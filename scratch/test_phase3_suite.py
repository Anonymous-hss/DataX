"""
Phase 3 Unit & Integration Test Suite for DataX Zero-Egress Platform
(Tasks 30, 32, 36)
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATAX_JWT_SECRET"] = "phase3-test-jwt-secret-key-32-chars-long"

from siem_engine import (
    calculate_chain_hash,
    verify_audit_chain_integrity,
    get_siem_config,
    save_siem_config,
    test_siem_dispatch,
    GENESIS_HASH
)
from license_engine import (
    generate_signed_license,
    verify_signed_license,
    get_active_license_status,
)
from gateway_benchmark import (
    run_gateway_load_benchmark
)


def test_siem_hash_chain():
    print("Testing Cryptographic SIEM Hash Chain (Task 32)...")
    # 1. Chain block calculation
    h1 = calculate_chain_hash(GENESIS_HASH, "req_1", "2026-11-06T11:00:00Z", "raw_hash_1", "san_hash_1", "PASSED")
    assert len(h1) == 64, f"Invalid SHA-256 length: {len(h1)}"
    
    # 2. Next block links to h1
    h2 = calculate_chain_hash(h1, "req_2", "2026-11-06T11:01:00Z", "raw_hash_2", "san_hash_2", "SANITIZED")
    assert h2 != h1
    
    # 3. Tampering attempt detection: if raw_hash_1 changes, h1 changes and breaks h2 link
    h1_tampered = calculate_chain_hash(GENESIS_HASH, "req_1", "2026-11-06T11:00:00Z", "ALTERED_HASH", "san_hash_1", "PASSED")
    assert h1_tampered != h1, "Tampered block must yield different hash!"

    # 4. SIEM config and test dispatch
    cfg = get_siem_config()
    assert "target_type" in cfg
    test_res = test_siem_dispatch()
    assert test_res.get("status") in ("success", "error")

    print("  PASS: Cryptographic hash chain calculation and tampering sensitivity verified.")


def test_offline_license_engine():
    print("Testing Air-Gapped Offline Signed License Engine (Task 30)...")
    # 1. Generate valid signed token
    token = generate_signed_license(
        customer_name="Hospital HealthCorp US",
        allowed_cores=64,
        allowed_seats=500,
        days_valid=180
    )
    assert token.startswith("DATAX-LIC-")
    
    # 2. Verify token offline
    is_valid, payload, msg = verify_signed_license(token)
    assert is_valid is True, f"Valid license rejected: {msg}"
    assert payload["customer_name"] == "Hospital HealthCorp US"
    assert payload["allowed_cores"] == 64
    assert payload["offline_airgap_permitted"] is True

    # 3. Tampered token detection (alter 1 character of signature)
    tampered_token = token[:-1] + ("0" if token[-1] != "0" else "1")
    is_valid_t, _, msg_t = verify_signed_license(tampered_token)
    assert is_valid_t is False, "Tampered license was incorrectly accepted!"
    assert "signature mismatch" in msg_t.lower()

    # 4. Expired token check
    expired_token = generate_signed_license(days_valid=-10)
    is_valid_exp, _, msg_exp = verify_signed_license(expired_token)
    assert is_valid_exp is False, "Expired license was incorrectly accepted!"
    assert "expired" in msg_exp.lower()

    # 5. Default evaluation license status
    status = get_active_license_status()
    assert status.get("status") in ("ACTIVE", "EXPIRED")
    assert status.get("offline_airgap_permitted") is True

    print("  PASS: Cryptographic offline license generation, verification, and tamper detection verified.")


def test_concurrency_load_benchmark():
    print("Testing Concurrency Load Benchmark (Task 36)...")
    res = run_gateway_load_benchmark(rounds=24, concurrency=4)
    assert res.get("status") == "success"
    assert res.get("benchmark_rounds") == 24
    assert res.get("throughput_requests_per_sec") > 0
    lats = res.get("latency_percentiles_ms", {})
    assert lats.get("p50", 0) > 0
    assert lats.get("p95", 0) > 0
    assert res.get("zero_cloud_egress_verified") is True
    print(f"  PASS: Benchmark ran {res['benchmark_rounds']} rounds at {res['throughput_requests_per_sec']} req/s with p95: {lats['p95']}ms.")


def test_fastapi_phase3_endpoints():
    print("Testing FastAPI Phase 3 Endpoints via TestClient...")
    from fastapi.testclient import TestClient
    from service import app

    client = TestClient(app)

    # 1. SIEM Config
    r_cfg = client.get("/siem/config")
    assert r_cfg.status_code == 200
    assert "config" in r_cfg.json()

    # 2. SIEM Test Dispatch
    r_disp = client.post("/siem/test-dispatch", json={})
    assert r_disp.status_code == 200

    # 3. SIEM Ledger Integrity Verification
    r_ledger = client.get("/siem/verify-ledger")
    assert r_ledger.status_code == 200
    assert "chain_intact" in r_ledger.json()

    # 4. License Status
    r_lic = client.get("/license/status")
    assert r_lic.status_code == 200
    assert r_lic.json().get("status") in ("ACTIVE", "EXPIRED")

    # 5. Gateway Benchmark Run
    r_bench = client.post("/gateway/benchmark/run", json={"rounds": 12, "concurrency": 2})
    assert r_bench.status_code == 200
    assert r_bench.json().get("throughput_requests_per_sec") > 0

    print("  PASS: All Phase 3 FastAPI endpoints returned HTTP 200 successfully.")


if __name__ == "__main__":
    print("\n================ DATAX PHASE 3 TEST RUNNER ================\n")
    test_siem_hash_chain()
    test_offline_license_engine()
    test_concurrency_load_benchmark()
    test_fastapi_phase3_endpoints()
    print("\n================ ALL PHASE 3 TESTS PASSED =================\n")
