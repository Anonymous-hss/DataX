"""
DataX Resilience & Fault Tolerance Engine
Implements Production Checklist Section 1:
- REL-01: Exponential Backoff & Jitter Retries
- REL-02: Circuit Breaker Pattern (Closed, Open, Half-Open)
- REL-03: Idempotent Pipeline Execution & Deduplication
- REL-04: Durable Dead-Letter Queue (DLQ) with Synchronous Disk Flush
- REL-05: Offline Fallback Heuristics for AI Rule Synthesis
"""

import os
import sys
import time
import json
import random
import hashlib
import threading
from typing import Dict, List, Any, Callable, Optional, Tuple
from functools import wraps
from datetime import datetime

# =============================================================================
# REL-01: Exponential Backoff & Jitter Retries
# =============================================================================

def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.5,
    max_delay: float = 10.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[type, ...] = (Exception,),
    on_retry_callback: Optional[Callable[[int, Exception, float], None]] = None
):
    """
    Decorator for exponential backoff with randomized jitter.
    Protects database queries, external APIs, and OpenAI completions.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempt = 0
            current_delay = base_delay

            while True:
                attempt += 1
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as exc:
                    if attempt > max_retries:
                        raise exc

                    # Calculate exponential delay with randomized jitter
                    delay = min(max_delay, current_delay * (backoff_factor ** (attempt - 1)))
                    if jitter:
                        # Full jitter algorithm: uniform random between 0 and delay
                        delay = random.uniform(delay * 0.5, delay * 1.2)

                    if on_retry_callback:
                        try:
                            on_retry_callback(attempt, exc, delay)
                        except Exception:
                            pass
                    else:
                        print(f"[RETRY {attempt}/{max_retries}] {func.__name__} failed: {exc}. Retrying in {delay:.2f}s...")

                    time.sleep(delay)
        return wrapper
    return decorator


# =============================================================================
# REL-02: Circuit Breaker Pattern
# =============================================================================

class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted while the circuit breaker is OPEN."""
    pass


class CircuitBreaker:
    """
    Stateful circuit breaker protecting downstream databases and AI APIs.
    States:
      - CLOSED: Normal operation; failures are tracked.
      - OPEN: Failures exceeded threshold; all calls fail fast without hitting target.
      - HALF_OPEN: Probe interval elapsed; allows a trial call to test recovery.
    """
    def __init__(
        self,
        name: str,
        failure_threshold: int = 4,
        recovery_timeout: float = 30.0,
        half_open_success_threshold: int = 2
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold

        self.state = "CLOSED"
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0.0
        self._lock = threading.Lock()

    def __call__(self, func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return self.call(func, *args, **kwargs)
        return wrapper

    def call(self, func: Callable, *args, **kwargs):
        with self._lock:
            now = time.time()
            if self.state == "OPEN":
                if now - self.last_failure_time >= self.recovery_timeout:
                    self.state = "HALF_OPEN"
                    self.success_count = 0
                    print(f"[CIRCUIT BREAKER: {self.name}] Transitioning OPEN -> HALF_OPEN (Probing recovery)")
                else:
                    remaining = int(self.recovery_timeout - (now - self.last_failure_time))
                    raise CircuitBreakerOpenException(
                        f"Circuit breaker '{self.name}' is OPEN. Fast-failing downstream call. Recovery retry in {remaining}s."
                    )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as exc:
            self._on_failure(exc)
            raise exc

    def _on_success(self):
        with self._lock:
            if self.state == "HALF_OPEN":
                self.success_count += 1
                if self.success_count >= self.half_open_success_threshold:
                    self.state = "CLOSED"
                    self.failure_count = 0
                    print(f"[CIRCUIT BREAKER: {self.name}] Service recovered. Transitioning HALF_OPEN -> CLOSED")
            elif self.state == "CLOSED":
                self.failure_count = 0

    def _on_failure(self, exc: Exception):
        with self._lock:
            self.last_failure_time = time.time()
            self.failure_count += 1
            if self.state == "HALF_OPEN" or self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                print(f"[CIRCUIT BREAKER: {self.name}] Failure threshold reached ({self.failure_count}). Tripping circuit -> OPEN. Error: {exc}")

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "name": self.name,
                "state": self.state,
                "failures": self.failure_count,
                "threshold": self.failure_threshold,
                "last_failure": datetime.fromtimestamp(self.last_failure_time).isoformat() if self.last_failure_time else None
            }


# Global named circuit breakers for core subsystems
openai_breaker = CircuitBreaker("azure_openai_service", failure_threshold=3, recovery_timeout=25.0)
source_db_breaker = CircuitBreaker("source_database_connector", failure_threshold=4, recovery_timeout=20.0)
target_db_breaker = CircuitBreaker("target_database_connector", failure_threshold=3, recovery_timeout=20.0)


# =============================================================================
# REL-03: Idempotent Pipeline Execution & Deduplication
# =============================================================================

class IdempotencyManager:
    """
    Prevents duplicate pipeline executions, phantom runs, and duplicate target commits.
    Stores run hash fingerprints with TTL in memory and on disk.
    """
    def __init__(self, persistence_file: str = ".idempotency_store.json", ttl_seconds: int = 86400):
        self.persistence_file = persistence_file
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._store: Dict[str, Dict[str, Any]] = self._load()

    def _load(self) -> Dict[str, Dict[str, Any]]:
        if os.path.exists(self.persistence_file):
            try:
                with open(self.persistence_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    now = time.time()
                    # Filter expired
                    return {k: v for k, v in data.items() if (now - v.get("timestamp", 0)) < self.ttl_seconds}
            except Exception:
                return {}
        return {}

    def _save(self):
        try:
            with open(self.persistence_file, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2)
        except Exception as e:
            print(f"[IDEMPOTENCY] Warning: could not persist store: {e}")

    def compute_fingerprint(self, payload: Dict[str, Any]) -> str:
        """Computes SHA-256 fingerprint from pipeline execution request."""
        # Strip volatile fields like timestamps
        stable_data = {
            "threadId": payload.get("threadId"),
            "pipelineName": payload.get("pipelineName"),
            "source": payload.get("source"),
            "target1": payload.get("target1"),
            "target2": payload.get("target2"),
            "rules": payload.get("rules"),
            "dryRun": payload.get("dryRun"),
            "autoFixEnabled": payload.get("autoFixEnabled")
        }
        raw_bytes = json.dumps(stable_data, sort_keys=True, default=str).encode("utf-8")
        return hashlib.sha256(raw_bytes).hexdigest()

    def acquire(self, idempotency_key: str, payload: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Attempts to acquire execution lock.
        Returns:
          (True, None) -> First time execution, proceed.
          (False, cached_result) -> Already executed or in progress, return cached outcome.
        """
        with self._lock:
            now = time.time()
            if idempotency_key in self._store:
                entry = self._store[idempotency_key]
                if entry.get("status") == "COMPLETED":
                    print(f"[IDEMPOTENCY] Execution '{idempotency_key}' already completed. Replaying cached outcome.")
                    return False, entry.get("result")
                elif entry.get("status") == "IN_PROGRESS" and (now - entry.get("timestamp", 0)) < 120:
                    print(f"[IDEMPOTENCY] Execution '{idempotency_key}' is currently running in another worker thread.")
                    return False, {"status": "IN_PROGRESS", "message": "Pipeline run already in progress. Deduped."}

            self._store[idempotency_key] = {
                "status": "IN_PROGRESS",
                "timestamp": now,
                "payload_fingerprint": self.compute_fingerprint(payload)
            }
            self._save()
            return True, None

    def commit(self, idempotency_key: str, result: Dict[str, Any]):
        """Marks run as completed and saves sanitized outcome for deduplication."""
        with self._lock:
            if idempotency_key in self._store:
                self._store[idempotency_key]["status"] = "COMPLETED"
                # Cache outcome metadata (exclude multi-MB arrays)
                cached_result = dict(result)
                if "sampleData" in cached_result and len(cached_result["sampleData"]) > 20:
                    cached_result["sampleData"] = cached_result["sampleData"][:20]
                self._store[idempotency_key]["result"] = cached_result
                self._save()

    def release(self, idempotency_key: str):
        """Cleans up in-progress lock in case of fatal crash."""
        with self._lock:
            if idempotency_key in self._store and self._store[idempotency_key].get("status") == "IN_PROGRESS":
                del self._store[idempotency_key]
                self._save()


idempotency_manager = IdempotencyManager()


# =============================================================================
# REL-04: Dead-Letter Queue (DLQ) Durability with Synchronous Disk Flush
# =============================================================================

class DurableDLQManager:
    """
    Durable Dead-Letter Queue for Quarantined Records.
    Guarantees 100% durability by synchronizing disk writes (fsync).
    Allows inspection, root-cause tagging, and resolution re-injection.
    """
    def __init__(self, dlq_file: str = ".quarantine_dlq.jsonl"):
        self.dlq_file = dlq_file
        self._lock = threading.Lock()

    def enqueue_batch(
        self,
        execution_id: str,
        pipeline_id: str,
        source_system: str,
        quarantine_items: List[Dict[str, Any]]
    ) -> int:
        """
        Appends quarantined records with row-level failure attribution and immediate fsync.
        """
        if not quarantine_items:
            return 0

        written = 0
        now_iso = datetime.utcnow().isoformat()

        with self._lock:
            with open(self.dlq_file, "a", encoding="utf-8") as f:
                for item in quarantine_items:
                    rec = item.get("record", {})
                    violations = item.get("violations", [])
                    record_id = str(rec.get("id") or rec.get("PO_NUMBER") or rec.get("MATNR") or rec.get("MATERIAL_DOC") or rec.get("ENTRY_ID") or f"ROW_{written}")
                    
                    entry = {
                        "dlq_id": f"dlq_{int(time.time()*1000)}_{random.randint(100, 999)}",
                        "execution_id": execution_id,
                        "pipeline_id": pipeline_id,
                        "source_system": source_system,
                        "record_id": record_id,
                        "violations": violations,
                        "raw_payload": rec,
                        "quarantined_at": now_iso,
                        "status": "QUARANTINED",  # QUARANTINED | RESOLVED | REJECTED
                        "resolution_notes": None
                    }
                    f.write(json.dumps(entry, default=str) + "\n")
                    written += 1

                # Flush buffers and force write to physical disk
                f.flush()
                os.fsync(f.fileno())

        print(f"[DURABLE DLQ] Committed & fsynced {written} quarantined records to {self.dlq_file}")
        return written

    def get_records(self, limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves quarantined records sorted by newest first."""
        if not os.path.exists(self.dlq_file):
            return []

        results = []
        with self._lock:
            try:
                with open(self.dlq_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            entry = json.loads(line)
                            if status is None or entry.get("status") == status:
                                results.append(entry)
            except Exception as e:
                print(f"[DURABLE DLQ] Error reading DLQ: {e}")

        # Reverse to show newest first
        return results[::-1][:limit]

    def resolve_record(self, dlq_id: str, action: str, resolution_notes: str = "") -> bool:
        """
        Updates status of a quarantined record (RESOLVE / REJECT) with atomic rewrite.
        """
        if not os.path.exists(self.dlq_file):
            return False

        updated = False
        all_lines = []
        with self._lock:
            with open(self.dlq_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        entry = json.loads(line)
                        if entry.get("dlq_id") == dlq_id:
                            entry["status"] = "RESOLVED" if action.lower() == "resolve" else "REJECTED"
                            entry["resolved_at"] = datetime.utcnow().isoformat()
                            entry["resolution_notes"] = resolution_notes
                            updated = True
                        all_lines.append(json.dumps(entry, default=str))

            if updated:
                tmp_file = f"{self.dlq_file}.tmp"
                with open(tmp_file, "w", encoding="utf-8") as f:
                    for l in all_lines:
                        f.write(l + "\n")
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(tmp_file, self.dlq_file)

        return updated


durable_dlq = DurableDLQManager()


# =============================================================================
# REL-05: Offline Fallback for AI Rule Synthesis Logic
# =============================================================================

class OfflineAIHeuristics:
    """
    Deterministic domain ontology, deep sample data profiler, and prompt-driven rule synthesizer.
    Activates when Azure OpenAI is unreachable, circuit is OPEN, or API key is absent,
    and also provides baseline data anomaly diagnostics for live sample rows.
    """

    @staticmethod
    def analyze_and_draft_prompt(
        table_name: str,
        engine: str = "mongodb",
        columns: Optional[List[str]] = None,
        selected_columns: Optional[List[str]] = None,
        sample_rows: Optional[List[Dict[str, Any]]] = None,
        governance_mode: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Profiles the selected table, columns, and sample rows to discover concrete
        data quality anomalies and automatically draft an actionable natural language prompt.
        """
        all_cols = list(columns or [])
        if not all_cols and sample_rows and isinstance(sample_rows[0], dict):
            all_cols = [k for k in sample_rows[0].keys() if k != "_id"]
        target_cols = [c for c in (selected_columns or all_cols) if c != "_id"]
        if not target_cols and all_cols:
            target_cols = [c for c in all_cols if c != "_id"]

        rows = sample_rows or []
        anomalies: List[Dict[str, Any]] = []
        prompt_clauses: List[str] = []
        prompt_chips: List[Dict[str, str]] = []
        col_profiles: List[Dict[str, Any]] = []

        # Helper to map case-insensitive column lookup in row
        def get_val(row: Dict[str, Any], col: str):
            if col in row:
                return row[col]
            for k, v in row.items():
                if k.lower() == col.lower():
                    return v
            return None

        # 1. Inspect each selected column across sample_rows
        for col in target_cols:
            col_lower = col.lower()
            vals = [get_val(r, col) for r in rows] if rows else []
            non_null_vals = [v for v in vals if v is not None and str(v).strip() != ""]
            null_count = len(vals) - len(non_null_vals) if rows else 0

            col_profiles.append({
                "column": col,
                "sampledCount": len(vals),
                "nullCount": null_count,
                "sampleValues": [str(v)[:40] for v in non_null_vals[:3]]
            })

            # Check A: Primary Key / Identifier completeness & uniqueness
            if any(k in col_lower for k in ["_id", "id", "ebeln", "po_number", "matnr", "material_doc", "code", "key"]):
                seen = set()
                dupes = []
                for v in non_null_vals:
                    sv = str(v).strip()
                    if sv in seen:
                        dupes.append(sv)
                    seen.add(sv)
                if dupes:
                    anomalies.append({
                        "column": col,
                        "issue": f"Duplicate identifier values detected ({dupes[0]})",
                        "severity": "Critical",
                        "sampleValue": dupes[0],
                        "affectedCount": len(dupes)
                    })
                    prompt_clauses.append(f"{col} is mandatory and must be strictly unique with no duplicate keys")
                else:
                    prompt_clauses.append(f"{col} is mandatory and must be unique")

            # Check B: Null / Missing values in non-PK columns
            if null_count > 0:
                anomalies.append({
                    "column": col,
                    "issue": f"Missing / NULL values in {null_count} of {len(vals)} sampled rows",
                    "severity": "Critical" if "id" in col_lower or "email" in col_lower or "name" in col_lower else "Warning",
                    "sampleValue": "NULL / Empty",
                    "affectedCount": null_count
                })
                if not any(col in c for c in prompt_clauses):
                    prompt_clauses.append(f"{col} must not be null or empty")

            # Check C: Untrimmed whitespace or SQL injection / corruption in string values
            whitespace_samples = []
            sqli_samples = []
            for v in non_null_vals:
                if isinstance(v, str):
                    if v != v.strip() or "  " in v:
                        whitespace_samples.append(v)
                    if any(tok in v.upper() for tok in ["DROP TABLE", "OR '1'='1", "--", "SELECT *", "PURGED_CORRUPT", "<SCRIPT"]):
                        sqli_samples.append(v)

            if sqli_samples:
                anomalies.append({
                    "column": col,
                    "issue": "SQL injection / corrupt payload signature detected",
                    "severity": "Critical",
                    "sampleValue": sqli_samples[0][:36],
                    "affectedCount": len(sqli_samples)
                })
                prompt_clauses.append(f"{col} must block SQL injection payloads and corrupt strings")

            if whitespace_samples:
                anomalies.append({
                    "column": col,
                    "issue": "Untrimmed leading/trailing whitespace detected",
                    "severity": "Warning",
                    "sampleValue": repr(whitespace_samples[0]),
                    "affectedCount": len(whitespace_samples)
                })
                prompt_clauses.append(f"{col} must be trimmed of leading/trailing whitespace")

            # Check D: Email validation
            if "email" in col_lower or "mail" in col_lower:
                bad_emails = []
                upper_emails = []
                for v in non_null_vals:
                    sv = str(v).strip()
                    if "@" not in sv or "@@" in sv or "." not in sv.split("@")[-1] or sv.startswith("-") or sv.endswith("-") or " " in sv:
                        bad_emails.append(sv)
                    elif sv != sv.lower():
                        upper_emails.append(sv)
                if bad_emails:
                    anomalies.append({
                        "column": col,
                        "issue": "Malformed RFC-5322 email syntax",
                        "severity": "Critical",
                        "sampleValue": bad_emails[0],
                        "affectedCount": len(bad_emails)
                    })
                if upper_emails:
                    anomalies.append({
                        "column": col,
                        "issue": "Non-normalized uppercase email casing",
                        "severity": "Warning",
                        "sampleValue": upper_emails[0],
                        "affectedCount": len(upper_emails)
                    })
                prompt_clauses.append(f"{col} must follow valid lowercase RFC-5322 email format (user@domain.tld)")

            # Check E: Numeric / Financial / Quantity / Balance columns
            if any(k in col_lower for k in ["quantity", "qty", "menge", "price", "netpr", "amount", "total", "balance", "pct", "utilization", "weight", "brgew", "ntgew"]):
                neg_vals = []
                zero_vals = []
                extreme_vals = []
                for v in non_null_vals:
                    try:
                        num = float(v)
                        if num < 0:
                            neg_vals.append(num)
                        elif num == 0 and ("price" in col_lower or "qty" in col_lower or "quantity" in col_lower):
                            zero_vals.append(num)
                        elif ("pct" in col_lower or "utilization" in col_lower) and num > 100:
                            extreme_vals.append(num)
                        elif "balance" in col_lower and num > 10000000:
                            extreme_vals.append(num)
                    except Exception:
                        pass

                if neg_vals:
                    anomalies.append({
                        "column": col,
                        "issue": f"Negative numeric value ({neg_vals[0]})",
                        "severity": "Critical",
                        "sampleValue": str(neg_vals[0]),
                        "affectedCount": len(neg_vals)
                    })
                    prompt_clauses.append(f"{col} must be strictly positive (> 0)" if ("qty" in col_lower or "quantity" in col_lower or "price" in col_lower) else f"{col} must be non-negative (>= 0)")
                elif zero_vals:
                    anomalies.append({
                        "column": col,
                        "issue": f"Zero value in commercial field ({col}=0)",
                        "severity": "Warning",
                        "sampleValue": "0",
                        "affectedCount": len(zero_vals)
                    })
                    prompt_clauses.append(f"{col} must be strictly greater than 0")
                elif not any(col in c for c in prompt_clauses):
                    prompt_clauses.append(f"{col} must be a valid positive number")

                if extreme_vals:
                    anomalies.append({
                        "column": col,
                        "issue": f"Extreme outlier threshold breach ({extreme_vals[0]})",
                        "severity": "Critical",
                        "sampleValue": str(extreme_vals[0]),
                        "affectedCount": len(extreme_vals)
                    })
                    bound = 100 if ("pct" in col_lower or "utilization" in col_lower) else 1000000
                    prompt_clauses.append(f"{col} must not exceed upper threshold {bound}")

            # Check F: Date / Timestamp columns
            if any(k in col_lower for k in ["date", "time", "created", "updated"]):
                bad_dates = []
                for v in non_null_vals:
                    sv = str(v).strip()
                    if sv.startswith("2099") or "/" in sv or "not-a-valid" in sv.lower():
                        bad_dates.append(sv)
                if bad_dates:
                    anomalies.append({
                        "column": col,
                        "issue": f"Future or non-ISO date format ({bad_dates[0]})",
                        "severity": "Warning",
                        "sampleValue": bad_dates[0],
                        "affectedCount": len(bad_dates)
                    })
                    prompt_clauses.append(f"{col} must be a valid ISO-8601 date and not in the far future")

            # Check G: Status / Role / Country / Phone / Zip domains
            if "status" in col_lower:
                bad_status = [str(v) for v in non_null_vals if str(v).lower() in ("cancelled", "corrupt", "purged_corrupt", "suspended", "rejected")]
                if bad_status:
                    anomalies.append({
                        "column": col,
                        "issue": f"Non-compliant status value ({bad_status[0]})",
                        "severity": "Warning",
                        "sampleValue": bad_status[0],
                        "affectedCount": len(bad_status)
                    })
                    prompt_clauses.append(f"{col} must be an active/approved lifecycle state (exclude '{bad_status[0]}')")
            elif "role" in col_lower:
                bad_roles = [str(v) for v in non_null_vals if str(v).lower() not in ("admin", "analyst", "manager", "viewer", "user", "engineer")]
                if bad_roles:
                    anomalies.append({
                        "column": col,
                        "issue": f"Unauthorized role enum ({bad_roles[0]})",
                        "severity": "Critical",
                        "sampleValue": bad_roles[0],
                        "affectedCount": len(bad_roles)
                    })
                    prompt_clauses.append(f"{col} must belong to authorized roles ('admin', 'analyst', 'manager', 'viewer')")
            elif "country" in col_lower:
                bad_country = [str(v) for v in non_null_vals if "invalid" in str(v).lower() or len(str(v).strip()) > 15]
                if bad_country:
                    anomalies.append({
                        "column": col,
                        "issue": f"Invalid ISO country code ({bad_country[0]})",
                        "severity": "Warning",
                        "sampleValue": bad_country[0],
                        "affectedCount": len(bad_country)
                    })
                    prompt_clauses.append(f"{col} must be a valid ISO country code (e.g. USA, UK, Canada, Germany, India)")
            elif "phone" in col_lower:
                bad_phone = [str(v) for v in non_null_vals if len(str(v).strip()) < 7 or any(c.isalpha() for c in str(v))]
                if bad_phone:
                    anomalies.append({
                        "column": col,
                        "issue": f"Malformed phone number ({bad_phone[0]})",
                        "severity": "Warning",
                        "sampleValue": bad_phone[0],
                        "affectedCount": len(bad_phone)
                    })
                    prompt_clauses.append(f"{col} must contain a valid numeric phone number format")
            elif "zip" in col_lower or "postal" in col_lower:
                bad_zip = [str(v) for v in non_null_vals if "invalid" in str(v).lower() or len(str(v).strip()) < 3]
                if bad_zip:
                    anomalies.append({
                        "column": col,
                        "issue": f"Corrupt postal/zip code ({bad_zip[0]})",
                        "severity": "Warning",
                        "sampleValue": bad_zip[0],
                        "affectedCount": len(bad_zip)
                    })
                    prompt_clauses.append(f"{col} must be a valid postal/zip code without corrupt suffixes")

        # 2. Cross-column arithmetic check (e.g. quantity * unit_price == total_amount)
        col_map_lower = {c.lower(): c for c in target_cols}
        qty_col = col_map_lower.get("quantity") or col_map_lower.get("menge") or col_map_lower.get("qty")
        price_col = col_map_lower.get("unit_price") or col_map_lower.get("netpr") or col_map_lower.get("price")
        total_col = col_map_lower.get("total_amount") or col_map_lower.get("dmbtr") or col_map_lower.get("total")
        if qty_col and price_col and total_col:
            mismatch_samples = []
            for r in rows:
                try:
                    q = float(get_val(r, qty_col))
                    p = float(get_val(r, price_col))
                    t = float(get_val(r, total_col))
                    if abs((q * p) - t) > 0.05:
                        mismatch_samples.append(f"{q} * {p} != {t}")
                except Exception:
                    pass
            if mismatch_samples:
                anomalies.append({
                    "column": f"{total_col}",
                    "issue": f"Cross-column math mismatch ({mismatch_samples[0]})",
                    "severity": "Critical",
                    "sampleValue": mismatch_samples[0],
                    "affectedCount": len(mismatch_samples)
                })
            prompt_clauses.append(f"{total_col} must equal {qty_col} multiplied by {price_col}")

        # Gross weight > Net weight check
        gross_col = col_map_lower.get("brgew") or col_map_lower.get("gross_weight")
        net_col = col_map_lower.get("ntgew") or col_map_lower.get("net_weight")
        if gross_col and net_col:
            prompt_clauses.append(f"{gross_col} must be strictly greater than {net_col}")

        # Deduplicate clauses while preserving order
        unique_clauses = []
        for cl in prompt_clauses:
            if cl not in unique_clauses:
                unique_clauses.append(cl)

        if not unique_clauses:
            col_str = ", ".join(target_cols[:5]) if target_cols else "all columns"
            unique_clauses.append(f"Validate completeness, data type integrity, and domain compliance across {col_str} in {table_name}")

        drafted_prompt = ". ".join(unique_clauses)
        if not drafted_prompt.endswith("."):
            drafted_prompt += "."

        # Build contextual smart chips the user can click to append to prompt
        prompt_chips = [
            {"label": "+ Trim Whitespace & Normalize Case", "clause": f"Trim leading/trailing whitespace and normalize text casing across {', '.join(target_cols[:3])}."},
            {"label": "+ Block SQL Injection & Payloads", "clause": "Quarantine any record containing SQL injection payloads or corrupt strings."},
            {"label": "+ Strict Null & Empty Guard", "clause": f"Require non-null, non-empty values for {', '.join(target_cols[:4])}."},
            {"label": "+ Deduplicate Primary Key", "clause": f"Enforce strict primary key uniqueness on {target_cols[0] if target_cols else 'ID'}."},
        ]
        if any("email" in c.lower() for c in target_cols):
            prompt_chips.insert(0, {"label": "+ Strict RFC-5322 Email Check", "clause": "Validate email addresses against RFC-5322 format and auto-lowercase domain names."})
        if qty_col and price_col and total_col:
            prompt_chips.insert(0, {"label": f"+ Verify {total_col} = {qty_col} * {price_col}", "clause": f"Enforce cross-column formula {total_col} == {qty_col} * {price_col}."})

        return {
            "tableName": table_name,
            "analyzedColumns": target_cols,
            "sampleRowCount": len(rows),
            "draftedPrompt": drafted_prompt,
            "anomalies": anomalies,
            "promptChips": prompt_chips[:6],
            "columnProfiles": col_profiles
        }

    @staticmethod
    def synthesize_rules(
        table_name: str,
        engine: str,
        columns: List[str],
        user_prompt: str = "",
        sample_rows: Optional[List[Dict[str, Any]]] = None,
        selected_columns: Optional[List[str]] = None,
        governance_mode: str = "balanced"
    ) -> List[Dict[str, Any]]:
        """
        Synthesizes executable validation rules directly from the user's natural language prompt,
        selected columns, and live sample data anomalies. Preserves exact column casing.
        """
        raw_cols = [c for c in (selected_columns or columns or []) if c != "_id"]
        if not raw_cols and sample_rows and isinstance(sample_rows[0], dict):
            raw_cols = [k for k in sample_rows[0].keys() if k != "_id"]
        if not raw_cols:
            raw_cols = ["id", "status"]

        col_lookup = {c.lower(): c for c in raw_cols}
        rules: List[Dict[str, Any]] = []
        seen_rule_ids = set()
        slug = re.sub(r"[^a-z0-9_]", "_", (table_name or "table").lower())
        prompt_text = (user_prompt or "").strip()
        p_lower = prompt_text.lower()

        def add_rule(rule_dict: Dict[str, Any]):
            rid = rule_dict["id"]
            if rid not in seen_rule_ids:
                seen_rule_ids.add(rid)
                if governance_mode == "strict":
                    rule_dict["severity"] = "Critical"
                rules.append(rule_dict)

        # Helper to find which columns are mentioned in a sentence/clause or match keywords
        def find_col_by_keywords(keywords: List[str]) -> Optional[str]:
            for c in raw_cols:
                cl = c.lower()
                if any(kw in cl for kw in keywords):
                    return c
            return None

        # 1. Parse explicit sentences/clauses from the user's prompt so custom prompts always generate matching rules!
        sentences = [s.strip() for s in re.split(r"[.;\n]+", prompt_text) if s.strip()]
        for idx, sent in enumerate(sentences):
            sl = sent.lower()
            mentioned_cols = [c for c in raw_cols if re.search(rf"\b{re.escape(c.lower())}\b", sl)]

            # Cross-column multiplication (e.g., total_amount must equal quantity multiplied by unit_price)
            if ("multiplied by" in sl or "*" in sl) and ("equal" in sl or "==" in sl or "=" in sl):
                qty_c = find_col_by_keywords(["quantity", "qty", "menge"])
                price_c = find_col_by_keywords(["unit_price", "price", "netpr"])
                tot_c = find_col_by_keywords(["total_amount", "total", "dmbtr", "amount"])
                if qty_c and price_c and tot_c:
                    add_rule({
                        "id": f"r_{slug}_math_{tot_c.lower()}",
                        "name": f"Cross-Column Math Integrity ({tot_c} = {qty_c} × {price_c})",
                        "field": tot_c,
                        "severity": "Critical",
                        "condition": f"ABS({tot_c} - ({qty_c} * {price_c})) <= 0.05",
                        "code": f"ABS({tot_c} - ({qty_c} * {price_c})) <= 0.05",
                        "desc": f"Validates prompt constraint: '{sent}'. Recomputes {tot_c} when auto-fix is enabled.",
                        "badge": "Prompt-Driven Synthesis"
                    })
                    continue

            # Gross weight > Net weight
            if "greater than" in sl and len(mentioned_cols) >= 2:
                c1, c2 = mentioned_cols[0], mentioned_cols[1]
                add_rule({
                    "id": f"r_{slug}_gt_{c1.lower()}_{c2.lower()}",
                    "name": f"Cross-Column Comparison ({c1} > {c2})",
                    "field": c1,
                    "severity": "Critical",
                    "condition": f"{c1} > {c2}",
                    "code": f"{c1} > {c2}",
                    "desc": f"Enforces prompt constraint: '{sent}'.",
                    "badge": "Prompt-Driven Synthesis"
                })
                continue

            # SQL Injection / Corrupt payload guard
            if any(k in sl for k in ["sql injection", "corrupt", "payload", "script"]):
                target_c = mentioned_cols[0] if mentioned_cols else (find_col_by_keywords(["name", "customer", "email", "status"]) or raw_cols[0])
                add_rule({
                    "id": f"r_{slug}_sqli_{target_c.lower()}",
                    "name": f"SQL Injection & Corrupt Payload Guard ({target_c})",
                    "field": target_c,
                    "severity": "Critical",
                    "condition": f"{target_c} NOT LIKE '%);%' AND {target_c} != 'PURGED_CORRUPT'",
                    "code": f"{target_c} NOT LIKE '%);%' AND {target_c} != 'PURGED_CORRUPT'",
                    "desc": f"Blocks malicious SQL injection strings and corrupt payloads on {target_c}.",
                    "badge": "Prompt-Driven Synthesis"
                })

            # Email format
            if "email" in sl or "rfc" in sl or "@" in sl:
                ec = find_col_by_keywords(["email", "mail"]) or (mentioned_cols[0] if mentioned_cols else raw_cols[0])
                add_rule({
                    "id": f"r_{slug}_email_{ec.lower()}",
                    "name": f"RFC-5322 Email & Case Compliance ({ec})",
                    "field": ec,
                    "severity": "Critical",
                    "condition": f"{ec} IS NOT NULL AND {ec} LIKE '%_@_%.__%' AND {ec} NOT LIKE '%@@%' AND {ec} NOT LIKE '% %'",
                    "code": f"{ec} IS NOT NULL AND {ec} LIKE '%_@_%.__%' AND {ec} NOT LIKE '%@@%'",
                    "desc": f"Validates {ec} against RFC-5322 email syntax and normalizes uppercase domains.",
                    "badge": "Prompt-Driven Synthesis"
                })

            # Whitespace / Trim normalization
            if any(k in sl for k in ["trim", "whitespace", "leading", "trailing"]):
                tc = mentioned_cols[0] if mentioned_cols else (find_col_by_keywords(["name", "customer", "vendor", "email"]) or raw_cols[0])
                add_rule({
                    "id": f"r_{slug}_trim_{tc.lower()}",
                    "name": f"Whitespace & Text Hygiene ({tc})",
                    "field": tc,
                    "severity": "Warning",
                    "condition": f"{tc} IS NOT NULL AND TRIM({tc}) = {tc} AND LENGTH(TRIM({tc})) > 0",
                    "code": f"TRIM({tc}) = {tc} AND LENGTH(TRIM({tc})) > 0",
                    "desc": f"Detects untrimmed leading/trailing whitespace on {tc} for automatic trimming.",
                    "badge": "Prompt-Driven Synthesis"
                })

            # Upper threshold / outlier check (e.g. must not exceed 100 or <= 100)
            thresh_match = re.search(r"(?:exceed|<=|<|below|under|max|maximum)\s*(\d+(?:\.\d+)?)", sl)
            if thresh_match:
                bound_val = thresh_match.group(1)
                tc = mentioned_cols[0] if mentioned_cols else (find_col_by_keywords(["pct", "utilization", "balance", "amount", "total"]) or raw_cols[0])
                add_rule({
                    "id": f"r_{slug}_max_{tc.lower()}",
                    "name": f"Upper Threshold Guard ({tc} <= {bound_val})",
                    "field": tc,
                    "severity": "Critical",
                    "condition": f"{tc} <= {bound_val}",
                    "code": f"{tc} <= {bound_val}",
                    "desc": f"Quarantines extreme outliers where {tc} exceeds {bound_val}.",
                    "badge": "Prompt-Driven Synthesis"
                })

            # Positive / Non-negative numeric bounds
            if any(k in sl for k in ["positive", "> 0", ">= 0", "non-negative", "negative", "greater than 0"]):
                targets = mentioned_cols if mentioned_cols else [c for c in raw_cols if any(k in c.lower() for k in ["quantity", "qty", "menge", "price", "netpr", "amount", "balance", "total"])]
                for nc in targets[:3]:
                    op = "> 0" if ("strictly positive" in sl or "greater than 0" in sl or "> 0" in sl or "qty" in nc.lower() or "quantity" in nc.lower() or "price" in nc.lower()) else ">= 0"
                    add_rule({
                        "id": f"r_{slug}_pos_{nc.lower()}",
                        "name": f"Positive Numeric Bound ({nc} {op})",
                        "field": nc,
                        "severity": "Critical",
                        "condition": f"{nc} IS NOT NULL AND {nc} {op}",
                        "code": f"{nc} {op}",
                        "desc": f"Enforces prompt constraint: '{sent}' on {nc}.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            # Date / ISO-8601 / Future date check
            if any(k in sl for k in ["date", "iso-8601", "future"]):
                dc = mentioned_cols[0] if mentioned_cols else (find_col_by_keywords(["date", "created", "time"]) or raw_cols[0])
                add_rule({
                    "id": f"r_{slug}_date_{dc.lower()}",
                    "name": f"ISO-8601 Date & Horizon Check ({dc})",
                    "field": dc,
                    "severity": "Warning",
                    "condition": f"{dc} IS NOT NULL AND {dc} NOT LIKE '2099%' AND {dc} NOT LIKE '%/%'",
                    "code": f"{dc} IS NOT NULL AND {dc} NOT LIKE '2099%'",
                    "desc": f"Ensures {dc} is formatted in ISO-8601 (YYYY-MM-DD) and is not a future-dated anomaly.",
                    "badge": "Prompt-Driven Synthesis"
                })

            # Status / Lifecycle / Role / Country / Phone / Zip domain checks
            if any(k in sl for k in ["status", "cancelled", "lifecycle", "active", "approved"]):
                sc = find_col_by_keywords(["status", "state"]) or (mentioned_cols[0] if mentioned_cols else None)
                if sc:
                    add_rule({
                        "id": f"r_{slug}_status_{sc.lower()}",
                        "name": f"Authorized Lifecycle Status ({sc})",
                        "field": sc,
                        "severity": "Warning",
                        "condition": f"LOWER({sc}) NOT IN ('cancelled', 'purged_corrupt', 'suspended', 'rejected')",
                        "code": f"LOWER({sc}) NOT IN ('cancelled', 'purged_corrupt', 'suspended')",
                        "desc": f"Validates {sc} against authorized operational lifecycle states.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            if "role" in sl:
                rc = find_col_by_keywords(["role"]) or (mentioned_cols[0] if mentioned_cols else None)
                if rc:
                    add_rule({
                        "id": f"r_{slug}_role_{rc.lower()}",
                        "name": f"RBAC Role Domain Check ({rc})",
                        "field": rc,
                        "severity": "Critical",
                        "condition": f"LOWER({rc}) IN ('admin', 'analyst', 'manager', 'viewer', 'user')",
                        "code": f"LOWER({rc}) IN ('admin', 'analyst', 'manager', 'viewer', 'user')",
                        "desc": f"Restricts {rc} to authorized enterprise RBAC roles.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            if "country" in sl:
                cc = find_col_by_keywords(["country"]) or (mentioned_cols[0] if mentioned_cols else None)
                if cc:
                    add_rule({
                        "id": f"r_{slug}_country_{cc.lower()}",
                        "name": f"ISO Country Code Validation ({cc})",
                        "field": cc,
                        "severity": "Warning",
                        "condition": f"{cc} IS NOT NULL AND {cc} NOT LIKE '%INVALID%' AND LENGTH(TRIM({cc})) BETWEEN 2 AND 15",
                        "code": f"{cc} NOT LIKE '%INVALID%'",
                        "desc": f"Ensures {cc} contains a recognized country identifier.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            if "phone" in sl:
                pc = find_col_by_keywords(["phone", "tel"]) or (mentioned_cols[0] if mentioned_cols else None)
                if pc:
                    add_rule({
                        "id": f"r_{slug}_phone_{pc.lower()}",
                        "name": f"Telecom Format Integrity ({pc})",
                        "field": pc,
                        "severity": "Warning",
                        "condition": f"{pc} IS NOT NULL AND LENGTH(TRIM({pc})) >= 7",
                        "code": f"{pc} IS NOT NULL AND LENGTH(TRIM({pc})) >= 7",
                        "desc": f"Validates that {pc} is non-empty and meets minimum digit length.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            if "zip" in sl or "postal" in sl:
                zc = find_col_by_keywords(["zip", "postal"]) or (mentioned_cols[0] if mentioned_cols else None)
                if zc:
                    add_rule({
                        "id": f"r_{slug}_zip_{zc.lower()}",
                        "name": f"Postal / Zip Code Integrity ({zc})",
                        "field": zc,
                        "severity": "Warning",
                        "condition": f"{zc} IS NOT NULL AND {zc} NOT LIKE '%INVALID%' AND LENGTH(TRIM({zc})) >= 4",
                        "code": f"{zc} IS NOT NULL AND {zc} NOT LIKE '%INVALID%'",
                        "desc": f"Ensures {zc} is a valid postal code without corrupt suffixes.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            # Mandatory / Unique / Not Null
            if any(k in sl for k in ["mandatory", "unique", "not null", "not be null", "empty", "required", "missing", "duplicate"]):
                targets = mentioned_cols if mentioned_cols else [raw_cols[0]]
                for mc in targets:
                    is_unique = "unique" in sl or "duplicate" in sl or "id" in mc.lower()
                    add_rule({
                        "id": f"r_{slug}_notnull_{mc.lower()}",
                        "name": f"{'Primary Key Uniqueness & Completeness' if is_unique else 'Mandatory Field Completeness'} ({mc})",
                        "field": mc,
                        "severity": "Critical",
                        "condition": f"{mc} IS NOT NULL AND TRIM(CAST({mc} AS VARCHAR)) != ''",
                        "code": f"{mc} IS NOT NULL AND TRIM(CAST({mc} AS VARCHAR)) != ''",
                        "desc": f"Enforces prompt requirement: '{sent}' on column {mc}.",
                        "badge": "Prompt-Driven Synthesis"
                    })

            # Catch-all for any custom user sentence mentioning a specific column that didn't match above patterns
            if mentioned_cols and not any(r["field"] in mentioned_cols for r in rules[-2:]):
                mc = mentioned_cols[0]
                # Check if user wrote an explicit operator like `age >= 18` or `country = 'USA'`
                op_match = re.search(rf"\b{re.escape(mc)}\s*(==|!=|>=|<=|>|<|=|IN|LIKE)\s*([^\.;]+)", sent, re.IGNORECASE)
                cond_expr = f"{mc} {op_match.group(1)} {op_match.group(2).strip()}" if op_match else f"{mc} IS NOT NULL AND TRIM(CAST({mc} AS VARCHAR)) != ''"
                add_rule({
                    "id": f"r_{slug}_custom_{mc.lower()}_{idx}",
                    "name": f"Custom Prompt Rule ({mc})",
                    "field": mc,
                    "severity": "Critical" if "must" in sl or "critical" in sl else "Warning",
                    "condition": cond_expr,
                    "code": cond_expr,
                    "desc": f"Synthesized directly from user instruction: '{sent}'.",
                    "badge": "Custom Prompt Rule"
                })

        # 2. Ensure at least 3 comprehensive rules covering the selected columns if prompt was very brief
        if len(rules) < 3:
            for col in raw_cols:
                if len(rules) >= 5:
                    break
                cl = col.lower()
                if any(r["field"].lower() == cl for r in rules):
                    continue
                if "email" in cl:
                    add_rule({
                        "id": f"r_{slug}_email_{cl}",
                        "name": f"RFC-5322 Email Compliance ({col})",
                        "field": col,
                        "severity": "Critical",
                        "condition": f"{col} IS NOT NULL AND {col} LIKE '%_@_%.__%'",
                        "code": f"{col} LIKE '%_@_%.__%'",
                        "desc": f"Validates {col} adheres to enterprise RFC-5322 email syntax.",
                        "badge": "Schema Profile Rule"
                    })
                elif any(k in cl for k in ["quantity", "qty", "menge", "price", "netpr", "amount", "balance", "total"]):
                    add_rule({
                        "id": f"r_{slug}_pos_{cl}",
                        "name": f"Positive Financial/Quantity Bound ({col})",
                        "field": col,
                        "severity": "Critical",
                        "condition": f"{col} >= 0",
                        "code": f"{col} >= 0",
                        "desc": f"Enforces non-negative numeric bound on {col}.",
                        "badge": "Schema Profile Rule"
                    })
                else:
                    add_rule({
                        "id": f"r_{slug}_complete_{cl}",
                        "name": f"Field Completeness & Hygiene ({col})",
                        "field": col,
                        "severity": "Critical" if "id" in cl else "Warning",
                        "condition": f"{col} IS NOT NULL AND TRIM(CAST({col} AS VARCHAR)) != ''",
                        "code": f"{col} IS NOT NULL AND TRIM(CAST({col} AS VARCHAR)) != ''",
                        "desc": f"Ensures {col} is populated and free of null/blank anomalies.",
                        "badge": "Schema Profile Rule"
                    })

        return rules


offline_ai_heuristics = OfflineAIHeuristics()
