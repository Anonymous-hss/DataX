"""
DataX Data Retention & Lifecycle Management (ARC-02)
Automates archiving and purging of historical logs, runs, and resolved quarantine records.
"""

import os
import json
import gzip
from datetime import datetime, timedelta
from typing import Dict, Any, List

VAULT_DIR = os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service")
ARCHIVE_DIR = os.path.join(VAULT_DIR, ".cold_archive")
POLICY_FILE = os.path.join(VAULT_DIR, ".retention_policy.json")

DEFAULT_RETENTION_POLICY = {
    "active_days": 30,
    "archive_days": 90,
    "auto_purge_enabled": True,
    "archive_quarantine_resolved": True,
    "last_run": None
}


def get_retention_policy() -> Dict[str, Any]:
    if os.path.exists(POLICY_FILE):
        try:
            with open(POLICY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_RETENTION_POLICY


def save_retention_policy(policy: Dict[str, Any]):
    with open(POLICY_FILE, "w") as f:
        json.dump(policy, f, indent=2)


def run_retention_lifecycle(active_days: int = 30, archive_days: int = 90) -> Dict[str, Any]:
    """
    ARC-02: Evaluates timestamps of runs and audit logs.
    Archives records older than active_days to .cold_archive, and purges archives older than archive_days.
    """
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    now = datetime.utcnow()
    cutoff_active = now - timedelta(days=active_days)
    cutoff_archive = now - timedelta(days=archive_days)

    runs_file = os.path.join(VAULT_DIR, ".runs_store.json")
    archived_runs = 0
    remaining_runs = 0

    if os.path.exists(runs_file):
        try:
            with open(runs_file, "r") as f:
                runs = json.load(f)

            active_runs = []
            cold_runs = []

            for r in runs:
                ts_str = r.get("timestamp") or r.get("created_at")
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00").split("+")[0]) if ts_str else now
                if dt < cutoff_active:
                    cold_runs.append(r)
                else:
                    active_runs.append(r)

            if cold_runs:
                archive_filename = os.path.join(
                    ARCHIVE_DIR, f"runs_archive_{cutoff_active.strftime('%Y%m%d')}.json.gz"
                )
                with gzip.open(archive_filename, "wt", encoding="utf-8") as gz:
                    json.dump(cold_runs, gz)
                archived_runs = len(cold_runs)

            with open(runs_file, "w") as f:
                json.dump(active_runs, f, indent=2)

            remaining_runs = len(active_runs)
        except Exception as e:
            print(f"[RETENTION RUNS ERROR] {e}")

    # Clean up expired cold archives older than archive_days
    purged_archives = 0
    try:
        for fname in os.listdir(ARCHIVE_DIR):
            fpath = os.path.join(ARCHIVE_DIR, fname)
            file_mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
            if file_mtime < cutoff_archive:
                os.remove(fpath)
                purged_archives += 1
    except Exception as e:
        print(f"[PURGE ERROR] {e}")

    policy = get_retention_policy()
    policy["last_run"] = now.isoformat() + "Z"
    save_retention_policy(policy)

    return {
        "status": "success",
        "timestamp": now.isoformat() + "Z",
        "active_cutoff_days": active_days,
        "archive_cutoff_days": archive_days,
        "archived_records_count": archived_runs,
        "active_records_retained": remaining_runs,
        "purged_cold_archives_count": purged_archives,
        "cold_archive_directory": ARCHIVE_DIR
    }


def get_storage_breakdown() -> Dict[str, Any]:
    """Returns local disk storage utilization across store files and cold archives."""
    breakdown = {}
    total_bytes = 0

    for fname in [".runs_store.json", ".audit_logs.json", ".credentials_vault.json", ".quarantine_dlq.jsonl"]:
        p = os.path.join(VAULT_DIR, fname)
        if os.path.exists(p):
            size = os.path.getsize(p)
            breakdown[fname] = round(size / 1024, 2)
            total_bytes += size

    archive_size = 0
    if os.path.exists(ARCHIVE_DIR):
        for f in os.listdir(ARCHIVE_DIR):
            fp = os.path.join(ARCHIVE_DIR, f)
            if os.path.isfile(fp):
                archive_size += os.path.getsize(fp)

    breakdown["cold_archives_kb"] = round(archive_size / 1024, 2)
    breakdown["total_storage_kb"] = round((total_bytes + archive_size) / 1024, 2)
    return breakdown
