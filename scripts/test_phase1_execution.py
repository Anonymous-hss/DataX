"""
Unit & Integration Tests for Phase 1: Real DAG Execution, Safe 3-Tier Remediation, & BYO File Ingest
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine import resolve_plant_ontology, evaluate_rules_with_duckdb
from pipeline import execute_dag_nodes, run_pipeline
from models import PipelineExecutionRequest, SourceConfig, TargetConfig, RuleItem

def test_resolve_plant_ontology():
    # 1. Exact match
    code, name, conf = resolve_plant_ontology("Dallas")
    assert code == "P1000"
    assert conf >= 0.90

    # 2. Fuzzy match
    code, name, conf = resolve_plant_ontology("Plant-Dallas")
    assert code == "P1000"
    assert conf >= 0.85

    # 3. Code format normalization
    code, name, conf = resolve_plant_ontology("p2000")
    assert code == "P2000"
    assert conf == 1.0

    # 4. Unknown
    code, name, conf = resolve_plant_ontology("CompletelyUnknownPlantXYZ999")
    assert code is None
    assert conf == 0.0

def test_safe_3tier_remediation_no_naive_abs_or_overwrite():
    records = [
        {
            "id": "REC_01",
            "VENDOR_ID": " v101 ",
            "QUANTITY": 10,
            "UNIT_PRICE": 25.0,
            "TOTAL_AMOUNT": 250.0,
            "DELIVERY_PLANT": "Dallas",
            "account_balance": 500.0
        },
        {
            "id": "REC_02",
            "VENDOR_ID": "V102",
            "QUANTITY": 5,
            "UNIT_PRICE": 100.0,
            "TOTAL_AMOUNT": 999.0, # Discrepancy! Expected 500.0
            "DELIVERY_PLANT": "Frankfurt",
            "account_balance": -150.0 # Negative balance! Guard against naive abs()
        }
    ]

    rules = [
        RuleItem(
            id="r_qty",
            name="Positive Qty",
            column="QUANTITY",
            check_type="THRESHOLD",
            condition="QUANTITY > 0",
            severity="critical",
            enabled=True
        ),
        RuleItem(
            id="r_bal",
            name="Non-Negative Balance",
            column="account_balance",
            check_type="THRESHOLD",
            condition="account_balance >= 0",
            severity="critical",
            enabled=True
        )
    ]

    valid, remediated, quarantined = evaluate_rules_with_duckdb(records, rules, auto_fix_on=True)

    # REC_01 should have VENDOR_ID trimmed ('V101') and DELIVERY_PLANT resolved to 'P1000'
    assert len(remediated) >= 1
    fixed_rec1 = next((item["record"] for item in remediated if item["record"]["id"] == "REC_01"), None)
    assert fixed_rec1 is not None
    assert fixed_rec1["DELIVERY_PLANT"] == "P1000"
    assert fixed_rec1["VENDOR_ID"] == "V101"

    # REC_02 has negative balance (-150.0). It must be QUARANTINED, NOT blindly converted to +150.0!
    quarantined_ids = [q["record"]["id"] for q in quarantined]
    assert "REC_02" in quarantined_ids

    rec2_q = next(q for q in quarantined if q["record"]["id"] == "REC_02")
    # Verify account balance was preserved as negative (not mutated to abs)
    assert rec2_q["record"]["account_balance"] == -150.0

    # Verify counterfactual proposals exist in metadata
    assert rec2_q["counterfactuals"] is not None
    cf_types = [cf["type"] for cf in rec2_q["counterfactuals"]]
    assert "CALCULATION_DISCREPANCY" in cf_types
    assert "NEGATIVE_BALANCE_GUARD" in cf_types

def test_topological_dag_execution():
    nodes = [
        {"id": "node_source", "type": "source", "title": "BYO CSV Ingest"},
        {"id": "node_rules", "type": "rules", "title": "Intelligence Engine"},
        {"id": "node_vector", "type": "vector_matcher", "title": "Semantic Vector Matcher"},
        {"id": "node_rag", "type": "rag", "title": "RAG Context Enricher"},
        {"id": "node_router", "type": "router", "title": "3-Way Router"},
        {"id": "node_target", "type": "target", "title": "Clean Core Lakehouse"},
        {"id": "node_quarantine", "type": "quarantine", "title": "Quarantine Workbench"}
    ]
    edges = [
        {"id": "e1", "source": "node_source", "target": "node_rules"},
        {"id": "e2", "source": "node_rules", "target": "node_vector"},
        {"id": "e3", "source": "node_vector", "target": "node_rag"},
        {"id": "e4", "source": "node_rag", "target": "node_router"},
        {"id": "e5", "source": "node_router", "target": "node_target"},
        {"id": "e6", "source": "node_router", "target": "node_quarantine"}
    ]

    raw_records = [{"id": f"row_{i}", "val": i} for i in range(100)]
    valid_records = raw_records[:80]
    remediated_records = raw_records[80:95]
    quarantined_records = raw_records[95:]

    exec_map = execute_dag_nodes(nodes, edges, raw_records, valid_records, remediated_records, quarantined_records)
    assert len(exec_map) == len(nodes)

    assert exec_map["node_source"]["rowsOut"] == 100
    assert exec_map["node_rules"]["rowsIn"] == 100
    assert exec_map["node_vector"]["rowsIn"] == 80  # downstream of rules (valid_records)
    assert exec_map["node_rag"]["rowsIn"] == 80
    assert exec_map["node_target"]["rowsIn"] == 80 # valid
    assert exec_map["node_quarantine"]["rowsIn"] == 5 # quarantined

def test_full_pipeline_with_uploaded_file():
    client_dataset = [
        {"PO_NUMBER": "PO-1001", "VENDOR_ID": "acme ", "QUANTITY": 10, "UNIT_PRICE": 50.0, "TOTAL_AMOUNT": 500.0, "DELIVERY_PLANT": "Dallas"},
        {"PO_NUMBER": "PO-1002", "VENDOR_ID": "beta", "QUANTITY": 0, "UNIT_PRICE": 30.0, "TOTAL_AMOUNT": 0.0, "DELIVERY_PLANT": "Austin"},
        {"PO_NUMBER": "PO-1003", "VENDOR_ID": "gamma", "QUANTITY": 4, "UNIT_PRICE": 25.0, "TOTAL_AMOUNT": 100.0, "DELIVERY_PLANT": "Frankfurt"}
    ]

    req = PipelineExecutionRequest(
        pipelineName="Client PO Verification",
        dryRun=True,
        autoFixEnabled=True,
        source=SourceConfig(
            engine="file_upload",
            fileName="client_procurement_q3.csv",
            fileData=client_dataset
        ),
        target1=TargetConfig(
            engine="duckdb",
            database="client_sandbox",
            table="po_clean"
        ),
        rules=[
            RuleItem(
                id="r_qty",
                name="Positive Quantity",
                column="QUANTITY",
                check_type="THRESHOLD",
                condition="QUANTITY > 0",
                severity="critical",
                enabled=True
            )
        ],
        nodes=[
            {"id": "src", "type": "source", "title": "BYO Ingest"},
            {"id": "rules", "type": "rules", "title": "Engine"},
            {"id": "target", "type": "target", "title": "Target"}
        ],
        edges=[
            {"id": "e1", "source": "src", "target": "rules"},
            {"id": "e2", "source": "rules", "target": "target"}
        ],
        uploadedRecords=client_dataset
    )

    result = run_pipeline(req)
    assert result["status"] == "success"
    assert result["summary"]["sourceExtracted"] == 3
    # PO-1002 has QUANTITY=0, should be quarantined
    assert result["summary"]["quarantined"] == 1
    # PO-1001 and PO-1003 should be compliant
    assert result["summary"]["compliantValid"] == 2
    # Node executions should be attached
    assert len(result["nodeExecutions"]) == 3
    # First row delivery plant Dallas should be resolved to P1000
    cleaned_plants = [r.get("DELIVERY_PLANT") for r in result["sampleValidRecords"] + [item.get("record", item) for item in result.get("sampleAutofixedRecords", [])]]
    assert "P1000" in cleaned_plants
