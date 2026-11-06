import os
import sys
import json
import uuid
import time
import copy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.getcwd())

# Set test environment variables
os.environ["DATAX_JWT_SECRET"] = "phase5-test-secret-key-for-tenant-isolation-32chars"
os.environ["DATAX_STORAGE_MODE"] = "POSTGRES"

# Import target engines
import auth_engine
import vault
import service
import privacy_gateway_engine
import siem_engine

def run_suite():
    print("=====================================================================")
    print("   DATAX PHASE 5 SAAS SUITE: MULTI-TENANCY, SETTINGS, BYOK TESTS     ")
    print("=====================================================================")
    passed = 0
    total = 0

    # -------------------------------------------------------------------------
    # TEST 1: Tenant ID Slug Generation on Registration
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 1] Registering users with corporate and generic domains...")
    # Admin / Demo accounts map to tenant_enterprise
    test_email_admin = f"admin_{uuid.uuid4().hex[:6]}@dataglow.ai"
    res_admin = auth_engine.register_user(test_email_admin, "Pass123456!", "Platform Admin")
    # Sequoia capital evaluator
    test_email_1 = f"evaluator_{uuid.uuid4().hex[:6]}@sequoiacap.com"
    res_seq = auth_engine.register_user(test_email_1, "Pass123456!", "Partner Sequoia")
    # Health corp evaluator
    test_email_2 = f"dr_smith_{uuid.uuid4().hex[:6]}@healthcorp.org"
    res_health = auth_engine.register_user(test_email_2, "Pass123456!", "Dr Smith")
    # Generic gmail evaluator
    test_email_3 = f"evaluator_{uuid.uuid4().hex[:6]}@gmail.com"
    res_gmail = auth_engine.register_user(test_email_3, "Pass123456!", "Solo Tester")

    print(f"  Admin Tenant: {res_admin.get('data', {}).get('user', {}).get('tenantId')}")
    print(f"  Sequoia Tenant: {res_seq.get('data', {}).get('user', {}).get('tenantId')}")
    print(f"  HealthCorp Tenant: {res_health.get('data', {}).get('user', {}).get('tenantId')}")
    print(f"  Gmail Tenant: {res_gmail.get('data', {}).get('user', {}).get('tenantId')}")

    tid_admin = res_admin.get('data', {}).get('user', {}).get('tenantId')
    tid_seq = res_seq.get('data', {}).get('user', {}).get('tenantId')
    tid_health = res_health.get('data', {}).get('user', {}).get('tenantId')
    tid_gmail = res_gmail.get('data', {}).get('user', {}).get('tenantId')

    assert tid_admin == "tenant_enterprise", f"Expected tenant_enterprise, got {tid_admin}"

    assert tid_seq == "tenant_sequoiacap_com", f"Expected tenant_sequoiacap_com, got {tid_seq}"
    assert tid_health == "tenant_healthcorp_org", f"Expected tenant_healthcorp_org, got {tid_health}"
    assert tid_gmail.startswith("tenant_evaluator_"), f"Expected tenant_evaluator_..., got {tid_gmail}"
    assert tid_seq != tid_health, "Tenants must have different IDs"
    print("  --> PASS: Tenant slugs generated accurately and isolated.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 2: Multi-Tenant Thread Workspace Isolation & Auto-Seeding
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 2] Verifying workspace thread auto-seeding & isolation...")
    threads_a = vault.load_threads(tid_seq)
    threads_b = vault.load_threads(tid_health)

    assert len(threads_a) == len(vault.DEFAULT_THREADS), f"Tenant A should have {len(vault.DEFAULT_THREADS)} seeded threads"
    assert len(threads_b) == len(vault.DEFAULT_THREADS), f"Tenant B should have {len(vault.DEFAULT_THREADS)} seeded threads"

    # Modify a thread in Tenant A
    threads_a[0]["name"] = "CUSTOM SEQUOIA PRIVATE WORKFLOW"
    vault.save_threads(threads_a, tid_seq)

    # Re-read Tenant A and Tenant B
    reloaded_a = vault.load_threads(tid_seq)
    reloaded_b = vault.load_threads(tid_health)

    assert reloaded_a[0]["name"] == "CUSTOM SEQUOIA PRIVATE WORKFLOW", "Tenant A should persist custom modification"
    assert reloaded_b[0]["name"] != "CUSTOM SEQUOIA PRIVATE WORKFLOW", "Tenant B must NEVER see Tenant A's modifications"
    print(f"  Tenant A Thread 0: {reloaded_a[0]['name']}")
    print(f"  Tenant B Thread 0: {reloaded_b[0]['name']}")
    print("  --> PASS: Strict thread data isolation verified.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 3: Settings Persistence & RBAC Member Management
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 3] Testing tenant settings get, save, invite, and api key rotation...")
    # Get initial settings
    init_settings = service.get_tenant_settings(tid_seq)
    assert init_settings["tenant_id"] == tid_seq

    # Save custom settings
    service.save_tenant_settings(tid_seq, {
        "company_name": "Sequoia Capital Tech Hub",
        "cron_expression": "0 */4 * * *",
        "email_alerts": "partner@sequoiacap.com"
    })
    updated_settings = service.get_tenant_settings(tid_seq)
    assert updated_settings["company_name"] == "Sequoia Capital Tech Hub"
    assert updated_settings["cron_expression"] == "0 */4 * * *"
    assert updated_settings["email_alerts"] == "partner@sequoiacap.com"

    # Healthcorp should still have default/separate settings
    health_settings = service.get_tenant_settings(tid_health)
    assert health_settings["company_name"] != "Sequoia Capital Tech Hub", "Settings must be tenant isolated"

    # Invite team member
    member_email = "associate@sequoiacap.com"
    members = list(updated_settings.get("team_members", []))
    new_mem = {
        "id": f"usr_test_{uuid.uuid4().hex[:6]}",
        "name": "Associate Sequoia",
        "email": member_email,
        "role": "Data Steward",
        "status": "Active"
    }
    members.append(new_mem)
    service.save_tenant_settings(tid_seq, {"team_members": members})

    reloaded_mem = service.get_tenant_settings(tid_seq)
    assert any(m["email"] == member_email for m in reloaded_mem.get("team_members", [])), "New team member must persist"

    # Rotate API key
    new_key = f"dx_live_{uuid.uuid4().hex[:28]}"
    service.save_tenant_settings(tid_seq, {"api_key": new_key})
    reloaded_key = service.get_tenant_settings(tid_seq)
    assert reloaded_key["api_key"] == new_key, "Rotated key must persist"

    print(f"  Persisted Company Name: {reloaded_key['company_name']}")
    print(f"  Team Count: {len(reloaded_key['team_members'])}")
    print(f"  Active API Key: {reloaded_key['api_key']}")
    print("  --> PASS: Settings persistence and tenant isolation verified.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 4: Privacy Gateway BYOK Support & Zero-Egress Fallback
    # -------------------------------------------------------------------------
    total += 1
    print("\n[TEST 4] Testing Privacy Gateway BYOK passthrough & tokenization...")
    sample_prompt = "Patient John Doe (SSN 123-45-6789, email john.doe@example.com) requests billing review."

    # Sub-test 4A: Without BYOK key (Zero-Egress Simulator Mode)
    req_sim = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": sample_prompt}],
        "stream": False
    }
    res_sim, audit_sim = privacy_gateway_engine.execute_privacy_gateway_chat(
        req_sim,
        session_id="test_sess_01",
        tenant_id=tid_seq
    )
    assert res_sim["choices"][0]["message"]["content"] is not None
    assert res_sim["datax_privacy_guard"]["execution_mode"] == "ZERO_EGRESS_SANDBOX"
    print(f"  Zero-Egress Mode Response: {res_sim['datax_privacy_guard']['execution_mode']}")
    print(f"  Entities Scrubbed: {res_sim['datax_privacy_guard']['entities_scrubbed']}")

    # Sub-test 4B: With BYOK key (simulated live key parameter)
    req_byok = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": sample_prompt}],
        "stream": False,
        "upstream_api_key": "sk-proj-simulated-live-evaluator-key-00000000"
    }
    res_byok, audit_byok = privacy_gateway_engine.execute_privacy_gateway_chat(
        req_byok,
        session_id="test_sess_02",
        upstream_api_key="sk-proj-simulated-live-evaluator-key-00000000",
        tenant_id=tid_seq
    )
    # The gateway attempts real dispatch or falls back gracefully to sandbox if key is simulated/unreachable
    print(f"  BYOK Provider: {res_byok['datax_privacy_guard']['provider']}")
    print(f"  BYOK Execution Mode: {res_byok['datax_privacy_guard']['execution_mode']}")
    
    # Crucial security verification: Ensure BYOK key is NEVER written to audit event or leaked
    audit_str = json.dumps(audit_byok)
    assert "sk-proj-simulated-live-evaluator-key-00000000" not in audit_str, "CRITICAL: BYOK key must NEVER leak to audit ledger!"
    assert audit_byok["tenantId"] == tid_seq, "Audit event must record correct tenant ID"

    # Sub-test 4C: Verify detokenization re-hydrates in caller response
    content = res_sim["choices"][0]["message"]["content"]
    assert "<SSN_1>" not in content, "Caller response must detokenize placeholders before returning"
    print("  Detokenization Verified: No un-rehydrated placeholders in output.")
    print("  --> PASS: BYOK passthrough & zero-retention security verified.")
    passed += 1

    print("\n=====================================================================")
    print(f"   ALL PHASE 5 TESTS PASSED: {passed}/{total} (100% SUCCESS)         ")
    print("=====================================================================")

if __name__ == "__main__":
    run_suite()
