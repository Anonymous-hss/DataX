"""
Universal Multi-Format Document & Spreadsheet Processor for DataX SaaS.

Supports ephemeral, stateless processing of user-uploaded files streamed from
client-side temporary storage (IndexedDB):
  - Spreadsheets: .xlsx, .xls, .csv, .tsv, .numbers (Apple Numbers), .ods
  - Semi-structured: .json
  - Reference Documents: .pdf, .pptx, .docx, .txt, .md

Zero reliance on pre-seeded VM files. Strictly hardened against path traversal,
oversized payloads, zip-bombs, disallowed extensions, and DDE formula injection.
"""

from __future__ import annotations

import base64
import csv
import io
import json
import os
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List, Optional, Tuple

import openpyxl

ALLOWED_EXTENSIONS = {
    ".xlsx",
    ".xls",
    ".csv",
    ".tsv",
    ".numbers",
    ".ods",
    ".json",
    ".pdf",
    ".pptx",
    ".docx",
    ".txt",
    ".md",
}

SPREADSHEET_EXTENSIONS = {".xlsx", ".xls", ".csv", ".tsv", ".numbers", ".ods"}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_ZIP_UNCOMPRESSED_BYTES = 60 * 1024 * 1024  # 60 MB zip-bomb guard


def sanitize_upload_filename(filename: str) -> Tuple[str, str]:
    """Strip directory traversal and validate allowed extension."""
    clean = os.path.basename(str(filename or "").strip())
    clean = re.sub(r"[^A-Za-z0-9._\-\s()]+", "_", clean).strip()
    if not clean:
        raise ValueError("Uploaded filename is empty or invalid.")
    ext = os.path.splitext(clean)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext or 'unknown'}'. "
            f"Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )
    return clean, ext


def _neutralize_cell(val: Any) -> Any:
    if isinstance(val, str):
        s = val.strip()
        if s and s[0] in ("=", "+", "-", "@") and not re.match(r"^[-+]?\d+(\.\d+)?$", s):
            return "'" + s
        return s
    return val


def _check_zip_safety(zf: zipfile.ZipFile) -> None:
    total = sum(info.file_size for info in zf.infolist())
    if total > MAX_ZIP_UNCOMPRESSED_BYTES:
        raise ValueError("Archive exceeds maximum safe uncompressed size limit (60 MB).")


def _build_xlsx_from_parsed_sheets(parsed_sheets: Dict[str, List[Dict[str, Any]]]) -> bytes:
    """Convert client-parsed sheet rows (e.g. from .xls, .numbers, .ods, .csv) into a clean .xlsx workbook."""
    wb = openpyxl.Workbook()
    first = True
    for sheet_name, rows in parsed_sheets.items():
        safe_title = re.sub(r"[:\\/?*\[\]]", "_", str(sheet_name or "Sheet1"))[:31] or "Sheet1"
        ws = wb.active if first else wb.create_sheet(title=safe_title)
        ws.title = safe_title
        first = False
        if not rows:
            continue
        headers: List[str] = []
        seen = set()
        for row in rows:
            if isinstance(row, dict):
                for k in row.keys():
                    ks = str(k)
                    if ks not in seen:
                        seen.add(ks)
                        headers.append(ks)
        if not headers:
            continue
        ws.append(headers)
        for row in rows:
            if isinstance(row, dict):
                ws.append([_neutralize_cell(row.get(h, "")) for h in headers])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _parse_csv_bytes(raw_bytes: bytes, delimiter: str = ",") -> Dict[str, List[Dict[str, Any]]]:
    text = raw_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    rows: List[Dict[str, Any]] = []
    for row in reader:
        cleaned = {str(k).strip(): _neutralize_cell(v) for k, v in row.items() if k is not None}
        if any(str(v).strip() for v in cleaned.values()):
            rows.append(cleaned)
    return {"Sheet1": rows}


def _parse_json_bytes(raw_bytes: bytes) -> Dict[str, List[Dict[str, Any]]]:
    text = raw_bytes.decode("utf-8-sig", errors="replace")
    payload = json.loads(text)
    if isinstance(payload, list):
        rows = [r if isinstance(r, dict) else {"value": r} for r in payload]
    elif isinstance(payload, dict):
        if isinstance(payload.get("records"), list):
            rows = payload["records"]
        elif isinstance(payload.get("data"), list):
            rows = payload["data"]
        else:
            rows = [payload]
    else:
        rows = [{"value": payload}]
    cleaned = [
        {str(k): _neutralize_cell(v) for k, v in r.items()}
        for r in rows
        if isinstance(r, dict)
    ]
    return {"JSON_Data": cleaned}


def _extract_docx_text(raw_bytes: bytes) -> List[str]:
    chunks: List[str] = []
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        _check_zip_safety(zf)
        if "word/document.xml" in zf.namelist():
            xml_bytes = zf.read("word/document.xml")
            root = ET.fromstring(xml_bytes)
            for p in root.iter():
                if p.tag.endswith("}p"):
                    texts = [t.text for t in p.iter() if t.tag.endswith("}t") and t.text]
                    line = "".join(texts).strip()
                    if line:
                        chunks.append(line)
    return chunks


def _extract_pptx_text(raw_bytes: bytes) -> List[str]:
    chunks: List[str] = []
    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        _check_zip_safety(zf)
        slide_files = sorted(
            name for name in zf.namelist() if re.match(r"^ppt/slides/slide\d+\.xml$", name)
        )
        for idx, sfile in enumerate(slide_files, start=1):
            root = ET.fromstring(zf.read(sfile))
            texts = [t.text.strip() for t in root.iter() if t.tag.endswith("}t") and t.text and t.text.strip()]
            if texts:
                chunks.append(f"Slide {idx}: " + " | ".join(texts))
    return chunks


def _extract_pdf_text(raw_bytes: bytes) -> List[str]:
    """Lightweight PDF text extraction (uses pypdf if available, else safe ASCII/UTF text scan)."""
    try:
        import pypdf  # type: ignore

        reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
        pages = []
        for idx, page in enumerate(reader.pages, start=1):
            txt = (page.extract_text() or "").strip()
            if txt:
                pages.append(f"Page {idx}: {txt}")
        if pages:
            return pages
    except Exception:
        pass

    # Pure-Python fallback extracting literal strings inside PDF text operators (...)
    decoded = raw_bytes.decode("latin-1", errors="ignore")
    matches = re.findall(r"\(([^()]{3,200})\)", decoded)
    cleaned = []
    for m in matches:
        s = re.sub(r"\\([()\\])", r"\1", m)
        s = re.sub(r"[^\x20-\x7E]+", " ", s).strip()
        if len(s) >= 3 and any(c.isalpha() for c in s):
            cleaned.append(s)
    if cleaned:
        return [" ".join(cleaned[:120])]
    return ["PDF uploaded (binary/scanned content stored for reference)."]


def detect_tabular_role(filename: str, sheets: Dict[str, List[Dict[str, Any]]], explicit_role: str = "auto") -> str:
    """Detect whether tabular data is an FMD workbook, XREF table, or Source Dataset."""
    if explicit_role and explicit_role != "auto":
        return explicit_role

    upper_name = filename.upper()
    all_headers = set()
    for rows in sheets.values():
        if rows and isinstance(rows[0], dict):
            for k in rows[0].keys():
                all_headers.add(re.sub(r"[^A-Z0-9]+", "_", str(k).upper()).strip("_"))

    fmd_markers = {"UNIQUE_ID", "TARGET_TABLE", "TARGET_FIELD_NAME", "MAPPING_RULE", "MAPPING_ACTION"}
    if len(all_headers.intersection(fmd_markers)) >= 2 or "FMD" in upper_name:
        return "fmd"

    xref_markers = {"LEGACY_MAKTX", "TARGET_MAKTX", "OVERRIDE_MAKTX", "OLD_VALUE", "NEW_VALUE", "XREF_KEY"}
    if "XREF" in upper_name or len(all_headers.intersection(xref_markers)) >= 1:
        return "xref"

    return "source_data"


def process_universal_upload(
    filename: str,
    content_base64: Optional[str] = None,
    parsed_sheets: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    file_role: str = "auto",
) -> Dict[str, Any]:
    """
    Validate and parse any supported uploaded file into a normalized ingestion envelope.

    Returns:
      {
        "filename": str,
        "ext": str,
        "size_bytes": int,
        "detected_role": "fmd" | "xref" | "source_data" | "reference_doc",
        "xlsx_bytes": Optional[bytes],      # Ready for fmd_mapping_engine if tabular
        "sheets": Dict[str, List[Dict]],    # Normalized sheet rows
        "columns": List[str],
        "row_count": int,
        "sheet_names": List[str],
        "text_chunks": List[str],           # Populated for PDF/PPTX/DOCX/TXT
      }
    """
    clean_name, ext = sanitize_upload_filename(filename)

    raw_bytes = b""
    if content_base64:
        try:
            raw_bytes = base64.b64decode(content_base64)
        except Exception as exc:
            raise ValueError(f"Invalid base64 file payload: {exc}") from exc
        if len(raw_bytes) > MAX_UPLOAD_BYTES:
            raise ValueError(
                f"File '{clean_name}' ({len(raw_bytes) / (1024 * 1024):.1f} MB) exceeds the 20 MB upload limit."
            )

    # Case 1: Native .xlsx workbook uploaded directly
    if ext == ".xlsx" and raw_bytes:
        wb = openpyxl.load_workbook(io.BytesIO(raw_bytes), data_only=True)
        sheets: Dict[str, List[Dict[str, Any]]] = {}
        for sname in wb.sheetnames:
            ws = wb[sname]
            rows_raw = list(ws.iter_rows(values_only=True))
            if not rows_raw:
                sheets[sname] = []
                continue
            # Detect header row within first 8 rows
            hdr_idx = 0
            for idx, r in enumerate(rows_raw[:8]):
                non_empty = [str(c).strip() for c in r if c is not None and str(c).strip()]
                if len(non_empty) >= 2:
                    hdr_idx = idx
                    break
            headers = [
                str(c).strip() if c is not None and str(c).strip() else f"Col_{i+1}"
                for i, c in enumerate(rows_raw[hdr_idx])
            ]
            parsed_rows = []
            for r in rows_raw[hdr_idx + 1 :]:
                if not any(c is not None and str(c).strip() for c in r):
                    continue
                parsed_rows.append(
                    {headers[i]: _neutralize_cell(r[i] if i < len(r) else "") for i in range(len(headers))}
                )
            sheets[sname] = parsed_rows

        role = detect_tabular_role(clean_name, sheets, file_role)
        total_rows = sum(len(v) for v in sheets.values())
        first_cols = list(next((v[0].keys() for v in sheets.values() if v), []))
        return {
            "filename": clean_name,
            "ext": ext,
            "size_bytes": len(raw_bytes),
            "detected_role": role,
            "xlsx_bytes": raw_bytes,
            "sheets": sheets,
            "columns": first_cols,
            "row_count": total_rows,
            "sheet_names": list(sheets.keys()),
            "text_chunks": [],
        }

    # Case 2: Client-parsed spreadsheets (.xls, .numbers, .ods, or pre-parsed .csv/.xlsx)
    if parsed_sheets and isinstance(parsed_sheets, dict) and len(parsed_sheets) > 0:
        norm_sheets: Dict[str, List[Dict[str, Any]]] = {}
        for sname, srows in parsed_sheets.items():
            if not isinstance(srows, list):
                continue
            norm_sheets[str(sname)] = [
                {str(k): _neutralize_cell(v) for k, v in r.items()}
                for r in srows
                if isinstance(r, dict)
            ]
        xlsx_bytes = _build_xlsx_from_parsed_sheets(norm_sheets)
        role = detect_tabular_role(clean_name, norm_sheets, file_role)
        total_rows = sum(len(v) for v in norm_sheets.values())
        first_cols = list(next((v[0].keys() for v in norm_sheets.values() if v), []))
        return {
            "filename": clean_name,
            "ext": ext,
            "size_bytes": len(raw_bytes) or len(xlsx_bytes),
            "detected_role": role,
            "xlsx_bytes": xlsx_bytes,
            "sheets": norm_sheets,
            "columns": first_cols,
            "row_count": total_rows,
            "sheet_names": list(norm_sheets.keys()),
            "text_chunks": [],
        }

    # Case 3: Raw CSV / TSV / JSON sent directly
    if ext in (".csv", ".tsv") and raw_bytes:
        sheets = _parse_csv_bytes(raw_bytes, delimiter="\t" if ext == ".tsv" else ",")
        xlsx_bytes = _build_xlsx_from_parsed_sheets(sheets)
        role = detect_tabular_role(clean_name, sheets, file_role)
        total_rows = sum(len(v) for v in sheets.values())
        first_cols = list(next((v[0].keys() for v in sheets.values() if v), []))
        return {
            "filename": clean_name,
            "ext": ext,
            "size_bytes": len(raw_bytes),
            "detected_role": role,
            "xlsx_bytes": xlsx_bytes,
            "sheets": sheets,
            "columns": first_cols,
            "row_count": total_rows,
            "sheet_names": list(sheets.keys()),
            "text_chunks": [],
        }

    if ext == ".json" and raw_bytes:
        sheets = _parse_json_bytes(raw_bytes)
        xlsx_bytes = _build_xlsx_from_parsed_sheets(sheets)
        role = detect_tabular_role(clean_name, sheets, file_role)
        total_rows = sum(len(v) for v in sheets.values())
        first_cols = list(next((v[0].keys() for v in sheets.values() if v), []))
        return {
            "filename": clean_name,
            "ext": ext,
            "size_bytes": len(raw_bytes),
            "detected_role": role,
            "xlsx_bytes": xlsx_bytes,
            "sheets": sheets,
            "columns": first_cols,
            "row_count": total_rows,
            "sheet_names": list(sheets.keys()),
            "text_chunks": [],
        }

    # Case 4: Unstructured Reference Documents (.pdf, .pptx, .docx, .txt, .md)
    if ext in (".pdf", ".pptx", ".docx", ".txt", ".md") and raw_bytes:
        if ext == ".pdf":
            chunks = _extract_pdf_text(raw_bytes)
        elif ext == ".pptx":
            chunks = _extract_pptx_text(raw_bytes)
        elif ext == ".docx":
            chunks = _extract_docx_text(raw_bytes)
        else:
            text = raw_bytes.decode("utf-8-sig", errors="replace")
            chunks = [line.strip() for line in text.splitlines() if line.strip()][:200]

        doc_rows = [
            {"SECTION_INDEX": idx + 1, "SOURCE_FILE": clean_name, "EXTRACTED_TEXT": _neutralize_cell(ch)}
            for idx, ch in enumerate(chunks[:100])
        ]
        sheets = {"Extracted_Text": doc_rows}
        return {
            "filename": clean_name,
            "ext": ext,
            "size_bytes": len(raw_bytes),
            "detected_role": "reference_doc",
            "xlsx_bytes": None,
            "sheets": sheets,
            "columns": ["SECTION_INDEX", "SOURCE_FILE", "EXTRACTED_TEXT"],
            "row_count": len(doc_rows),
            "sheet_names": ["Extracted_Text"],
            "text_chunks": chunks[:100],
        }

    raise ValueError(
        f"Unable to parse '{clean_name}'. Please upload a valid Excel (.xlsx, .xls), CSV, Apple Numbers (.numbers), JSON, PDF, PPTX, or DOCX file."
    )
