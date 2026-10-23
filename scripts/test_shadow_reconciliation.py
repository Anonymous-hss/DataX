"""
Test Suite for Shadow Mode Dual-Pipeline Reconciliation (Section 19)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shadow_reconciler import shadow_reconciler

def test_shadow_reconciliation():
    print("Testing Shadow Mode Dual-Pipeline Reconciliation Engine...")
    
    # Simulate legacy pipeline output (which accepts negative amounts unchecked)
    legacy_data = [
        {"id": "PO_101", "PO_NUMBER": "PO_101", "NETPR": 1500.0, "WERKS": "1000", "STATUS": "APPROVED"},
        {"id": "PO_102", "PO_NUMBER": "PO_102", "NETPR": -50.0,  "WERKS": "1000", "STATUS": "APPROVED"}, # Dirty row!
        {"id": "PO_103", "PO_NUMBER": "PO_103", "NETPR": 2400.0, "WERKS": "2000", "STATUS": "PENDING"},
        {"id": "PO_104", "PO_NUMBER": "PO_104", "NETPR": 300.0,  "WERKS": "1000", "STATUS": "REJECTED"},
    ]

    # Simulate DataX output (quarantined PO_102, auto-fixed or validated the rest)
    datax_data = [
        {"id": "PO_101", "PO_NUMBER": "PO_101", "NETPR": 1500.0, "WERKS": "1000", "STATUS": "APPROVED"},
        # PO_102 was quarantined due to NETPR < 0, so not in validated target
        {"id": "PO_103", "PO_NUMBER": "PO_103", "NETPR": 2400.0, "WERKS": "2000", "STATUS": "PENDING"},
        {"id": "PO_104", "PO_NUMBER": "PO_104", "NETPR": 300.0,  "WERKS": "1000", "STATUS": "REJECTED"},
    ]

    result = shadow_reconciler.reconcile_batches(
        batch_id="test_batch_001",
        pipeline_name="SAP_S4HANA_PO_PROCUREMENT",
        legacy_records=legacy_data,
        datax_records=datax_data,
        primary_key="id",
        metric_columns=["NETPR", "WERKS", "STATUS"]
    )

    print("Reconciliation Summary:")
    print(f"  Total records analyzed: {result['summary']['total_records_analyzed']}")
    print(f"  Identical records:      {result['summary']['identical_records']}")
    print(f"  Parity percentage:      {result['summary']['parity_percentage']}%")
    print(f"  Dirty rows caught:      {result['summary']['datax_quarantined_bad_records']}")
    print(f"  Status:                 {result['summary']['status']}")
    print(f"  Manifest Hash:          {result['sha256_manifest']}")

    assert result['summary']['identical_records'] == 3
    assert result['summary']['datax_quarantined_bad_records'] == 1
    assert "PO_102" in result['datax_prevented_dirty_records_sample'][0]['primary_key']
    print("\nShadow Mode Reconciliation verification PASSED!")

if __name__ == "__main__":
    test_shadow_reconciliation()
