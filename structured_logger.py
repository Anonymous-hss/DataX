"""
DataX Structured JSON Logging Engine (OBS-04)
Emits JSON log lines containing trace_id, pipeline_id, and duration_ms for Datadog/Splunk/ELK.
"""

import os
import sys
import json
import time
import uuid
import threading
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager

_context = threading.local()


def set_trace_context(trace_id: Optional[str] = None, pipeline_id: Optional[str] = None):
    _context.trace_id = trace_id or f"trace_{uuid.uuid4().hex[:12]}"
    _context.pipeline_id = pipeline_id or "adhoc"


def get_trace_context() -> Dict[str, str]:
    return {
        "trace_id": getattr(_context, "trace_id", "trace_default"),
        "pipeline_id": getattr(_context, "pipeline_id", "system")
    }


@contextmanager
def trace_context(trace_id: Optional[str] = None, pipeline_id: Optional[str] = None):
    old_trace = getattr(_context, "trace_id", None)
    old_pipe = getattr(_context, "pipeline_id", None)
    try:
        set_trace_context(trace_id, pipeline_id)
        yield
    finally:
        _context.trace_id = old_trace
        _context.pipeline_id = old_pipe


class StructuredJsonLogger:
    """Emits structured JSON logs to stdout and optional local append-only log file."""

    def __init__(self, log_file: Optional[str] = None):
        self.log_file = log_file or os.path.join(
            os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service"),
            "datax_structured.log"
        )
        self._lock = threading.Lock()

    def _emit(self, level: str, message: str, duration_ms: Optional[float] = None, **kwargs):
        ctx = get_trace_context()
        record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "service": "datax-service",
            "trace_id": ctx["trace_id"],
            "pipeline_id": ctx["pipeline_id"],
            "message": message,
            "duration_ms": duration_ms,
            "context": kwargs
        }

        # Filter out None values
        record = {k: v for k, v in record.items() if v is not None}
        log_line = json.dumps(record, default=str)

        # Print to stdout
        sys.stdout.write(log_line + "\n")
        sys.stdout.flush()

        # Persist to local JSONL log file
        try:
            with self._lock:
                with open(self.log_file, "a", encoding="utf-8") as f:
                    f.write(log_line + "\n")
        except Exception:
            pass

    def info(self, message: str, duration_ms: Optional[float] = None, **kwargs):
        self._emit("INFO", message, duration_ms=duration_ms, **kwargs)

    def warning(self, message: str, duration_ms: Optional[float] = None, **kwargs):
        self._emit("WARNING", message, duration_ms=duration_ms, **kwargs)

    def error(self, message: str, duration_ms: Optional[float] = None, **kwargs):
        self._emit("ERROR", message, duration_ms=duration_ms, **kwargs)

    def audit(self, message: str, **kwargs):
        self._emit("AUDIT", message, **kwargs)


# Global Singleton Logger
logger = StructuredJsonLogger()
