"""Shared JWT signing key configuration for token issuers and verifiers."""

import os


def _load_jwt_secret() -> str:
    """Load the shared signing key, accepting legacy variable names."""
    for name in ("DATAX_JWT_SECRET", "JWT_SECRET", "JWT_SECRET_KEY"):
        value = os.environ.get(name)
        if value and value.strip():
            return value

    raise RuntimeError(
        "JWT signing key is not configured. Set DATAX_JWT_SECRET in the server environment."
    )


JWT_SECRET = _load_jwt_secret()
