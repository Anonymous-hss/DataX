"""
DataX Encrypted Credential Vault & Store Management
Handles encrypted credential storage, thread templates, runs history, and audit logs.
"""

import os
import json
from typing import Dict, List, Any
from cryptography.fernet import Fernet

VAULT_DIR = os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service")
if not os.path.exists(VAULT_DIR):
    VAULT_DIR = os.path.dirname(os.path.abspath(__file__))

VAULT_KEY_FILE = os.path.join(VAULT_DIR, ".vault.key")
VAULT_DATA_FILE = os.path.join(VAULT_DIR, ".credentials_vault.json")
THREADS_STORE_FILE = os.path.join(VAULT_DIR, ".threads_store.json")
AUDIT_LOGS_FILE = os.path.join(VAULT_DIR, ".audit_logs.json")
RUNS_STORE_FILE = os.path.join(VAULT_DIR, ".runs_store.json")

from db_config import get_storage_uri, DEFAULT_STORAGE_URI, DEFAULT_NEON_URI


def get_vault_cipher():
    env_key = os.environ.get("DATAX_MASTER_KEY")
    if env_key:
        try:
            return Fernet(env_key.encode('utf-8') if isinstance(env_key, str) else env_key)
        except Exception:
            pass
    if not os.path.exists(VAULT_KEY_FILE):
        key = Fernet.generate_key()
        with open(VAULT_KEY_FILE, "wb") as f:
            f.write(key)
    else:
        with open(VAULT_KEY_FILE, "rb") as f:
            key = f.read().strip()
    return Fernet(key)


def load_vault() -> Dict[str, Any]:
    if not os.path.exists(VAULT_DATA_FILE):
        return {}
    try:
        cipher = get_vault_cipher()
        with open(VAULT_DATA_FILE, "rb") as f:
            encrypted = f.read()
            if not encrypted:
                return {}
            decrypted = cipher.decrypt(encrypted)
            return json.loads(decrypted.decode("utf-8"))
    except Exception as e:
        print(f"Error loading vault: {e}")
        return {}


def save_vault(data: Dict[str, Any]):
    cipher = get_vault_cipher()
    raw = json.dumps(data).encode("utf-8")
    encrypted = cipher.encrypt(raw)
    with open(VAULT_DATA_FILE, "wb") as f:
        f.write(encrypted)


def get_credential_uri(cred_id_or_uri: str) -> str:
    if cred_id_or_uri.startswith("cred_"):
        vault = load_vault()
        cred = vault.get(cred_id_or_uri)
        if cred and "uri" in cred:
            return cred["uri"]
    return cred_id_or_uri


def get_resolved_uri(req: Any) -> str:
    if getattr(req, "credentialId", None):
        return get_credential_uri(req.credentialId)
    uri = getattr(req, "connectionUri", None)
    if (not uri or not isinstance(uri, str)) and getattr(req, "host", None):
        raw_host = str(req.host).strip()
        if raw_host.startswith(("mongodb://", "mongodb+srv://", "postgresql://", "postgres://", "jdbc:")):
            uri = raw_host
    engine = str(getattr(req, "engine", "")).lower()
    if not uri or not isinstance(uri, str):
        if engine in ["postgres", "postgresql"]:
            return get_storage_uri()
        return ""
    uri = uri.strip()
    if not uri or "<" in uri or "user:password" in uri or "target-db.internal" in uri or "ep-sweet-neon" in uri or "••••" in uri:
        if engine in ["postgres", "postgresql"]:
            return get_storage_uri()
        return ""
    return uri


DEFAULT_THREADS = [
    {
        "id": "thread_sap_s4hana",
        "name": "SAP BW ➔ S/4HANA Clean Core Modernizer",
        "description": "Extract raw InfoCube purchasing lines, resolve legacy plant codes with ontology knowledge graph, enforce budget bounds, and stage BAPI_PO_CREATE1 orders with Gold Lakehouse replication.",
        "domainPackId": "sap_bw_s4hana",
        "category": "ERP Modernization",
        "badge": "SAP Certified Ontology",
        "status": "draft",
        "autoFixEnabled": True,
        "healthScore": None,
        "healthGrade": None,
        "driftStatus": "NOT_EVALUATED",
        "driftScore": 0.0,
        "runCount": 0,
        "lastRun": None,
        "nodesCount": 4,
        "edgesCount": 4
    },
    {
        "id": "thread_customer_master",
        "name": "Customer Master & Identity Harmonizer",
        "description": "Harmonize raw customer and user documents from MongoDB Atlas into PostgreSQL Neon DB, enforce RFC-5322 email syntax and non-negative balances, and replicate clean gold records.",
        "domainPackId": "customer_master",
        "category": "Customer 360",
        "badge": "MongoDB ➔ Neon DB",
        "status": "draft",
        "autoFixEnabled": True,
        "healthScore": None,
        "healthGrade": None,
        "driftStatus": "NOT_EVALUATED",
        "driftScore": 0.0,
        "runCount": 0,
        "lastRun": None,
        "nodesCount": 4,
        "edgesCount": 4
    },
    {
        "id": "thread_financial_gl",
        "name": "Financial General Ledger & AP Compliance",
        "description": "Audit general ledger and AP entries across disparate legacy systems, guarantee zero imbalance, verify ISO currency standards, and dual-dispatch approved entries to Financial ERP and audit warehouse.",
        "domainPackId": "financial_gl_ledger",
        "category": "Finance & Audit",
        "badge": "SOX & GAAP Compliant",
        "status": "draft",
        "autoFixEnabled": True,
        "healthScore": None,
        "healthGrade": None,
        "driftStatus": "NOT_EVALUATED",
        "driftScore": 0.0,
        "runCount": 0,
        "lastRun": None,
        "nodesCount": 4,
        "edgesCount": 4
    },
    {
        "id": "thread_healthcare_hipaa",
        "name": "Healthcare Patient Master & HIPAA Sanitizer",
        "description": "Ingest HL7 and EHR patient records, scrub PII anomalies, cross-verify National Provider Identifiers (NPI), and stage HIPAA-compliant clinical data to analytics warehouse.",
        "domainPackId": "healthcare_hipaa",
        "category": "Healthcare & Life Sciences",
        "badge": "HIPAA & HL7 Compliant",
        "status": "draft",
        "autoFixEnabled": True,
        "healthScore": None,
        "healthGrade": None,
        "driftStatus": "NOT_EVALUATED",
        "driftScore": 0.0,
        "runCount": 0,
        "lastRun": None,
        "nodesCount": 3,
        "edgesCount": 3
    },
    {
        "id": "thread_supply_chain",
        "name": "Supply Chain Multi-Echelon Inventory Balancer",
        "description": "Reconcile logistics warehouse counts with distribution center purchase orders, resolve SKU naming discrepancies, and feed real-time supply chain telemetry.",
        "domainPackId": "supply_chain",
        "category": "Supply Chain & Logistics",
        "badge": "Multi-Echelon Balancer",
        "status": "draft",
        "autoFixEnabled": True,
        "healthScore": None,
        "healthGrade": None,
        "driftStatus": "NOT_EVALUATED",
        "driftScore": 0.0,
        "runCount": 0,
        "lastRun": None,
        "nodesCount": 3,
        "edgesCount": 3
    }
]


import copy

def _read_json_store(filepath: str, default: Any) -> Any:
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _write_json_store(filepath: str, data: Any):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing to {filepath}: {e}")


def load_threads(tenant_id: str = "tenant_enterprise") -> List[Dict[str, Any]]:
    tid = (tenant_id or "tenant_enterprise").strip()
    raw = _read_json_store(THREADS_STORE_FILE, None)
    
    # Migrate legacy flat list if present
    if isinstance(raw, list):
        store = {"tenant_enterprise": raw}
    elif isinstance(raw, dict):
        store = raw
    else:
        store = {"tenant_enterprise": copy.deepcopy(DEFAULT_THREADS)}

    if tid not in store or not store[tid]:
        store[tid] = copy.deepcopy(DEFAULT_THREADS)
        _write_json_store(THREADS_STORE_FILE, store)

    return store[tid]


def save_threads(threads: List[Dict[str, Any]], tenant_id: str = "tenant_enterprise"):
    tid = (tenant_id or "tenant_enterprise").strip()
    raw = _read_json_store(THREADS_STORE_FILE, {})
    store = {"tenant_enterprise": raw} if isinstance(raw, list) else (raw if isinstance(raw, dict) else {})
    store[tid] = threads
    _write_json_store(THREADS_STORE_FILE, store)


def load_audit_logs(tenant_id: str = "tenant_enterprise") -> Dict[str, List[Dict[str, Any]]]:
    tid = (tenant_id or "tenant_enterprise").strip()
    raw = _read_json_store(AUDIT_LOGS_FILE, {})
    if isinstance(raw, dict) and any(isinstance(v, list) for v in raw.values()) and not any(k.startswith("tenant_") for k in raw.keys()):
        store = {"tenant_enterprise": raw}
    elif isinstance(raw, dict):
        store = raw
    else:
        store = {}
    return store.get(tid, {})


def load_runs(tenant_id: str = "tenant_enterprise") -> List[Dict[str, Any]]:
    tid = (tenant_id or "tenant_enterprise").strip()
    raw = _read_json_store(RUNS_STORE_FILE, {})
    if isinstance(raw, list):
        store = {"tenant_enterprise": raw}
    elif isinstance(raw, dict):
        store = raw
    else:
        store = {}
    return store.get(tid, [])


def append_run(run_entry: Dict[str, Any], tenant_id: str = "tenant_enterprise"):
    tid = (tenant_id or "tenant_enterprise").strip()
    from sanitizer import mask_telemetry_payload
    sanitized_entry = mask_telemetry_payload(run_entry)
    
    raw = _read_json_store(RUNS_STORE_FILE, {})
    store = {"tenant_enterprise": raw} if isinstance(raw, list) else (raw if isinstance(raw, dict) else {})
    runs = store.get(tid, [])
    runs.insert(0, sanitized_entry)
    store[tid] = runs[:100]
    _write_json_store(RUNS_STORE_FILE, store)


def append_audit_log(thread_id: str, log_entry: Dict[str, Any], tenant_id: str = "tenant_enterprise"):
    tid = (tenant_id or "tenant_enterprise").strip()
    from sanitizer import mask_telemetry_payload
    sanitized_entry = mask_telemetry_payload(log_entry)
    
    raw = _read_json_store(AUDIT_LOGS_FILE, {})
    store = raw if isinstance(raw, dict) else {}
    tenant_logs = store.get(tid, {})
    if thread_id not in tenant_logs:
        tenant_logs[thread_id] = []
    tenant_logs[thread_id].insert(0, sanitized_entry)
    tenant_logs[thread_id] = tenant_logs[thread_id][:50]
    store[tid] = tenant_logs
    _write_json_store(AUDIT_LOGS_FILE, store)
