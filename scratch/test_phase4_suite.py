"""
Phase 4 Unit & Integration Test Suite for DataX Zero-Egress Platform
(Tasks 14, 29, 31, 33)
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATAX_JWT_SECRET"] = "phase4-test-jwt-secret-key-32-chars-long"

from vault_connector import (
    get_vault_health_status,
    get_secret,
    VAULT_PROVIDER_ENV,
)
from rbac_engine import (
    get_sso_config,
    save_sso_config,
    get_role_permissions,
    has_permission,
    map_idp_claims_to_role,
    CANONICAL_ROLES,
    ROLE_ADMIN,
    ROLE_DATA_STEWARD,
    ROLE_SECURITY_AUDITOR,
    PERM_PIPELINE_RUN,
    PERM_SIEM_CONFIG,
    PERM_AUDIT_VERIFY,
)
from egress_block_test import (
    run_egress_block_audit,
)


def test_vault_connector():
    print("Testing Customer-Managed Vault Connector (Task 14)...")
    os.environ["DATAX_POSTGRES_PASSWORD"] = "vault_secret_postgres_pass"
    os.environ["OPENAI_API_KEY"] = "sk-test-secret-key-12345"

    sec = get_secret("DATAX_POSTGRES_PASSWORD")
    assert sec == "vault_secret_postgres_pass"

    status = get_vault_health_status()
    assert status.get("status") == "healthy"
    assert status.get("zero_cloud_leak_verified") is True
    assert status.get("total_secrets_resolved") >= 2
    print(f"  PASS: Vault provider '{status.get('provider')}' resolved {status.get('total_secrets_resolved')} secrets with zero egress.")


def test_rbac_sso_engine():
    print("Testing Role-Based Access Control & SSO IdP Mapping (Task 33)...")
    # 1. Canonical roles verification
    assert len(CANONICAL_ROLES) == 3
    assert ROLE_ADMIN in CANONICAL_ROLES
    assert ROLE_DATA_STEWARD in CANONICAL_ROLES
    assert ROLE_SECURITY_AUDITOR in CANONICAL_ROLES

    # 2. Granular Permissions verification
    assert has_permission(ROLE_ADMIN, PERM_SIEM_CONFIG) is True
    assert has_permission(ROLE_DATA_STEWARD, PERM_SIEM_CONFIG) is False
    assert has_permission(ROLE_SECURITY_AUDITOR, PERM_PIPELINE_RUN) is False
    assert has_permission(ROLE_SECURITY_AUDITOR, PERM_AUDIT_VERIFY) is True

    # 3. IdP Claim Group Mapping
    sso_cfg = {
        "role_claim_name": "roles",
        "role_mapping": {
            "DataX-Global-Admins": ROLE_ADMIN,
            "Data-Governance-Team": ROLE_DATA_STEWARD,
            "Compliance-Auditors": ROLE_SECURITY_AUDITOR
        }
    }
    role1 = map_idp_claims_to_role({"roles": ["DataX-Global-Admins"]}, sso_cfg)
    assert role1 == ROLE_ADMIN, f"Expected Admin, got {role1}"

    role2 = map_idp_claims_to_role({"roles": ["Data-Governance-Team"]}, sso_cfg)
    assert role2 == ROLE_DATA_STEWARD, f"Expected Data Steward, got {role2}"

    role3 = map_idp_claims_to_role({"roles": ["Unknown-Group"]}, sso_cfg)
    assert role3 == ROLE_SECURITY_AUDITOR, "Unknown groups must default to least-privilege Security Auditor!"

    # 4. Save and Get SSO Config
    save_res = save_sso_config({
        "provider": "OKTA",
        "client_id": "okta-test-client-id",
        "client_secret": "test-secret-123",
        "enabled": True
    })
    assert save_res.get("status") == "success"

    cfg = get_sso_config()
    assert cfg.get("provider") == "OKTA"
    assert cfg.get("client_secret") == "••••••••"
    print("  PASS: Canonical roles, permissions matrix, and IdP claim mapping verified.")


def test_egress_block_audit():
    print("Testing Automated Network Egress-Block Barrier Audit (Task 31)...")
    res = run_egress_block_audit()
    assert res.get("status") == "PASSED", f"Egress audit failed: {res}"
    assert res.get("airgap_certified") is True
    assert res.get("tests_passed") == 6
    assert res.get("tests_total") == 6
    print(f"  PASS: Air-Gap certified. {res.get('tests_passed')}/{res.get('tests_total')} tests passed with 0 external bytes leaked.")


def test_fastapi_phase4_endpoints():
    print("Testing FastAPI Phase 4 Endpoints via TestClient...")
    from fastapi.testclient import TestClient
    from service import app

    client = TestClient(app)

    # 1. Vault Status
    r_vault = client.get("/vault/status")
    assert r_vault.status_code == 200
    assert r_vault.json().get("zero_cloud_leak_verified") is True

    # 2. SSO Config
    r_sso = client.get("/sso/config")
    assert r_sso.status_code == 200
    assert "config" in r_sso.json()

    # 3. SSO Roles
    r_roles = client.get("/sso/roles")
    assert r_roles.status_code == 200
    assert len(r_roles.json().get("roles", [])) == 3

    # 4. SSO Simulate Login
    r_login = client.post("/sso/simulate-login", json={
        "email": "compliance.auditor@hospital.internal",
        "claims": {"roles": ["Compliance-Auditors"]}
    })
    assert r_login.status_code == 200
    assert "token" in r_login.json()
    assert r_login.json().get("role") == ROLE_SECURITY_AUDITOR

    # 5. Security Egress Barrier Audit
    r_egress = client.post("/security/egress-test/run")
    assert r_egress.status_code == 200
    assert r_egress.json().get("airgap_certified") is True

    print("  PASS: All Phase 4 FastAPI endpoints returned HTTP 200 successfully.")


if __name__ == "__main__":
    print("\n================ DATAX PHASE 4 TEST RUNNER ================\n")
    test_vault_connector()
    test_rbac_sso_engine()
    test_egress_block_audit()
    test_fastapi_phase4_endpoints()
    print("\n================ ALL PHASE 4 TESTS PASSED =================\n")
