"""Shared JWT signing key configuration for token issuers and verifiers."""

import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


def _load_jwt_secret() -> str:
    """Load the shared signing key, accepting legacy variable names."""
    for name in ("DATAX_JWT_SECRET", "JWT_SECRET", "JWT_SECRET_KEY"):
        value = os.environ.get(name)
        if value and value.strip():
            return value

    return "datax-default-secret-key-32-chars-minimum-prod-grade"


JWT_SECRET = _load_jwt_secret()
