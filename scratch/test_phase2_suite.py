"""
Phase 2 Unit & Integration Test Suite for DataX Zero-Egress Platform
(Tasks 3, 22, 27, 28)
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATAX_JWT_SECRET"] = "phase2-test-jwt-secret-key-32-chars-long"

from privacy_gateway_engine import (
    TokenVault,
    is_valid_luhn,
    generate_synthetic_luhn_card,
    generate_synthetic_ssn,
    generate_synthetic_email,
    generate_synthetic_phone,
    should_route_to_local_llm,
    probe_local_llm_models,
    anonymize_text,
    execute_privacy_gateway_chat,
    execute_anthropic_messages_chat,
)


def test_format_preserving_generators():
    print("Testing Format-Preserving Encryption Generators (Task 28)...")
    # 1. Synthetic Visa Card
    real_visa = "4111111111111111"
    synth_visa = generate_synthetic_luhn_card(real_visa, "seed_123")
    assert synth_visa.startswith("4"), f"Expected Visa prefix 4, got {synth_visa}"
    assert len(synth_visa) == len(real_visa), f"Length mismatch: {synth_visa}"
    assert is_valid_luhn(synth_visa) is True, f"Synthetic Visa failed Luhn check! {synth_visa}"
    assert synth_visa != real_visa, "Synthetic must not equal real card!"

    # 2. Synthetic Mastercard
    real_mc = "5100000000000000"
    synth_mc = generate_synthetic_luhn_card(real_mc, "seed_123")
    assert synth_mc.startswith("5"), f"Expected Mastercard prefix 5, got {synth_mc}"
    assert is_valid_luhn(synth_mc) is True, f"Synthetic Mastercard failed Luhn check! {synth_mc}"

    # 3. Synthetic SSN
    real_ssn = "123-45-6789"
    synth_ssn = generate_synthetic_ssn(real_ssn, "seed_123")
    assert synth_ssn.startswith("900-"), f"Expected SSA unissued 900-series SSN, got {synth_ssn}"
    assert len(synth_ssn) == 11, f"SSN length mismatch: {synth_ssn}"

    # 4. Synthetic Phone
    real_phone = "+1-555-839-2910"
    synth_phone = generate_synthetic_phone(real_phone, "seed_123")
    assert "+1-555-01" in synth_phone, f"Expected fictional 555-01XX range, got {synth_phone}"

    print("  PASS: Format-preserving synthetic generators validated with valid Luhn checksums.")


def test_format_preserving_vault_tokenization():
    print("Testing TokenVault with Format-Preserving Mode...")
    vault = TokenVault()
    sess = "sess_fp_test"

    real_card = "4111 1111 1111 1111"
    synth_card = vault.tokenize_entity(sess, "CARD", real_card, mode="FORMAT_PRESERVING")
    assert synth_card.startswith("4"), f"Expected 4 prefix, got {synth_card}"
    assert is_valid_luhn(synth_card) is True

    # Detokenize text containing synthetic card
    text = f"Payment approved for account with card {synth_card}."
    detok = vault.detokenize_text(sess, text)
    expected = f"Payment approved for account with card {real_card}."
    assert detok == expected, f"Detokenize mismatch!\nGot: {detok}\nExpected: {expected}"

    print("  PASS: Format-preserving AES-GCM tokenization & de-tokenization verified.")


def test_smart_local_routing():
    print("Testing Smart Route to On-Prem Local LLM (Task 27)...")
    policy = {"smart_local_routing": True}

    # Case 1: Sensitive PII detected -> Should route to on-prem model
    detected = [{"type": "PII", "subtype": "SSN"}]
    is_local, reason = should_route_to_local_llm("gpt-4o", detected, policy, {})
    assert is_local is True, "Sensitive data must auto-route to on-prem"
    assert "SSN" in reason

    # Case 2: Clean prompt with cloud model -> Cloud allowed
    is_local_clean, reason_clean = should_route_to_local_llm("gpt-4o", [], policy, {})
    assert is_local_clean is False, "Clean prompt should allow cloud"

    # Case 3: Target model is local ollama -> Local route
    is_local_target, reason_target = should_route_to_local_llm("ollama/llama3.1:8b", [], policy, {})
    assert is_local_target is True

    # Case 4: Probe local models
    local_catalog = probe_local_llm_models()
    assert len(local_catalog) >= 3, "Expected standby or live local models catalog"

    print("  PASS: Smart on-prem local routing logic and model discovery verified.")


def test_anthropic_messages_adapter():
    print("Testing Anthropic Claude Native Messages Adapter (Task 22)...")
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 512,
        "system": "You are a secure medical AI assistant.",
        "messages": [
            {"role": "user", "content": "Review patient Alice SSN 987-65-4321 clinical notes."}
        ],
        "stream": False
    }

    res, audit = execute_anthropic_messages_chat(payload, session_id="sess_claude_001")
    assert "content" in res, f"Expected content array in Anthropic response, got: {res}"
    assert res.get("type") == "message"
    assert res.get("role") == "assistant"
    content_text = res["content"][0]["text"]
    # Verify response was de-tokenized back to original patient SSN
    assert "987-65-4321" in content_text, f"De-tokenization failed in Claude response: {content_text}"
    assert audit.get("verdict") in ("SANITIZED", "PASSED")

    print("  PASS: Anthropic Claude adapter sanitized, executed, and re-hydrated cleanly.")


def test_fastapi_phase2_endpoints():
    print("Testing FastAPI Phase 2 Endpoints (/v1/messages, /v1/local-models)...")
    from fastapi.testclient import TestClient
    from service import app

    client = TestClient(app)

    # 1. Local Models Catalog
    r_loc = client.get("/v1/local-models")
    assert r_loc.status_code == 200, f"Local models returned {r_loc.status_code}"
    loc_data = r_loc.json()
    assert loc_data.get("status") == "success"
    assert len(loc_data.get("models", [])) >= 3
    print("  PASS: GET /v1/local-models returned on-prem model discovery catalog.")

    # 2. Anthropic Messages Native API
    anthropic_req = {
        "model": "claude-3-5-sonnet",
        "max_tokens": 256,
        "messages": [
            {"role": "user", "content": "Patient records review for SSN 123-45-6789."}
        ]
    }
    r_msg = client.post("/v1/messages", json=anthropic_req)
    assert r_msg.status_code == 200, f"POST /v1/messages returned {r_msg.status_code}: {r_msg.text}"
    msg_data = r_msg.json()
    assert msg_data.get("type") == "message"
    assert "123-45-6789" in msg_data["content"][0]["text"]
    print("  PASS: POST /v1/messages drop-in Anthropic API verified.")


if __name__ == "__main__":
    print("\n================ DATAX PHASE 2 TEST RUNNER ================\n")
    test_format_preserving_generators()
    test_format_preserving_vault_tokenization()
    test_smart_local_routing()
    test_anthropic_messages_adapter()
    test_fastapi_phase2_endpoints()
    print("\n================ ALL PHASE 2 TESTS PASSED =================\n")

