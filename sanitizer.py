"""
DataX Injection Defense & Automated PII Masking Engine (SEC-04 & SEC-05)
Hardens against SQL/AST injection and sanitizes PII/HIPAA data in telemetry logs.
"""

import re
from typing import Any, Dict, List, Union

# SEC-04: Dangerous SQL / DDL / AST injection tokens disallowed in user prompts and rules
DANGEROUS_SQL_PATTERNS = [
    re.compile(r'\b(DROP\s+TABLE|DROP\s+DATABASE|DROP\s+SCHEMA)\b', re.IGNORECASE),
    re.compile(r'\b(TRUNCATE\s+TABLE|TRUNCATE)\b', re.IGNORECASE),
    re.compile(r'\b(ALTER\s+TABLE|ALTER\s+USER|ALTER\s+SYSTEM)\b', re.IGNORECASE),
    re.compile(r'\b(GRANT\s+ALL|REVOKE\s+ALL)\b', re.IGNORECASE),
    re.compile(r'\b(EXEC\s+|EXECUTE\s+|XP_CMDSHELL)\b', re.IGNORECASE),
    re.compile(r'\b(ATTACH\s+DATABASE|COPY\s+.*TO)\b', re.IGNORECASE),
    re.compile(r'(--|/\*|\*/|;\s*$)', re.IGNORECASE),
]

# SEC-05: Regex patterns for PII and sensitive data masking
SSN_REGEX = re.compile(r'\b(\d{3})-(\d{2})-(\d{4})\b')
CREDIT_CARD_REGEX = re.compile(r'\b(?:\d{4}[-\s]?){3}(\d{4})\b')
PHONE_REGEX = re.compile(r'\b(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b')
EMAIL_REGEX = re.compile(r'\b([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b')
HIPAA_MRN_REGEX = re.compile(r'\b(MRN|PATIENT|PAT)[-_]?(\d{4,10})\b', re.IGNORECASE)


def sanitize_prompt_and_rules(input_text: str) -> str:
    """
    SEC-04: Inspects user prompts and expressions for DDL injection and dangerous clauses.
    Raises ValueError if malicious injection attempts are detected.
    """
    if not input_text or not isinstance(input_text, str):
        return input_text or ""

    trimmed = input_text.strip()
    for pattern in DANGEROUS_SQL_PATTERNS:
        match = pattern.search(trimmed)
        if match:
            raise ValueError(
                f"Security Violation: Query or prompt contains disallowed DDL/injection token '{match.group(0)}'. "
                "DataX prohibits raw schema mutation statements."
            )

    return trimmed


def mask_sensitive_pii_string(text: str) -> str:
    """
    SEC-05: Masks SSN, Credit Cards, Phone numbers, Emails, and HIPAA identifiers in a string.
    """
    if not isinstance(text, str):
        return text

    # Mask SSN: 123-45-6789 -> ***-**-6789
    masked = SSN_REGEX.sub(r'***-**-\3', text)

    # Mask Credit Card: 4111-2222-3333-4444 -> ****-****-****-4444
    masked = CREDIT_CARD_REGEX.sub(r'****-****-****-\1', masked)

    # Mask Phone: 555-123-4567 or (555) 123-4567 -> ***-***-4567
    masked = PHONE_REGEX.sub(r'***-***-\3', masked)

    # Mask Email: john.doe@example.com -> j***@example.com
    masked = EMAIL_REGEX.sub(r'\1***@\2', masked)

    # Mask HIPAA Patient / MRN identifiers
    masked = HIPAA_MRN_REGEX.sub(r'\1-****', masked)

    return masked


def mask_telemetry_payload(data: Any) -> Any:
    """
    SEC-05: Recursively traverses dictionaries, lists, and strings to mask sensitive PII.
    Used before persisting audit logs, telemetry, and DLQ records.
    """
    if isinstance(data, str):
        return mask_sensitive_pii_string(data)
    elif isinstance(data, dict):
        sanitized_dict = {}
        for k, v in data.items():
            lower_k = k.lower()
            # If the key itself is explicitly sensitive (password, secret, ssn, pin), mask completely
            if any(s in lower_k for s in ["password", "secret", "token", "ssn", "cvv", "api_key"]):
                sanitized_dict[k] = "********"
            else:
                sanitized_dict[k] = mask_telemetry_payload(v)
        return sanitized_dict
    elif isinstance(data, list):
        return [mask_telemetry_payload(item) for item in data]
    else:
        return data
