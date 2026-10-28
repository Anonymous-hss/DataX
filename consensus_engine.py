"""
DataX Mathematical Consensus Guard Engine (Layer 1, Layer 2, Layer 3)
Based on langgraph-consensus-guard architecture:
- Layer 1: Deterministic statistical baseline (<30ms, completeness, IQR outliers, Shannon entropy, PII scans)
- Layer 2: Specialized domain agent consensus votes (Schema, Drift/Anomaly, Governance/PII, Business Logic)
- Layer 3: Deterministic mathematical anchoring (±2.5 points band clamping) and fatal flaw overrides
"""

import math
import re
import time
import hashlib
from typing import Dict, Any, List, Optional, Tuple

SSN_REGEX = re.compile(r'^\d{3}-\d{2}-\d{4}$')
CC_REGEX = re.compile(r'^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

RESERVED_SQL_KEYWORDS = frozenset({
    "select", "from", "where", "drop", "delete", "update", "insert",
    "table", "database", "order", "group", "by", "having", "limit",
    "join", "inner", "outer", "left", "right", "null", "case", "when"
})


def compute_layer1_stats(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes Layer 1 pure mathematical statistics on raw records (<30ms execution).
    """
    start_time = time.time()
    if not records:
        return {
            "rowCount": 0,
            "columnCount": 0,
            "nullRatios": {},
            "completenessScore": 0.0,
            "cardinalityRatios": {},
            "outlierCount": 0,
            "detectedPii": [],
            "baselineScore": 0.0,
            "executionTimeMs": 0.0
        }

    row_count = len(records)
    all_cols = list(records[0].keys())
    column_count = len(all_cols)

    # 1. Null ratios & completeness
    null_counts = {col: 0 for col in all_cols}
    unique_values = {col: set() for col in all_cols}
    numeric_values = {col: [] for col in all_cols}
    detected_pii = []

    for r in records:
        for col in all_cols:
            val = r.get(col)
            if val is None or str(val).strip() == "" or str(val).lower() == "nan" or str(val).lower() == "null":
                null_counts[col] += 1
            else:
                s_val = str(val).strip()
                unique_values[col].add(s_val)
                # Check for critical unmasked PII
                col_lower = col.lower()
                if "ssn" in col_lower or SSN_REGEX.match(s_val):
                    detected_pii.append({"column": col, "type": "SSN", "sample": "***-**-****"})
                elif "card" in col_lower or CC_REGEX.match(s_val):
                    detected_pii.append({"column": col, "type": "CREDIT_CARD", "sample": "****-****-****-****"})

                # Collect numeric values for IQR outlier calculations
                try:
                    num_val = float(val)
                    numeric_values[col].append(num_val)
                except (ValueError, TypeError):
                    pass

    null_ratios = {col: round(null_counts[col] / row_count, 4) for col in all_cols}
    avg_null_ratio = sum(null_ratios.values()) / max(1, column_count)
    completeness_score = max(0.0, min(1.0, 1.0 - avg_null_ratio))

    cardinality_ratios = {col: round(len(unique_values[col]) / row_count, 4) for col in all_cols}

    # 2. IQR Outlier calculation on numeric columns
    outlier_count = 0
    iqr_bounds = {}
    for col, nums in numeric_values.items():
        if len(nums) >= 8:
            sorted_nums = sorted(nums)
            q1 = sorted_nums[int(len(sorted_nums) * 0.25)]
            q3 = sorted_nums[int(len(sorted_nums) * 0.75)]
            iqr = q3 - q1
            if iqr > 0:
                lower_b = q1 - 1.5 * iqr
                upper_b = q3 + 1.5 * iqr
                iqr_bounds[col] = {"lower": lower_b, "upper": upper_b}
                for n in nums:
                    if n < lower_b or n > upper_b:
                        outlier_count += 1

    # 3. Composite deterministic baseline score (0.0 - 10.0)
    # 40% Completeness, 30% Outlier Health, 30% PII / Structural Cleanliness
    outlier_ratio = min(1.0, outlier_count / max(1, row_count * max(1, len(iqr_bounds))))
    outlier_health = max(0.0, 1.0 - outlier_ratio)

    pii_penalty = 1.0 if not detected_pii else max(0.0, 1.0 - (len(detected_pii) * 0.2))

    raw_baseline = (
        (completeness_score * 0.40) +
        (outlier_health * 0.30) +
        (pii_penalty * 0.30)
    ) * 10.0

    baseline_score = round(max(0.0, min(10.0, raw_baseline)), 2)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "rowCount": row_count,
        "columnCount": column_count,
        "nullRatios": null_ratios,
        "completenessScore": round(completeness_score, 4),
        "cardinalityRatios": cardinality_ratios,
        "outlierCount": outlier_count,
        "detectedPii": detected_pii[:10],
        "baselineScore": baseline_score,
        "executionTimeMs": elapsed_ms
    }


def compute_domain_agent_votes(
    records: List[Dict[str, Any]],
    layer1_stats: Dict[str, Any]
) -> Dict[str, Dict[str, Any]]:
    """
    Computes Layer 2 specialized domain agent evaluation votes.
    Each agent outputs a score (0.0 to 1.0), confidence, and cited metrics.
    """
    row_count = layer1_stats["rowCount"]
    null_ratios = layer1_stats["nullRatios"]

    # Agent 1: Schema Integrity Agent
    cols = list(records[0].keys()) if records else []
    invalid_col_names = [c for c in cols if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', c) or c.lower() in RESERVED_SQL_KEYWORDS]
    schema_score = max(0.2, 1.0 - (len(invalid_col_names) * 0.15))
    schema_vote = {
        "score": round(schema_score, 2),
        "confidence": 0.95,
        "verdict": "PASS" if schema_score >= 0.8 else "WARN",
        "citedMetrics": {
            "totalColumns": len(cols),
            "invalidNamingColumns": invalid_col_names
        },
        "reasoning": f"Evaluated {len(cols)} columns. {len(invalid_col_names)} columns breach SQL naming conventions."
    }

    # Agent 2: Drift & Dispersion Agent
    outlier_count = layer1_stats["outlierCount"]
    drift_score = max(0.3, 1.0 - min(0.7, outlier_count / max(1, row_count)))
    drift_vote = {
        "score": round(drift_score, 2),
        "confidence": 0.90,
        "verdict": "PASS" if drift_score >= 0.8 else "WARN",
        "citedMetrics": {
            "outlierCount": outlier_count,
            "outlierFrequency": f"{round((outlier_count / max(1, row_count)) * 100, 2)}%"
        },
        "reasoning": f"Observed {outlier_count} IQR outliers across numeric distributions."
    }

    # Agent 3: Governance & Security Agent
    pii_found = layer1_stats["detectedPii"]
    gov_score = 0.2 if pii_found else 0.98
    gov_vote = {
        "score": round(gov_score, 2),
        "confidence": 0.98,
        "verdict": "SUSPEND" if pii_found else "PASS",
        "citedMetrics": {
            "detectedPiiCount": len(pii_found),
            "criticalTypes": list(set(p["type"] for p in pii_found))
        },
        "reasoning": f"Security audit: {len(pii_found)} unmasked PII instances identified." if pii_found else "Zero unmasked PII elements detected."
    }

    # Agent 4: Business Data Quality Agent
    comp_score = layer1_stats["completenessScore"]
    quality_score = max(0.1, comp_score)
    quality_vote = {
        "score": round(quality_score, 2),
        "confidence": 0.92,
        "verdict": "PASS" if quality_score >= 0.8 else "CONDITIONAL",
        "citedMetrics": {
            "completenessScore": comp_score,
            "highNullColumns": [c for c, r in null_ratios.items() if r > 0.05]
        },
        "reasoning": f"Data completeness is {round(comp_score * 100, 1)}%. High null density in {[c for c, r in null_ratios.items() if r > 0.05]}."
    }

    return {
        "Schema Integrity": schema_vote,
        "Drift & Dispersion": drift_vote,
        "Governance & Security": gov_vote,
        "Data Quality": quality_vote
    }


def evaluate_consensus_guard(
    records: List[Dict[str, Any]],
    rules: Optional[List[Any]] = None,
    table_role: str = "primary",
    target_column: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes full 3-Layer Mathematical Consensus Guard:
    1. Layer 1: Deterministic Statistical Invariants (<30ms)
    2. Layer 2: Specialized Domain Expert Agent Voting
    3. Layer 3: Mathematical Score Anchoring (±2.5) & Fatal Flaw Gating
    """
    start_time = time.time()
    if not records:
        return {
            "status": "REJECTED",
            "disposition": "SUSPENDED",
            "layer1BaselineScore": 0.0,
            "anchoredScore": 0.0,
            "toleranceBand": "±2.5",
            "domainVotes": {},
            "fatalFlawOverrides": ["Empty record batch provided"],
            "manifestHash": hashlib.sha256(b"empty").hexdigest(),
            "executionTimeMs": 0.0
        }

    # Layer 1: Pure Deterministic Baseline
    layer1 = compute_layer1_stats(records)
    baseline_score = layer1["baselineScore"]

    # Layer 2: Concurrent Domain Votes
    domain_votes = compute_domain_agent_votes(records, layer1)

    # Compute qualitative aggregate score
    total_weighted_score = sum(v["score"] * v["confidence"] for v in domain_votes.values())
    total_weights = sum(v["confidence"] for v in domain_votes.values())
    unanchored_qualitative_score = round((total_weighted_score / max(0.1, total_weights)) * 10.0, 2)

    # Layer 3: Mathematical Anchoring within ±2.5 points
    band = 2.5
    lower_bound = max(0.0, baseline_score - band)
    upper_bound = min(10.0, baseline_score + band)
    anchored_score = round(max(lower_bound, min(upper_bound, unanchored_qualitative_score)), 2)

    # Fatal Flaw Gating & Disposition Escalation
    disposition = "READY"
    fatal_flaws = []

    # Fatal Flaw 1: Critical unmasked PII
    if layer1["detectedPii"]:
        anchored_score = min(anchored_score, 2.0)
        disposition = "SUSPENDED"
        pii_cols = ", ".join(set(p["column"] for p in layer1["detectedPii"]))
        fatal_flaws.append(f"[Fatal Flaw: PII Guard] Unmasked critical PII detected in column(s): {pii_cols}. Score capped at 2.0.")

    # Fatal Flaw 2: High null rate on designated target column (> 5%)
    if target_column and layer1["nullRatios"].get(target_column, 0.0) > 0.05:
        null_rate = layer1["nullRatios"][target_column]
        anchored_score = min(anchored_score, 3.0)
        disposition = "SUSPENDED"
        fatal_flaws.append(f"[Fatal Flaw: Target Completeness] Primary target column '{target_column}' has {round(null_rate * 100, 1)}% nulls (exceeds allowable 5%). Score capped at 3.0.")

    # Fatal Flaw 3: Row volume sufficiency
    if layer1["rowCount"] < 5:
        anchored_score = min(anchored_score, 4.0)
        disposition = "SUSPENDED" if disposition == "SUSPENDED" else "CONDITIONAL"
        fatal_flaws.append(f"[Volume Warning] Sample dataset has only {layer1['rowCount']} rows. Score capped at 4.0.")

    # Assign final status & disposition
    if disposition != "SUSPENDED":
        if anchored_score >= 8.0:
            disposition = "READY"
            status = "APPROVED"
        elif anchored_score >= 6.0:
            disposition = "CONDITIONAL"
            status = "CONDITIONALLY_APPROVED"
        else:
            disposition = "SUSPENDED"
            status = "REJECTED"
    else:
        status = "REJECTED"

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Cryptographic Manifest Hash for audit immutability
    manifest_bytes = f"{baseline_score}:{anchored_score}:{disposition}:{status}:{layer1['rowCount']}".encode('utf-8')
    manifest_hash = hashlib.sha256(manifest_bytes).hexdigest()

    return {
        "status": status,
        "disposition": disposition,
        "layer1BaselineScore": baseline_score,
        "unanchoredQualitativeScore": unanchored_qualitative_score,
        "anchoredScore": anchored_score,
        "toleranceBand": f"±{band}",
        "clampedBandRange": [round(lower_bound, 2), round(upper_bound, 2)],
        "domainVotes": {
            k: {
                "score": round(v["score"] * 10, 1),
                "confidence": v["confidence"],
                "verdict": v["verdict"],
                "reasoning": v["reasoning"]
            }
            for k, v in domain_votes.items()
        },
        "layer1Stats": {
            "rowCount": layer1["rowCount"],
            "columnCount": layer1["columnCount"],
            "completenessPct": round(layer1["completenessScore"] * 100, 1),
            "outlierCount": layer1["outlierCount"],
            "detectedPiiCount": len(layer1["detectedPii"]),
            "nullRatios": layer1["nullRatios"]
        },
        "fatalFlawOverrides": fatal_flaws,
        "manifestHash": manifest_hash,
        "executionTimeMs": elapsed_ms
    }

