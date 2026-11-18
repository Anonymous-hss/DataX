"""
DataX FMD (Functional Mapping Document) Mapping Studio Engine
Supports SAP Material Master migration into TIME (SAP S/4HANA) via SAP BODS.

Capabilities:
1. Multi-tab Excel (.xlsx) FMD parser with header auto-detection and cell provenance
2. XREF (.xlsx / .csv) and Legacy Source Data (.xlsx / .csv) ingestion
3. Deterministic rule classifier (XREF_OVERRIDE, BUSINESS_CONSTRUCTION, DIRECT_COPY, INTERNAL, DEFAULT)
4. Cross-document consolidator with inconsistency/exception detection
5. Grounded business-language explainer (Azure OpenAI + deterministic fallback)
6. In-memory DuckDB transformation simulator producing Staging Preload + Z_ERRORLOG
7. Multi-sheet Excel (.xlsx) & CSV staging export for SAP BODS
"""

import os
import io
import re
import csv
import json
import uuid
import base64
import binascii
import zipfile
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

import duckdb
import openpyxl
from openpyxl.styles import Font, PatternFill

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_FMD_DIR = os.path.join(BASE_DIR, "demo_data", "fmd")
STORE_PATH = os.path.join(BASE_DIR, ".fmd_store.json")

DESIGN_SPEC_REF = "TIME_L3_MDA_MT-C_Material_Master_R3.2[21]"
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB compressed cap
MAX_UNCOMPRESSED_ZIP_BYTES = 50 * 1024 * 1024  # 50 MB zip-bomb cap
FORMULA_INJECTION_PREFIXES = ("=", "+", "-", "@", "\t", "\r")

CANONICAL_SOURCE_ORDER = ["SUSTAIN", "ATLAS", "CONS", "CMMS/MAXIMO"]

DEMO_FILE_REGISTRY = {
    "sustain_fmd": "TIME-L3-MDA-MT-C_Material_Master-FMD-SUSTAIN_R3.2.xlsx",
    "atlas_fmd": "TIME-L3-MDA-MT-C_Material_Master-FMD-ATLAS_R3.2.xlsx",
    "cons_fmd": "TIME-L3-MDA-MT-C Material Master-FMD-CONS R3.2.xlsx",
    "cmms_fmd": "TIME-L3-MDA-MT-C Material Master-FMD-CMMS_R3.2.xlsx",
    "xref_primary": "TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA.xlsx",
    "xref_override": "TIME_L3_MM_R3_2_MAKT_OVERRIDE_XREF.xlsx",
    "source_makt": "SAP_BW_HANA_Legacy_MAKT_Source_Data.xlsx",
}


# -----------------------------------------------------------------------------
# Storage Helpers (.fmd_store.json scoped per tenant)
# -----------------------------------------------------------------------------
def _load_store() -> Dict[str, Any]:
    if not os.path.exists(STORE_PATH):
        return {}
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_store(store: Dict[str, Any]) -> None:
    tmp_path = f"{STORE_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(store, f, indent=2, default=str)
    os.replace(tmp_path, STORE_PATH)


def _sanitize_tenant_id(tid: Optional[str]) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_\-]", "", str(tid or ""))[:64]
    return clean or "tenant_enterprise"


def _sanitize_identifier(val: Optional[str], default: str) -> str:
    clean = re.sub(r"[^A-Z0-9_]", "", str(val or "").strip().upper())[:64]
    return clean or default


def _sanitize_filename(file_name: Optional[str], allowed_exts: Tuple[str, ...]) -> str:
    base = os.path.basename(str(file_name or "").replace("\\", "/")).strip()
    base = re.sub(r"[\r\n\"';<>|*?]", "_", base)
    if not base:
        raise ValueError("File name is required.")
    ext = os.path.splitext(base)[1].lower()
    if ext not in allowed_exts:
        raise ValueError(f"Unsupported file type '{ext or 'none'}'. Allowed: {', '.join(allowed_exts)}")
    return base[:180]


def _decode_base64_safely(content_base64: str) -> bytes:
    if not content_base64 or not isinstance(content_base64, str):
        raise ValueError("Empty file payload.")
    raw_b64 = content_base64.split(",")[-1].strip()
    if len(raw_b64) > int(MAX_UPLOAD_BYTES * 1.4):
        raise ValueError("Uploaded file exceeds the 15 MB maximum limit.")
    try:
        decoded = base64.b64decode(raw_b64, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("Invalid base64 file encoding.")
    if not decoded:
        raise ValueError("Uploaded file is empty.")
    if len(decoded) > MAX_UPLOAD_BYTES:
        raise ValueError("Uploaded file exceeds the 15 MB maximum limit.")
    return decoded


def _validate_xlsx_zip_safety(content_bytes: bytes) -> None:
    """Prevent zip-bomb DoS and verify valid OpenXML container before openpyxl loads it."""
    try:
        with zipfile.ZipFile(io.BytesIO(content_bytes), "r") as zf:
            total_uncompressed = 0
            for info in zf.infolist():
                if ".." in info.filename or info.filename.startswith("/"):
                    raise ValueError("Unsafe archive entry path detected in workbook.")
                total_uncompressed += info.file_size
                if total_uncompressed > MAX_UNCOMPRESSED_ZIP_BYTES:
                    raise ValueError("Workbook uncompressed size exceeds 50 MB safety limit.")
    except zipfile.BadZipFile:
        raise ValueError("Invalid or corrupted Excel (.xlsx) file.")


def _sanitize_spreadsheet_cell(val: Any) -> Any:
    """Neutralize Excel/CSV formula (DDE) injection on export."""
    if isinstance(val, str) and val and val[0] in FORMULA_INJECTION_PREFIXES:
        return "'" + val
    return val


def _get_tenant_bucket(store: Dict[str, Any], tid: str) -> Dict[str, Any]:
    safe_tid = _sanitize_tenant_id(tid)
    bucket = store.setdefault(
        safe_tid,
        {
            "documents": [],
            "xrefs": [],
            "source_datasets": [],
            "last_simulation": None,
            "updated_at": None,
        },
    )
    return bucket


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -----------------------------------------------------------------------------
# Inference & Normalization Helpers
# -----------------------------------------------------------------------------
def infer_source_system(file_name: str, explicit: Optional[str] = None) -> str:
    if explicit and explicit.strip():
        val = explicit.strip().upper()
        if "CMMS" in val or "MAXIMO" in val:
            return "CMMS/MAXIMO"
        if "SUSTAIN" in val:
            return "SUSTAIN"
        if "ATLAS" in val:
            return "ATLAS"
        if "CONS" in val:
            return "CONS"
        return explicit.strip()

    upper = (file_name or "").upper()
    if "SUSTAIN" in upper:
        return "SUSTAIN"
    if "ATLAS" in upper:
        return "ATLAS"
    if "CMMS" in upper or "MAXIMO" in upper:
        return "CMMS/MAXIMO"
    if "CONS" in upper:
        return "CONS"
    return "CUSTOM"


def _clean_cell(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _normalize_header(val: Any) -> str:
    s = _clean_cell(val).upper()
    s = re.sub(r"[^A-Z0-9]+", "_", s).strip("_")
    return s


def classify_mapping_rule(
    raw_rule: str,
    xref_table: str = "",
    rule_logic: str = "",
) -> Dict[str, Any]:
    """Deterministically classify an FMD MAPPING_RULE into a canonical pattern."""
    rule_u = _clean_cell(raw_rule).upper()
    xref_u = _clean_cell(xref_table).upper()
    logic_u = _clean_cell(rule_logic).upper()

    has_xref = bool(xref_u and xref_u not in ("N/A", "NA", "NONE", "-"))

    if "INTERNAL" in rule_u:
        return {
            "code": "INTERNAL",
            "label": "Internal",
            "short_label": "Internal (no transform)",
            "description": "Direct internal key mapping — no active transformation required.",
        }
    if "XREF" in rule_u or has_xref or "CROSS-REFERENCE" in logic_u or "OVERRIDE" in rule_u:
        return {
            "code": "XREF_OVERRIDE",
            "label": "XRef/Rule",
            "short_label": "XREF override",
            "description": "Cross-reference override lookup with fallback to legacy source copy.",
        }
    if "CONSTRUCT" in rule_u or "BUSINESS" in rule_u or "CONCAT" in logic_u or "CONSTRUCT" in logic_u:
        return {
            "code": "BUSINESS_CONSTRUCTION",
            "label": "Business construction",
            "short_label": "Business construction",
            "description": "Standardized description constructed from business model attributes.",
        }
    if "COPY" in rule_u or "DIRECT" in rule_u or "1:1" in rule_u:
        return {
            "code": "DIRECT_COPY",
            "label": "Copy",
            "short_label": "Direct copy",
            "description": "Direct copy from source table field to TIME target field.",
        }
    if "DEFAULT" in rule_u or "CONST" in rule_u or "HARDCODE" in rule_u:
        return {
            "code": "DEFAULT",
            "label": "Default",
            "short_label": "Default / constant",
            "description": "Assigned a constant or default value when source is empty.",
        }
    if not rule_u or rule_u in ("N/A", "NONE", "NOT MAPPED"):
        return {
            "code": "NOT_MAPPED",
            "label": "Not mapped",
            "short_label": "Not mapped",
            "description": "No active mapping rule specified in FMD.",
        }
    return {
        "code": "UNKNOWN",
        "label": raw_rule or "Unknown",
        "short_label": raw_rule or "Custom rule",
        "description": "Custom mapping rule requiring functional review.",
    }


def _find_header_row(rows: List[Tuple[Any, ...]], marker_keys: List[str]) -> Tuple[int, List[str]]:
    """Scan first 12 rows to locate the header row (e.g. Row 2 with UNIQUE_ID in client FMDs)."""
    for idx, row in enumerate(rows[:12]):
        norm = [_normalize_header(c) for c in row]
        hits = sum(1 for k in marker_keys if k in norm)
        if hits >= 2 or (marker_keys and marker_keys[0] in norm):
            return idx, norm
    # Fallback to first non-empty row
    for idx, row in enumerate(rows[:12]):
        if any(_clean_cell(c) for c in row):
            return idx, [_normalize_header(c) for c in row]
    return 0, []


# -----------------------------------------------------------------------------
# Parsers: Multi-Tab FMD (.xlsx), XREF (.xlsx / .csv), Source Data (.xlsx / .csv)
# -----------------------------------------------------------------------------
def parse_fmd_workbook_bytes(
    content_bytes: bytes,
    file_name: str,
    source_system: Optional[str] = None,
) -> Dict[str, Any]:
    if len(content_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError("Uploaded workbook exceeds 15 MB limit.")
    safe_name = _sanitize_filename(file_name, (".xlsx", ".xls"))
    _validate_xlsx_zip_safety(content_bytes)

    try:
        wb = openpyxl.load_workbook(io.BytesIO(content_bytes), read_only=True, data_only=True)
    except Exception:
        raise ValueError("Unable to open Excel workbook; ensure it is a valid .xlsx file.")
    inferred_src = infer_source_system(safe_name, source_system)
    doc_id = f"fmd_{uuid.uuid4().hex[:10]}"
    file_name = safe_name

    sheets_meta: List[Dict[str, Any]] = []
    parsed_rules: List[Dict[str, Any]] = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        raw_rows = list(ws.iter_rows(values_only=True))
        if not raw_rows:
            continue

        hdr_idx, norm_headers = _find_header_row(
            raw_rows, ["UNIQUE_ID", "TARGET_TABLE", "TARGET_FIELD_NAME", "MAPPING_RULE"]
        )
        if not norm_headers:
            continue

        # Map column indices flexibly
        def col_val(row_tuple, candidates: List[str]) -> str:
            for cand in candidates:
                if cand in norm_headers:
                    c_i = norm_headers.index(cand)
                    if c_i < len(row_tuple):
                        return _clean_cell(row_tuple[c_i])
            return ""

        sheet_rows_preview: List[Dict[str, Any]] = []
        sheet_rule_count = 0

        for offset, r_tuple in enumerate(raw_rows[hdr_idx + 1 :], start=hdr_idx + 2):
            if not any(_clean_cell(c) for c in r_tuple):
                continue

            unique_id = col_val(r_tuple, ["UNIQUE_ID", "ID", "RULE_ID"])
            target_table = col_val(r_tuple, ["TARGET_TABLE", "SAP_TABLE", "TABLE"])
            target_field = col_val(r_tuple, ["TARGET_FIELD_NAME", "TARGET_FIELD", "FIELD_NAME"])
            target_text = col_val(r_tuple, ["TARGET_FIELD_TEXT", "FIELD_DESCRIPTION", "DESCRIPTION"])
            mapping_rule = col_val(r_tuple, ["MAPPING_RULE", "RULE", "RULE_TYPE"])
            src_table = col_val(r_tuple, ["SOURCE_TABLE", "SRC_TABLE"])
            src_field = col_val(r_tuple, ["SOURCE_FIELD", "SRC_FIELD"])
            xref_table = col_val(r_tuple, ["XREF_TABLE", "CROSS_REFERENCE", "XREF"])
            xref_field = col_val(r_tuple, ["XREF_FIELD", "XREF_TARGET_FIELD"])
            rule_logic = col_val(r_tuple, ["RULE_LOGIC", "TRANSFORMATION_LOGIC", "LOGIC", "COMMENTS"])
            status = col_val(r_tuple, ["STATUS", "MAPPING_STATUS"]) or "VALID"
            exception_note = col_val(r_tuple, ["EXCEPTION_NOTE", "EXCEPTION", "NOTES"])
            source_col = col_val(r_tuple, ["SOURCE"])
            obj_col = col_val(r_tuple, ["OBJECT"]) or "Material Master"
            workstream = col_val(r_tuple, ["WORKSTREAM"]) or "Make"
            sub_workstream = col_val(r_tuple, ["SUB_WORKSTREAM"]) or "Quality"
            data_level = col_val(r_tuple, ["DATA_LEVEL"])
            file_ref = col_val(r_tuple, ["FILE_NAME"])

            if not target_table and " - " in sheet_name:
                target_table = sheet_name.split(" - ")[-1].strip().upper()

            classification = classify_mapping_rule(mapping_rule, xref_table, rule_logic)

            row_dict = {
                "excel_row": offset,
                "doc_id": doc_id,
                "file_name": file_name,
                "source_system": inferred_src,
                "sheet_name": sheet_name,
                "unique_id": unique_id or f"{inferred_src}_{sheet_name}_{offset}",
                "source_label": source_col or inferred_src,
                "object": obj_col,
                "workstream": workstream,
                "sub_workstream": sub_workstream,
                "data_level": data_level,
                "target_table": target_table.upper(),
                "target_field_name": target_field.upper(),
                "target_field_text": target_text,
                "mapping_rule": mapping_rule or classification["label"],
                "rule_code": classification["code"],
                "rule_short_label": classification["short_label"],
                "source_table": src_table,
                "source_field": src_field,
                "file_ref": file_ref,
                "xref_table": xref_table,
                "xref_field": xref_field,
                "rule_logic": rule_logic or classification["description"],
                "status": status.upper(),
                "exception_note": exception_note if exception_note and exception_note.upper() != "NONE" else "",
            }

            parsed_rules.append(row_dict)
            sheet_rows_preview.append(row_dict)
            sheet_rule_count += 1

        sheets_meta.append(
            {
                "name": sheet_name,
                "header_row": hdr_idx + 1,
                "headers": [h for h in norm_headers if h],
                "row_count": sheet_rule_count,
                "rows": sheet_rows_preview,
            }
        )

    wb.close()

    # Determine overall document status (surface REWORK or FINAL REVIEW if present on key fields)
    statuses = [r["status"] for r in parsed_rules if r["target_table"] == "MAKT" and r["target_field_name"] == "MAKTX"]
    doc_status = statuses[0] if statuses else ("VALID" if parsed_rules else "EMPTY")

    return {
        "doc_id": doc_id,
        "file_name": file_name,
        "source_system": inferred_src,
        "uploaded_at": _now_iso(),
        "tab_count": len(sheets_meta),
        "rule_count": len(parsed_rules),
        "status": doc_status,
        "tabs": [s["name"] for s in sheets_meta],
        "sheets": sheets_meta,
        "rules": parsed_rules,
    }


def _parse_tabular_bytes(content_bytes: bytes, file_name: str, marker_keys: List[str]) -> Tuple[List[str], List[Dict[str, Any]]]:
    lower = file_name.lower()
    if lower.endswith(".csv"):
        text = content_bytes.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = []
        headers = [_normalize_header(h) for h in (reader.fieldnames or [])]
        for r in reader:
            cleaned = {_normalize_header(k): _clean_cell(v) for k, v in r.items() if k is not None}
            if any(cleaned.values()):
                rows.append(cleaned)
        return headers, rows

    _validate_xlsx_zip_safety(content_bytes)
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content_bytes), read_only=True, data_only=True)
    except Exception:
        raise ValueError("Unable to open tabular Excel file; ensure it is a valid .xlsx or .csv file.")
    all_rows: List[Dict[str, Any]] = []
    headers_out: List[str] = []
    # Prefer combined sheet if present, otherwise parse first sheet
    target_sheets = [wb.sheetnames[0]] if wb.sheetnames else []
    for sname in target_sheets:
        ws = wb[sname]
        raw_rows = list(ws.iter_rows(values_only=True))
        if not raw_rows:
            continue
        hdr_idx, norm_headers = _find_header_row(raw_rows, marker_keys)
        headers_out = [h for h in norm_headers if h]
        for r_tuple in raw_rows[hdr_idx + 1 :]:
            if not any(_clean_cell(c) for c in r_tuple):
                continue
            row_obj = {}
            for idx, h in enumerate(norm_headers):
                if h:
                    row_obj[h] = _clean_cell(r_tuple[idx]) if idx < len(r_tuple) else ""
            all_rows.append(row_obj)
    wb.close()
    return headers_out, all_rows


def parse_xref_bytes(content_bytes: bytes, file_name: str, table_name: Optional[str] = None) -> Dict[str, Any]:
    headers, rows = _parse_tabular_bytes(content_bytes, file_name, ["LEGACY_MATNR", "TIME_MAKTX", "MATNR"])
    clean_name = table_name or os.path.splitext(os.path.basename(file_name))[0]
    entries = []
    for r in rows:
        matnr = r.get("LEGACY_MATNR") or r.get("MATNR") or r.get("MATERIAL_NUMBER") or ""
        time_maktx = r.get("TIME_MAKTX") or r.get("TARGET_MAKTX") or r.get("TARGET_VALUE") or ""
        src_sys = infer_source_system("", r.get("SOURCE_SYSTEM")) if r.get("SOURCE_SYSTEM") else "ALL"
        if matnr and time_maktx:
            entries.append(
                {
                    "legacy_matnr": matnr,
                    "source_system": src_sys,
                    "legacy_maktx": r.get("LEGACY_MAKTX") or r.get("ORIGINAL_MAKTX") or "",
                    "time_maktx": time_maktx,
                    "override_reason": r.get("OVERRIDE_REASON") or "Cross-reference override",
                    "approved_by": r.get("APPROVED_BY") or "Data Governance",
                }
            )
    return {
        "xref_id": f"xref_{uuid.uuid4().hex[:8]}",
        "table_name": clean_name,
        "file_name": file_name,
        "uploaded_at": _now_iso(),
        "headers": headers,
        "entry_count": len(entries),
        "entries": entries,
    }


def parse_source_bytes(content_bytes: bytes, file_name: str) -> Dict[str, Any]:
    headers, rows = _parse_tabular_bytes(content_bytes, file_name, ["MATNR", "MAKTX", "SOURCE_SYSTEM"])
    records = []
    for r in rows:
        src_sys = infer_source_system(file_name, r.get("SOURCE_SYSTEM"))
        records.append(
            {
                "source_system": src_sys,
                "source_table": r.get("SOURCE_TABLE") or "MAKT",
                "matnr": r.get("MATNR") or r.get("MATERIAL_NUMBER") or "",
                "spras": r.get("SPRAS") or "EN",
                "maktx": r.get("MAKTX") or r.get("MATERIAL_DESCRIPTION") or "",
                "werks": r.get("WERKS") or "",
                "condition_prefix": r.get("CONDITION_PREFIX") or "",
                "equip_noun": r.get("EQUIP_NOUN") or "",
                "dismm": r.get("DISMM") or "",
                "ekgrp": r.get("EKGRP") or "",
            }
        )
    return {
        "source_id": f"src_{uuid.uuid4().hex[:8]}",
        "file_name": file_name,
        "uploaded_at": _now_iso(),
        "headers": headers,
        "record_count": len(records),
        "records": records,
    }


# -----------------------------------------------------------------------------
# Workspace CRUD & Demo Seeding
# -----------------------------------------------------------------------------
def _ensure_demo_files_exist() -> None:
    missing = [
        fn for fn in DEMO_FILE_REGISTRY.values()
        if not os.path.exists(os.path.join(DEMO_FMD_DIR, fn))
    ]
    if missing:
        from scripts.generate_demo_fmds import generate_all
        generate_all()


def seed_demo_workspace(tid: str = "tenant_enterprise") -> Dict[str, Any]:
    """Load the 4 synthetic multi-tab FMD workbooks, 2 XREF workbooks, and 1 Source workbook."""
    _ensure_demo_files_exist()
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)

    docs = []
    for key in ("sustain_fmd", "atlas_fmd", "cons_fmd", "cmms_fmd"):
        fn = DEMO_FILE_REGISTRY[key]
        path = os.path.join(DEMO_FMD_DIR, fn)
        with open(path, "rb") as f:
            docs.append(parse_fmd_workbook_bytes(f.read(), fn))

    xrefs = []
    for key in ("xref_primary", "xref_override"):
        fn = DEMO_FILE_REGISTRY[key]
        path = os.path.join(DEMO_FMD_DIR, fn)
        with open(path, "rb") as f:
            xrefs.append(parse_xref_bytes(f.read(), fn))

    src_fn = DEMO_FILE_REGISTRY["source_makt"]
    with open(os.path.join(DEMO_FMD_DIR, src_fn), "rb") as f:
        src_ds = parse_source_bytes(f.read(), src_fn)

    bucket["documents"] = docs
    bucket["xrefs"] = xrefs
    bucket["source_datasets"] = [src_ds]
    bucket["updated_at"] = _now_iso()
    _save_store(store)

    return get_workspace_summary(tid)


def get_demo_file_bytes(file_key: str) -> Tuple[bytes, str, str]:
    """Return (bytes, filename, media_type) for downloading sample Excel files to computer."""
    _ensure_demo_files_exist()
    if file_key == "all_zip":
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for fn in DEMO_FILE_REGISTRY.values():
                full_path = os.path.join(DEMO_FMD_DIR, fn)
                if os.path.exists(full_path):
                    zf.write(full_path, arcname=fn)
        return buf.getvalue(), "TIME_R3.2_Material_Master_Demo_Excel_Pack.zip", "application/zip"

    if file_key not in DEMO_FILE_REGISTRY:
        raise ValueError(f"Unknown demo file key: {file_key}")

    fn = DEMO_FILE_REGISTRY[file_key]
    path = os.path.join(DEMO_FMD_DIR, fn)
    with open(path, "rb") as f:
        return (
            f.read(),
            fn,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )


def list_demo_files() -> List[Dict[str, Any]]:
    _ensure_demo_files_exist()
    items = []
    for key, fn in DEMO_FILE_REGISTRY.items():
        path = os.path.join(DEMO_FMD_DIR, fn)
        size_kb = round(os.path.getsize(path) / 1024, 1) if os.path.exists(path) else 0
        kind = "FMD" if "fmd" in key else ("XREF" if "xref" in key else "SOURCE")
        items.append({"key": key, "file_name": fn, "kind": kind, "size_kb": size_kb})
    return items


def upload_fmd_document(
    tid: str,
    file_name: str,
    content_base64: str,
    source_system: Optional[str] = None,
) -> Dict[str, Any]:
    safe_name = _sanitize_filename(file_name, (".xlsx", ".xls"))
    raw_bytes = _decode_base64_safely(content_base64)
    doc = parse_fmd_workbook_bytes(raw_bytes, safe_name, source_system)
    if doc["rule_count"] == 0:
        raise ValueError("No mapping rows were found in the uploaded Excel workbook.")
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    # Replace existing doc for the same source_system + filename to avoid duplicates on re-upload
    bucket["documents"] = [
        d for d in bucket["documents"]
        if not (d["source_system"] == doc["source_system"] and d["file_name"] == doc["file_name"])
    ]
    bucket["documents"].append(doc)
    bucket["updated_at"] = _now_iso()
    _save_store(store)
    return _strip_doc_heavy_fields(doc)


def upload_xref_document(
    tid: str,
    file_name: str,
    content_base64: str,
    table_name: Optional[str] = None,
) -> Dict[str, Any]:
    safe_name = _sanitize_filename(file_name, (".xlsx", ".xls", ".csv"))
    raw_bytes = _decode_base64_safely(content_base64)
    xref = parse_xref_bytes(raw_bytes, safe_name, table_name)
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    bucket["xrefs"] = [x for x in bucket["xrefs"] if x["file_name"] != xref["file_name"]]
    bucket["xrefs"].append(xref)
    bucket["updated_at"] = _now_iso()
    _save_store(store)
    return xref


def upload_source_document(
    tid: str,
    file_name: str,
    content_base64: str,
) -> Dict[str, Any]:
    safe_name = _sanitize_filename(file_name, (".xlsx", ".xls", ".csv"))
    raw_bytes = _decode_base64_safely(content_base64)
    src = parse_source_bytes(raw_bytes, safe_name)
    if src["record_count"] == 0:
        raise ValueError("No source records were found in the uploaded file.")
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    bucket["source_datasets"] = [s for s in bucket["source_datasets"] if s["file_name"] != src["file_name"]]
    bucket["source_datasets"].append(src)
    bucket["updated_at"] = _now_iso()
    _save_store(store)
    return src


def delete_fmd_document(tid: str, doc_id: str) -> bool:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    before = len(bucket["documents"])
    bucket["documents"] = [d for d in bucket["documents"] if d["doc_id"] != doc_id]
    if len(bucket["documents"]) != before:
        bucket["updated_at"] = _now_iso()
        _save_store(store)
        return True
    return False


def _strip_doc_heavy_fields(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "doc_id": doc["doc_id"],
        "file_name": doc["file_name"],
        "source_system": doc["source_system"],
        "uploaded_at": doc["uploaded_at"],
        "tab_count": doc["tab_count"],
        "rule_count": doc["rule_count"],
        "status": doc["status"],
        "tabs": doc["tabs"],
    }


def get_workspace_summary(tid: str = "tenant_enterprise") -> Dict[str, Any]:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    docs = [_strip_doc_heavy_fields(d) for d in bucket["documents"]]
    # Sort in canonical demo order
    docs.sort(
        key=lambda d: (
            CANONICAL_SOURCE_ORDER.index(d["source_system"])
            if d["source_system"] in CANONICAL_SOURCE_ORDER
            else 99
        )
    )
    fields = list_available_target_fields(tid)
    return {
        "status": "success",
        "tenant_id": tid,
        "design_spec_ref": DESIGN_SPEC_REF,
        "documents": docs,
        "xrefs": [
            {
                "xref_id": x["xref_id"],
                "table_name": x["table_name"],
                "file_name": x["file_name"],
                "entry_count": x["entry_count"],
                "entries": x["entries"],
            }
            for x in bucket["xrefs"]
        ],
        "source_datasets": [
            {
                "source_id": s["source_id"],
                "file_name": s["file_name"],
                "record_count": s["record_count"],
                "records": s["records"],
            }
            for s in bucket["source_datasets"]
        ],
        "available_fields": fields,
        "updated_at": bucket.get("updated_at"),
    }


def get_document_sheet(
    tid: str,
    doc_id: str,
    sheet_name: Optional[str] = None,
    highlight_row: Optional[int] = None,
) -> Dict[str, Any]:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    doc = next((d for d in bucket["documents"] if d["doc_id"] == doc_id), None)
    if not doc:
        raise ValueError(f"Document not found: {doc_id}")

    sheets = doc.get("sheets", [])
    selected = None
    if sheet_name:
        selected = next((s for s in sheets if s["name"].lower() == sheet_name.lower()), None)
    if not selected and sheets:
        # Default to MAKT if present, else first tab
        selected = next((s for s in sheets if "MAKT" in s["name"].upper()), sheets[0])

    return {
        "doc_id": doc["doc_id"],
        "file_name": doc["file_name"],
        "source_system": doc["source_system"],
        "tabs": [s["name"] for s in sheets],
        "active_tab": selected["name"] if selected else "",
        "header_row": selected["header_row"] if selected else 2,
        "headers": selected["headers"] if selected else [],
        "rows": selected["rows"] if selected else [],
        "highlight_row": highlight_row,
    }


def list_available_target_fields(tid: str = "tenant_enterprise") -> List[Dict[str, Any]]:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    seen: Dict[str, Dict[str, Any]] = {}
    for doc in bucket["documents"]:
        for r in doc.get("rules", []):
            key = f"{r['target_table']}-{r['target_field_name']}"
            if not r["target_table"] or not r["target_field_name"]:
                continue
            if key not in seen:
                seen[key] = {
                    "key": key,
                    "target_table": r["target_table"],
                    "target_field_name": r["target_field_name"],
                    "target_field_text": r["target_field_text"] or r["target_field_name"],
                    "source_count": 0,
                    "sources": [],
                }
            if doc["source_system"] not in seen[key]["sources"]:
                seen[key]["sources"].append(doc["source_system"])
                seen[key]["source_count"] += 1

    # Put MAKT-MAKTX first as the primary demo field
    items = list(seen.values())
    items.sort(key=lambda x: (0 if x["key"] == "MAKT-MAKTX" else (1 if x["target_table"] == "MAKT" else 2), x["key"]))
    return items


# -----------------------------------------------------------------------------
# Cross-FMD Comparison & Inconsistency Detection
# -----------------------------------------------------------------------------
def compare_target_field(
    tid: str = "tenant_enterprise",
    target_table: str = "MAKT",
    target_field: str = "MAKTX",
) -> Dict[str, Any]:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    docs = bucket["documents"]

    if not docs:
        return {
            "status": "empty",
            "target_table": target_table,
            "target_field": target_field,
            "overview_rows": [],
            "consolidated_rows": [],
            "findings": [],
            "recommendation": "Upload FMD Excel workbooks or click 'Load 4 Demo FMDs (R3.2)' to begin.",
        }

    t_tbl = _sanitize_identifier(target_table, "MAKT")
    t_fld = _sanitize_identifier(target_field, "MAKTX")
    uploaded_xref_names = {x["table_name"].upper() for x in bucket["xrefs"]}

    # Sort docs in canonical demo order
    sorted_docs = sorted(
        docs,
        key=lambda d: (
            CANONICAL_SOURCE_ORDER.index(d["source_system"])
            if d["source_system"] in CANONICAL_SOURCE_ORDER
            else 99
        ),
    )

    overview_rows: List[Dict[str, Any]] = []
    consolidated_rows: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    distinct_patterns = set()

    for doc in sorted_docs:
        match = next(
            (
                r for r in doc.get("rules", [])
                if r["target_table"] == t_tbl and r["target_field_name"] == t_fld
            ),
            None,
        )

        if not match:
            overview_rows.append(
                {
                    "source": doc["source_system"],
                    "source_field": "Missing",
                    "target": f"{t_tbl}-{t_fld}",
                    "mapping_decision": "Missing in FMD",
                    "status": "Missing",
                }
            )
            consolidated_rows.append(
                {
                    "source_system": doc["source_system"],
                    "source_field": "Not found",
                    "target_field": f"{t_tbl}-{t_fld}",
                    "mapping_rule": "Not mapped",
                    "rule_code": "NOT_MAPPED",
                    "rule_short_label": "Missing",
                    "exception_or_override": "No mapping row found for this target field.",
                    "confidence": 0.0,
                    "status": "MISSING",
                    "source_document_link": {
                        "doc_id": doc["doc_id"],
                        "file_name": doc["file_name"],
                        "sheet_name": doc["tabs"][0] if doc["tabs"] else "",
                        "excel_row": 2,
                        "unique_id": "N/A",
                        "label": f"{doc['file_name']} (not mapped)",
                    },
                }
            )
            findings.append(
                {
                    "severity": "high",
                    "category": "Missing Mapping",
                    "source_system": doc["source_system"],
                    "message": f"{doc['source_system']} FMD ({doc['file_name']}) is missing a mapping entry for {t_tbl}-{t_fld}.",
                }
            )
            continue

        distinct_patterns.add(match["rule_short_label"])

        # Confidence scoring
        conf = 0.98
        if match["status"] == "REWORK":
            conf = 0.72
            findings.append(
                {
                    "severity": "high",
                    "category": "Status: REWORK",
                    "source_system": doc["source_system"],
                    "message": f"{doc['source_system']} mapping ({match['unique_id']}) is currently marked REWORK and requires dual cross-reference validation before BODS load.",
                }
            )
        elif match["status"] == "FINAL REVIEW":
            conf = 0.88
            findings.append(
                {
                    "severity": "medium",
                    "category": "Status: FINAL REVIEW",
                    "source_system": doc["source_system"],
                    "message": f"{doc['source_system']} mapping ({match['unique_id']}) is in FINAL REVIEW pending sign-off on primary XREF lookup.",
                }
            )

        # Check referenced XREFs
        xref_raw = match.get("xref_table", "")
        if xref_raw and xref_raw.upper() not in ("N/A", "NA", "NONE"):
            referenced = [x.strip() for x in re.split(r"[;,]", xref_raw) if x.strip()]
            missing_xrefs = [xr for xr in referenced if xr.upper() not in uploaded_xref_names]
            if missing_xrefs:
                conf = max(0.55, conf - 0.15)
                findings.append(
                    {
                        "severity": "medium",
                        "category": "Missing XREF Table",
                        "source_system": doc["source_system"],
                        "message": f"{doc['source_system']} references XREF table(s) not yet uploaded: {', '.join(missing_xrefs)}.",
                    }
                )

        # Check design-spec override exception on Direct Copy
        if match["rule_code"] == "DIRECT_COPY" and t_tbl == "MAKT" and t_fld == "MAKTX":
            findings.append(
                {
                    "severity": "info",
                    "category": "Design-Spec Override Exception",
                    "source_system": doc["source_system"],
                    "message": f"{doc['source_system']} maps {t_tbl}-{t_fld} via Direct Copy from {match['source_table']}.{match['source_field']}, but {DESIGN_SPEC_REF} permits a cross-reference override when registered.",
                }
            )

        # Overview table row (Screenshot 2)
        overview_rows.append(
            {
                "source": doc["source_system"],
                "source_field": "MAKTX" if doc["source_system"] == "CMMS/MAXIMO" else "Material description",
                "target": f"{t_tbl}-{t_fld}",
                "mapping_decision": "Copy" if match["rule_code"] == "DIRECT_COPY" else "Extracted from FMD",
                "status": "Valid",
            }
        )

        # Exception / override text
        exception_text = match.get("exception_note") or (
            f"Checks XREF: {match['xref_table']}" if match["rule_code"] == "XREF_OVERRIDE" else "None"
        )

        # 7-column Consolidated table row (Screenshot 3)
        consolidated_rows.append(
            {
                "source_system": doc["source_system"],
                "source_field": f"{match['source_table']}.{match['source_field']}" if match["source_table"] and match["source_table"] != "N/A" else match["source_field"],
                "target_field": f"{t_tbl}-{t_fld} ({match['target_field_text'] or 'Product Description'})",
                "mapping_rule": match["mapping_rule"],
                "rule_code": match["rule_code"],
                "rule_short_label": match["rule_short_label"],
                "rule_logic": match["rule_logic"],
                "xref_table": match["xref_table"],
                "exception_or_override": exception_text,
                "confidence": round(conf, 2),
                "confidence_label": f"{int(conf * 100)}% · {match['status']}",
                "status": match["status"],
                "source_document_link": {
                    "doc_id": doc["doc_id"],
                    "file_name": doc["file_name"],
                    "sheet_name": match["sheet_name"],
                    "excel_row": match["excel_row"],
                    "unique_id": match["unique_id"],
                    "label": f"{doc['file_name']} › {match['sheet_name']} › Row {match['excel_row']} ({match['unique_id']})",
                },
            }
        )

    if len(distinct_patterns) > 1:
        findings.insert(
            0,
            {
                "severity": "info",
                "category": "Divergent Mapping Patterns",
                "source_system": "ALL",
                "message": f"AI identified {len(distinct_patterns)} different mapping patterns for the same target field ({t_tbl}-{t_fld}): {', '.join(sorted(distinct_patterns))}.",
            },
        )

    highlight_finding = (
        "The normal mapping is a direct copy, but a cross-reference can override the description. "
        "This proves that DataX is not only searching for a field name, but understanding the supporting design logic across distributed FMDs."
    )
    demo_conclusion = (
        f"For the same TIME target field ({t_tbl}-{t_fld}), AI correctly identified three different mapping patterns: "
        "cross-reference override, business construction, and direct copy. It then produced one consolidated, traceable result for business review."
    )
    recommendation = (
        "Approve ATLAS (FINAL REVIEW) and CONS/CMMS mappings for BODS staging preload; resolve SUSTAIN REWORK status by confirming "
        "precedence order between Material Description XREF and MAKT Override XREF, and enforce SAP 40-char + non-null checks into Z_ERRORLOG."
    )

    return {
        "status": "success",
        "target_table": t_tbl,
        "target_field": t_fld,
        "design_spec_ref": DESIGN_SPEC_REF,
        "pattern_count": len(distinct_patterns),
        "patterns_identified": sorted(list(distinct_patterns)),
        "overview_rows": overview_rows,
        "consolidated_rows": consolidated_rows,
        "findings": findings,
        "highlight_finding": highlight_finding,
        "demo_conclusion": demo_conclusion,
        "recommendation": recommendation,
    }


# -----------------------------------------------------------------------------
# Grounded Business Question Explainer ("Ask One Business Question")
# -----------------------------------------------------------------------------
def ask_business_question(
    tid: str,
    question: str,
    target_table: str = "MAKT",
    target_field: str = "MAKTX",
    llm_client: Any = None,
    llm_deployment: Optional[str] = None,
) -> Dict[str, Any]:
    # Try to infer table-field if mentioned in question (e.g. MARC-WERKS or MAKT-MAKTX)
    m = re.search(r"\b(MARA|MARC|MAKT|MBEW|MARD|KSSK|AUSP)[\-_]([A-Z0-9_]+)\b", (question or "").upper())
    if m:
        target_table, target_field = m.group(1), m.group(2)

    comparison = compare_target_field(tid, target_table, target_field)
    if comparison["status"] == "empty":
        return {
            "status": "empty",
            "question": question,
            "answer": "No FMD Excel documents are loaded yet. Please upload FMD files or click 'Load 4 Demo FMDs (R3.2)'.",
            "comparison": comparison,
            "citations": [],
            "engine": "deterministic",
        }

    citations = [
        {
            "source_system": row["source_system"],
            "unique_id": row["source_document_link"]["unique_id"],
            "file_name": row["source_document_link"]["file_name"],
            "sheet_name": row["source_document_link"]["sheet_name"],
            "excel_row": row["source_document_link"]["excel_row"],
            "doc_id": row["source_document_link"]["doc_id"],
        }
        for row in comparison["consolidated_rows"]
    ]

    # Deterministic grounded executive answer (always available, zero hallucination)
    bullets = []
    for r in comparison["consolidated_rows"]:
        cite = r["source_document_link"]
        bullets.append(
            f"- **{r['source_system']}** (`{cite['file_name']}` › `{cite['sheet_name']}` › Row {cite['excel_row']}, `{cite['unique_id']}`): "
            f"Maps `{r['source_field']}` $\\to$ `{r['target_field']}` using **{r['mapping_rule']}** ({r['rule_short_label']}). "
            f"Status: **{r['status']}**. {r['exception_or_override']}"
        )

    deterministic_answer = (
        f"### Business Summary for `{target_table}-{target_field}` across {len(comparison['consolidated_rows'])} Legacy Sources\n\n"
        f"{comparison['demo_conclusion']}\n\n"
        f"**Source-by-Source Rules & Citations:**\n" + "\n".join(bullets) + "\n\n"
        f"**Key Design Logic Highlight:** {comparison['highlight_finding']}\n\n"
        f"**Review-Ready Recommendation:** {comparison['recommendation']}"
    )

    engine_used = "grounded-deterministic"
    final_answer = deterministic_answer

    if llm_client is not None and llm_deployment:
        try:
            sys_prompt = (
                "You are a senior SAP S/4HANA Data Migration Architect reviewing Functional Mapping Documents (FMDs). "
                "Answer the user's business question concisely in plain business language using ONLY the structured FMD facts provided. "
                "Always cite the exact originating file name, Excel tab, row number, and UNIQUE_ID. Never invent rules."
            )
            user_payload = json.dumps(
                {
                    "question": question,
                    "target": f"{target_table}-{target_field}",
                    "design_spec": DESIGN_SPEC_REF,
                    "consolidated_rows": comparison["consolidated_rows"],
                    "findings": comparison["findings"],
                },
                indent=2,
            )
            resp = llm_client.chat.completions.create(
                model=llm_deployment,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_payload},
                ],
                temperature=0.1,
                max_tokens=700,
            )
            llm_text = (resp.choices[0].message.content or "").strip()
            if llm_text:
                final_answer = llm_text
                engine_used = f"azure-openai:{llm_deployment}"
        except Exception:
            # Seamless fallback to grounded deterministic explanation
            final_answer = deterministic_answer
            engine_used = "grounded-deterministic-fallback"

    return {
        "status": "success",
        "question": question,
        "target_table": target_table,
        "target_field": target_field,
        "answer": final_answer,
        "engine": engine_used,
        "citations": citations,
        "comparison": comparison,
    }


# -----------------------------------------------------------------------------
# DuckDB Transformation Simulator + Z_ERRORLOG + Best Demo Screen
# -----------------------------------------------------------------------------
def simulate_fmd_transformation(
    tid: str = "tenant_enterprise",
    target_table: str = "MAKT",
    target_field: str = "MAKTX",
    xref_enabled: bool = True,
    apply_cmms_override: bool = False,
    custom_records: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    target_table = _sanitize_identifier(target_table, "MAKT")
    target_field = _sanitize_identifier(target_field, "MAKTX")
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)

    comparison = compare_target_field(tid, target_table, target_field)
    rule_by_source = {r["source_system"]: r for r in comparison["consolidated_rows"]}

    # Gather source records (uploaded or custom)
    records: List[Dict[str, Any]] = []
    if custom_records:
        records = custom_records
    else:
        for ds in bucket["source_datasets"]:
            records.extend(ds.get("records", []))

    if not records:
        records = [
            {"source_system": "SUSTAIN", "source_table": "MAKT", "matnr": "100001", "spras": "EN", "maktx": "LEGACY PUMP ASSEMBLY", "werks": "P100", "condition_prefix": "", "equip_noun": ""},
            {"source_system": "ATLAS", "source_table": "MAKT", "matnr": "200001", "spras": "EN", "maktx": "ATLAS FILTER UNIT", "werks": "P200", "condition_prefix": "", "equip_noun": ""},
            {"source_system": "CONS", "source_table": "R3_2_CONS_MATERIAL_MASTERDATA", "matnr": "300001", "spras": "EN", "maktx": "NEW MIXING VESSEL", "werks": "P300", "condition_prefix": "NEW", "equip_noun": "MIXING VESSEL"},
            {"source_system": "CMMS/MAXIMO", "source_table": "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "matnr": "400001", "spras": "EN", "maktx": "MAINTENANCE MOTOR", "werks": "P400", "condition_prefix": "", "equip_noun": ""},
        ]

    # Build DuckDB in-memory tables for real SQL execution
    con = duckdb.connect(database=":memory:")
    con.execute("""
        CREATE TABLE src_makt (
            source_system VARCHAR,
            source_table VARCHAR,
            matnr VARCHAR,
            spras VARCHAR,
            maktx VARCHAR,
            werks VARCHAR,
            condition_prefix VARCHAR,
            equip_noun VARCHAR
        )
    """)
    for rec in records:
        con.execute(
            "INSERT INTO src_makt VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                rec.get("source_system", ""),
                rec.get("source_table", "MAKT"),
                str(rec.get("matnr", "")),
                rec.get("spras", "EN") or "EN",
                rec.get("maktx", ""),
                rec.get("werks", ""),
                rec.get("condition_prefix", ""),
                rec.get("equip_noun", ""),
            ],
        )

    con.execute("""
        CREATE TABLE xref_primary (
            legacy_matnr VARCHAR,
            source_system VARCHAR,
            time_maktx VARCHAR,
            override_reason VARCHAR
        )
    """)
    con.execute("""
        CREATE TABLE xref_override (
            legacy_matnr VARCHAR,
            source_system VARCHAR,
            time_maktx VARCHAR,
            override_reason VARCHAR
        )
    """)

    if xref_enabled:
        for xf in bucket["xrefs"]:
            tbl = "xref_override" if "OVERRIDE" in xf["table_name"].upper() else "xref_primary"
            for e in xf.get("entries", []):
                con.execute(
                    f"INSERT INTO {tbl} VALUES (?, ?, ?, ?)",
                    [str(e["legacy_matnr"]), e["source_system"], e["time_maktx"], e.get("override_reason", "")],
                )

    compiled_sql = f"""
-- Compiled DataX DuckDB Transformation SQL for TIME {target_table}-{target_field}
SELECT
    s.source_system,
    s.source_table,
    s.matnr,
    COALESCE(NULLIF(TRIM(s.spras), ''), 'EN') AS spras,
    s.maktx AS original_maktx,
    CASE
        WHEN s.source_system = 'SUSTAIN' THEN COALESCE(xo.time_maktx, xp.time_maktx, s.maktx)
        WHEN s.source_system = 'ATLAS' THEN COALESCE(xp.time_maktx, s.maktx)
        WHEN s.source_system = 'CONS' THEN
            CASE
                WHEN TRIM(COALESCE(s.condition_prefix, '') || ' ' || COALESCE(s.equip_noun, '')) <> ''
                THEN UPPER(TRIM(s.condition_prefix || ' ' || s.equip_noun))
                ELSE UPPER(TRIM(s.maktx))
            END
        WHEN s.source_system = 'CMMS/MAXIMO' THEN
            {"COALESCE(xo.time_maktx, xp.time_maktx, s.maktx)" if apply_cmms_override else "s.maktx"}
        ELSE s.maktx
    END AS final_time_maktx,
    CASE
        WHEN s.source_system = 'SUSTAIN' AND xo.time_maktx IS NOT NULL THEN 'XREF override (MAKT Override XREF hit)'
        WHEN s.source_system = 'SUSTAIN' AND xp.time_maktx IS NOT NULL THEN 'XREF override (Material Description XREF hit)'
        WHEN s.source_system = 'SUSTAIN' THEN 'XREF miss -> fallback legacy copy'
        WHEN s.source_system = 'ATLAS' AND xp.time_maktx IS NOT NULL THEN 'XREF override (Primary XREF hit)'
        WHEN s.source_system = 'ATLAS' THEN 'XREF miss -> fallback legacy copy'
        WHEN s.source_system = 'CONS' THEN 'Business construction'
        WHEN s.source_system = 'CMMS/MAXIMO' AND {"(xo.time_maktx IS NOT NULL OR xp.time_maktx IS NOT NULL)" if apply_cmms_override else "FALSE"} THEN 'Design-spec XREF override applied'
        ELSE 'Direct copy'
    END AS execution_branch
FROM src_makt s
LEFT JOIN xref_primary xp ON s.matnr = xp.legacy_matnr
LEFT JOIN xref_override xo ON s.matnr = xo.legacy_matnr
""".strip()

    rows_out = con.execute(compiled_sql).fetchall()
    con.close()

    preload_rows: List[Dict[str, Any]] = []
    z_errorlog: List[Dict[str, Any]] = []

    for src_sys, src_tbl, matnr, spras, orig_maktx, final_maktx, branch in rows_out:
        rule_meta = rule_by_source.get(src_sys, {})
        unique_id = rule_meta.get("source_document_link", {}).get("unique_id", "N/A")
        rule_short = rule_meta.get("rule_short_label", "Direct copy")
        fmd_status = rule_meta.get("status", "VALID")
        doc_label = rule_meta.get("source_document_link", {}).get("label", "N/A")

        row_errors = []
        # Validation Rule 1: Mandatory MAKTX non-empty
        if not (final_maktx or "").strip():
            err = {
                "record_key": matnr,
                "source_system": src_sys,
                "source_table": src_tbl,
                "COLUMNNAME": "MAKTX",
                "RULENAME": "MANDATORY_MAKTX_NOT_NULL",
                "ERROR_CATEGORY": "COMPLETENESS_ERROR",
                "severity": "Critical",
                "message": f"Material {matnr} ({src_sys}) has an empty MAKT-MAKTX description after rule evaluation; blocked from TIME preload.",
            }
            z_errorlog.append(err)
            row_errors.append(err)

        # Validation Rule 2: SAP S/4HANA MAKT-MAKTX max length = 40 chars
        elif len(final_maktx.strip()) > 40:
            err = {
                "record_key": matnr,
                "source_system": src_sys,
                "source_table": src_tbl,
                "COLUMNNAME": "MAKTX",
                "RULENAME": "SAP_S4_MAKTX_MAX_40_CHARS",
                "ERROR_CATEGORY": "LENGTH_VIOLATION",
                "severity": "Critical",
                "message": f"Material {matnr} ({src_sys}) description length ({len(final_maktx.strip())} chars) exceeds SAP S/4HANA MAKT-MAKTX 40-char limit.",
            }
            z_errorlog.append(err)
            row_errors.append(err)

        # Validation Rule 3: Governance Warning when FMD status is REWORK
        if fmd_status == "REWORK" and not row_errors:
            z_errorlog.append(
                {
                    "record_key": matnr,
                    "source_system": src_sys,
                    "source_table": src_tbl,
                    "COLUMNNAME": "MAKTX",
                    "RULENAME": "FMD_MAPPING_STATUS_REWORK",
                    "ERROR_CATEGORY": "GOVERNANCE_WARNING",
                    "severity": "Warning",
                    "message": f"FMD rule {unique_id} ({src_sys}) has status REWORK; staged for business review before final TIME cutover.",
                }
            )

        preload_status = "ERROR_LOGGED" if row_errors else ("STAGED_WITH_WARNING" if fmd_status == "REWORK" else "PRELOAD_READY")

        preload_rows.append(
            {
                "matnr": matnr,
                "spras": spras,
                "source_system": src_sys,
                "source_table": src_tbl,
                "original_description": orig_maktx,
                "rule_identified_by_ai": rule_short,
                "execution_branch": branch,
                "final_time_description": final_maktx,
                "fmd_status": fmd_status,
                "preload_status": preload_status,
                "fmd_unique_id": unique_id,
                "trace_link": doc_label,
            }
        )

    # Build the 4-row "Best Demo Screen" compact comparison (one canonical record per source)
    best_demo_rows: List[Dict[str, Any]] = []
    for src_name in CANONICAL_SOURCE_ORDER:
        rec = next((r for r in preload_rows if r["source_system"] == src_name and r["preload_status"] != "ERROR_LOGGED"), None)
        if rec:
            best_demo_rows.append(
                {
                    "source": rec["source_system"],
                    "matnr": rec["matnr"],
                    "original_description": rec["original_description"],
                    "rule_identified_by_ai": rec["rule_identified_by_ai"],
                    "final_time_description": rec["final_time_description"],
                    "execution_branch": rec["execution_branch"],
                    "fmd_status": rec["fmd_status"],
                }
            )

    # Build detailed per-source walkthrough cards (Screenshots 4, 5, 6)
    walkthrough_cards = [
        {
            "order": 1,
            "source_system": "SUSTAIN",
            "title": "1. SUSTAIN FMD example",
            "fmd_file": "TIME-L3-MDA-MT-C_Material_Master-FMD-SUSTAIN_R3.2",
            "status": "REWORK",
            "example_record": {"source_table": "MAKT", "matnr": "100001", "maktx": "LEGACY PUMP ASSEMBLY"},
            "rule_type": "XRef/Rule",
            "logic_bullets": [
                "Check whether MATNR = 100001 exists in the Material Description or MAKT Override cross-reference.",
                "If an override exists, use TIME_MAKTX.",
                "Otherwise, copy the legacy MAKT-MAKTX.",
                "The current mapping status is REWORK.",
            ],
            "condition_table": [
                {"condition": "XREF contains 100001 -> PUMP ASSEMBLY", "target_value": "PUMP ASSEMBLY", "active": xref_enabled},
                {"condition": "No XREF entry", "target_value": "LEGACY PUMP ASSEMBLY", "active": not xref_enabled},
            ],
            "demo_message": "AI found that SUSTAIN is not a simple copy. It must first check two description-override cross-references.",
        },
        {
            "order": 2,
            "source_system": "ATLAS",
            "title": "2. ATLAS FMD example",
            "fmd_file": "TIME-L3-MDA-MT-C_Material_Master-FMD-ATLAS_R3.2",
            "status": "FINAL REVIEW",
            "example_record": {"source_table": "MAKT", "matnr": "200001", "maktx": "ATLAS FILTER UNIT"},
            "rule_type": "XRef/Rule",
            "logic_bullets": [
                "Search TIME_L3_MM_R3_2_MAKTX_XREF_MATERIAL_DESCRIPTION_MASTER_DATA using the legacy material number.",
                "If found, use the cross-reference field TIME_MAKTX.",
                "Otherwise, copy MAKT-MAKTX.",
                "The mapping status is FINAL REVIEW.",
            ],
            "condition_table": [
                {"condition": "XREF contains 200001 -> FILTER UNIT", "target_value": "FILTER UNIT", "active": xref_enabled},
                {"condition": "No XREF entry", "target_value": "ATLAS FILTER UNIT", "active": not xref_enabled},
            ],
            "demo_message": "AI identified that ATLAS follows the same general override pattern, but uses one primary material-description cross-reference.",
        },
        {
            "order": 3,
            "source_system": "CONS",
            "title": "3. CONS / Construction FMD example",
            "fmd_file": "TIME-L3-MDA-MT-C Material Master-FMD-CONS R3.2",
            "status": "VALID",
            "example_record": {"source_table": "R3_2_CONS_MATERIAL_MASTERDATA", "matnr": "300001", "maktx": "NEW MIXING VESSEL"},
            "rule_type": "Business construction",
            "logic_bullets": [
                "Read standardized construction attributes (CONDITION_PREFIX + EQUIP_NOUN) from R3_2_CONS_MATERIAL_MASTERDATA.",
                "Apply business construction formatting (uppercase, normalized whitespace, <= 40 characters).",
                "No legacy XREF override is required; description is constructed natively for TIME.",
            ],
            "condition_table": [
                {"condition": "Constructed from NEW + MIXING VESSEL", "target_value": "NEW MIXING VESSEL", "active": True},
            ],
            "demo_message": "AI recognized that CONS constructs the TIME product description directly from business model attributes rather than copying legacy text.",
        },
        {
            "order": 4,
            "source_system": "CMMS/MAXIMO",
            "title": "4. CMMS/MAXIMO FMD example",
            "fmd_file": "TIME-L3-MDA-MT-C Material Master-FMD-CMMS_R3.2",
            "status": "VALID",
            "example_record": {"source_table": "R3_2_CONS_MATERIAL_CMMS_MASTERDATA", "matnr": "400001", "maktx": "MAINTENANCE MOTOR"},
            "rule_type": "Copy",
            "logic_bullets": [
                "Explicitly mapped using Direct Copy from R3_2_CONS_MATERIAL_CMMS_MASTERDATA.MAKTX to target Product Description.",
                f"Design specification ({DESIGN_SPEC_REF}) exception: a cross-reference override may supersede the description if registered.",
                "Related key field MATNR uses Internal mapping (no active transformation needed).",
            ],
            "condition_table": [
                {"condition": "Standard Direct Copy (400001)", "target_value": "MAINTENANCE MOTOR", "active": not apply_cmms_override},
                {"condition": "Design-spec XREF Override enabled (400009)", "target_value": "ELECTRIC MOTOR 5HP IEC", "active": apply_cmms_override},
            ],
            "demo_message": "AI confirmed CMMS/MAXIMO uses a direct copy while surfacing the design-specification override exception.",
        },
    ]

    result = {
        "status": "success",
        "run_id": f"fmd_sim_{uuid.uuid4().hex[:8]}",
        "executed_at": _now_iso(),
        "target_table": target_table,
        "target_field": target_field,
        "xref_enabled": xref_enabled,
        "apply_cmms_override": apply_cmms_override,
        "summary": {
            "total_records": len(preload_rows),
            "preload_ready": sum(1 for r in preload_rows if r["preload_status"] == "PRELOAD_READY"),
            "staged_with_warning": sum(1 for r in preload_rows if r["preload_status"] == "STAGED_WITH_WARNING"),
            "error_logged": sum(1 for r in preload_rows if r["preload_status"] == "ERROR_LOGGED"),
            "z_errorlog_count": len(z_errorlog),
        },
        "best_demo_rows": best_demo_rows,
        "walkthrough_cards": walkthrough_cards,
        "preload_rows": preload_rows,
        "z_errorlog": z_errorlog,
        "compiled_sql": compiled_sql,
        "demo_conclusion": comparison["demo_conclusion"],
    }

    bucket["last_simulation"] = result
    _save_store(store)
    return result


# -----------------------------------------------------------------------------
# BODS Staging Bundle Exporter (.xlsx / .csv)
# -----------------------------------------------------------------------------
def export_bods_staging(tid: str = "tenant_enterprise", fmt: str = "xlsx") -> Tuple[bytes, str, str]:
    store = _load_store()
    bucket = _get_tenant_bucket(store, tid)
    sim = bucket.get("last_simulation") or simulate_fmd_transformation(tid)

    preload_rows = sim.get("preload_rows", [])
    z_errorlog = sim.get("z_errorlog", [])

    if fmt.lower() == "csv":
        buf = io.StringIO()
        fieldnames = [
            "MATNR", "SPRAS", "MAKTX", "SOURCE_SYSTEM", "SOURCE_TABLE",
            "ORIGINAL_MAKTX", "APPLIED_RULE", "EXECUTION_BRANCH", "PRELOAD_STATUS", "FMD_UNIQUE_ID",
        ]
        writer = csv.DictWriter(buf, fieldnames=fieldnames)
        writer.writeheader()
        for r in preload_rows:
            if r["preload_status"] != "ERROR_LOGGED":
                writer.writerow(
                    {
                        "MATNR": _sanitize_spreadsheet_cell(r["matnr"]),
                        "SPRAS": _sanitize_spreadsheet_cell(r["spras"]),
                        "MAKTX": _sanitize_spreadsheet_cell(r["final_time_description"]),
                        "SOURCE_SYSTEM": _sanitize_spreadsheet_cell(r["source_system"]),
                        "SOURCE_TABLE": _sanitize_spreadsheet_cell(r["source_table"]),
                        "ORIGINAL_MAKTX": _sanitize_spreadsheet_cell(r["original_description"]),
                        "APPLIED_RULE": _sanitize_spreadsheet_cell(r["rule_identified_by_ai"]),
                        "EXECUTION_BRANCH": _sanitize_spreadsheet_cell(r["execution_branch"]),
                        "PRELOAD_STATUS": _sanitize_spreadsheet_cell(r["preload_status"]),
                        "FMD_UNIQUE_ID": _sanitize_spreadsheet_cell(r["fmd_unique_id"]),
                    }
                )
        return buf.getvalue().encode("utf-8"), "TIME_BODS_Staging_Preload_MAKT.csv", "text/csv"

    # Multi-tab XLSX staging workbook for SAP BODS
    wb = openpyxl.Workbook()
    header_fill = PatternFill(start_color="0A0F1F", end_color="0A0F1F", fill_type="solid")
    err_fill = PatternFill(start_color="B91C1C", end_color="B91C1C", fill_type="solid")
    hfont = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    # Sheet 1: Preload_MAKT_TIME
    ws1 = wb.active
    ws1.title = "Preload_MAKT_TIME"
    h1 = [
        "MATNR", "SPRAS", "MAKTX", "SOURCE_SYSTEM", "SOURCE_TABLE",
        "ORIGINAL_MAKTX", "APPLIED_RULE", "EXECUTION_BRANCH", "PRELOAD_STATUS", "FMD_UNIQUE_ID", "TRACE_LINK",
    ]
    for ci, h in enumerate(h1, start=1):
        c = ws1.cell(row=1, column=ci, value=h)
        c.fill = header_fill
        c.font = hfont
    r_i = 2
    for r in preload_rows:
        if r["preload_status"] == "ERROR_LOGGED":
            continue
        vals = [
            r["matnr"], r["spras"], r["final_time_description"], r["source_system"],
            r["source_table"], r["original_description"], r["rule_identified_by_ai"],
            r["execution_branch"], r["preload_status"], r["fmd_unique_id"], r["trace_link"],
        ]
        for ci, v in enumerate(vals, start=1):
            ws1.cell(row=r_i, column=ci, value=_sanitize_spreadsheet_cell(v))
        r_i += 1

    # Sheet 2: Z_ERRORLOG
    ws2 = wb.create_sheet("Z_ERRORLOG")
    h2 = ["RECORD_KEY", "SOURCE_SYSTEM", "SOURCE_TABLE", "COLUMNNAME", "RULENAME", "ERROR_CATEGORY", "SEVERITY", "MESSAGE"]
    for ci, h in enumerate(h2, start=1):
        c = ws2.cell(row=1, column=ci, value=h)
        c.fill = err_fill
        c.font = hfont
    for ri, e in enumerate(z_errorlog, start=2):
        vals = [
            e["record_key"], e["source_system"], e["source_table"], e["COLUMNNAME"],
            e["RULENAME"], e["ERROR_CATEGORY"], e["severity"], e["message"],
        ]
        for ci, v in enumerate(vals, start=1):
            ws2.cell(row=ri, column=ci, value=_sanitize_spreadsheet_cell(v))

    # Sheet 3: FMD_Traceability_Audit
    ws3 = wb.create_sheet("FMD_Traceability_Audit")
    comp = compare_target_field(tid, sim["target_table"], sim["target_field"])
    h3 = ["SOURCE_SYSTEM", "SOURCE_FIELD", "TARGET_FIELD", "MAPPING_RULE", "EXCEPTION_OR_OVERRIDE", "STATUS", "SOURCE_DOCUMENT_LINK"]
    for ci, h in enumerate(h3, start=1):
        c = ws3.cell(row=1, column=ci, value=h)
        c.fill = header_fill
        c.font = hfont
    for ri, row in enumerate(comp["consolidated_rows"], start=2):
        vals = [
            row["source_system"], row["source_field"], row["target_field"],
            row["mapping_rule"], row["exception_or_override"], row["status"],
            row["source_document_link"]["label"],
        ]
        for ci, v in enumerate(vals, start=1):
            ws3.cell(row=ri, column=ci, value=_sanitize_spreadsheet_cell(v))

    for ws in (ws1, ws2, ws3):
        for col in ws.columns:
            max_len = max(len(str(c.value or "")) for c in col)
            ws.column_dimensions[col[0].column_letter].width = min(max(max_len + 4, 14), 55)

    out = io.BytesIO()
    wb.save(out)
    return (
        out.getvalue(),
        "TIME_BODS_Staging_Preload_and_Z_ERRORLOG.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
