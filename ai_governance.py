"""
DataX AI & Intelligence Engine Governance (Section 9)
Enforces dry-run compilation gates, data-sharing privacy controls, auto-fix explainability,
confidence thresholds, LLM token & budget tracking, and pinned model versions.
"""

import os
import json
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

VAULT_DIR = os.environ.get("DATAX_VAULT_DIR")
if not VAULT_DIR:
    if os.path.exists("/home/azureuserSDH/Production/datax-service"):
        VAULT_DIR = "/home/azureuserSDH/Production/datax-service"
    else:
        VAULT_DIR = os.path.dirname(os.path.abspath(__file__))

AI_BUDGET_FILE = os.path.join(VAULT_DIR, ".ai_tenant_budgets.json")
_lock = threading.Lock()

# P1: Pinned Model Version (No silent behavior drift)
PINNED_MODEL_CONFIG = {
    "provider": "AzureOpenAI",
    "deployment_id": os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
    "api_version": "2024-08-01-preview",
    "pinned_model_tag": "gpt-4o-2024-08-06",
    "prompt_cost_per_1k": 0.005,
    "completion_cost_per_1k": 0.015
}


def _load_budget_store() -> Dict[str, Any]:
    if os.path.exists(AI_BUDGET_FILE):
        try:
            with open(AI_BUDGET_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "default": {
            "monthly_budget_usd": 50.0,
            "current_spend_usd": 0.0,
            "total_tokens_used": 0,
            "allow_external_llm_sharing": False,  # P0: Opt-in privacy toggle per tenant
            "confidence_threshold": 0.85          # P1: Low-confidence fixes go to review
        }
    }


def _save_budget_store(data: Dict[str, Any]):
    with open(AI_BUDGET_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


class AIGovernanceService:
    """Enterprise AI Governance, Compilation Gates & Privacy Shield."""

    def __init__(self):
        self.budgets = _load_budget_store()

    # -------------------------------------------------------------------------
    # P0: Data-Sharing Privacy Control
    # -------------------------------------------------------------------------
    def check_llm_sharing_permission(self, tenant_id: str = "default") -> Tuple[bool, str]:
        """Verifies if tenant has explicitly enabled cloud LLM data sharing."""
        tenant_cfg = self.budgets.get(tenant_id, self.budgets.get("default", {}))
        if not tenant_cfg.get("allow_external_llm_sharing", False):
            return False, "Tenant has disabled third-party LLM data sharing. Routing to local certified ontology engine."
        
        # Check budget cap
        if tenant_cfg.get("current_spend_usd", 0.0) >= tenant_cfg.get("monthly_budget_usd", 50.0):
            return False, f"Monthly LLM budget cap (${tenant_cfg.get('monthly_budget_usd')} USD) reached. Routing to offline heuristics."
        
        return True, "Authorized"

    def set_tenant_governance(self, tenant_id: str, allow_sharing: bool, monthly_budget: float, confidence_threshold: float = 0.85):
        with _lock:
            self.budgets[tenant_id] = {
                "monthly_budget_usd": monthly_budget,
                "current_spend_usd": self.budgets.get(tenant_id, {}).get("current_spend_usd", 0.0),
                "total_tokens_used": self.budgets.get(tenant_id, {}).get("total_tokens_used", 0),
                "allow_external_llm_sharing": allow_sharing,
                "confidence_threshold": confidence_threshold
            }
            _save_budget_store(self.budgets)

    def sanitize_llm_prompt_context(self, schema: Dict[str, Any], sample_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """P0: Filters out raw values; only sends schema names, data types, and masked samples."""
        from sanitizer import mask_telemetry_payload
        masked_samples = [mask_telemetry_payload(row) for row in sample_records[:3]]
        return {
            "columns": schema.get("columns", []),
            "table_name": schema.get("table_name", "UNKNOWN"),
            "masked_sample_rows": masked_samples
        }

    # -------------------------------------------------------------------------
    # P0: Compilation & Dry-Run Verification Gate
    # -------------------------------------------------------------------------
    def verify_rule_compilation(self, rules: List[Dict[str, Any]], sample_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Executes rules in in-memory DuckDB sandbox; rejects invalid or non-compiling rules."""
        import duckdb
        test_con = duckdb.connect(":memory:")
        diagnostics = []
        valid_rules = []
        has_failure = False

        # Prepare test view from sample_records
        if not sample_records:
            sample_records = [{"DUMMY_COL": "val", "QUANTITY": 10, "NET_PRICE": 100.0, "PLANT": "US01"}]
        
        try:
            cols = []
            for k, v in sample_records[0].items():
                if isinstance(v, (int, float)):
                    cols.append(f"{v} AS \"{k}\"")
                else:
                    escaped_v = str(v).replace("'", "''")
                    cols.append(f"'{escaped_v}' AS \"{k}\"")
            test_con.execute(f"CREATE OR REPLACE VIEW _verify_table AS SELECT {', '.join(cols)}")
        except Exception:
            test_con.execute("CREATE OR REPLACE VIEW _verify_table AS SELECT 10 AS QUANTITY, 100.0 AS NET_PRICE, 'US01' AS PLANT")

        for rule in rules:
            rule_id = rule.get("id") or "rule_test"
            cond = rule.get("condition") or rule.get("code") or ""
            if not cond:
                diagnostics.append({"rule_id": rule_id, "status": "ERROR", "error": "Empty condition string"})
                has_failure = True
                continue

            try:
                # Compile AST condition against test table
                test_sql = f"SELECT count(*) FROM _verify_table WHERE {cond}"
                test_con.execute(test_sql).fetchone()
                valid_rules.append(rule)
                diagnostics.append({"rule_id": rule_id, "status": "COMPILED_OK"})
            except Exception as e:
                diagnostics.append({"rule_id": rule_id, "status": "COMPILATION_ERROR", "error": str(e)})
                has_failure = True

        test_con.close()
        return {
            "all_passed": not has_failure,
            "total_rules": len(rules),
            "compiled_rules_count": len(valid_rules),
            "diagnostics": diagnostics
        }

    # -------------------------------------------------------------------------
    # P0 & P1: Explainability & Confidence Threshold Routing
    # -------------------------------------------------------------------------
    def evaluate_remediation_confidence(
        self,
        rule_id: str,
        field: str,
        original_value: Any,
        fixed_value: Any,
        heuristic_type: str,
        tenant_id: str = "default"
    ) -> Dict[str, Any]:
        """Calculates confidence and produces human explainability audit trail."""
        # High confidence for deterministic syntax transforms
        if heuristic_type in ["WHITESPACE_TRIM", "UPPERCASE_CODE", "NEGATIVE_SIGN_INVERSION"]:
            confidence = 0.98
            reason = f"Deterministic syntax normalization: converted '{original_value}' -> '{fixed_value}' to satisfy {rule_id}"
        elif heuristic_type == "SAP_PLANT_FALLBACK":
            confidence = 0.88
            reason = f"Legacy plant code remapping: replaced deprecated plant code with corporate hub key {fixed_value}"
        else:
            confidence = 0.72  # Lower confidence requires human review
            reason = f"Heuristic auto-fix proposed change from '{original_value}' -> '{fixed_value}'"

        tenant_threshold = self.budgets.get(tenant_id, {}).get("confidence_threshold", 0.85)
        requires_human_approval = confidence < tenant_threshold

        return {
            "rule_id": rule_id,
            "field": field,
            "original_value": original_value,
            "fixed_value": fixed_value,
            "confidence": confidence,
            "threshold": tenant_threshold,
            "requires_human_review": requires_human_approval,
            "reason": reason
        }

    # -------------------------------------------------------------------------
    # P1: Token & Cost Tracking
    # -------------------------------------------------------------------------
    def record_token_usage(self, prompt_tokens: int, completion_tokens: int, tenant_id: str = "default") -> Dict[str, Any]:
        with _lock:
            prompt_cost = (prompt_tokens / 1000.0) * PINNED_MODEL_CONFIG["prompt_cost_per_1k"]
            comp_cost = (completion_tokens / 1000.0) * PINNED_MODEL_CONFIG["completion_cost_per_1k"]
            total_cost = round(prompt_cost + comp_cost, 4)

            cfg = self.budgets.setdefault(tenant_id, {
                "monthly_budget_usd": 50.0,
                "current_spend_usd": 0.0,
                "total_tokens_used": 0,
                "allow_external_llm_sharing": False,
                "confidence_threshold": 0.85
            })

            cfg["current_spend_usd"] = round(cfg["current_spend_usd"] + total_cost, 4)
            cfg["total_tokens_used"] += (prompt_tokens + completion_tokens)
            _save_budget_store(self.budgets)

            return {
                "tenant_id": tenant_id,
                "tokens_recorded": prompt_tokens + completion_tokens,
                "call_cost_usd": total_cost,
                "monthly_spend_usd": cfg["current_spend_usd"],
                "budget_cap_usd": cfg["monthly_budget_usd"],
                "budget_remaining_usd": max(0.0, round(cfg["monthly_budget_usd"] - cfg["current_spend_usd"], 4))
            }

    def get_governance_report(self, tenant_id: str = "default") -> Dict[str, Any]:
        cfg = self.budgets.get(tenant_id, self.budgets.get("default", {}))
        return {
            "tenant_id": tenant_id,
            "pinned_model": PINNED_MODEL_CONFIG,
            "allow_external_llm_sharing": cfg.get("allow_external_llm_sharing", False),
            "confidence_threshold": cfg.get("confidence_threshold", 0.85),
            "monthly_budget_usd": cfg.get("monthly_budget_usd", 50.0),
            "current_spend_usd": cfg.get("current_spend_usd", 0.0),
            "total_tokens_used": cfg.get("total_tokens_used", 0)
        }


# Global Singleton AI Governance
ai_governor = AIGovernanceService()
