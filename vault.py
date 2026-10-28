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

def _resolve_default_neon_uri() -> str:
    env_uri = os.environ.get("DATAX_NEON_URI") or os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_DB_URI")
    if env_uri:
        return env_uri

    env_file = '/home/azureuserSDH/Production/nexlayer-backend/.env'
    if os.path.exists(env_file):
        try:
            env = {}
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        k, v = line.split('=', 1)
                        env[k.strip()] = v.strip().replace('"', '').replace("'", "")
            if env.get('POSTGRES_DB_URI'):
                return env['POSTGRES_DB_URI']
            if env.get('PGHOST') and env.get('PGUSER') and env.get('PGPASSWORD'):
                ssl_mode = f"?sslmode={env.get('PGSSLMODE', 'require')}" if env.get('PGSSLMODE') else ""
                return f"postgresql://{env['PGUSER']}:{env['PGPASSWORD']}@{env['PGHOST']}:{env.get('PGPORT', 5432)}/{env.get('PGDATABASE', 'postgres')}{ssl_mode}"
        except Exception:
            pass
    return ""

DEFAULT_NEON_URI = (
    _resolve_default_neon_uri()
    or "postgresql://neondb_owner:npg_Eim1u6bIldRL@ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
)


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
        if engine in ["postgres", "postgresql"] and DEFAULT_NEON_URI:
            return DEFAULT_NEON_URI
        return ""
    uri = uri.strip()
    if not uri or "<" in uri or "user:password" in uri or "target-db.internal" in uri or "ep-sweet-neon" in uri or "••••" in uri:
        if engine in ["postgres", "postgresql"] and DEFAULT_NEON_URI:
            return DEFAULT_NEON_URI
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


def load_threads() -> List[Dict[str, Any]]:
    if not os.path.exists(THREADS_STORE_FILE):
        save_threads(DEFAULT_THREADS)
        return DEFAULT_THREADS
    try:
        with open(THREADS_STORE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_THREADS


def save_threads(threads: List[Dict[str, Any]]):
    with open(THREADS_STORE_FILE, "w") as f:
        json.dump(threads, f, indent=2)


def load_audit_logs() -> Dict[str, List[Dict[str, Any]]]:
    if not os.path.exists(AUDIT_LOGS_FILE):
        return {}
    try:
        with open(AUDIT_LOGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def load_runs() -> List[Dict[str, Any]]:
    if not os.path.exists(RUNS_STORE_FILE):
        return []
    try:
        with open(RUNS_STORE_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def append_run(run_entry: Dict[str, Any]):
    from sanitizer import mask_telemetry_payload
    sanitized_entry = mask_telemetry_payload(run_entry)
    runs = load_runs()
    runs.insert(0, sanitized_entry)
    runs = runs[:100]
    with open(RUNS_STORE_FILE, "w") as f:
        json.dump(runs, f, indent=2)


def append_audit_log(thread_id: str, log_entry: Dict[str, Any]):
    from sanitizer import mask_telemetry_payload
    sanitized_entry = mask_telemetry_payload(log_entry)
    logs = load_audit_logs()
    if thread_id not in logs:
        logs[thread_id] = []
    logs[thread_id].insert(0, sanitized_entry)
    logs[thread_id] = logs[thread_id][:50]
    with open(AUDIT_LOGS_FILE, "w") as f:
        json.dump(logs, f, indent=2)
