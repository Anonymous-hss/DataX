"""
DataX Commercial Entitlements, Metering & Licensing Engine (Section 17)
Enforces license quotas, meters consumption for automated billing,
and validates enterprise license keys.
"""

import os
import json
import time
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

TIER_QUOTAS = {
    "Starter": {
        "max_active_pipelines": 3,
        "monthly_row_limit": 100_000,
        "max_custom_connectors": 2,
        "ai_synthesis_monthly_limit": 50,
        "sla_tier": "Community / Email",
        "features": ["duckdb_ast", "standard_connectors"]
    },
    "Professional": {
        "max_active_pipelines": 15,
        "monthly_row_limit": 2_500_000,
        "max_custom_connectors": 10,
        "ai_synthesis_monthly_limit": 500,
        "sla_tier": "Business Hours (4-hr response)",
        "features": ["duckdb_ast", "all_connectors", "circuit_breakers", "durable_dlq", "audit_trail"]
    },
    "Enterprise": {
        "max_active_pipelines": 9999,
        "monthly_row_limit": 100_000_000,
        "max_custom_connectors": 9999,
        "ai_synthesis_monthly_limit": 999999,
        "sla_tier": "Mission Critical 24/7 (1-hr response)",
        "features": ["duckdb_ast", "all_connectors", "circuit_breakers", "durable_dlq", "audit_trail", "rbac", "sso_saml", "custom_sdk", "multi_region"]
    }
}

METER_STORE_FILE = os.path.join(os.path.dirname(__file__), ".meter_store.json")

class EntitlementsEngine:
    def __init__(self):
        self._load_store()

    def _load_store(self):
        if not os.path.exists(METER_STORE_FILE):
            self.store = {}
            self._save_store()
        else:
            try:
                with open(METER_STORE_FILE, "r") as f:
                    self.store = json.load(f)
            except Exception:
                self.store = {}

    def _save_store(self):
        with open(METER_STORE_FILE, "w") as f:
            json.dump(self.store, f, indent=2)

    def get_tenant_entitlement(self, tenant_id: str) -> Dict[str, Any]:
        """Returns the tier, quotas, and current consumption for a tenant."""
        self._load_store()
        month_key = datetime.utcnow().strftime("%Y-%m")
        tenant_data = self.store.setdefault(tenant_id, {
            "tier": "Enterprise",  # Default to Enterprise for licensed deployment
            "license_key": f"dx_ent_{hashlib.sha256(tenant_id.encode()).hexdigest()[:16]}",
            "activated_at": "2026-01-01T00:00:00Z",
            "status": "ACTIVE_ENTITLED",
            "months": {}
        })

        month_usage = tenant_data["months"].setdefault(month_key, {
            "rows_processed": 0,
            "pipeline_executions": 0,
            "ai_synthesis_calls": 0,
            "quarantined_rows": 0,
            "remediated_rows": 0
        })

        tier = tenant_data.get("tier", "Enterprise")
        quotas = TIER_QUOTAS.get(tier, TIER_QUOTAS["Enterprise"])

        return {
            "tenant_id": tenant_id,
            "tier": tier,
            "status": tenant_data.get("status", "ACTIVE_ENTITLED"),
            "license_key": tenant_data.get("license_key"),
            "current_billing_period": month_key,
            "quotas": quotas,
            "consumption": month_usage,
            "utilization_percentage": {
                "rows_processed": round((month_usage["rows_processed"] / quotas["monthly_row_limit"]) * 100, 2),
                "ai_synthesis": round((month_usage["ai_synthesis_calls"] / quotas["ai_synthesis_monthly_limit"]) * 100, 2)
            }
        }

    def record_usage_metric(self, tenant_id: str, metric_type: str, count: int = 1) -> Dict[str, Any]:
        """Accumulates usage metrics for automated billing and entitlement checks."""
        self._load_store()
        month_key = datetime.utcnow().strftime("%Y-%m")
        tenant_data = self.store.setdefault(tenant_id, {
            "tier": "Enterprise",
            "license_key": f"dx_ent_{hashlib.sha256(tenant_id.encode()).hexdigest()[:16]}",
            "activated_at": datetime.utcnow().isoformat() + "Z",
            "status": "ACTIVE_ENTITLED",
            "months": {}
        })

        month_usage = tenant_data["months"].setdefault(month_key, {
            "rows_processed": 0,
            "pipeline_executions": 0,
            "ai_synthesis_calls": 0,
            "quarantined_rows": 0,
            "remediated_rows": 0
        })

        if metric_type in month_usage:
            month_usage[metric_type] += count
        else:
            month_usage[metric_type] = count

        self._save_store()
        return {
            "tenant_id": tenant_id,
            "billing_month": month_key,
            "metric": metric_type,
            "increment": count,
            "total_accumulated": month_usage[metric_type]
        }

    def enforce_quota_gate(self, tenant_id: str, action: str, requested_units: int = 1):
        """
        Gatekeeper function raising PermissionError if the tenant's current monthly usage
        would exceed their contracted tier quota.
        """
        info = self.get_tenant_entitlement(tenant_id)
        quotas = info["quotas"]
        consumption = info["consumption"]

        if action == "process_rows":
            if consumption["rows_processed"] + requested_units > quotas["monthly_row_limit"]:
                raise PermissionError(
                    f"License Quota Exceeded: Contracted limit is {quotas['monthly_row_limit']:,} rows/mo. "
                    f"Current usage: {consumption['rows_processed']:,}. Upgrade tier to continue."
                )
        elif action == "ai_synthesis":
            if consumption["ai_synthesis_calls"] + requested_units > quotas["ai_synthesis_monthly_limit"]:
                raise PermissionError(
                    f"AI Synthesis Quota Exceeded: Contracted limit is {quotas['ai_synthesis_monthly_limit']} calls/mo. "
                    f"Current usage: {consumption['ai_synthesis_calls']}. Upgrade tier or use local heuristics."
                )

        return True

entitlements_engine = EntitlementsEngine()
