"""
DataX Phase 3 & 4 Pytest Suite:
Validates Automated Root-Cause Traceability, AST Failure Diagnosis,
Executive ROI Calculations, and Board Dossier APIs.
"""
import sys
import os

# Set testing JWT Secret before importing service
os.environ["DATAX_JWT_SECRET"] = "demo-test-secret-key-1234567890"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from diagnostic_engine import diagnose_quarantined_record
from service import app

client = TestClient(app)

def test_diagnose_negative_sign_breach():
    """Verify diagnosis engine identifies upstream ERP sign inversion on negative quantity."""
    sample = {
        "recordId": "PO-98421-01",
        "ruleName": "Positive Quantity & Sign Balance Check",
        "severity": "critical",
        "failedField": "QUANTITY",
        "originalValue": "-5",
        "rawPayload": {"PO_NUMBER": "PO-98421", "QUANTITY": -5, "UNIT_PRICE": 420.0, "TOTAL_AMOUNT": -2100.0}
    }
    diag = diagnose_quarantined_record(sample)
    assert diag["record_id"] == "PO-98421-01"
    assert "amount < 0" in diag["ast_expression_node"]
    assert "0PUR_C01" in diag["root_cause_hypothesis"]
    assert diag["estimated_financial_exposure_usd"] == 2100.0
    assert any("SOX 404" in comp for comp in diag["compliance_violations"])
    assert len(diag["remediation_actions"]) == 3

def test_diagnose_calculation_mismatch():
    """Verify diagnosis engine flags deterministic calculation mismatch and discount matrix."""
    sample = {
        "recordId": "PO-98421-02",
        "ruleName": "Calculation Sanity (Quantity * Price)",
        "severity": "warning",
        "failedField": "TOTAL_AMOUNT",
        "originalValue": "45000.00",
        "rawPayload": {"PO_NUMBER": "PO-98421", "QUANTITY": 10, "UNIT_PRICE": 420.0, "TOTAL_AMOUNT": 45000.0}
    }
    diag = diagnose_quarantined_record(sample)
    assert "TOTAL_AMOUNT" in diag["ast_expression_node"]
    assert "volume discount" in diag["root_cause_hypothesis"].lower()
    assert diag["estimated_financial_exposure_usd"] == 45000.0

def test_diagnose_pii_exposure_breach():
    """Verify diagnosis engine flags unmasked PII and maps to GDPR/HIPAA compliance."""
    sample = {
        "recordId": "CUST-39104-PII",
        "ruleName": "Unmasked SSN / Direct Identifier Leakage",
        "severity": "critical",
        "failedField": "TAX_ID_SSN",
        "originalValue": "419-88-2910",
        "rawPayload": {"CUSTOMER_ID": "CUST-39104", "FULL_NAME": "Sarah Jenkins", "TAX_ID_SSN": "419-88-2910", "BALANCE": 34500.0}
    }
    diag = diagnose_quarantined_record(sample)
    assert "PatternMatch" in diag["ast_expression_node"]
    assert any("GDPR" in comp for comp in diag["compliance_violations"])
    assert any("HIPAA" in comp for comp in diag["compliance_violations"])
    assert diag["estimated_financial_exposure_usd"] == 34500.0

def test_api_quarantine_diagnose_endpoint():
    """Verify POST /quarantine/diagnose returns 200 with full diagnosis payload."""
    payload = {
        "record": {
            "recordId": "GL-44091-04",
            "ruleName": "Debits Equal Credits Zero Balance",
            "severity": "critical",
            "failedField": "DEBIT",
            "originalValue": "12450.00",
            "rawPayload": {"JOURNAL_ID": "GL-44091", "DEBIT": 12450.0, "CREDIT": 12400.0}
        }
    }
    response = client.post("/quarantine/diagnose", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ast_expression_node" in data
    assert "root_cause_hypothesis" in data
    assert data["estimated_financial_exposure_usd"] == 12450.0

def test_api_quarantine_diagnosis_get_endpoint():
    """Verify GET /quarantine/diagnosis/{record_id} returns 200."""
    response = client.get("/quarantine/diagnosis/PO-TEST-123")
    assert response.status_code == 200
    data = response.json()
    assert data["record_id"] == "PO-TEST-123"
    assert "remediation_actions" in data

def test_api_executive_metrics_endpoint():
    """Verify GET /executive/metrics returns executive KPIs, compliance frameworks, and SHA-256 seal."""
    response = client.get("/executive/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["financial_risk_prevented_usd"] >= 1000000.0
    assert data["engineering_hours_saved"] >= 100
    assert data["parity_percentage"] >= 95.0
    assert len(data["regulatory_certifications"]) >= 4
    assert "cryptographic_merkle_seal" in data
    assert len(data["cryptographic_merkle_seal"]) == 64

