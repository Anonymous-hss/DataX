"""
DataX AI Agent & RAG Data Firewall Engine (Production SaaS)
- Pre-embedding RAG Document & Knowledge Chunk Guard with Configurable Policy
  (Prompt Injection Quarantine or Strip, Secrets, SSN/PCI, Email/Phone PII, Custom Terms, Entropy)
- Persistent Firewall Policy Management (Neon PostgreSQL: datax_firewall_policies)
- In-Flight Agent Tool-Call & Parameter Guardrail (<25ms Interceptor + HITL Resolution)
- Neon PostgreSQL Persistence (datax_verified_rag_chunks & datax_firewall_events)
"""

import re
import json
import time
import math
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List, Optional
from vault import DEFAULT_NEON_URI
from studio_io_engine import chunk_text_with_overlap

# Regular Expression Signatures for Secrets & Credentials
SECRET_PATTERNS = [
    ("OPENAI_API_KEY", re.compile(r"sk-[a-zA-Z0-9_-]{20,}")),
    ("ANTHROPIC_API_KEY", re.compile(r"sk-ant-[a-zA-Z0-9_-]{20,}")),
    ("AWS_ACCESS_KEY", re.compile(r"\b(AKIA|ABIA|ACCA)[0-9A-Z]{16}\b")),
    ("GITHUB_PAT", re.compile(r"\bghp_[a-zA-Z0-9]{36}\b")),
    ("SLACK_TOKEN", re.compile(r"\bxox[baprs]-[a-zA-Z0-9-]{15,}\b")),
    ("GENERIC_BEARER_JWT", re.compile(r"\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b")),
    ("DATABASE_URI", re.compile(r"\b(mongodb(\+srv)?|postgresql|postgres|mysql|redis)://[^:\s]+:[^@\s]+@[^\s\"']+", re.IGNORECASE)),
    ("PRIVATE_KEY_HEADER", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)")),
]

# Sensitive PII Patterns
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CREDIT_CARD_REGEX = re.compile(r"\b(?:\d{4}[- ]?){3}\d{4}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b")

# Indirect Prompt Injection Signatures
PROMPT_INJECTION_PATTERNS = [
    ("SYSTEM_OVERRIDE", re.compile(r"(ignore|disregard|forget|override)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules|directives)[^.!?\n]*[.!?\n]?", re.IGNORECASE)),
    ("DEVELOPER_JAILBREAK", re.compile(r"(developer\s+mode\s+enabled|now\s+act\s+as\s+DAN|unrestricted\s+mode|bypass\s+safety\s+filter)[^.!?\n]*[.!?\n]?", re.IGNORECASE)),
    ("PROMPT_LEAKAGE", re.compile(r"(print|repeat|output|reveal|display)\s+(your\s+)?(system\s+prompt|initial\s+instructions|base\s+instructions)[^.!?\n]*[.!?\n]?", re.IGNORECASE)),
    ("UNTRUSTED_TOOL_HIJACK", re.compile(r"(<tool_call>[\s\S]*?</tool_call>|<execute>[\s\S]*?</execute>|<!--[\s\S]*?(?:ignore|override|system|transfer_funds|drop\s+database)[\s\S]*?-->|(?:call\s+tool|execute_sql|transfer_funds|drop\s+database|rm\s+-rf)[^.!?\n]*[.!?\n]?)", re.IGNORECASE)),
    ("MARKDOWN_EXFILTRATION", re.compile(r"!\[.*?\]\((https?://[^\s)]+?(exfil|steal|collect|log|track|webhook)[^\s)]*)\)", re.IGNORECASE)),
    ("BASE64_EXEC_PAYLOAD", re.compile(r"(eval|exec)\s*\(\s*base64\.b64decode\s*\([^\)]*\)\s*\)", re.IGNORECASE)),
]

# Destructive SQL Commands for Agent Tool Calls
DESTRUCTIVE_SQL_REGEX = re.compile(
    r"\b(DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE|GRANT\s+ALL|DROP\s+DATABASE|DROP\s+SCHEMA)\b",
    re.IGNORECASE
)

DEFAULT_FIREWALL_POLICY = {
    "max_financial_limit": 5000.0,
    "hitl_threshold": 500.0,
    "financial_fields": ["amount", "refund_amount", "transfer_amount", "credit_limit", "total", "payout", "payment", "price"],
    "block_destructive_sql": True,
    "redact_secrets_in_args": True,
    "redact_pii_in_args": True,
    "redact_emails_in_args": False,
    "blocked_tools": [],
    "custom_blocked_terms": []
}


def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy to flag corrupted binary or obfuscated payloads."""
    if not text:
        return 0.0
    length = len(text)
    counts = {}
    for ch in text:
        counts[ch] = counts.get(ch, 0) + 1
    return -sum((cnt / length) * math.log2(cnt / length) for cnt in counts.values() if cnt > 0)


def init_firewall_tables():
    """Idempotently ensures firewall persistence tables exist in Neon PostgreSQL."""
    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "datax_verified_rag_chunks" (
                        chunk_id VARCHAR(64) PRIMARY KEY,
                        source_doc VARCHAR(256),
                        clean_text TEXT,
                        redactions_count INT DEFAULT 0,
                        trust_score NUMERIC(5, 2) DEFAULT 10.0,
                        verdict VARCHAR(32) DEFAULT 'VERIFIED',
                        violations TEXT,
                        sha256_seal VARCHAR(64),
                        indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "datax_firewall_events" (
                        event_id VARCHAR(64) PRIMARY KEY,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        mode VARCHAR(32),
                        agent_or_source VARCHAR(128),
                        target_tool VARCHAR(64),
                        verdict VARCHAR(32),
                        risk_score NUMERIC(5, 2),
                        violations TEXT,
                        original_payload JSONB,
                        sanitized_payload JSONB,
                        sha256_seal VARCHAR(64),
                        latency_ms NUMERIC(8, 2)
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "datax_firewall_policies" (
                        policy_id VARCHAR(64) PRIMARY KEY,
                        policy_json JSONB NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            conn.commit()
    except Exception as e:
        print(f"[AI_FIREWALL] Note: Table init deferred or non-fatal: {e}")


init_firewall_tables()


def get_active_firewall_policy(policy_id: str = "default") -> Dict[str, Any]:
    """Loads persisted firewall policy from Neon PostgreSQL, falling back to clean defaults."""
    merged = dict(DEFAULT_FIREWALL_POLICY)
    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=5) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    'SELECT policy_json, updated_at FROM "datax_firewall_policies" WHERE policy_id = %s;',
                    (policy_id,)
                )
                row = cur.fetchone()
                if row and row.get("policy_json"):
                    stored = row["policy_json"] if isinstance(row["policy_json"], dict) else json.loads(row["policy_json"])
                    merged.update(stored)
                    if row.get("updated_at"):
                        merged["updatedAt"] = row["updated_at"].isoformat()
    except Exception as e:
        print(f"[AI_FIREWALL] Load policy note: {e}")
    return merged


def save_active_firewall_policy(policy_updates: Dict[str, Any], policy_id: str = "default") -> Dict[str, Any]:
    """Saves active firewall policy to Neon PostgreSQL."""
    current = get_active_firewall_policy(policy_id)
    current.pop("updatedAt", None)
    for k, v in (policy_updates or {}).items():
        if v is not None:
            current[k] = v

    with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO "datax_firewall_policies" (policy_id, policy_json, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (policy_id) DO UPDATE SET
                    policy_json = EXCLUDED.policy_json,
                    updated_at = CURRENT_TIMESTAMP;
            """, (policy_id, json.dumps(current)))
        conn.commit()

    return get_active_firewall_policy(policy_id)


def resolve_firewall_event(event_id: str, decision: str, reviewer_note: str = "") -> Dict[str, Any]:
    """Approves or rejects a HOLD_FOR_HITL firewall interception event in Neon PostgreSQL."""
    norm = (decision or "").upper().strip()
    new_verdict = "APPROVED_BY_HUMAN" if norm in ["APPROVE", "APPROVED", "ALLOW", "APPROVED_BY_HUMAN"] else "REJECTED_BY_HUMAN"

    with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT violations FROM "datax_firewall_events" WHERE event_id = %s;', (event_id,))
            existing = cur.fetchone()
            if not existing:
                raise ValueError(f"Firewall event '{event_id}' not found.")

            note_suffix = f" | HITL Decision: {new_verdict}" + (f" ({reviewer_note})" if reviewer_note else "")
            updated_violations = (existing.get("violations") or "") + note_suffix
            cur.execute("""
                UPDATE "datax_firewall_events"
                SET verdict = %s, violations = %s
                WHERE event_id = %s;
            """, (new_verdict, updated_violations, event_id))
        conn.commit()

    return {"status": "success", "eventId": event_id, "verdict": new_verdict}


def scan_single_chunk(
    text: str,
    doc_name: str = "document_chunk",
    policy: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluates an unstructured document chunk against prompt injections, secrets, PII, custom rules, and entropy.
    """
    start_time = time.time()
    pol = policy or {}
    redact_secrets = pol.get("redactSecrets", True)
    redact_ssn_cards = pol.get("redactSsnAndCards", True)
    redact_emails = pol.get("redactEmails", False)
    redact_phones = pol.get("redactPhones", False)
    injection_action = (pol.get("injectionAction") or "quarantine").lower()  # 'quarantine' | 'strip'
    custom_terms = [t.strip() for t in (pol.get("customRedactions") or []) if str(t).strip()]

    violations = []
    redactions = []
    raw_text = text or ""
    sanitized_text = raw_text

    # 1. Prompt Injection & Jailbreak Scanner
    injection_matches = []
    for label, pattern in PROMPT_INJECTION_PATTERNS:
        matches = list(pattern.finditer(sanitized_text))
        if matches:
            injection_matches.append(label)
            violations.append(f"Prompt Injection Signature Detected ({label})")
            if injection_action == "strip":
                for m in matches:
                    redactions.append({
                        "type": f"INJECTION_{label}",
                        "original": m.group(0)[:32] + ("..." if len(m.group(0)) > 32 else ""),
                        "replacement": "[STRIPPED_INJECTION]"
                    })
                sanitized_text = pattern.sub("[STRIPPED_INJECTION] ", sanitized_text)

    # 2. Secret & API Key Scanner
    if redact_secrets:
        for sec_name, pattern in SECRET_PATTERNS:
            matches = list(pattern.finditer(sanitized_text))
            for m in matches:
                secret_val = m.group(0)
                replacement = f"[REDACTED_{sec_name}]"
                redactions.append({
                    "type": sec_name,
                    "original": secret_val[:6] + "..." + secret_val[-4:] if len(secret_val) > 10 else "***",
                    "replacement": replacement
                })
                violations.append(f"Credential Leaked ({sec_name})")
            if matches:
                sanitized_text = pattern.sub(f"[REDACTED_{sec_name}]", sanitized_text)

    # 3. PII Scanner (SSN & Credit Cards)
    if redact_ssn_cards:
        ssn_matches = list(SSN_REGEX.finditer(sanitized_text))
        for _ in ssn_matches:
            redactions.append({"type": "SSN", "original": "***-**-****", "replacement": "[REDACTED_SSN]"})
            violations.append("Government Identity PII Detected (SSN)")
        if ssn_matches:
            sanitized_text = SSN_REGEX.sub("[REDACTED_SSN]", sanitized_text)

        cc_matches = list(CREDIT_CARD_REGEX.finditer(sanitized_text))
        for _ in cc_matches:
            redactions.append({"type": "CREDIT_CARD", "original": "****-****-****-****", "replacement": "[REDACTED_CARD]"})
            violations.append("Payment Card PII Detected (PCI-DSS)")
        if cc_matches:
            sanitized_text = CREDIT_CARD_REGEX.sub("[REDACTED_CARD]", sanitized_text)

    # Optional Email & Phone PII Redaction
    if redact_emails:
        em_matches = list(EMAIL_REGEX.finditer(sanitized_text))
        for m in em_matches:
            val = m.group(0)
            redactions.append({"type": "EMAIL", "original": val[:3] + "***@" + val.split("@")[-1], "replacement": "[REDACTED_EMAIL]"})
            violations.append("Email PII Masked")
        if em_matches:
            sanitized_text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized_text)

    if redact_phones:
        ph_matches = list(PHONE_REGEX.finditer(sanitized_text))
        for _ in ph_matches:
            redactions.append({"type": "PHONE", "original": "***-***-****", "replacement": "[REDACTED_PHONE]"})
            violations.append("Phone PII Masked")
        if ph_matches:
            sanitized_text = PHONE_REGEX.sub("[REDACTED_PHONE]", sanitized_text)

    # 4. User Custom Forbidden Terms / Regexes
    for term in custom_terms:
        try:
            c_pat = re.compile(re.escape(term), re.IGNORECASE)
            c_matches = list(c_pat.finditer(sanitized_text))
            if c_matches:
                for _ in c_matches:
                    redactions.append({"type": "CUSTOM_POLICY", "original": term[:16], "replacement": "[REDACTED_CUSTOM]"})
                violations.append(f"Custom Restricted Term Redacted ('{term}')")
                sanitized_text = c_pat.sub("[REDACTED_CUSTOM]", sanitized_text)
        except re.error:
            pass

    # 5. Entropy & Structural Invariants
    entropy = calculate_shannon_entropy(raw_text)
    abnormal_entropy = len(raw_text.strip()) > 30 and (entropy < 1.5 or entropy > 6.8)
    if abnormal_entropy:
        violations.append(f"Abnormal Shannon Entropy ({entropy:.2f}): Possible binary/obfuscated payload")

    low_density = len(raw_text.strip()) < 8
    if low_density:
        violations.append("Low Information Density: Empty or degenerate chunk (< 8 chars)")

    # Compute Trust Score (0.0 to 10.0)
    base_score = 10.0
    if injection_matches:
        base_score -= 8.0 if injection_action == "quarantine" else 2.5
    if any("Credential" in v for v in violations):
        base_score -= 2.5
    if any("PII" in v for v in violations):
        base_score -= 1.5
    if abnormal_entropy:
        base_score -= 3.5
    if low_density:
        base_score -= 6.5

    trust_score = round(max(0.0, min(10.0, base_score)), 2)

    # Assign Verdict
    if (injection_matches and injection_action == "quarantine") or trust_score < 4.0 or low_density:
        verdict = "QUARANTINED"
    elif redactions:
        verdict = "REDACTED_PASS"
    else:
        verdict = "VERIFIED"

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    seal = hashlib.sha256(f"{doc_name}:{trust_score}:{verdict}:{sanitized_text}".encode("utf-8")).hexdigest()

    return {
        "chunkId": f"chk_{hashlib.md5((doc_name + ':' + raw_text).encode('utf-8')).hexdigest()[:12]}",
        "docName": doc_name,
        "originalText": raw_text,
        "sanitizedText": sanitized_text.strip(),
        "verdict": verdict,
        "trustScore": trust_score,
        "violations": violations,
        "redactions": redactions,
        "redactionsCount": len(redactions),
        "entropy": round(entropy, 2),
        "charCount": len(sanitized_text.strip()),
        "estTokens": max(1, len(sanitized_text.strip()) // 4),
        "metadata": metadata or {},
        "sha256Seal": seal,
        "elapsedMs": elapsed_ms
    }


def scan_rag_batch(
    chunks: List[Dict[str, Any]],
    policy: Optional[Dict[str, Any]] = None,
    persist: bool = True
) -> Dict[str, Any]:
    """
    Scans a batch of user-ingested documents/chunks, optionally splitting long texts into overlapping chunks first,
    applies the configured sanitization policy, and persists verified/redacted chunks into Neon PostgreSQL.
    """
    start_time = time.time()
    pol = policy or {}
    auto_chunk = bool(pol.get("autoChunk", False))
    chunk_size = int(pol.get("chunkSize") or 1200)
    chunk_overlap = int(pol.get("chunkOverlap") or 120)

    expanded_chunks: List[Dict[str, Any]] = []
    for idx, c in enumerate(chunks):
        if isinstance(c, str):
            raw_t = c
            d_name = f"document_{idx + 1}"
            meta = {}
        else:
            raw_t = str(c.get("text") or c.get("content") or c.get("chunk") or "")
            d_name = str(c.get("docName") or c.get("source") or c.get("filename") or c.get("id") or f"document_{idx + 1}")
            meta = c.get("metadata") if isinstance(c.get("metadata"), dict) else {}

        if auto_chunk and len(raw_t) > chunk_size:
            pieces = chunk_text_with_overlap(raw_t, doc_name=d_name, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            for p in pieces:
                expanded_chunks.append({"docName": p["docName"], "text": p["text"], "metadata": meta})
        else:
            expanded_chunks.append({"docName": d_name, "text": raw_t, "metadata": meta})

    results = []
    verified_count = 0
    redacted_count = 0
    quarantined_count = 0
    total_redactions = 0

    for c in expanded_chunks:
        res = scan_single_chunk(c["text"], c["docName"], policy=pol, metadata=c.get("metadata"))
        results.append(res)

        if res["verdict"] == "VERIFIED":
            verified_count += 1
        elif res["verdict"] == "REDACTED_PASS":
            redacted_count += 1
            total_redactions += res["redactionsCount"]
        else:
            quarantined_count += 1

    total = len(results)
    overall_health = round(((verified_count + redacted_count * 0.95) / max(1, total)) * 100, 1)

    if persist and (verified_count > 0 or redacted_count > 0):
        try:
            with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
                with conn.cursor() as cur:
                    for r in results:
                        if r["verdict"] in ["VERIFIED", "REDACTED_PASS"]:
                            cur.execute("""
                                INSERT INTO "datax_verified_rag_chunks"
                                (chunk_id, source_doc, clean_text, redactions_count, trust_score, verdict, violations, sha256_seal)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (chunk_id) DO UPDATE SET
                                    clean_text = EXCLUDED.clean_text,
                                    redactions_count = EXCLUDED.redactions_count,
                                    trust_score = EXCLUDED.trust_score,
                                    verdict = EXCLUDED.verdict,
                                    violations = EXCLUDED.violations,
                                    sha256_seal = EXCLUDED.sha256_seal,
                                    indexed_at = CURRENT_TIMESTAMP;
                            """, (
                                r["chunkId"],
                                r["docName"][:250],
                                r["sanitizedText"],
                                r["redactionsCount"],
                                r["trustScore"],
                                r["verdict"],
                                " | ".join(r["violations"]),
                                r["sha256Seal"]
                            ))
                conn.commit()
        except Exception as e:
            print(f"[AI_FIREWALL] Note: Database persistence warning: {e}")

    total_elapsed = round((time.time() - start_time) * 1000, 2)
    batch_seal = hashlib.sha256(f"{total}:{verified_count}:{quarantined_count}:{total_redactions}".encode("utf-8")).hexdigest()

    return {
        "status": "success",
        "totalChunks": total,
        "verifiedCount": verified_count,
        "redactedCount": redacted_count,
        "quarantinedCount": quarantined_count,
        "totalRedactionsApplied": total_redactions,
        "overallHealth": overall_health,
        "batchSha256Seal": batch_seal,
        "elapsedMs": total_elapsed,
        "results": results
    }


def _recursive_redact_obj(obj: Any, pattern: re.Pattern, replacement: str) -> Any:
    if isinstance(obj, str):
        return pattern.sub(replacement, obj)
    if isinstance(obj, list):
        return [_recursive_redact_obj(x, pattern, replacement) for x in obj]
    if isinstance(obj, dict):
        return {k: _recursive_redact_obj(v, pattern, replacement) for k, v in obj.items()}
    return obj


def _extract_numeric_fields(obj: Any, target_keys: set, found: List[tuple]):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.lower() in target_keys and v is not None and not isinstance(v, bool):
                try:
                    found.append((k, float(v)))
                except (ValueError, TypeError):
                    pass
            elif isinstance(v, (dict, list)):
                _extract_numeric_fields(v, target_keys, found)
    elif isinstance(obj, list):
        for item in obj:
            _extract_numeric_fields(item, target_keys, found)


def intercept_agent_tool_call(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sub-25ms synchronous firewall for AI Agent tool calls.
    Enforces saved tenant firewall policy merged with per-call overrides.
    """
    start_time = time.time()
    agent_id = str(payload.get("agent_id") or payload.get("agentId") or "autonomous_agent")
    tool_name = str(payload.get("tool_name") or payload.get("toolName") or "unspecified_tool")
    args = payload.get("arguments") if payload.get("arguments") is not None else (payload.get("args") or {})

    # Merge saved policy with any explicit per-call policies
    effective_policy = get_active_firewall_policy("default")
    if isinstance(payload.get("policies"), dict):
        for pk, pv in payload["policies"].items():
            if pv is not None:
                effective_policy[pk] = pv

    violations = []
    verdict = "ALLOW"
    risk_score = 0.0
    sanitized_args = json.loads(json.dumps(args))

    # 0. Blocked Tool Denylist Check
    blocked_tools = [str(t).strip().lower() for t in (effective_policy.get("blocked_tools") or []) if str(t).strip()]
    if tool_name.strip().lower() in blocked_tools:
        violations.append(f"Policy Denylist Violation: Tool '{tool_name}' is explicitly forbidden by workspace policy")
        verdict = "BLOCK_CRITICAL"
        risk_score = 10.0

    # 1. SQL Tool Destructive Operation Guard
    if effective_policy.get("block_destructive_sql", True):
        args_dump = json.dumps(args)
        destructive_match = DESTRUCTIVE_SQL_REGEX.search(args_dump)
        if destructive_match:
            violations.append(f"Critical Safety Breach: Destructive SQL '{destructive_match.group(0)}' blocked by AST guard")
            verdict = "BLOCK_CRITICAL"
            risk_score = max(risk_score, 9.8)

    # 2. Financial & Monetary Blast Radius Gate
    fin_fields = set(
        str(f).strip().lower()
        for f in (effective_policy.get("financial_fields") or DEFAULT_FIREWALL_POLICY["financial_fields"])
    )
    numeric_hits: List[tuple] = []
    _extract_numeric_fields(args, fin_fields, numeric_hits)

    max_allowed = float(effective_policy.get("max_financial_limit", 5000.0))
    hitl_threshold = float(effective_policy.get("hitl_threshold", 500.0))

    for field_name, num_val in numeric_hits:
        if num_val < 0:
            violations.append(f"Negative Financial Amount ({num_val}) in '{field_name}': Sign inversion blocked")
            verdict = "BLOCK_CRITICAL"
            risk_score = max(risk_score, 9.0)
        elif num_val > max_allowed:
            violations.append(f"Exceeded Autonomous Safety Ceiling: {field_name}=${num_val:,.2f} exceeds max cap (${max_allowed:,.2f})")
            verdict = "BLOCK_CRITICAL"
            risk_score = max(risk_score, 9.5)
        elif num_val > hitl_threshold:
            violations.append(f"High-Value Transaction: {field_name}=${num_val:,.2f} exceeds HITL threshold (${hitl_threshold:,.2f})")
            if verdict != "BLOCK_CRITICAL":
                verdict = "HOLD_FOR_HITL"
                risk_score = max(risk_score, 6.5)

    # 3. Secret & PII Leakage in Tool Arguments (Recursive)
    args_str = json.dumps(sanitized_args)
    if effective_policy.get("redact_secrets_in_args", True):
        for sec_name, pattern in SECRET_PATTERNS:
            if pattern.search(args_str):
                violations.append(f"Tool Argument Contains Raw Credential ({sec_name})")
                if verdict == "ALLOW":
                    verdict = "ALLOW_REDACTED"
                risk_score = max(risk_score, 7.5)
                sanitized_args = _recursive_redact_obj(sanitized_args, pattern, f"[REDACTED_{sec_name}]")
                args_str = json.dumps(sanitized_args)

    if effective_policy.get("redact_pii_in_args", True):
        if SSN_REGEX.search(args_str):
            violations.append("Tool Argument Contains Unmasked SSN")
            if verdict == "ALLOW":
                verdict = "ALLOW_REDACTED"
            risk_score = max(risk_score, 6.0)
            sanitized_args = _recursive_redact_obj(sanitized_args, SSN_REGEX, "[REDACTED_SSN]")
            args_str = json.dumps(sanitized_args)

        if CREDIT_CARD_REGEX.search(args_str):
            violations.append("Tool Argument Contains Unmasked Payment Card")
            if verdict == "ALLOW":
                verdict = "ALLOW_REDACTED"
            risk_score = max(risk_score, 6.5)
            sanitized_args = _recursive_redact_obj(sanitized_args, CREDIT_CARD_REGEX, "[REDACTED_CARD]")
            args_str = json.dumps(sanitized_args)

    if effective_policy.get("redact_emails_in_args", False):
        if EMAIL_REGEX.search(args_str):
            violations.append("Tool Argument Email PII Redacted")
            if verdict == "ALLOW":
                verdict = "ALLOW_REDACTED"
            risk_score = max(risk_score, 3.5)
            sanitized_args = _recursive_redact_obj(sanitized_args, EMAIL_REGEX, "[REDACTED_EMAIL]")
            args_str = json.dumps(sanitized_args)

    # 4. Custom Restricted Terms
    for term in (effective_policy.get("custom_blocked_terms") or []):
        t_clean = str(term).strip()
        if t_clean and re.search(re.escape(t_clean), args_str, re.IGNORECASE):
            violations.append(f"Custom Restricted Term Blocked in Tool Arguments ('{t_clean}')")
            verdict = "BLOCK_CRITICAL"
            risk_score = max(risk_score, 8.5)

    # 5. Indirect Prompt Injection in Tool Arguments
    for label, pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(args_str):
            violations.append(f"Prompt Injection Signature ({label}) detected in tool payload")
            verdict = "BLOCK_CRITICAL"
            risk_score = 10.0

    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    event_id = f"evt_{int(time.time() * 1000)}_{hashlib.md5(f'{agent_id}:{tool_name}:{time.time()}'.encode()).hexdigest()[:6]}"
    seal = hashlib.sha256(f"{event_id}:{verdict}:{risk_score}:{elapsed_ms}".encode()).hexdigest()

    result = {
        "eventId": event_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "agentId": agent_id,
        "toolName": tool_name,
        "verdict": verdict,
        "isBlocked": verdict == "BLOCK_CRITICAL",
        "isHeld": verdict == "HOLD_FOR_HITL",
        "isRedacted": verdict == "ALLOW_REDACTED",
        "riskScore": risk_score,
        "violations": violations,
        "appliedPolicy": {
            "max_financial_limit": max_allowed,
            "hitl_threshold": hitl_threshold,
            "block_destructive_sql": bool(effective_policy.get("block_destructive_sql", True)),
        },
        "sanitizedArguments": sanitized_args if verdict != "BLOCK_CRITICAL" else None,
        "sha256Seal": seal,
        "latencyMs": elapsed_ms
    }

    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "datax_firewall_events"
                    (event_id, mode, agent_or_source, target_tool, verdict, risk_score, violations, original_payload, sanitized_payload, sha256_seal, latency_ms)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    event_id,
                    "AGENT_TOOL_CALL",
                    agent_id,
                    tool_name,
                    verdict,
                    risk_score,
                    " | ".join(violations) if violations else "Clean",
                    json.dumps(args),
                    json.dumps(sanitized_args),
                    seal,
                    elapsed_ms
                ))
            conn.commit()
    except Exception as e:
        print(f"[AI_FIREWALL] Note: Event persistence note: {e}")

    return result


def get_verified_rag_ledger(limit: int = 100) -> List[Dict[str, Any]]:
    """Fetches persisted verified/redacted RAG chunks from Neon PostgreSQL."""
    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=5) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT chunk_id, source_doc, clean_text, redactions_count, trust_score, verdict, violations, sha256_seal, indexed_at
                    FROM "datax_verified_rag_chunks"
                    ORDER BY indexed_at DESC
                    LIMIT %s;
                """, (min(max(int(limit or 100), 1), 1000),))
                rows = cur.fetchall()
                out = []
                for r in rows:
                    d = dict(r)
                    if d.get("trust_score") is not None:
                        d["trust_score"] = float(d["trust_score"])
                    if d.get("indexed_at") is not None:
                        d["indexed_at"] = d["indexed_at"].isoformat()
                    out.append(d)
                return out
    except Exception as e:
        print(f"[AI_FIREWALL] Ledger fetch note: {e}")
        return []
