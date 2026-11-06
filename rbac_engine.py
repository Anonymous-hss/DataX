"""
DataX Role-Based Access Control (RBAC) & Enterprise OIDC/SAML SSO Engine (Task 33)
Provides:
1. Canonical Enterprise Roles: Admin, Data Steward, Security Auditor
2. Granular Permissions Matrix
3. Enterprise Identity Provider (IdP) Claim Mapping (Okta, Azure AD, Keycloak)
4. Offline Durability with PostgreSQL persistence
"""

import os
import json
import time
import logging
from typing import Dict, Any, List, Optional

from db_config import get_storage_connection

logger = logging.getLogger("DataX.RBACEngine")

# Canonical Roles
ROLE_ADMIN = "Admin"
ROLE_DATA_STEWARD = "Data Steward"
ROLE_SECURITY_AUDITOR = "Security Auditor"

CANONICAL_ROLES = [ROLE_ADMIN, ROLE_DATA_STEWARD, ROLE_SECURITY_AUDITOR]

# Permissions
PERM_PIPELINE_VIEW = "pipeline:view"
PERM_PIPELINE_EDIT = "pipeline:edit"
PERM_PIPELINE_RUN = "pipeline:run"
PERM_CANVAS_VIEW = "canvas:view"
PERM_CANVAS_EDIT = "canvas:edit"
PERM_CANVAS_RUN = "canvas:run"
PERM_AUDIT_VIEW = "audit:view"
PERM_AUDIT_VERIFY = "audit:verify"
PERM_SIEM_CONFIG = "siem:config"
PERM_LICENSE_MANAGE = "license:manage"
PERM_RBAC_MANAGE = "rbac:manage"
PERM_SECRETS_MANAGE = "secrets:manage"

# Role -> Permission Mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    ROLE_ADMIN: [
        PERM_PIPELINE_VIEW, PERM_PIPELINE_EDIT, PERM_PIPELINE_RUN,
        PERM_CANVAS_VIEW, PERM_CANVAS_EDIT, PERM_CANVAS_RUN,
        PERM_AUDIT_VIEW, PERM_AUDIT_VERIFY,
        PERM_SIEM_CONFIG, PERM_LICENSE_MANAGE,
        PERM_RBAC_MANAGE, PERM_SECRETS_MANAGE
    ],
    ROLE_DATA_STEWARD: [
        PERM_PIPELINE_VIEW, PERM_PIPELINE_EDIT, PERM_PIPELINE_RUN,
        PERM_CANVAS_VIEW, PERM_CANVAS_EDIT, PERM_CANVAS_RUN,
        PERM_AUDIT_VIEW
    ],
    ROLE_SECURITY_AUDITOR: [
        PERM_PIPELINE_VIEW,
        PERM_CANVAS_VIEW,
        PERM_AUDIT_VIEW, PERM_AUDIT_VERIFY
    ]
}

# In-Memory Fallback Store when Postgres is not running or offline
_MEMORY_SSO_CONFIG: Dict[str, Any] = {
    "provider": "AZURE_AD",
    "client_id": "00000000-datax-azure-client-id",
    "issuer_url": "https://login.microsoftonline.com/tenant-id/v2.0",
    "jwks_uri": "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
    "redirect_uri": "https://dataglow.ai/datax/sso/callback",
    "role_claim_name": "roles",
    "role_mapping": {
        "DataX-Global-Admins": ROLE_ADMIN,
        "Data-Governance-Team": ROLE_DATA_STEWARD,
        "InfoSec-Compliance-Auditors": ROLE_SECURITY_AUDITOR
    },
    "enabled": True,
    "enforce_sso_only": False,
    "has_client_secret": True
}


def get_role_permissions(role: str) -> List[str]:
    """Returns permission list for given role."""
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS[ROLE_SECURITY_AUDITOR])


def has_permission(role: str, permission: str) -> bool:
    """Checks whether a role possesses a specific permission."""
    perms = get_role_permissions(role)
    return permission in perms


def map_idp_claims_to_role(claims: Dict[str, Any], sso_cfg: Optional[Dict[str, Any]] = None) -> str:
    """
    Extracts group/role claims from IdP token and maps to DataX canonical role.
    Defaults to Security Auditor if no elevated group matches.
    """
    if sso_cfg is None:
        sso_cfg = get_sso_config()

    role_claim_name = sso_cfg.get("role_claim_name", "roles")
    role_mapping = sso_cfg.get("role_mapping", {})

    extracted_groups = claims.get(role_claim_name) or claims.get("groups") or claims.get("roles") or []
    if isinstance(extracted_groups, str):
        extracted_groups = [extracted_groups]

    # Find highest matching role
    matched_role = ROLE_SECURITY_AUDITOR
    for g in extracted_groups:
        mapped = role_mapping.get(g)
        if mapped == ROLE_ADMIN:
            return ROLE_ADMIN  # Admin is highest priority
        elif mapped == ROLE_DATA_STEWARD and matched_role != ROLE_ADMIN:
            matched_role = ROLE_DATA_STEWARD

    return matched_role


def get_sso_config() -> Dict[str, Any]:
    """Retrieves enterprise SSO configuration."""
    global _MEMORY_SSO_CONFIG
    try:
        conn = get_storage_connection(connect_timeout=2, autocommit=True)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT provider, client_id, issuer_url, jwks_uri, redirect_uri,
                       role_claim_name, role_mapping_json, enabled, enforce_sso_only,
                       client_secret
                FROM "datax_sso_config"
                LIMIT 1;
            """)
            row = cur.fetchone()
            if row:
                conn.close()
                mapping = json.loads(row[6]) if isinstance(row[6], str) else (row[6] or {})
                return {
                    "provider": row[0] or "AZURE_AD",
                    "client_id": row[1] or "",
                    "issuer_url": row[2] or "",
                    "jwks_uri": row[3] or "",
                    "redirect_uri": row[4] or "",
                    "role_claim_name": row[5] or "roles",
                    "role_mapping": mapping,
                    "enabled": bool(row[7]),
                    "enforce_sso_only": bool(row[8]),
                    "has_client_secret": bool(row[9]),
                    "client_secret": "••••••••" if row[9] else ""
                }
        conn.close()
    except Exception:
        pass
    return _MEMORY_SSO_CONFIG


def save_sso_config(cfg: Dict[str, Any]) -> Dict[str, Any]:
    """Persists enterprise SSO configuration."""
    global _MEMORY_SSO_CONFIG
    provider = cfg.get("provider", "AZURE_AD")
    client_id = cfg.get("client_id", "")
    issuer_url = cfg.get("issuer_url", "")
    jwks_uri = cfg.get("jwks_uri", "")
    redirect_uri = cfg.get("redirect_uri", "")
    role_claim_name = cfg.get("role_claim_name", "roles")
    role_mapping = cfg.get("role_mapping", {})
    enabled = bool(cfg.get("enabled", True))
    enforce_sso_only = bool(cfg.get("enforce_sso_only", False))
    client_secret = cfg.get("client_secret", "")

    # Update memory cache
    has_sec = bool(client_secret and "•" not in client_secret) or _MEMORY_SSO_CONFIG.get("has_client_secret", False)
    _MEMORY_SSO_CONFIG = {
        "provider": provider,
        "client_id": client_id,
        "issuer_url": issuer_url,
        "jwks_uri": jwks_uri,
        "redirect_uri": redirect_uri,
        "role_claim_name": role_claim_name,
        "role_mapping": role_mapping,
        "enabled": enabled,
        "enforce_sso_only": enforce_sso_only,
        "has_client_secret": has_sec,
        "client_secret": "••••••••" if has_sec else ""
    }

    try:
        conn = get_storage_connection(connect_timeout=3, autocommit=True)
        with conn.cursor() as cur:
            mapping_str = json.dumps(role_mapping)
            if client_secret and "•" not in client_secret:
                cur.execute("""
                    INSERT INTO "datax_sso_config" (
                        config_id, provider, client_id, client_secret, issuer_url,
                        jwks_uri, redirect_uri, role_claim_name, role_mapping_json,
                        enabled, enforce_sso_only, updated_at
                    ) VALUES (
                        'sso_default', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
                    ) ON CONFLICT (config_id) DO UPDATE SET
                        provider = EXCLUDED.provider,
                        client_id = EXCLUDED.client_id,
                        client_secret = EXCLUDED.client_secret,
                        issuer_url = EXCLUDED.issuer_url,
                        jwks_uri = EXCLUDED.jwks_uri,
                        redirect_uri = EXCLUDED.redirect_uri,
                        role_claim_name = EXCLUDED.role_claim_name,
                        role_mapping_json = EXCLUDED.role_mapping_json,
                        enabled = EXCLUDED.enabled,
                        enforce_sso_only = EXCLUDED.enforce_sso_only,
                        updated_at = CURRENT_TIMESTAMP;
                """, (provider, client_id, client_secret, issuer_url, jwks_uri, redirect_uri, role_claim_name, mapping_str, enabled, enforce_sso_only))
            else:
                cur.execute("""
                    INSERT INTO "datax_sso_config" (
                        config_id, provider, client_id, issuer_url,
                        jwks_uri, redirect_uri, role_claim_name, role_mapping_json,
                        enabled, enforce_sso_only, updated_at
                    ) VALUES (
                        'sso_default', %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
                    ) ON CONFLICT (config_id) DO UPDATE SET
                        provider = EXCLUDED.provider,
                        client_id = EXCLUDED.client_id,
                        issuer_url = EXCLUDED.issuer_url,
                        jwks_uri = EXCLUDED.jwks_uri,
                        redirect_uri = EXCLUDED.redirect_uri,
                        role_claim_name = EXCLUDED.role_claim_name,
                        role_mapping_json = EXCLUDED.role_mapping_json,
                        enabled = EXCLUDED.enabled,
                        enforce_sso_only = EXCLUDED.enforce_sso_only,
                        updated_at = CURRENT_TIMESTAMP;
                """, (provider, client_id, issuer_url, jwks_uri, redirect_uri, role_claim_name, mapping_str, enabled, enforce_sso_only))
        conn.close()
    except Exception as e:
        logger.warning(f"Could not persist SSO config to DB (using memory fallback): {e}")

    return {"status": "success", "message": "SSO configuration saved successfully.", "config": _MEMORY_SSO_CONFIG}
