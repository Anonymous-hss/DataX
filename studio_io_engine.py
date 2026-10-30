"""
DataX Studio Real I/O Engine
- Live Database Table Discovery & High-Throughput Record Extraction (PostgreSQL & MongoDB)
- Live Destination Database Table Creation & Bulk Commit (PostgreSQL & MongoDB)
- SSRF-Safe Public URL Document Fetching & Overlapping Text Chunker
"""

import re
import json
import time
import html
import socket
import ipaddress
import urllib.request
import urllib.parse
from decimal import Decimal
from datetime import datetime, date
from typing import Dict, Any, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from pymongo import MongoClient

from vault import DEFAULT_NEON_URI, get_credential_uri


def _resolve_studio_uri(
    engine: str,
    connection_uri: Optional[str] = None,
    credential_id: Optional[str] = None,
    use_workspace_db: bool = False
) -> str:
    eng = (engine or "postgres").lower().strip()
    if credential_id:
        resolved = get_credential_uri(credential_id)
        if resolved:
            return resolved.strip()

    uri = (connection_uri or "").strip()
    if uri and "••••" not in uri and "<" not in uri:
        return uri

    if use_workspace_db and eng in ["postgres", "postgresql"]:
        return DEFAULT_NEON_URI

    return ""


def _sanitize_identifier(name: str, fallback: str = "datax_output") -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", (name or "").strip())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    if not cleaned:
        return fallback
    if cleaned[0].isdigit():
        cleaned = f"t_{cleaned}"
    return cleaned[:63]


def _serialize_val(v: Any) -> Any:
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if isinstance(v, bytes):
        return v.decode("utf-8", errors="replace")
    if isinstance(v, (dict, list)):
        return v
    return v


def list_database_tables(
    engine: str,
    connection_uri: Optional[str] = None,
    credential_id: Optional[str] = None,
    database: Optional[str] = None,
    use_workspace_db: bool = False
) -> Dict[str, Any]:
    """Discovers live tables or collections from PostgreSQL or MongoDB."""
    start_t = time.time()
    eng = (engine or "postgres").lower().strip()
    uri = _resolve_studio_uri(eng, connection_uri, credential_id, use_workspace_db)

    if not uri:
        raise ValueError("Please provide a valid database Connection URI (or select Workspace PostgreSQL).")

    if eng in ["postgres", "postgresql"]:
        with psycopg2.connect(uri, connect_timeout=8) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        t.table_name AS name,
                        COALESCE(s.n_live_tup, 0) AS approx_rows
                    FROM information_schema.tables t
                    LEFT JOIN pg_stat_user_tables s
                        ON s.relname = t.table_name AND s.schemaname = 'public'
                    WHERE t.table_schema = 'public'
                      AND t.table_type = 'BASE TABLE'
                    ORDER BY t.table_name;
                """)
                rows = cur.fetchall()
                tables = [r["name"] for r in rows]
                details = [{"name": r["name"], "approxRows": int(r["approx_rows"] or 0)} for r in rows]
        return {
            "status": "success",
            "engine": "postgres",
            "tables": tables,
            "tableDetails": details,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    elif eng in ["mongodb", "mongo"]:
        client = MongoClient(uri, serverSelectionTimeoutMS=6000)
        db_names = [d for d in client.list_database_names() if d not in ["admin", "local", "config"]]
        target_db = database if (database and database in db_names) else None
        if not target_db:
            try:
                def_db = client.get_default_database()
                if def_db and def_db.name in db_names:
                    target_db = def_db.name
            except Exception:
                pass
        if not target_db:
            target_db = db_names[0] if db_names else "test"

        colls = sorted(client[target_db].list_collection_names()) if target_db in db_names else []
        details = []
        for c in colls[:60]:
            try:
                cnt = client[target_db][c].estimated_document_count()
            except Exception:
                cnt = 0
            details.append({"name": c, "approxRows": int(cnt)})
        client.close()
        return {
            "status": "success",
            "engine": "mongodb",
            "database": target_db,
            "availableDatabases": db_names,
            "tables": colls,
            "tableDetails": details,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    else:
        raise ValueError(f"Unsupported database engine '{engine}'. Supported engines: PostgreSQL, MongoDB.")


def extract_database_records(
    engine: str,
    table_name: str,
    connection_uri: Optional[str] = None,
    credential_id: Optional[str] = None,
    database: Optional[str] = None,
    limit: int = 2000,
    use_workspace_db: bool = False
) -> Dict[str, Any]:
    """Extracts up to 25,000 real records from a user PostgreSQL table or MongoDB collection."""
    start_t = time.time()
    eng = (engine or "postgres").lower().strip()
    uri = _resolve_studio_uri(eng, connection_uri, credential_id, use_workspace_db)
    if not uri:
        raise ValueError("Please provide a valid database Connection URI (or select Workspace PostgreSQL).")

    if not table_name or not table_name.strip():
        raise ValueError("Table or collection name is required.")

    safe_limit = min(max(int(limit or 1000), 1), 25000)

    if eng in ["postgres", "postgresql"]:
        with psycopg2.connect(uri, connect_timeout=10) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
                )
                valid_tables = {r["table_name"] for r in cur.fetchall()}
                if table_name not in valid_tables:
                    raise ValueError(f"Table '{table_name}' was not found in public schema.")

                cur.execute(f'SELECT COUNT(*) AS cnt FROM "{table_name}";')
                total_rows = int((cur.fetchone() or {}).get("cnt", 0))

                cur.execute(f'SELECT * FROM "{table_name}" LIMIT %s;', (safe_limit,))
                raw_rows = cur.fetchall()

        records = []
        columns = []
        for r in raw_rows:
            item = {}
            for k, v in r.items():
                if k not in columns:
                    columns.append(k)
                item[k] = _serialize_val(v)
            records.append(item)

        return {
            "status": "success",
            "engine": "postgres",
            "table": table_name,
            "totalRowsInTable": total_rows,
            "extractedCount": len(records),
            "columns": columns,
            "records": records,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    elif eng in ["mongodb", "mongo"]:
        client = MongoClient(uri, serverSelectionTimeoutMS=6000)
        db_names = [d for d in client.list_database_names() if d not in ["admin", "local", "config"]]
        target_db = database if (database and database in db_names) else None
        if not target_db:
            for d in db_names:
                if table_name in client[d].list_collection_names():
                    target_db = d
                    break
        if not target_db:
            target_db = db_names[0] if db_names else "test"

        coll = client[target_db][table_name]
        total_rows = coll.count_documents({})
        cursor = coll.find({}, {"_id": 0}).limit(safe_limit)
        records = []
        columns = []
        for doc in cursor:
            item = {}
            for k, v in doc.items():
                if k not in columns:
                    columns.append(k)
                val = _serialize_val(v)
                if not isinstance(val, (str, int, float, bool, list, dict, type(None))):
                    val = str(val)
                item[k] = val
            records.append(item)
        client.close()

        return {
            "status": "success",
            "engine": "mongodb",
            "database": target_db,
            "table": table_name,
            "totalRowsInTable": total_rows,
            "extractedCount": len(records),
            "columns": columns,
            "records": records,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    else:
        raise ValueError(f"Unsupported database engine '{engine}'.")


def _infer_pg_type(values: List[Any]) -> str:
    non_null = [v for v in values if v is not None and v != ""]
    if not non_null:
        return "TEXT"
    if all(isinstance(v, bool) for v in non_null):
        return "BOOLEAN"
    if all(isinstance(v, int) and not isinstance(v, bool) and -2147483648 <= v <= 2147483647 for v in non_null):
        return "BIGINT"
    if all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in non_null):
        return "DOUBLE PRECISION"
    if any(isinstance(v, (dict, list)) for v in non_null):
        return "JSONB"
    return "TEXT"


def commit_records_to_database(
    engine: str,
    table_name: str,
    records: List[Dict[str, Any]],
    connection_uri: Optional[str] = None,
    credential_id: Optional[str] = None,
    database: Optional[str] = None,
    write_mode: str = "replace",
    use_workspace_db: bool = False
) -> Dict[str, Any]:
    """
    Commits sanitized RAG chunks or certified ML/SFT datasets directly into PostgreSQL or MongoDB.
    Automatically creates the target table/collection and verifies row count after commit.
    """
    start_t = time.time()
    if not records:
        raise ValueError("No records provided to commit.")

    eng = (engine or "postgres").lower().strip()
    uri = _resolve_studio_uri(eng, connection_uri, credential_id, use_workspace_db)
    if not uri:
        raise ValueError("Please provide a valid target Connection URI (or select Workspace PostgreSQL).")

    safe_table = _sanitize_identifier(table_name, fallback="datax_certified_output")
    mode = (write_mode or "replace").lower().strip()

    if eng in ["postgres", "postgresql"]:
        # Collect ordered union of all keys across records
        raw_keys = []
        for r in records[:500]:
            for k in r.keys():
                if k not in raw_keys:
                    raw_keys.append(k)

        col_map = []
        used_cols = set()
        for rk in raw_keys:
            sc = _sanitize_identifier(rk, fallback="col")
            base_sc = sc
            suffix = 1
            while sc.lower() in used_cols:
                suffix += 1
                sc = f"{base_sc}_{suffix}"
            used_cols.add(sc.lower())
            sample_vals = [r.get(rk) for r in records[:200]]
            pg_type = _infer_pg_type(sample_vals)
            col_map.append((rk, sc, pg_type))

        with psycopg2.connect(uri, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                if mode == "replace":
                    cur.execute(f'DROP TABLE IF EXISTS "{safe_table}";')

                col_defs = ", ".join([f'"{sc}" {pg_type}' for _, sc, pg_type in col_map])
                cur.execute(f'CREATE TABLE IF NOT EXISTS "{safe_table}" ({col_defs});')

                if mode == "append":
                    for _, sc, pg_type in col_map:
                        cur.execute(f'ALTER TABLE "{safe_table}" ADD COLUMN IF NOT EXISTS "{sc}" {pg_type};')

                col_names_sql = ", ".join([f'"{sc}"' for _, sc, _ in col_map])
                insert_sql = f'INSERT INTO "{safe_table}" ({col_names_sql}) VALUES %s;'

                tuples = []
                for r in records:
                    row_vals = []
                    for rk, _, pg_type in col_map:
                        val = r.get(rk)
                        if val is None or (val == "" and pg_type in ["BIGINT", "DOUBLE PRECISION", "BOOLEAN"]):
                            row_vals.append(None)
                        elif pg_type == "JSONB":
                            row_vals.append(json.dumps(val) if not isinstance(val, str) else val)
                        elif isinstance(val, (dict, list)):
                            row_vals.append(json.dumps(val))
                        else:
                            row_vals.append(val)
                    tuples.append(tuple(row_vals))

                execute_values(cur, insert_sql, tuples, page_size=2000)
                cur.execute(f'SELECT COUNT(*) FROM "{safe_table}";')
                total_in_target = int(cur.fetchone()[0])
            conn.commit()

        return {
            "status": "success",
            "engine": "postgres",
            "tableName": safe_table,
            "writeMode": mode,
            "rowsCommitted": len(records),
            "totalRowsInTarget": total_in_target,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    elif eng in ["mongodb", "mongo"]:
        client = MongoClient(uri, serverSelectionTimeoutMS=6000)
        db_names = [d for d in client.list_database_names() if d not in ["admin", "local", "config"]]
        target_db = database
        if not target_db:
            try:
                def_db = client.get_default_database()
                if def_db:
                    target_db = def_db.name
            except Exception:
                pass
        if not target_db:
            target_db = db_names[0] if db_names else "datax_output"

        coll = client[target_db][safe_table]
        if mode == "replace":
            coll.drop()

        # Copy dicts without mutating caller objects
        docs_to_insert = [json.loads(json.dumps(r, default=str)) for r in records]
        coll.insert_many(docs_to_insert)
        total_in_target = coll.count_documents({})
        client.close()

        return {
            "status": "success",
            "engine": "mongodb",
            "database": target_db,
            "tableName": safe_table,
            "writeMode": mode,
            "rowsCommitted": len(records),
            "totalRowsInTarget": total_in_target,
            "latencyMs": round((time.time() - start_t) * 1000, 1)
        }

    else:
        raise ValueError(f"Unsupported target engine '{engine}'.")


def chunk_text_with_overlap(text: str, doc_name: str, chunk_size: int = 1200, chunk_overlap: int = 120) -> List[Dict[str, Any]]:
    """Splits long unstructured text into clean overlapping chunks respecting paragraph/sentence boundaries."""
    clean = (text or "").strip()
    if not clean:
        return []

    size = min(max(int(chunk_size or 1200), 150), 12000)
    overlap = min(max(int(chunk_overlap or 120), 0), size // 2)

    if len(clean) <= size:
        return [{"docName": doc_name, "chunkIndex": 0, "text": clean}]

    chunks = []
    start = 0
    idx = 0
    n = len(clean)
    while start < n:
        end = min(start + size, n)
        if end < n:
            # Prefer breaking on paragraph, newline, or sentence end
            window = clean[start:end]
            for sep in ["\n\n", "\n", ". ", "? ", "! ", " "]:
                pos = window.rfind(sep)
                if pos > size * 0.55:
                    end = start + pos + len(sep)
                    break

        piece = clean[start:end].strip()
        if piece:
            chunks.append({
                "docName": f"{doc_name}#chunk_{idx + 1}",
                "sourceDoc": doc_name,
                "chunkIndex": idx,
                "text": piece
            })
            idx += 1

        if end >= n:
            break
        start = max(start + 1, end - overlap)

    return chunks


def _validate_public_url(url: str) -> str:
    parsed = urllib.parse.urlparse((url or "").strip())
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http:// and https:// URLs are allowed.")
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL hostname.")
    if hostname.lower() in ("localhost", "metadata.google.internal"):
        raise ValueError("Private/local hostnames are restricted.")

    addr_infos = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    for info in addr_infos:
        ip_str = info[4][0]
        ip_obj = ipaddress.ip_address(ip_str)
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ValueError("Access to private, loopback, or internal network addresses is blocked.")
    return parsed.geturl()


def fetch_url_and_chunk(url: str, chunk_size: int = 1200, chunk_overlap: int = 120) -> Dict[str, Any]:
    """Fetches a public URL safely (with SSRF protection), extracts readable text, and splits into RAG chunks."""
    safe_url = _validate_public_url(url)
    req = urllib.request.Request(
        safe_url,
        headers={"User-Agent": "DataX-RAG-Firewall-Ingestor/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        content_type = resp.headers.get("Content-Type", "")
        raw_bytes = resp.read(2_000_000)  # Max 2 MB fetch

    raw_text = raw_bytes.decode("utf-8", errors="replace")
    if "html" in content_type.lower() or "<html" in raw_text[:500].lower():
        raw_text = re.sub(r"<script[\s\S]*?</script>", " ", raw_text, flags=re.IGNORECASE)
        raw_text = re.sub(r"<style[\s\S]*?</style>", " ", raw_text, flags=re.IGNORECASE)
        raw_text = re.sub(r"</(p|div|h1|h2|h3|h4|li|tr|section|article|br)>", "\n", raw_text, flags=re.IGNORECASE)
        raw_text = re.sub(r"<[^>]+>", " ", raw_text)
        raw_text = html.unescape(raw_text)
        raw_text = re.sub(r"[ \t]+", " ", raw_text)
        raw_text = re.sub(r"\n{3,}", "\n\n", raw_text).strip()

    doc_label = urllib.parse.urlparse(safe_url).netloc + urllib.parse.urlparse(safe_url).path
    chunks = chunk_text_with_overlap(raw_text, doc_name=doc_label[:120], chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return {
        "status": "success",
        "url": safe_url,
        "charCount": len(raw_text),
        "chunkCount": len(chunks),
        "chunks": chunks
    }
