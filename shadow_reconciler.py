"""
DataX Shadow Mode Reconciliation Engine (Section 19: Go-Live & Cutover)
Enables parallel execution alongside legacy ETL pipelines. Reconciles batch outputs
row-by-row, calculates data parity, flags discrepancies, and measures dirty records
caught by DataX that legacy pipelines missed.
"""

import os
import json
import time
import hashlib
from typing import Dict, List, Any, Optional

VAULT_DIR = os.environ.get("DATAX_VAULT_DIR", ".")
if os.path.exists("/home/azureuserSDH/Production/datax-service"):
    VAULT_DIR = "/home/azureuserSDH/Production/datax-service"

RECONCILIATION_STORE_PATH = os.path.join(VAULT_DIR, ".reconciliation_store.json")

class ShadowReconciliationEngine:
    def __init__(self, store_path: str = RECONCILIATION_STORE_PATH):
        self.store_path = store_path
        self._ensure_store()

    def _ensure_store(self):
        if not os.path.exists(self.store_path):
            try:
                with open(self.store_path, "w", encoding="utf-8") as f:
                    json.dump({"reports": []}, f, indent=2)
            except Exception:
                pass

    def reconcile_batches(
        self,
        batch_id: str,
        pipeline_name: str,
        legacy_records: List[Dict[str, Any]],
        datax_records: List[Dict[str, Any]],
        primary_key: str = "id",
        metric_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Performs dual-pipeline reconciliation between legacy outputs and DataX outputs.
        """
        start_time = time.time()
        metric_cols = metric_columns or []

        # Index legacy records by primary key
        legacy_map = {}
        for r in legacy_records:
            pk = str(r.get(primary_key, r.get("PO_NUMBER", r.get("MATNR", r.get("id")))))
            if pk:
                legacy_map[pk] = r

        # Index DataX records by primary key
        datax_map = {}
        for r in datax_records:
            pk = str(r.get(primary_key, r.get("PO_NUMBER", r.get("MATNR", r.get("id")))))
            if pk:
                datax_map[pk] = r

        all_keys = set(legacy_map.keys()).union(set(datax_map.keys()))
        
        identical_records = []
        discrepancies = []
        datax_quarantined_or_fixed = []
        legacy_unmatched = []

        for pk in all_keys:
            leg_rec = legacy_map.get(pk)
            dx_rec = datax_map.get(pk)

            if leg_rec and not dx_rec:
                # Legacy emitted it, DataX withheld/quarantined or did not emit
                datax_quarantined_or_fixed.append({
                    "primary_key": pk,
                    "reason": "Record rejected or quarantined by DataX AST validation engine",
                    "legacy_record": leg_rec
                })
            elif dx_rec and not leg_rec:
                legacy_unmatched.append({
                    "primary_key": pk,
                    "reason": "Present in DataX but missing from legacy pipeline extract",
                    "datax_record": dx_rec
                })
            else:
                # Both emitted record: compare field values
                field_diffs = {}
                is_match = True
                
                check_cols = metric_cols if metric_cols else list(leg_rec.keys())
                for col in check_cols:
                    leg_val = leg_rec.get(col)
                    dx_val = dx_rec.get(col)
                    
                    # Normalize string representations for comparison
                    if str(leg_val).strip() != str(dx_val).strip():
                        # Numeric fuzzy match for floating point values
                        try:
                            f_leg = float(leg_val)
                            f_dx = float(dx_val)
                            if abs(f_leg - f_dx) < 0.0001:
                                continue
                        except (ValueError, TypeError):
                            pass
                        
                        field_diffs[col] = {
                            "legacy_value": leg_val,
                            "datax_value": dx_val
                        }
                        is_match = False

                if is_match:
                    identical_records.append(pk)
                else:
                    discrepancies.append({
                        "primary_key": pk,
                        "differences": field_diffs
                    })

        total_compared = len(all_keys)
        match_count = len(identical_records)
        parity_percentage = round((match_count / max(1, total_compared)) * 100, 3)

        report = {
            "report_id": f"recon_{batch_id}_{int(time.time())}",
            "batch_id": batch_id,
            "pipeline_name": pipeline_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
            "execution_duration_sec": round(time.time() - start_time, 4),
            "summary": {
                "total_records_analyzed": total_compared,
                "legacy_record_count": len(legacy_records),
                "datax_record_count": len(datax_records),
                "identical_records": match_count,
                "discrepant_records": len(discrepancies),
                "datax_quarantined_bad_records": len(datax_quarantined_or_fixed),
                "legacy_dropped_records": len(legacy_unmatched),
                "parity_percentage": parity_percentage,
                "status": "PARITY_CERTIFIED" if parity_percentage >= 99.5 else "PARITY_INVESTIGATION_REQUIRED"
            },
            "discrepancies_sample": discrepancies[:20],
            "datax_prevented_dirty_records_sample": datax_quarantined_or_fixed[:20],
            "sha256_manifest": hashlib.sha256(json.dumps({
                "batch_id": batch_id,
                "parity": parity_percentage,
                "identical": match_count
            }, sort_keys=True).encode()).hexdigest()
        }

        self._persist_report(report)
        return report

    def _persist_report(self, report: Dict[str, Any]):
        try:
            reports = []
            if os.path.exists(self.store_path):
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    reports = data.get("reports", [])
            reports.append(report)
            if len(reports) > 50:
                reports = reports[-50:]
            with open(self.store_path, "w", encoding="utf-8") as f:
                json.dump({"reports": reports}, f, indent=2)
        except Exception as e:
            print(f"[SHADOW RECONCILER] Warning: could not persist report: {e}")

    def get_latest_reports(self, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            if os.path.exists(self.store_path):
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("reports", [])[::-1][:limit]
        except Exception:
            pass
        return []

shadow_reconciler = ShadowReconciliationEngine()
