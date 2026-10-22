"""
DataX Pipeline Stage Checkpointer (Section 7 - Orchestration)
Enables re-running pipelines from the exact failed stage without full reload.
"""

import os
import json
import gzip
import threading
from typing import Dict, Any, Optional

CHECKPOINTS_DIR = os.path.join(
    os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service"),
    ".stage_checkpoints"
)
_lock = threading.Lock()


def _ensure_dir():
    os.makedirs(CHECKPOINTS_DIR, exist_ok=True)


def save_stage_checkpoint(run_id: str, stage_name: str, payload: Dict[str, Any]):
    """Saves checkpoint data for a stage."""
    _ensure_dir()
    run_dir = os.path.join(CHECKPOINTS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    fpath = os.path.join(run_dir, f"{stage_name}.json.gz")
    
    with _lock:
        with gzip.open(fpath, "wt", encoding="utf-8") as gz:
            json.dump(payload, gz, default=str)


def load_stage_checkpoint(run_id: str, stage_name: str) -> Optional[Dict[str, Any]]:
    """Loads saved checkpoint data for a specific stage."""
    fpath = os.path.join(CHECKPOINTS_DIR, run_id, f"{stage_name}.json.gz")
    if not os.path.exists(fpath):
        return None
    try:
        with gzip.open(fpath, "rt", encoding="utf-8") as gz:
            return json.load(gz)
    except Exception:
        return None


def get_available_checkpoints(run_id: str) -> Dict[str, bool]:
    """Lists completed stages for a run."""
    run_dir = os.path.join(CHECKPOINTS_DIR, run_id)
    if not os.path.exists(run_dir):
        return {}
    res = {}
    for f in os.listdir(run_dir):
        if f.endswith(".json.gz"):
            stage = f.replace(".json.gz", "")
            res[stage] = True
    return res


def clear_checkpoints(run_id: str):
    """Cleans up checkpoint storage after successful pipeline finish."""
    run_dir = os.path.join(CHECKPOINTS_DIR, run_id)
    if os.path.exists(run_dir):
        try:
            for f in os.listdir(run_dir):
                os.remove(os.path.join(run_dir, f))
            os.rmdir(run_dir)
        except Exception:
            pass
