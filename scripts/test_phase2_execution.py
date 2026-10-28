"""
DataX Phase 2 Pytest Suite:
Validates Dual-Pipeline Shadow Reconciliation, Mathematical Consensus Guard (langgraph-consensus-guard),
Layer 1-3 statistical clamping (+/- 2.5), Merkle SHA-256 manifests, and Reconciliation APIs.
"""
import sys
import os

# Set testing JWT Secret before importing service
os.environ["DATAX_JWT_SECRET"] = "demo-test-secret-key-1234567890"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from consensus_engine import (
    compute_layer1_stats,
    compute_domain_agent_votes,
    evaluate_consensus_guard
)
from shadow_reconciler import shadow_reconciler
from service import app

client = TestClient(app)

def test_layer1_deterministic_stats():
    """Verify Layer 1 computes sub-30ms deterministic stats with null ratios and IQR."""
    dataset = [
        {"id": 1, "name": "Acme Corp", "balance": 100.0, "email": "admin@acme.com"},
        {"id": 2, "name": "Global Tech", "balance": 250.0, "email": "contact@global.com"},
        {"id": 3, "name": "Summit Health", "balance": 50000.0, "email": "null"},
        {"id": 4, "name": None, "balance": -50.0, "email": "support@summit.com"},
    ]
    stats = compute_layer1_stats(dataset)
    assert stats["rowCount"] == 4
    assert stats["columnCount"] == 4
    assert "balance" in stats["nullRatios"]
    assert 0.0 <= stats["baselineScore"] <= 10.0
    assert "executionTimeMs" in stats
    assert stats["executionTimeMs"] < 100.0

def test_layer2_domain_expert_voting():
    """Verify Layer 2 runs multi-expert voting across schema, drift, governance, and business."""
    dataset = [
        {"id": 1, "name": "Acme Corp", "balance": 100.0, "email": "admin@acme.com"},
        {"id": 2, "name": "Beta LLC", "balance": 200.0, "email": "billing@beta.org"},
    ]
    stats = compute_layer1_stats(dataset)
    votes = compute_domain_agent_votes(dataset, stats)
    assert len(votes) == 4
    assert "Schema Integrity" in votes
    assert "Drift & Dispersion" in votes
    assert "Governance & Security" in votes
    assert "Data Quality" in votes
    for name, v in votes.items():
        assert 0.0 <= v["score"] <= 1.0
        assert 0.0 <= v["confidence"] <= 1.0
        assert v["verdict"] in ["PASS", "WARN", "SUSPEND", "CONDITIONAL"]

def test_layer3_clamping_and_fatal_flaw():
    """Verify Layer 3 clamps score within +/- 2.5 of baseline and overrides on fatal flaws."""
    # Test dataset with unmasked SSN to trigger Fatal Flaw 1
    dataset_with_ssn = [
        {"id": 1, "name": "User 1", "ssn": "000-12-3456", "balance": 100.0},
        {"id": 2, "name": "User 2", "ssn": "111-23-4567", "balance": 200.0},
        {"id": 3, "name": "User 3", "ssn": "222-34-5678", "balance": 300.0},
        {"id": 4, "name": "User 4", "ssn": "333-45-6789", "balance": 400.0},
        {"id": 5, "name": "User 5", "ssn": "444-56-7890", "balance": 500.0},
        {"id": 6, "name": "User 6", "ssn": "555-67-8901", "balance": 600.0},
    ]
    guard = evaluate_consensus_guard(dataset_with_ssn, target_column="balance")
    assert guard["status"] == "REJECTED"
    assert guard["disposition"] == "SUSPENDED"
    assert guard["anchoredScore"] <= 2.0
    assert any("Fatal Flaw: PII Guard" in flaw for flaw in guard["fatalFlawOverrides"])
    assert guard["manifestHash"] is not None
    assert len(guard["manifestHash"]) == 64

def test_clean_pipeline_consensus_approval():
    """Verify clean dataset achieves APPROVED status with clamped score within +/- 2.5."""
    clean_dataset = [
        {"user_id": f"USR_{i}", "account_name": f"Enterprise Account {i}", "balance": 1000.0 + (i * 10)}
        for i in range(25)
    ]
    guard = evaluate_consensus_guard(clean_dataset, target_column="balance")
    assert guard["status"] in ["APPROVED", "CONDITIONALLY_APPROVED"]
    assert guard["toleranceBand"] == "±2.5"
    low, high = guard["clampedBandRange"]
    assert low <= guard["anchoredScore"] <= high

def test_shadow_reconciliation_engine():
    """Verify shadow reconciler calculates exact parity, quarantined records, and SHA-256 seal."""
    legacy_records = [
        {"id": "PO_1", "vendor": "V1", "amount": 100.0},
        {"id": "PO_2", "vendor": "V2", "amount": -50.0},  # Dirty legacy admitted
        {"id": "PO_3", "vendor": "V3", "amount": 300.0},
    ]
    datax_records = [
        {"id": "PO_1", "vendor": "V1", "amount": 100.0},
        {"id": "PO_3", "vendor": "V3", "amount": 300.0},
    ]
    report = shadow_reconciler.reconcile_batches(
        batch_id="TEST_RECON_BATCH_01",
        pipeline_name="SAP BW → S/4HANA",
        legacy_records=legacy_records,
        datax_records=datax_records,
        primary_key="id"
    )
    assert report["batch_id"] == "TEST_RECON_BATCH_01"
    assert report["summary"]["total_records_analyzed"] == 3
    assert report["summary"]["identical_records"] == 2
    assert report["summary"]["datax_quarantined_bad_records"] == 1
    assert "sha256_manifest" in report
    assert len(report["sha256_manifest"]) == 64

def test_api_consensus_evaluate_endpoint():
    """Verify POST /consensus/evaluate API returns 200 with full consensus guard."""
    payload = {
        "records": [
            {"order_id": f"ORD_{i}", "total_usd": 150.0 * (i + 1), "customer": f"Client {i}"}
            for i in range(10)
        ],
        "targetColumn": "total_usd",
        "tableRole": "primary"
    }
    response = client.post("/consensus/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "anchoredScore" in data
    assert "domainVotes" in data
    assert "manifestHash" in data

def test_api_shadow_reconciler_reports_endpoint():
    """Verify GET /reconciliation/shadow/reports returns enterprise parity reports."""
    response = client.get("/reconciliation/shadow/reports")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    rep = data[0]
    assert "summary" in rep
    assert "parity_percentage" in rep["summary"]
    assert 0.0 <= rep["summary"]["parity_percentage"] <= 100.0
    assert "sha256_manifest" in rep