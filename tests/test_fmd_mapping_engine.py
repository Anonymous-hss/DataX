"""
Comprehensive Backend Functional, Error-Prone & Security Test Suite
for FMD Mapping Studio Engine and FastAPI endpoints.
"""

import os
import io
import base64
import openpyxl

os.environ.setdefault("DATAX_JWT_SECRET", "test-secret-for-fmd-pytest-suite-32bytes")

from fastapi.testclient import TestClient

import fmd_mapping_engine
from service import app

client = TestClient(app)
TEST_TENANT = "tenant_test_fmd"


# -----------------------------------------------------------------------------
# 1. Functional Tests (Phase 1 Core Flow)
# -----------------------------------------------------------------------------
def test_seed_demo_workspace_and_compare_makt_maktx():
    summary = fmd_mapping_engine.seed_demo_workspace(TEST_TENANT)
    assert summary["status"] == "success"
    assert len(summary["documents"]) == 4
    assert len(summary["xrefs"]) == 2
    assert len(summary["source_datasets"]) == 1

    sources = [d["source_system"] for d in summary["documents"]]
    assert sources == ["SUSTAIN", "ATLAS", "CONS", "CMMS/MAXIMO"]

    cmms_doc = next(d for d in summary["documents"] if d["source_system"] == "CMMS/MAXIMO")
    assert cmms_doc["tab_count"] == 6
    assert "Field Mapping - MARC" in cmms_doc["tabs"]
    assert "Field Mapping - MAKT" in cmms_doc["tabs"]

    marc_sheet = fmd_mapping_engine.get_document_sheet(TEST_TENANT, cmms_doc["doc_id"], "Field Mapping - MARC")
    assert marc_sheet["header_row"] == 2
    pm1 = next(r for r in marc_sheet["rows"] if r["unique_id"] == "PM_MM_1")
    assert pm1["target_field_name"] == "MATNR"
    assert pm1["rule_code"] == "INTERNAL"

    pm2 = next(r for r in marc_sheet["rows"] if r["unique_id"] == "PM_MM_2")
    assert pm2["target_field_name"] == "WERKS"
    assert pm2["rule_code"] == "DIRECT_COPY"
    assert pm2["source_table"] == "R3_2_CONS_MATERIAL_CMMS_MASTERDATA"

    comp = fmd_mapping_engine.compare_target_field(TEST_TENANT, "MAKT", "MAKTX")
    assert comp["status"] == "success"
    assert len(comp["overview_rows"]) == 4
    assert len(comp["consolidated_rows"]) == 4
    assert comp["pattern_count"] == 3
    assert set(comp["patterns_identified"]) == {"XREF override", "Business construction", "Direct copy"}

    sustain_row = next(r for r in comp["consolidated_rows"] if r["source_system"] == "SUSTAIN")
    assert sustain_row["status"] == "REWORK"
    assert sustain_row["source_document_link"]["excel_row"] == 5

    atlas_row = next(r for r in comp["consolidated_rows"] if r["source_system"] == "ATLAS")
    assert atlas_row["status"] == "FINAL REVIEW"

    categories = {f["category"] for f in comp["findings"]}
    assert "Divergent Mapping Patterns" in categories
    assert "Status: REWORK" in categories
    assert "Design-Spec Override Exception" in categories

    # Also verify MARC-MATNR comparison returns Internal mapping across all 4 FMDs
    comp_matnr = fmd_mapping_engine.compare_target_field(TEST_TENANT, "MARC", "MATNR")
    assert all(r["rule_code"] == "INTERNAL" for r in comp_matnr["consolidated_rows"])


def test_duckdb_simulation_xref_hit_miss_cmms_override_and_z_errorlog():
    fmd_mapping_engine.seed_demo_workspace(TEST_TENANT)

    sim_on = fmd_mapping_engine.simulate_fmd_transformation(TEST_TENANT, "MAKT", "MAKTX", xref_enabled=True)
    assert sim_on["status"] == "success"
    best = {r["source"]: r["final_time_description"] for r in sim_on["best_demo_rows"]}
    assert best["SUSTAIN"] == "PUMP ASSEMBLY"
    assert best["ATLAS"] == "FILTER UNIT"
    assert best["CONS"] == "NEW MIXING VESSEL"
    assert best["CMMS/MAXIMO"] == "MAINTENANCE MOTOR"

    err_rules = {e["RULENAME"] for e in sim_on["z_errorlog"]}
    assert "MANDATORY_MAKTX_NOT_NULL" in err_rules
    assert "SAP_S4_MAKTX_MAX_40_CHARS" in err_rules
    assert all("COLUMNNAME" in e and "RULENAME" in e and "ERROR_CATEGORY" in e for e in sim_on["z_errorlog"])

    # XREF disabled -> fallback to legacy copy
    sim_off = fmd_mapping_engine.simulate_fmd_transformation(TEST_TENANT, "MAKT", "MAKTX", xref_enabled=False)
    best_off = {r["source"]: r["final_time_description"] for r in sim_off["best_demo_rows"]}
    assert best_off["SUSTAIN"] == "LEGACY PUMP ASSEMBLY"
    assert best_off["ATLAS"] == "ATLAS FILTER UNIT"

    # CMMS design-spec override ON -> 400009 gets overridden via MAKT_OVERRIDE_XREF
    sim_cmms = fmd_mapping_engine.simulate_fmd_transformation(
        TEST_TENANT, "MAKT", "MAKTX", xref_enabled=True, apply_cmms_override=True
    )
    rec_400009 = next(r for r in sim_cmms["preload_rows"] if r["matnr"] == "400009")
    assert rec_400009["final_time_description"] == "ELECTRIC MOTOR 5HP IEC"


def test_bods_export_xlsx_and_csv():
    fmd_mapping_engine.seed_demo_workspace(TEST_TENANT)
    fmd_mapping_engine.simulate_fmd_transformation(TEST_TENANT, "MAKT", "MAKTX", xref_enabled=True)

    xlsx_bytes, fname, _ = fmd_mapping_engine.export_bods_staging(TEST_TENANT, "xlsx")
    assert fname.endswith(".xlsx")
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes))
    assert set(wb.sheetnames) == {"Preload_MAKT_TIME", "Z_ERRORLOG", "FMD_Traceability_Audit"}

    csv_bytes, csv_fname, _ = fmd_mapping_engine.export_bods_staging(TEST_TENANT, "csv")
    assert csv_fname.endswith(".csv")
    assert b"PUMP ASSEMBLY" in csv_bytes


def test_api_endpoints_end_to_end():
    r_seed = client.post(f"/api/fmd/demo/seed?tenant_id={TEST_TENANT}")
    assert r_seed.status_code == 200
    assert len(r_seed.json()["documents"]) == 4

    r_files = client.get("/api/fmd/demo/files")
    assert r_files.status_code == 200
    assert len(r_files.json()["files"]) == 7

    r_zip = client.get("/api/fmd/demo/download/all_zip")
    assert r_zip.status_code == 200
    assert r_zip.headers.get("x-content-type-options") == "nosniff"

    r_comp = client.post("/api/fmd/compare", json={"targetTable": "MAKT", "targetField": "MAKTX", "tenantId": TEST_TENANT})
    assert r_comp.status_code == 200
    assert r_comp.json()["pattern_count"] == 3

    r_ask = client.post(
        "/api/fmd/ask",
        json={
            "question": "Compare the Material Description mapping, MAKT-MAKTX, across SUSTAIN, ATLAS, CONS, and CMMS/MAXIMO.",
            "targetTable": "MAKT",
            "targetField": "MAKTX",
            "tenantId": TEST_TENANT,
        },
    )
    assert r_ask.status_code == 200
    assert len(r_ask.json()["citations"]) == 4

    r_sim = client.post("/api/fmd/simulate", json={"targetTable": "MAKT", "targetField": "MAKTX", "xrefEnabled": True, "tenantId": TEST_TENANT})
    assert r_sim.status_code == 200
    assert r_sim.json()["summary"]["z_errorlog_count"] >= 2

    raw_bytes, fn, _ = fmd_mapping_engine.get_demo_file_bytes("cmms_fmd")
    b64 = base64.b64encode(raw_bytes).decode("utf-8")
    r_up = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": fn, "contentBase64": b64, "tenantId": TEST_TENANT},
    )
    assert r_up.status_code == 200
    assert r_up.json()["document"]["source_system"] == "CMMS/MAXIMO"

    r_exp = client.get(f"/api/fmd/export/bods?format=xlsx&tenant_id={TEST_TENANT}")
    assert r_exp.status_code == 200
    assert len(r_exp.content) > 1000


# -----------------------------------------------------------------------------
# 2. Security & Error-Prone Edge-Case Tests
# -----------------------------------------------------------------------------
def test_security_path_traversal_and_disallowed_extensions():
    # Path traversal on download key
    r_trav = client.get("/api/fmd/demo/download/..%2F..%2Fetc%2Fpasswd")
    assert r_trav.status_code == 404

    # Macro-enabled .xlsm or executable .exe rejected
    fake_b64 = base64.b64encode(b"MZ_FAKE_BINARY").decode("utf-8")
    r_ext = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": "malicious_macro.xlsm", "contentBase64": fake_b64, "tenantId": TEST_TENANT},
    )
    assert r_ext.status_code == 400
    assert "Unsupported file type" in r_ext.json()["detail"]

    # Path traversal in uploaded filename is stripped to safe basename
    raw_bytes, _, _ = fmd_mapping_engine.get_demo_file_bytes("atlas_fmd")
    b64 = base64.b64encode(raw_bytes).decode("utf-8")
    r_clean = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": "../../../evil\\ATLAS_R3.2.xlsx", "contentBase64": b64, "tenantId": TEST_TENANT},
    )
    assert r_clean.status_code == 200
    assert "/" not in r_clean.json()["document"]["file_name"]
    assert "\\" not in r_clean.json()["document"]["file_name"]
    assert r_clean.json()["document"]["file_name"] == "ATLAS_R3.2.xlsx"


def test_error_prone_malformed_base64_corrupt_xlsx_and_empty_workbook():
    # Invalid base64
    r_bad_b64 = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": "bad.xlsx", "contentBase64": "%%%NOT_BASE64%%%", "tenantId": TEST_TENANT},
    )
    assert r_bad_b64.status_code == 400
    assert "Invalid base64" in r_bad_b64.json()["detail"]

    # Corrupt non-zip bytes with .xlsx extension
    corrupt_b64 = base64.b64encode(b"this is not an excel zip file").decode("utf-8")
    r_corrupt = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": "corrupt.xlsx", "contentBase64": corrupt_b64, "tenantId": TEST_TENANT},
    )
    assert r_corrupt.status_code == 400
    assert "corrupted" in r_corrupt.json()["detail"].lower()

    # Valid empty workbook (0 mapping rows) rejected cleanly
    wb = openpyxl.Workbook()
    buf = io.BytesIO()
    wb.save(buf)
    empty_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    r_empty = client.post(
        "/api/fmd/documents/upload",
        json={"fileName": "empty.xlsx", "contentBase64": empty_b64, "tenantId": TEST_TENANT},
    )
    assert r_empty.status_code == 400

    # Nonexistent document delete / sheet inspect returns 404
    assert client.delete(f"/api/fmd/documents/fmd_does_not_exist?tenant_id={TEST_TENANT}").status_code == 404
    assert client.get(f"/api/fmd/documents/fmd_does_not_exist/sheet?tenant_id={TEST_TENANT}").status_code == 404


def test_security_sql_injection_and_csv_excel_formula_injection():
    fmd_mapping_engine.seed_demo_workspace(TEST_TENANT)

    # SQL injection attempt via targetTable + record fields
    malicious_records = [
        {
            "source_system": "CMMS/MAXIMO",
            "source_table": "MAKT",
            "matnr": "999999'; DROP TABLE src_makt;--",
            "spras": "EN",
            "maktx": "=CMD|' /C calc'!A0",
            "werks": "P400",
        },
        {
            "source_system": "CMMS/MAXIMO",
            "source_table": "MAKT",
            "matnr": "999998",
            "spras": "EN",
            "maktx": "+SUM(1+1)",
            "werks": "P400",
        },
    ]
    sim = fmd_mapping_engine.simulate_fmd_transformation(
        tid=TEST_TENANT,
        target_table="MAKT\n; DROP TABLE src_makt;--",
        target_field="MAKTX",
        custom_records=malicious_records,
    )
    assert sim["status"] == "success"
    assert len(sim["preload_rows"]) == 2

    # Export to CSV and XLSX and verify DDE formula payloads are neutralized with leading apostrophe
    csv_bytes, _, _ = fmd_mapping_engine.export_bods_staging(TEST_TENANT, "csv")
    csv_text = csv_bytes.decode("utf-8")
    assert "'=CMD|" in csv_text
    assert "'+SUM(1+1)" in csv_text

    xlsx_bytes, _, _ = fmd_mapping_engine.export_bods_staging(TEST_TENANT, "xlsx")
    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes))
    ws = wb["Preload_MAKT_TIME"]
    exported_maktx = [ws.cell(row=r, column=3).value for r in range(2, ws.max_row + 1)]
    assert "'=CMD|' /C calc'!A0" in exported_maktx
    assert "'+SUM(1+1)" in exported_maktx


def test_security_tenant_isolation():
    iso_a = "tenant_iso_alpha"
    iso_b = "tenant_iso_beta"
    fmd_mapping_engine.seed_demo_workspace(iso_a)

    # Clear iso_b if leftover
    store = fmd_mapping_engine._load_store()
    store.pop(iso_b, None)
    fmd_mapping_engine._save_store(store)

    r_b = client.get("/api/fmd/documents", headers={"X-Tenant-Id": iso_b})
    assert r_b.status_code == 200
    assert len(r_b.json()["documents"]) == 0

    r_a = client.get("/api/fmd/documents", headers={"X-Tenant-Id": iso_a})
    assert r_a.status_code == 200
    assert len(r_a.json()["documents"]) == 4


# -----------------------------------------------------------------------------
# 3. Phase 2 & Phase 3 Tests: Coverage Heatmap, Version Diff, HITL, RBAC,
#    ARC-01 Staging Commit, BW HANA Subset Extract, SHA-256 Audit Chain
# -----------------------------------------------------------------------------
def test_phase2_full_workbook_coverage_heatmap():
    tid = "tenant_phase2_cov"
    fmd_mapping_engine.seed_demo_workspace(tid)
    r = client.get("/api/fmd/coverage", headers={"X-Tenant-Id": tid})
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "success"
    assert len(data["sources"]) == 4
    tables_present = {t["table"] for t in data["tab_summaries"]}
    assert {"MAKT", "MARC", "MARA", "MBEW", "MARD"}.issubset(tables_present)
    maktx_row = next(row for row in data["matrix_rows"] if row["key"] == "MAKT-MAKTX")
    assert maktx_row["divergent"] is True
    assert maktx_row["needs_review"] is True


def test_phase3_version_diff_r32_to_r33():
    tid = "tenant_phase3_diff"
    fmd_mapping_engine.seed_demo_workspace(tid)
    r = client.post(
        "/api/fmd/demo/seed-r33",
        json={"actor": "Harshal Sawatkar", "role": "Lead Data Engineer", "tenantId": tid},
    )
    assert r.status_code == 200
    diff = r.json()["diff"]
    assert diff["counts"]["ADDED"] >= 1
    assert diff["counts"]["REMOVED"] >= 1
    assert diff["counts"]["RULE_CHANGED"] >= 1
    assert diff["counts"]["STATUS_CHANGED"] >= 1
    changed_keys = {c["field_key"]: c["change_type"] for c in diff["changes"]}
    assert changed_keys.get("MARA-BISMT") == "ADDED"
    assert changed_keys.get("MBEW-VPRSV") == "REMOVED"
    assert changed_keys.get("MARC-WERKS") == "RULE_CHANGED"
    assert changed_keys.get("MAKT-MAKTX") == "STATUS_CHANGED"


def test_phase23_rbac_hitl_gate_staging_commit_bw_extract_and_audit_chain():
    tid = "tenant_phase3_gov"
    # Fresh bucket
    store = fmd_mapping_engine._load_store()
    store.pop(tid, None)
    fmd_mapping_engine._save_store(store)
    fmd_mapping_engine.seed_demo_workspace(tid)

    # 1. RBAC: Read-Only Auditor must be blocked (HTTP 403) on HITL, BW Extract, R3.3, and Staging Commit
    assert client.post(
        "/api/fmd/approvals/decide",
        json={"uniqueId": "SUS_MAKT_3", "decision": "APPROVED", "role": "Read-Only Auditor", "tenantId": tid},
    ).status_code == 403
    assert client.post(
        "/api/fmd/staging/commit",
        json={"role": "Auditor", "tenantId": tid},
    ).status_code == 403
    assert client.post(
        "/api/fmd/bw-extract",
        json={"tableName": "MAKT", "role": "Viewer", "tenantId": tid},
    ).status_code == 403

    # 2. HITL Gate: Commit blocked while SUSTAIN REWORK (SUS_MAKT_3) is pending
    r_blocked = client.post(
        "/api/fmd/staging/commit",
        json={"actor": "Harshal Sawatkar", "role": "Lead Data Engineer", "enforceHitlGate": True, "tenantId": tid},
    )
    assert r_blocked.status_code == 200
    assert r_blocked.json()["status"] == "blocked_by_hitl"

    # 3. Compliance Controller approves SUS_MAKT_3
    r_app = client.post(
        "/api/fmd/approvals/decide",
        json={
            "uniqueId": "SUS_MAKT_3",
            "decision": "APPROVED",
            "reviewer": "Harshal Sawatkar",
            "role": "Compliance Controller",
            "comment": "Dual XREF precedence verified",
            "tenantId": tid,
        },
    )
    assert r_app.status_code == 200
    assert r_app.json()["queue"]["summary"]["bods_gate_clear"] is True

    # 4. Now ARC-01 Staging Commit succeeds with SHA-256 receipt
    r_commit = client.post(
        "/api/fmd/staging/commit",
        json={"actor": "Harshal Sawatkar", "role": "ERP Integration Lead", "enforceHitlGate": True, "tenantId": tid},
    )
    assert r_commit.status_code == 200
    assert r_commit.json()["status"] == "success"
    tables = {t["table"] for t in r_commit.json()["commit"]["tables"]}
    assert tables == {"time_preload_makt", "time_preload_marc", "z_errorlog"}
    assert len(r_commit.json()["commit"]["sha256_receipt"]) == 64

    # 5. Live Rule-Filtered SAP BW HANA Subset Extraction
    r_bw = client.post(
        "/api/fmd/bw-extract",
        json={"tableName": "MAKT", "maxRows": 8, "role": "Lead Data Engineer", "tenantId": tid},
    )
    assert r_bw.status_code == 200
    assert r_bw.json()["dataset"]["record_count"] == 8
    assert "MAKTX" in r_bw.json()["projected_fields"]

    # 6. Verify SHA-256 Audit Chain integrity & tamper detection
    r_ver = client.get("/api/fmd/audit/verify", headers={"X-Tenant-Id": tid})
    assert r_ver.status_code == 200
    assert r_ver.json()["valid"] is True
    assert r_ver.json()["blocks_verified"] >= 3

    # Simulate tampering on block 1 and confirm verifier catches it
    s2 = fmd_mapping_engine._load_store()
    s2[tid]["audit_chain"][0]["summary"] = "TAMPERED_ENTRY"
    fmd_mapping_engine._save_store(s2)
    tamper_check = fmd_mapping_engine.verify_audit_chain(tid)
    assert tamper_check["valid"] is False
    assert tamper_check["tampered_seq"] == 1


def test_saas_universal_upload_and_ephemeral_reset():
    tid = "tenant_saas_universal"

    # 1. Reset workspace cleanly -> zero pre-fed files
    r_reset = client.post("/api/fmd/reset-workspace", json={"role": "Lead Data Engineer", "tenantId": tid})
    assert r_reset.status_code == 200
    assert len(r_reset.json()["documents"]) == 0
    assert len(r_reset.json()["source_datasets"]) == 0

    # 2. Upload CSV file streamed from client-side temp storage
    csv_payload = base64.b64encode(b"MATNR,MAKTX,WERKS\n9001,CENTRIFUGAL PUMP,P100\n9002,=CMD|calc,P200\n").decode()
    r_csv = client.post(
        "/api/fmd/upload-universal",
        json={"fileName": "legacy_materials.csv", "contentBase64": csv_payload, "tenantId": tid},
    )
    assert r_csv.status_code == 200
    assert r_csv.json()["ingestion"]["detected_role"] == "source_data"
    assert r_csv.json()["ingestion"]["row_count"] == 2
    # Confirm DDE formula neutralization on uploaded CSV
    recs = r_csv.json()["workspace"]["source_datasets"][0]["records"]
    assert recs[1]["MAKTX"].startswith("'=CMD")

    # 3. Upload Apple Numbers (.numbers) via client-parsed sheets
    r_numbers = client.post(
        "/api/fmd/upload-universal",
        json={
            "fileName": "Apple_XREF_Lookup.numbers",
            "parsedSheets": {
                "Sheet 1": [
                    {"LEGACY_MAKTX": "PUMP OLD", "TARGET_MAKTX": "PUMP NEW"},
                ]
            },
            "fileRole": "xref",
            "tenantId": tid,
        },
    )
    assert r_numbers.status_code == 200
    assert r_numbers.json()["ingestion"]["detected_role"] == "xref"
    assert len(r_numbers.json()["workspace"]["xrefs"]) == 1

    # 4. Upload Reference Document (.txt)
    txt_b64 = base64.b64encode(b"Material descriptions must not exceed 40 characters.\nPlant codes start with P.").decode()
    r_txt = client.post(
        "/api/fmd/upload-universal",
        json={"fileName": "design_spec.txt", "contentBase64": txt_b64, "tenantId": tid},
    )
    assert r_txt.status_code == 200
    assert r_txt.json()["ingestion"]["detected_role"] == "reference_doc"
    assert len(r_txt.json()["workspace"]["reference_docs"]) == 1

    # 5. Security: reject disallowed extension (.exe) & path traversal
    r_bad = client.post(
        "/api/fmd/upload-universal",
        json={"fileName": "../../malware.exe", "contentBase64": csv_payload, "tenantId": tid},
    )
    assert r_bad.status_code == 400
    assert "Unsupported file format" in r_bad.json()["detail"]

    # 6. Security: Read-Only Auditor cannot upload or reset
    r_ro = client.post(
        "/api/fmd/reset-workspace",
        json={"role": "Read-Only Auditor", "tenantId": tid},
    )
    assert r_ro.status_code == 403

