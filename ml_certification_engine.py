"""
DataX ML Training & LLM Fine-Tuning Dataset Certification Gate (Production SaaS)
- Real Population Stability Index (PSI) 10-Bin Covariate Drift Math
- Column Health & Missingness Profiler (Nulls, Distincts, Quantiles, IQR Outliers)
- Target / Label Leakage Scanner (Numeric & Binary Categorical Targets)
- Class Imbalance & Protected-Attribute Disparate Impact Audit (EU AI Act Art. 10 & SR 11-7)
- Deterministic Tabular Remediation Engine (Column Drop, Deduplication, Imputation, Outlier Clipping)
- LLM SFT/DPO Corpus Hygiene Auditor & Auto-Sanitizer (Secrets, PII, Refusal Stripping, OpenAI Chat Formatting)
- Neon PostgreSQL Persistence (datax_ml_certifications) & Content-Addressed SHA-256 Dataset Release Seals
"""

import re
import json
import time
import math
import hashlib
from collections import Counter
from typing import Dict, Any, List, Optional, Tuple

import psycopg2
from vault import DEFAULT_NEON_URI
from ai_firewall_engine import (
    SECRET_PATTERNS,
    SSN_REGEX,
    CREDIT_CARD_REGEX,
    EMAIL_REGEX,
    PHONE_REGEX,
)


def init_ml_tables():
    """Idempotently ensures datax_ml_certifications exists in Neon PostgreSQL."""
    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "datax_ml_certifications" (
                        cert_id VARCHAR(64) PRIMARY KEY,
                        dataset_name VARCHAR(256),
                        modality VARCHAR(32),
                        row_count INT,
                        clean_row_count INT,
                        psi_max NUMERIC(6, 4),
                        leakage_columns TEXT,
                        pii_leaks_found INT DEFAULT 0,
                        anchored_score NUMERIC(5, 2),
                        verdict VARCHAR(32),
                        sha256_dataset_hash VARCHAR(64),
                        certificate_json JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """)
            conn.commit()
    except Exception as e:
        print(f"[ML_GATE] Note: Table init deferred or non-fatal: {e}")


init_ml_tables()


def _is_missing(val: Any) -> bool:
    if val is None:
        return True
    if isinstance(val, float) and math.isnan(val):
        return True
    if isinstance(val, str) and val.strip().lower() in ("", "null", "none", "nan", "na", "n/a"):
        return True
    return False


def _try_float(val: Any) -> Optional[float]:
    if _is_missing(val) or isinstance(val, bool):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _percentile(sorted_vals: List[float], q: float) -> float:
    if not sorted_vals:
        return 0.0
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    pos = q * (len(sorted_vals) - 1)
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return sorted_vals[lo]
    weight = pos - lo
    return sorted_vals[lo] * (1.0 - weight) + sorted_vals[hi] * weight


def compute_psi(baseline_vals: List[float], candidate_vals: List[float], num_bins: int = 10) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes exact Population Stability Index (PSI) between baseline and candidate feature distributions.
    """
    b_valid = [float(v) for v in baseline_vals if v is not None and not math.isnan(float(v))]
    c_valid = [float(v) for v in candidate_vals if v is not None and not math.isnan(float(v))]

    if len(b_valid) < 5 or len(c_valid) < 5:
        return 0.0, []

    b_sorted = sorted(b_valid)
    quantiles = [i / num_bins for i in range(1, num_bins)]
    cutoffs = []
    for q in quantiles:
        cutoffs.append(_percentile(b_sorted, q))
    cutoffs = sorted(list(set(round(c, 6) for c in cutoffs)))

    if not cutoffs:
        return 0.0, []

    b_counts = [0] * (len(cutoffs) + 1)
    for v in b_valid:
        placed = False
        for i, cut in enumerate(cutoffs):
            if v <= cut:
                b_counts[i] += 1
                placed = True
                break
        if not placed:
            b_counts[-1] += 1

    c_counts = [0] * (len(cutoffs) + 1)
    for v in c_valid:
        placed = False
        for i, cut in enumerate(cutoffs):
            if v <= cut:
                c_counts[i] += 1
                placed = True
                break
        if not placed:
            c_counts[-1] += 1

    total_b = max(1, len(b_valid))
    total_c = max(1, len(c_valid))
    psi = 0.0
    bins_detail = []

    for i in range(len(b_counts)):
        p = max(0.0001, b_counts[i] / total_b)
        q = max(0.0001, c_counts[i] / total_c)
        bin_psi = (q - p) * math.log(q / p)
        psi += bin_psi
        label = f"<= {cutoffs[i]:.2f}" if i < len(cutoffs) else f"> {cutoffs[-1]:.2f}"
        bins_detail.append({
            "binLabel": label,
            "baselinePct": round(p * 100, 2),
            "candidatePct": round(q * 100, 2),
            "binPsi": round(bin_psi, 4)
        })

    return round(psi, 4), bins_detail


def compute_pearson_correlation(x_vals: List[Optional[float]], y_vals: List[Optional[float]]) -> float:
    """Computes Pearson correlation coefficient between feature X and target Y over valid non-null pairs."""
    pairs = [(x, y) for x, y in zip(x_vals, y_vals) if x is not None and y is not None]
    if len(pairs) < 5:
        return 0.0

    n = len(pairs)
    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]

    mean_x = sum(xs) / n
    mean_y = sum(ys) / n

    numerator = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
    denom_x = math.sqrt(sum((x - mean_x) ** 2 for x in xs))
    denom_y = math.sqrt(sum((y - mean_y) ** 2 for y in ys))

    if denom_x == 0 or denom_y == 0:
        return 0.0

    return round(numerator / (denom_x * denom_y), 4)


def _encode_target_vector(records: List[Dict[str, Any]], target_col: str) -> Tuple[List[Optional[float]], Optional[Any]]:
    """
    Encodes numeric, boolean, or 2-class categorical target columns into float values for correlation & parity checks.
    Returns (encoded_vector, positive_label_repr).
    """
    raw_non_null = [r.get(target_col) for r in records if not _is_missing(r.get(target_col))]
    if not raw_non_null:
        return [None] * len(records), None

    # Check if purely numeric
    num_parsed = [_try_float(v) for v in raw_non_null]
    if sum(1 for x in num_parsed if x is not None) >= len(raw_non_null) * 0.9:
        vec = [_try_float(r.get(target_col)) for r in records]
        distinct_nums = sorted(list(set(x for x in vec if x is not None)))
        pos_label = distinct_nums[-1] if distinct_nums else 1.0
        return vec, pos_label

    # Categorical / Boolean encoding
    norm_strs = [str(v).strip() for v in raw_non_null]
    counts = Counter(norm_strs)
    distinct = [k for k, _ in counts.most_common()]

    positive_tokens = {"1", "true", "yes", "y", "positive", "churn", "churned", "fraud", "default", "approved", "active"}
    pos_class = None
    for d in distinct:
        if d.lower() in positive_tokens:
            pos_class = d
            break
    if pos_class is None:
        # Pick minority class for binary, or most common second class
        pos_class = distinct[-1] if len(distinct) == 2 else distinct[0]

    vec = []
    for r in records:
        v = r.get(target_col)
        if _is_missing(v):
            vec.append(None)
        else:
            vec.append(1.0 if str(v).strip() == pos_class else 0.0)
    return vec, pos_class


def _profile_columns(records: List[Dict[str, Any]], cols: List[str]) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """Computes column-by-column health telemetry and infers 'numeric' vs 'categorical' types."""
    total = max(1, len(records))
    profiles = []
    col_types: Dict[str, str] = {}

    for col in cols:
        raw_vals = [r.get(col) for r in records]
        non_missing = [v for v in raw_vals if not _is_missing(v)]
        null_count = len(records) - len(non_missing)
        null_pct = round((null_count / total) * 100, 2)
        distinct_count = len(set(json.dumps(v, default=str) if isinstance(v, (dict, list)) else str(v) for v in non_missing))

        num_vals = [_try_float(v) for v in non_missing]
        valid_nums = [x for x in num_vals if x is not None]

        is_numeric = len(non_missing) > 0 and (len(valid_nums) / len(non_missing)) >= 0.85
        col_types[col] = "numeric" if is_numeric else "categorical"

        if is_numeric and valid_nums:
            s_nums = sorted(valid_nums)
            mean_v = sum(s_nums) / len(s_nums)
            med_v = _percentile(s_nums, 0.5)
            q1 = _percentile(s_nums, 0.25)
            q3 = _percentile(s_nums, 0.75)
            iqr = q3 - q1
            if iqr > 0:
                lo_fence = q1 - 1.5 * iqr
                hi_fence = q3 + 1.5 * iqr
                outliers = sum(1 for x in s_nums if x < lo_fence or x > hi_fence)
            else:
                outliers = 0

            profiles.append({
                "column": col,
                "dataType": "numeric",
                "nullCount": null_count,
                "nullPct": null_pct,
                "distinctCount": distinct_count,
                "min": round(s_nums[0], 4),
                "max": round(s_nums[-1], 4),
                "mean": round(mean_v, 4),
                "median": round(med_v, 4),
                "outlierCount": outliers,
            })
        else:
            top_val = None
            if non_missing:
                top_val = Counter(str(v) for v in non_missing).most_common(1)[0][0]
            profiles.append({
                "column": col,
                "dataType": "categorical",
                "nullCount": null_count,
                "nullPct": null_pct,
                "distinctCount": distinct_count,
                "topValue": top_val,
                "outlierCount": 0,
            })

    return profiles, col_types


def _apply_tabular_remediations(
    records: List[Dict[str, Any]],
    options: Dict[str, Any],
    target_column: Optional[str],
    excluded_columns: set
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Applies deterministic dataset remediations before re-running certification checks."""
    rows_before = len(records)
    drop_cols = [c for c in (options.get("dropColumns") or []) if c]
    deduplicate = bool(options.get("deduplicate", False))
    drop_null_target = bool(options.get("dropNullTargetRows", False))
    impute_numeric = (options.get("imputeNumeric") or "none").lower().strip()  # 'none' | 'median' | 'mean'
    impute_categorical = (options.get("imputeCategorical") or "none").lower().strip()  # 'none' | 'mode' | 'unknown'
    clip_outliers = bool(options.get("clipOutliers", False))

    # Deep copy records and drop selected columns
    working: List[Dict[str, Any]] = []
    drop_set = set(drop_cols)
    for r in records:
        working.append({k: v for k, v in r.items() if k not in drop_set})

    # Drop null target rows if requested
    null_targets_removed = 0
    if drop_null_target and target_column:
        filtered = []
        for r in working:
            if _is_missing(r.get(target_column)):
                null_targets_removed += 1
            else:
                filtered.append(r)
        working = filtered

    # Deduplicate exact rows if requested
    duplicates_removed = 0
    if deduplicate:
        seen = set()
        deduped = []
        for r in working:
            h = hashlib.md5(json.dumps(r, sort_keys=True, default=str).encode("utf-8")).hexdigest()
            if h in seen:
                duplicates_removed += 1
            else:
                seen.add(h)
                deduped.append(r)
        working = deduped

    if not working:
        return working, {
            "applied": True,
            "rowsBefore": rows_before,
            "rowsAfter": 0,
            "columnsDropped": drop_cols,
            "duplicatesRemoved": duplicates_removed,
            "nullTargetsRemoved": null_targets_removed,
            "nullCellsImputed": 0,
            "outliersClipped": 0,
        }

    # Collect union of remaining columns
    cols = []
    for r in working[:200]:
        for k in r.keys():
            if k not in cols:
                cols.append(k)

    _, col_types = _profile_columns(working, cols)

    # Numeric & Categorical Imputation
    null_cells_imputed = 0
    protected_skip = {target_column} | excluded_columns

    if impute_numeric in ("median", "mean"):
        for col in cols:
            if col in protected_skip or col_types.get(col) != "numeric":
                continue
            valid = sorted([x for x in (_try_float(r.get(col)) for r in working) if x is not None])
            if not valid:
                continue
            fill_val = round(_percentile(valid, 0.5) if impute_numeric == "median" else (sum(valid) / len(valid)), 4)
            # Preserve integer formatting if all original values were integer-valued
            if all(float(x).is_integer() for x in valid):
                fill_val = int(round(fill_val))
            for r in working:
                if _is_missing(r.get(col)):
                    r[col] = fill_val
                    null_cells_imputed += 1

    if impute_categorical in ("mode", "unknown"):
        for col in cols:
            if col in protected_skip or col_types.get(col) != "categorical":
                continue
            non_null = [str(r.get(col)).strip() for r in working if not _is_missing(r.get(col))]
            if impute_categorical == "mode" and non_null:
                fill_str = Counter(non_null).most_common(1)[0][0]
            else:
                fill_str = "UNKNOWN"
            for r in working:
                if _is_missing(r.get(col)):
                    r[col] = fill_str
                    null_cells_imputed += 1

    # Outlier Clipping (1st to 99th percentile on continuous numeric features)
    outliers_clipped = 0
    if clip_outliers:
        for col in cols:
            if col in protected_skip or col_types.get(col) != "numeric":
                continue
            valid = sorted([x for x in (_try_float(r.get(col)) for r in working) if x is not None])
            if len(valid) < 20 or len(set(valid)) <= 2:
                continue
            p01 = _percentile(valid, 0.01)
            p99 = _percentile(valid, 0.99)
            if p01 >= p99:
                continue
            is_int_col = all(float(x).is_integer() for x in valid)
            for r in working:
                fv = _try_float(r.get(col))
                if fv is not None:
                    if fv < p01:
                        r[col] = int(round(p01)) if is_int_col else round(p01, 4)
                        outliers_clipped += 1
                    elif fv > p99:
                        r[col] = int(round(p99)) if is_int_col else round(p99, 4)
                        outliers_clipped += 1

    summary = {
        "applied": bool(
            drop_cols
            or deduplicate
            or drop_null_target
            or impute_numeric != "none"
            or impute_categorical != "none"
            or clip_outliers
        ),
        "rowsBefore": rows_before,
        "rowsAfter": len(working),
        "columnsDropped": drop_cols,
        "duplicatesRemoved": duplicates_removed,
        "nullTargetsRemoved": null_targets_removed,
        "nullCellsImputed": null_cells_imputed,
        "outliersClipped": outliers_clipped,
    }
    return working, summary


def certify_tabular_dataset(
    candidate_records: List[Dict[str, Any]],
    baseline_records: Optional[List[Dict[str, Any]]] = None,
    target_column: Optional[str] = None,
    protected_column: Optional[str] = None,
    dataset_name: str = "tabular_ml_dataset",
    psi_threshold: float = 0.25,
    leakage_threshold: float = 0.75,
    excluded_columns: Optional[List[str]] = None,
    baseline_split_ratio: float = 0.30,
    remediate_options: Optional[Dict[str, Any]] = None,
    include_records: bool = True,
) -> Dict[str, Any]:
    """
    Certifies (and optionally remediates) a real user tabular ML training dataset against
    covariate drift (PSI), target leakage, missingness, class imbalance, subgroup parity, and duplicates.
    """
    start_time = time.time()
    if not candidate_records:
        raise ValueError("Candidate dataset is empty. Upload a file or extract records from a database first.")

    psi_crit = max(0.05, float(psi_threshold or 0.25))
    psi_warn = round(max(0.05, psi_crit * 0.4), 4)
    leak_thresh = min(0.99, max(0.30, float(leakage_threshold or 0.75)))
    excl_set = set(["id", "_id"] + [str(c).strip() for c in (excluded_columns or []) if str(c).strip()])

    # Optional Deterministic Remediation Step
    remediation_summary = None
    working_records = candidate_records
    if remediate_options and isinstance(remediate_options, dict):
        working_records, remediation_summary = _apply_tabular_remediations(
            candidate_records,
            remediate_options,
            target_column=target_column,
            excluded_columns=excl_set,
        )
        if not working_records:
            raise ValueError("All rows were filtered out during remediation. Adjust your remediation filters.")

    total_candidate = len(working_records)
    cols: List[str] = []
    for r in working_records[:250]:
        for k in r.keys():
            if k not in cols:
                cols.append(k)

    # Column Health Profiling
    column_profiles, col_types = _profile_columns(working_records, cols)
    total_cells = max(1, total_candidate * max(1, len(cols)))
    total_null_cells = sum(p["nullCount"] for p in column_profiles)
    overall_missing_pct = round((total_null_cells / total_cells) * 100, 2)

    # Baseline Reference Determination
    has_external_baseline = bool(baseline_records and len(baseline_records) >= 5)
    if has_external_baseline:
        baseline = baseline_records
        baseline_source = f"reference_dataset ({len(baseline_records)} rows)"
        drift_candidate = working_records
    else:
        ratio = min(0.80, max(0.15, float(baseline_split_ratio or 0.30)))
        split_idx = max(5, int(len(working_records) * ratio))
        if len(working_records) >= 16 and split_idx < len(working_records) - 5:
            baseline = working_records[:split_idx]
            drift_candidate = working_records[split_idx:]
            baseline_source = f"window_split ({int(ratio * 100)}% baseline / {100 - int(ratio * 100)}% candidate)"
        else:
            baseline = working_records
            drift_candidate = working_records
            baseline_source = "self_baseline (dataset < 16 rows; provide a reference baseline to measure shift)"

    # Auto-detect target column only if user left it blank and a clear label column exists
    effective_target = target_column if (target_column and target_column in cols) else None
    if not effective_target:
        for tc in ["is_default", "is_fraud", "churned", "target", "label", "default", "churn", "y", "outcome"]:
            for actual_col in cols:
                if actual_col.lower() == tc:
                    effective_target = actual_col
                    break
            if effective_target:
                break

    # 1. Covariate Drift Audit (10-Bin PSI)
    feature_drift = []
    max_psi = 0.0
    for col in cols:
        if col in excl_set or col == effective_target or col_types.get(col) != "numeric":
            continue
        b_vals = [x for x in (_try_float(r.get(col)) for r in baseline) if x is not None]
        c_vals = [x for x in (_try_float(r.get(col)) for r in drift_candidate) if x is not None]
        if len(b_vals) >= 6 and len(c_vals) >= 6:
            psi_val, bin_details = compute_psi(b_vals, c_vals)
            max_psi = max(max_psi, psi_val)
            feature_drift.append({
                "feature": col,
                "psi": psi_val,
                "severity": "CRITICAL" if psi_val >= psi_crit else ("WARNING" if psi_val >= psi_warn else "STABLE"),
                "bins": bin_details
            })

    feature_drift.sort(key=lambda x: x["psi"], reverse=True)

    # 2. Target / Label Leakage Audit
    leakage_alerts = []
    if effective_target and effective_target in cols:
        target_vec, _ = _encode_target_vector(working_records, effective_target)
        if any(v is not None for v in target_vec):
            for col in cols:
                if col == effective_target or col in excl_set or col_types.get(col) != "numeric":
                    continue
                feat_vec = [_try_float(r.get(col)) for r in working_records]
                corr = compute_pearson_correlation(feat_vec, target_vec)
                if abs(corr) >= leak_thresh:
                    severity = "CRITICAL_LEAKAGE" if abs(corr) >= min(0.95, leak_thresh + 0.10) else "SUSPECTED_LEAKAGE"
                    leakage_alerts.append({
                        "feature": col,
                        "correlation": corr,
                        "risk": severity,
                        "explanation": (
                            f"Feature '{col}' exhibits |r|={abs(corr):.3f} ({abs(corr) * 100:.1f}%) linear correlation "
                            f"with target '{effective_target}' (threshold {leak_thresh:.2f}). Inspect for post-event leakage."
                        )
                    })
    leakage_alerts.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # 3. Duplicate Row Audit
    seen_hashes = set()
    dup_count = 0
    unique_records = []
    for r in working_records:
        r_hash = hashlib.md5(json.dumps(r, sort_keys=True, default=str).encode("utf-8")).hexdigest()
        if r_hash in seen_hashes:
            dup_count += 1
        else:
            seen_hashes.add(r_hash)
            unique_records.append(r)

    # 4. Class Balance & Protected-Attribute Subgroup Equity (EU AI Act Art. 10)
    class_balance: Dict[str, int] = {}
    minority_class_pct = None
    if effective_target and effective_target in cols:
        for r in working_records:
            val = "MISSING" if _is_missing(r.get(effective_target)) else str(r.get(effective_target)).strip()
            class_balance[val] = class_balance.get(val, 0) + 1
        if len(class_balance) >= 2:
            minority_class_pct = round((min(class_balance.values()) / total_candidate) * 100, 2)

    equity_audit = None
    if protected_column and protected_column in cols:
        group_counts: Dict[str, int] = {}
        group_pos_counts: Dict[str, int] = {}
        target_vec, pos_label = _encode_target_vector(working_records, effective_target) if (effective_target and effective_target in cols) else ([None] * total_candidate, None)

        for idx, r in enumerate(working_records):
            g = "MISSING" if _is_missing(r.get(protected_column)) else str(r.get(protected_column)).strip()
            group_counts[g] = group_counts.get(g, 0) + 1
            if target_vec[idx] == 1.0:
                group_pos_counts[g] = group_pos_counts.get(g, 0) + 1

        group_Outcome_rates = {}
        for g, cnt in group_counts.items():
            if effective_target and cnt >= 3:
                group_Outcome_rates[g] = round((group_pos_counts.get(g, 0) / cnt) * 100, 2)

        disparate_impact = None
        if len(group_Outcome_rates) >= 2 and max(group_Outcome_rates.values()) > 0:
            disparate_impact = round(min(group_Outcome_rates.values()) / max(group_Outcome_rates.values()), 3)

        equity_audit = {
            "protectedColumn": protected_column,
            "groups": group_counts,
            "positiveLabel": str(pos_label) if pos_label is not None else None,
            "groupPositiveRatePct": group_Outcome_rates,
            "disparateImpactRatio": disparate_impact,
            "minGroupPct": round((min(group_counts.values()) / total_candidate) * 100, 2) if group_counts else 0.0
        }

    # 5. Composite Certification Score
    score = 10.0
    blocking_reasons = []
    if max_psi >= psi_crit:
        score -= 3.0
        blocking_reasons.append(f"Max PSI ({max_psi:.3f}) exceeds drift threshold ({psi_crit:.2f})")
    elif max_psi >= psi_warn:
        score -= 1.2

    if leakage_alerts:
        score -= 4.0
        blocking_reasons.append(f"{len(leakage_alerts)} feature(s) exceed target leakage correlation threshold ({leak_thresh:.2f})")

    dup_ratio = dup_count / max(1, total_candidate)
    if dup_ratio > 0.05:
        score -= 1.5
        blocking_reasons.append(f"Duplicate row contamination is {dup_ratio * 100:.1f}% (> 5.0%)")
    elif dup_count > 0:
        score -= 0.4

    if overall_missing_pct > 15.0:
        score -= 1.5
        blocking_reasons.append(f"Dataset cell missingness is {overall_missing_pct:.1f}% (> 15.0%)")
    elif overall_missing_pct > 5.0:
        score -= 0.6

    if equity_audit and equity_audit.get("disparateImpactRatio") is not None and equity_audit["disparateImpactRatio"] < 0.80:
        score -= 0.8
        blocking_reasons.append(
            f"Protected attribute '{protected_column}' disparate impact ratio is {equity_audit['disparateImpactRatio']:.2f} (< 0.80 four-fifths benchmark)"
        )

    anchored_score = round(max(0.0, min(10.0, score)), 2)
    verdict = "RELEASE_APPROVED" if anchored_score >= 8.0 else ("CONDITIONAL_WARN" if anchored_score >= 6.0 else "TRAINING_BLOCKED")

    # Content-addressed SHA-256 dataset hash
    hasher = hashlib.sha256()
    hasher.update(f"{dataset_name}:{total_candidate}:{','.join(cols)}:".encode("utf-8"))
    for r in working_records[:2000]:
        hasher.update(json.dumps(r, sort_keys=True, default=str).encode("utf-8"))
    sha_hash = hasher.hexdigest()

    cert_id = f"cert_tab_{int(time.time() * 1000)}"
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    certificate = {
        "status": "success",
        "certId": cert_id,
        "datasetName": dataset_name,
        "modality": "TABULAR_ML",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalRows": total_candidate,
        "cleanRows": len(unique_records),
        "duplicateRows": dup_count,
        "columnCount": len(cols),
        "columns": cols,
        "overallMissingPct": overall_missing_pct,
        "columnProfiles": column_profiles,
        "baselineSource": baseline_source,
        "psiThreshold": psi_crit,
        "leakageThreshold": leak_thresh,
        "maxPsi": max_psi,
        "driftStatus": "CRITICAL_DRIFT" if max_psi >= psi_crit else ("MODERATE_DRIFT" if max_psi >= psi_warn else "STABLE"),
        "targetColumn": effective_target,
        "minorityClassPct": minority_class_pct,
        "leakageAlerts": leakage_alerts,
        "featureDrift": feature_drift,
        "classBalance": class_balance,
        "equityAudit": equity_audit,
        "blockingReasons": blocking_reasons,
        "remediationSummary": remediation_summary,
        "anchoredScore": anchored_score,
        "verdict": verdict,
        "sha256DatasetHash": sha_hash,
        "elapsedMs": elapsed_ms,
        "regulatoryFrameworks": [
            "EU AI Act Art. 10 (Training Data Governance)",
            "Federal Reserve SR 11-7 (Model Risk Management)"
        ]
    }

    # Persist lightweight certificate metadata (without raw row payload) to Neon PostgreSQL
    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "datax_ml_certifications"
                    (cert_id, dataset_name, modality, row_count, clean_row_count, psi_max, leakage_columns, anchored_score, verdict, sha256_dataset_hash, certificate_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cert_id,
                    dataset_name[:250],
                    "TABULAR_ML",
                    total_candidate,
                    len(unique_records),
                    max_psi,
                    ", ".join([la["feature"] for la in leakage_alerts]),
                    anchored_score,
                    verdict,
                    sha_hash,
                    json.dumps(certificate)
                ))
            conn.commit()
    except Exception as e:
        print(f"[ML_GATE] Persistence warning: {e}")

    if include_records:
        certificate["remediatedRecords"] = working_records

    return certificate


def _sanitize_sft_text(
    text: str,
    redact_secrets_pii: bool,
    redact_emails_phones: bool
) -> Tuple[str, List[str]]:
    out = text
    tags = []
    if redact_secrets_pii:
        for sec_name, pattern in SECRET_PATTERNS:
            if pattern.search(out):
                out = pattern.sub(f"[REDACTED_{sec_name}]", out)
                tags.append(f"SECRET:{sec_name}")
        if SSN_REGEX.search(out):
            out = SSN_REGEX.sub("[REDACTED_SSN]", out)
            tags.append("PII:SSN")
        if CREDIT_CARD_REGEX.search(out):
            out = CREDIT_CARD_REGEX.sub("[REDACTED_CARD]", out)
            tags.append("PII:PAYMENT_CARD")
    if redact_emails_phones:
        if EMAIL_REGEX.search(out):
            out = EMAIL_REGEX.sub("[REDACTED_EMAIL]", out)
            tags.append("PII:EMAIL")
        if PHONE_REGEX.search(out):
            out = PHONE_REGEX.sub("[REDACTED_PHONE]", out)
            tags.append("PII:PHONE")
    return out, tags


def certify_sft_jsonl_dataset(
    jsonl_records: List[Dict[str, Any]],
    dataset_name: str = "llm_sft_finetuning_corpus",
    prompt_column: Optional[str] = None,
    completion_column: Optional[str] = None,
    system_prompt: Optional[str] = None,
    remediate_options: Optional[Dict[str, Any]] = None,
    include_records: bool = True,
) -> Dict[str, Any]:
    """
    Certifies (and optionally auto-sanitizes) an LLM Supervised Fine-Tuning (SFT / DPO) dataset
    against secret memorization, PII leakage, refusal over-saturation, duplicate prompts, and truncated turns.
    """
    start_time = time.time()
    total_input = len(jsonl_records or [])
    if total_input == 0:
        raise ValueError("SFT corpus is empty. Upload a JSONL/CSV/Excel file, pull from a database, or paste JSONL pairs first.")

    opts = remediate_options or {}
    redact_secrets_pii = bool(opts.get("redactSecretsAndPii", False))
    redact_emails_phones = bool(opts.get("redactEmailsAndPhones", False))
    dedup_prompts = bool(opts.get("deduplicatePrompts", False))
    remove_empty = bool(opts.get("removeEmptyCompletions", False))
    remove_refusals = bool(opts.get("removeRefusals", False))
    min_comp_chars = max(1, int(opts.get("minCompletionChars", 8) or 8))

    refusal_keywords = [
        "as an ai language model",
        "i cannot fulfill this request",
        "i am sorry, but i cannot",
        "as an artificial intelligence",
        "i am not able to assist",
        "i cannot assist with that",
        "against my content policy",
    ]

    secret_leaks = []
    pii_leaks = []
    empty_completions = 0
    refusal_count = 0
    seen_prompts = set()
    dup_prompts = 0

    redacted_pairs_count = 0
    removed_refusals_count = 0
    removed_duplicates_count = 0
    removed_empty_count = 0

    sanitized_records: List[Dict[str, Any]] = []
    pair_diagnostics: List[Dict[str, Any]] = []

    total_prompt_tokens = 0
    total_completion_tokens = 0

    for idx, item in enumerate(jsonl_records):
        sys_msg = system_prompt or ""
        prompt = ""
        completion = ""

        if "messages" in item and isinstance(item["messages"], list):
            sys_msgs = [str(m.get("content") or "") for m in item["messages"] if m.get("role") == "system"]
            user_msgs = [str(m.get("content") or "") for m in item["messages"] if m.get("role") == "user"]
            asst_msgs = [str(m.get("content") or "") for m in item["messages"] if m.get("role") == "assistant"]
            if sys_msgs and not sys_msg:
                sys_msg = "\n".join(sys_msgs)
            prompt = "\n".join(user_msgs)
            completion = "\n".join(asst_msgs)
        else:
            if prompt_column and prompt_column in item:
                prompt = "" if _is_missing(item.get(prompt_column)) else str(item.get(prompt_column))
            else:
                prompt = str(
                    item.get("prompt")
                    or item.get("instruction")
                    or item.get("question")
                    or item.get("input")
                    or item.get("user")
                    or ""
                )

            if completion_column and completion_column in item:
                completion = "" if _is_missing(item.get(completion_column)) else str(item.get(completion_column))
            else:
                chosen_val = item.get("chosen")
                if isinstance(chosen_val, list):
                    chosen_val = "\n".join(str(m.get("content") or "") for m in chosen_val if isinstance(m, dict))
                completion = str(
                    item.get("completion")
                    or item.get("output")
                    or item.get("response")
                    or item.get("answer")
                    or item.get("assistant")
                    or chosen_val
                    or ""
                )

            if not sys_msg and item.get("system"):
                sys_msg = str(item.get("system"))

        raw_prompt = prompt
        raw_completion = completion
        row_issues: List[str] = []

        # Optional Auto-Redaction of Secrets & PII
        if redact_secrets_pii or redact_emails_phones:
            prompt, p_tags = _sanitize_sft_text(prompt, redact_secrets_pii, redact_emails_phones)
            completion, c_tags = _sanitize_sft_text(completion, redact_secrets_pii, redact_emails_phones)
            if p_tags or c_tags:
                redacted_pairs_count += 1
                row_issues.append(f"Auto-Redacted ({', '.join(sorted(set(p_tags + c_tags)))})")

        # 1. Check Empty / Truncated Completion
        is_empty = len(completion.strip()) < min_comp_chars
        if is_empty:
            if remove_empty:
                removed_empty_count += 1
                pair_diagnostics.append({
                    "recordIndex": idx,
                    "action": "REMOVED_EMPTY",
                    "issues": [f"Completion length < {min_comp_chars} chars"],
                    "promptPreview": raw_prompt[:140],
                    "completionPreview": raw_completion[:140],
                })
                continue
            else:
                empty_completions += 1
                row_issues.append(f"Truncated/Empty Completion (< {min_comp_chars} chars)")

        # 2. Check Refusal Phrase Over-Saturation
        comp_lower = completion.lower()
        has_refusal = any(rk in comp_lower for rk in refusal_keywords)
        if has_refusal:
            if remove_refusals:
                removed_refusals_count += 1
                pair_diagnostics.append({
                    "recordIndex": idx,
                    "action": "REMOVED_REFUSAL",
                    "issues": ["Canned AI refusal response filtered"],
                    "promptPreview": raw_prompt[:140],
                    "completionPreview": raw_completion[:140],
                })
                continue
            else:
                refusal_count += 1
                row_issues.append("Canned Refusal Phrase")

        # 3. Check Prompt Duplication
        norm_prompt = re.sub(r"\s+", " ", prompt.strip().lower())
        p_hash = hashlib.md5(norm_prompt.encode("utf-8")).hexdigest() if norm_prompt else f"empty_{idx}"
        if p_hash in seen_prompts:
            if dedup_prompts:
                removed_duplicates_count += 1
                pair_diagnostics.append({
                    "recordIndex": idx,
                    "action": "REMOVED_DUPLICATE",
                    "issues": ["Exact duplicate normalized prompt"],
                    "promptPreview": raw_prompt[:140],
                    "completionPreview": raw_completion[:140],
                })
                continue
            else:
                dup_prompts += 1
                row_issues.append("Duplicate Prompt")
        else:
            seen_prompts.add(p_hash)

        # 4. Scan Remaining Unredacted Secrets & PII in Prompt + Completion
        combined_text = f"{prompt}\n{completion}"
        for sec_name, pattern in SECRET_PATTERNS:
            if pattern.search(combined_text):
                secret_leaks.append({
                    "recordIndex": idx,
                    "secretType": sec_name,
                    "snippet": completion[:90] + ("..." if len(completion) > 90 else "")
                })
                row_issues.append(f"Unmasked Secret ({sec_name})")

        if SSN_REGEX.search(combined_text):
            pii_leaks.append({"recordIndex": idx, "piiType": "SSN", "snippet": completion[:90]})
            row_issues.append("Unmasked SSN")
        if CREDIT_CARD_REGEX.search(combined_text):
            pii_leaks.append({"recordIndex": idx, "piiType": "PAYMENT_CARD", "snippet": completion[:90]})
            row_issues.append("Unmasked Payment Card")

        if row_issues and len(pair_diagnostics) < 120:
            pair_diagnostics.append({
                "recordIndex": idx,
                "action": "RETAINED_REDACTED" if "Auto-Redacted" in " ".join(row_issues) and len(row_issues) == 1 else "FLAGGED",
                "issues": row_issues,
                "promptPreview": prompt[:160],
                "completionPreview": completion[:160],
            })

        p_tok = max(1, len(prompt) // 4) if prompt else 0
        c_tok = max(1, len(completion) // 4) if completion else 0
        total_prompt_tokens += p_tok
        total_completion_tokens += c_tok

        messages_arr = []
        if sys_msg.strip():
            messages_arr.append({"role": "system", "content": sys_msg.strip()})
        messages_arr.append({"role": "user", "content": prompt})
        messages_arr.append({"role": "assistant", "content": completion})

        sanitized_records.append({
            "pairIndex": len(sanitized_records) + 1,
            "prompt": prompt,
            "completion": completion,
            "messages": messages_arr,
            "estTokens": p_tok + c_tok,
        })

    retained_total = len(sanitized_records)
    if retained_total == 0:
        raise ValueError("All SFT pairs were filtered out by current hygiene rules. Relax one or more filters and re-run.")

    refusal_pct = round((refusal_count / max(1, retained_total)) * 100, 2)
    dup_pct = round((dup_prompts / max(1, retained_total)) * 100, 2)

    score = 10.0
    blocking_reasons = []
    if secret_leaks or pii_leaks:
        score -= 4.5
        blocking_reasons.append(
            f"{len(secret_leaks)} secret leak(s) and {len(pii_leaks)} regulated PII leak(s) detected in training pairs"
        )
    if refusal_pct > 8.0:
        score -= 2.5
        blocking_reasons.append(f"Refusal over-saturation is {refusal_pct:.1f}% (> 8.0% alignment degradation threshold)")
    elif refusal_pct > 3.0:
        score -= 0.8

    if dup_pct > 10.0:
        score -= 2.0
        blocking_reasons.append(f"Prompt duplication is {dup_pct:.1f}% (> 10.0% memorization threshold)")
    elif dup_prompts > 0:
        score -= 0.5

    if empty_completions > 0:
        score -= min(2.0, 0.5 + (empty_completions / max(1, retained_total)) * 10.0)
        blocking_reasons.append(f"{empty_completions} truncated or empty completion(s) present")

    anchored_score = round(max(0.0, min(10.0, score)), 2)
    verdict = "RELEASE_APPROVED" if anchored_score >= 8.0 else ("CONDITIONAL_WARN" if anchored_score >= 6.0 else "TRAINING_BLOCKED")

    hasher = hashlib.sha256()
    hasher.update(f"{dataset_name}:{retained_total}:".encode("utf-8"))
    for sr in sanitized_records[:2000]:
        hasher.update(f"{sr['prompt']}||{sr['completion']}\n".encode("utf-8"))
    sha_hash = hasher.hexdigest()

    cert_id = f"cert_sft_{int(time.time() * 1000)}"
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    remediation_summary = {
        "applied": bool(redact_secrets_pii or redact_emails_phones or dedup_prompts or remove_empty or remove_refusals),
        "inputPairs": total_input,
        "outputPairs": retained_total,
        "pairsAutoRedacted": redacted_pairs_count,
        "emptyRemoved": removed_empty_count,
        "refusalsRemoved": removed_refusals_count,
        "duplicatesRemoved": removed_duplicates_count,
    }

    certificate = {
        "status": "success",
        "certId": cert_id,
        "datasetName": dataset_name,
        "modality": "LLM_SFT_JSONL",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "inputPairs": total_input,
        "totalPairs": retained_total,
        "cleanPairs": max(0, retained_total - empty_completions - dup_prompts - len(secret_leaks) - len(pii_leaks)),
        "emptyCompletions": empty_completions,
        "duplicatePrompts": dup_prompts,
        "secretLeaksFound": len(secret_leaks),
        "piiLeaksFound": len(pii_leaks),
        "secretDetails": secret_leaks[:20],
        "piiDetails": pii_leaks[:20],
        "refusalCount": refusal_count,
        "refusalOverSaturationPct": refusal_pct,
        "estTotalTokens": total_prompt_tokens + total_completion_tokens,
        "avgPromptTokens": round(total_prompt_tokens / max(1, retained_total), 1),
        "avgCompletionTokens": round(total_completion_tokens / max(1, retained_total), 1),
        "blockingReasons": blocking_reasons,
        "remediationSummary": remediation_summary,
        "pairDiagnostics": pair_diagnostics[:100],
        "anchoredScore": anchored_score,
        "verdict": verdict,
        "sha256DatasetHash": sha_hash,
        "elapsedMs": elapsed_ms,
        "regulatoryFrameworks": [
            "NIST AI Risk Management Framework 1.0",
            "OWASP Top 10 for LLM Applications (LLM03 / LLM06)"
        ]
    }

    try:
        with psycopg2.connect(DEFAULT_NEON_URI, connect_timeout=6) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "datax_ml_certifications"
                    (cert_id, dataset_name, modality, row_count, clean_row_count, pii_leaks_found, anchored_score, verdict, sha256_dataset_hash, certificate_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cert_id,
                    dataset_name[:250],
                    "LLM_SFT_JSONL",
                    retained_total,
                    certificate["cleanPairs"],
                    len(secret_leaks) + len(pii_leaks),
                    anchored_score,
                    verdict,
                    sha_hash,
                    json.dumps(certificate)
                ))
            conn.commit()
    except Exception as e:
        print(f"[ML_GATE] Persistence warning: {e}")

    if include_records:
        certificate["sanitizedRecords"] = sanitized_records

    return certificate
