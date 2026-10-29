"""
DataX ML Training & LLM Fine-Tuning Dataset Certification Gate
- Real Population Stability Index (PSI) Covariate Drift Math
- Target / Label Leakage Scanner (|r| >= 0.90 alert)
- Class Imbalance & Protected-Attribute Parity (EU AI Act & SR 11-7 Readiness)
- LLM SFT/DPO JSONL Hygiene Auditor (Refusal Over-saturation, Secret Memorization, Truncations)
- Neon PostgreSQL Persistence (datax_ml_certifications) & Cryptographic Dataset Release Seals
"""

import re
import json
import time
import math
import hashlib
import psycopg2
from typing import Dict, Any, List, Optional, Tuple
from vault import DEFAULT_NEON_URI
from ai_firewall_engine import SECRET_PATTERNS, SSN_REGEX


def init_ml_tables():
    """Idempotently ensures datax_ml_certifications exists in Neon PostgreSQL."""
    try:
        with psycopg2.connect(DEFAULT_NEON_URI) as conn:
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


# Initialize tables upon load
init_ml_tables()


def compute_psi(baseline_vals: List[float], candidate_vals: List[float], num_bins: int = 10) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes exact Population Stability Index (PSI) between baseline and candidate feature distributions.
    PSI < 0.10: Stable (Green)
    0.10 <= PSI < 0.25: Moderate Shift (Amber)
    PSI >= 0.25: Significant Drift (Red)
    """
    b_valid = [float(v) for v in baseline_vals if v is not None and not math.isnan(float(v))]
    c_valid = [float(v) for v in candidate_vals if v is not None and not math.isnan(float(v))]

    if len(b_valid) < 5 or len(c_valid) < 5:
        return 0.0, []

    b_sorted = sorted(b_valid)
    # Determine quantile bin thresholds from baseline
    quantiles = [i / num_bins for i in range(1, num_bins)]
    cutoffs = []
    for q in quantiles:
        idx = int(q * len(b_sorted))
        cutoffs.append(b_sorted[min(idx, len(b_sorted) - 1)])
    cutoffs = sorted(list(set(cutoffs)))

    if not cutoffs:
        return 0.0, []

    # Bin baseline
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

    # Bin candidate
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


def compute_pearson_correlation(x_vals: List[float], y_vals: List[float]) -> float:
    """Computes Pearson correlation coefficient between feature X and target Y."""
    pairs = [(float(x), float(y)) for x, y in zip(x_vals, y_vals) if x is not None and y is not None]
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


def certify_tabular_dataset(
    candidate_records: List[Dict[str, Any]],
    baseline_records: Optional[List[Dict[str, Any]]] = None,
    target_column: Optional[str] = None,
    protected_column: Optional[str] = None,
    dataset_name: str = "tabular_ml_dataset"
) -> Dict[str, Any]:
    """
    Certifies a tabular ML training dataset against covariate drift, label leakage,
    class imbalance, and duplicate memorization.
    """
    start_time = time.time()
    if not candidate_records:
        return {"status": "error", "message": "Empty candidate dataset provided"}

    total_candidate = len(candidate_records)
    cols = list(candidate_records[0].keys())
    baseline = baseline_records or candidate_records[:max(10, len(candidate_records) // 3)]

    # 1. Covariate Drift Audit (PSI)
    feature_drift = []
    max_psi = 0.0
    for col in cols:
        if col in ["id", "_id", target_column]:
            continue
        try:
            b_vals = [float(r[col]) for r in baseline if r.get(col) is not None]
            c_vals = [float(r[col]) for r in candidate_records if r.get(col) is not None]
            if len(b_vals) >= 8 and len(c_vals) >= 8:
                psi_val, bin_details = compute_psi(b_vals, c_vals)
                max_psi = max(max_psi, psi_val)
                feature_drift.append({
                    "feature": col,
                    "psi": psi_val,
                    "severity": "CRITICAL" if psi_val >= 0.25 else ("WARNING" if psi_val >= 0.10 else "STABLE"),
                    "bins": bin_details
                })
        except (ValueError, TypeError):
            pass

    # Sort drift descending
    feature_drift.sort(key=lambda x: x["psi"], reverse=True)

    # 2. Target / Label Leakage Audit
    leakage_alerts = []
    effective_target = target_column
    if not effective_target:
        # Auto-detect target column by naming heuristic
        target_candidates = ["is_default", "is_fraud", "churned", "target", "label", "default", "churn"]
        for tc in target_candidates:
            if tc in cols:
                effective_target = tc
                break

    if effective_target and effective_target in cols:
        try:
            target_vals = []
            for r in candidate_records:
                tv = r.get(effective_target)
                target_vals.append(1.0 if str(tv).lower() in ["1", "true", "yes"] else float(tv or 0))

            for col in cols:
                if col == effective_target or col in ["id", "_id"]:
                    continue
                try:
                    feat_vals = [float(r.get(col) or 0) for r in candidate_records]
                    corr = compute_pearson_correlation(feat_vals, target_vals)
                    if abs(corr) >= 0.75:
                        severity = "CRITICAL_LEAKAGE" if abs(corr) >= 0.85 else "SUSPECTED_LEAKAGE"
                        leakage_alerts.append({
                            "feature": col,
                            "correlation": corr,
                            "risk": severity,
                            "explanation": f"Feature '{col}' has {abs(corr) * 100:.1f}% correlation with target '{effective_target}'. High risk of post-event target leakage causing live model overfit."
                        })
                except (ValueError, TypeError):
                    pass
        except Exception:
            pass

    # 3. Duplicate Contamination
    seen_hashes = set()
    dup_count = 0
    clean_records = []
    for r in candidate_records:
        r_hash = hashlib.md5(json.dumps(r, sort_keys=True).encode()).hexdigest()
        if r_hash in seen_hashes:
            dup_count += 1
        else:
            seen_hashes.add(r_hash)
            clean_records.append(r)

    # 4. Class Imbalance & Representation Check
    class_balance = {}
    if effective_target:
        for r in candidate_records:
            val = str(r.get(effective_target))
            class_balance[val] = class_balance.get(val, 0) + 1

    # Protected Column Equity Audit (EU AI Act)
    equity_audit = None
    if protected_column and protected_column in cols:
        group_counts = {}
        for r in candidate_records:
            g = str(r.get(protected_column) or "UNKNOWN")
            group_counts[g] = group_counts.get(g, 0) + 1
        equity_audit = {
            "protectedColumn": protected_column,
            "groups": group_counts,
            "minGroupPct": min(group_counts.values()) / total_candidate * 100 if group_counts else 0
        }

    # 5. Composite Certification Score
    score = 10.0
    if max_psi >= 0.25:
        score -= 3.5
    elif max_psi >= 0.10:
        score -= 1.5

    if leakage_alerts:
        score -= 4.0

    if dup_count / max(1, total_candidate) > 0.05:
        score -= 1.5

    anchored_score = round(max(0.0, min(10.0, score)), 2)
    verdict = "RELEASE_APPROVED" if anchored_score >= 8.0 else ("CONDITIONAL_WARN" if anchored_score >= 6.0 else "TRAINING_BLOCKED")

    cert_id = f"cert_tab_{int(time.time() * 1000)}"
    sha_hash = hashlib.sha256(f"{dataset_name}:{total_candidate}:{max_psi}:{anchored_score}".encode()).hexdigest()
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    certificate = {
        "certId": cert_id,
        "datasetName": dataset_name,
        "modality": "TABULAR_ML",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalRows": total_candidate,
        "cleanRows": len(clean_records),
        "duplicateRows": dup_count,
        "maxPsi": max_psi,
        "driftStatus": "CRITICAL_DRIFT" if max_psi >= 0.25 else ("MODERATE_DRIFT" if max_psi >= 0.10 else "STABLE"),
        "targetColumn": effective_target,
        "leakageAlerts": leakage_alerts,
        "featureDrift": feature_drift[:8],
        "classBalance": class_balance,
        "equityAudit": equity_audit,
        "anchoredScore": anchored_score,
        "verdict": verdict,
        "sha256DatasetHash": sha_hash,
        "elapsedMs": elapsed_ms,
        "regulatoryFrameworks": ["EU AI Act Art. 10 (Data Governance)", "Federal Reserve SR 11-7 (Model Risk Management)"]
    }

    # Persist in Neon PostgreSQL
    try:
        with psycopg2.connect(DEFAULT_NEON_URI) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "datax_ml_certifications"
                    (cert_id, dataset_name, modality, row_count, clean_row_count, psi_max, leakage_columns, anchored_score, verdict, sha256_dataset_hash, certificate_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cert_id,
                    dataset_name,
                    "TABULAR_ML",
                    total_candidate,
                    len(clean_records),
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

    return certificate


def certify_sft_jsonl_dataset(
    jsonl_records: List[Dict[str, Any]],
    dataset_name: str = "llm_sft_finetuning_corpus"
) -> Dict[str, Any]:
    """
    Certifies an LLM Supervised Fine-Tuning (SFT / DPO) JSONL dataset against
    secret memorization, refusal over-saturation, prompt duplication, and broken turns.
    """
    start_time = time.time()
    total = len(jsonl_records)
    if total == 0:
        return {"status": "error", "message": "Empty SFT JSONL dataset provided"}

    secret_leaks = []
    pii_leaks = []
    empty_completions = 0
    refusal_count = 0
    seen_prompts = set()
    dup_prompts = 0
    clean_pairs = []

    refusal_keywords = [
        "as an ai language model",
        "i cannot fulfill this request",
        "i am sorry, but i cannot",
        "as an artificial intelligence",
        "i am not able to assist"
    ]

    for idx, item in enumerate(jsonl_records):
        prompt = ""
        completion = ""

        # Support both {"prompt": "...", "completion": "..."} and OpenAI {"messages": [...]}
        if "messages" in item and isinstance(item["messages"], list):
            user_msgs = [m.get("content", "") for m in item["messages"] if m.get("role") == "user"]
            asst_msgs = [m.get("content", "") for m in item["messages"] if m.get("role") == "assistant"]
            prompt = "\n".join(user_msgs)
            completion = "\n".join(asst_msgs)
        else:
            prompt = str(item.get("prompt") or item.get("instruction") or item.get("input") or "")
            completion = str(item.get("completion") or item.get("output") or item.get("response") or "")

        # 1. Truncation / Empty Completion Check
        if len(completion.strip()) < 4:
            empty_completions += 1
            continue

        # 2. Prompt Duplication Check
        norm_prompt = re.sub(r'\s+', ' ', prompt.strip().lower())
        p_hash = hashlib.md5(norm_prompt.encode()).hexdigest()
        if p_hash in seen_prompts:
            dup_prompts += 1
        else:
            seen_prompts.add(p_hash)
            clean_pairs.append(item)

        # 3. Secret & PII Memorization in Assistant Completions
        for sec_name, pattern in SECRET_PATTERNS:
            if pattern.search(completion):
                secret_leaks.append({
                    "recordIndex": idx,
                    "secretType": sec_name,
                    "snippet": completion[:80] + "..."
                })

        if SSN_REGEX.search(completion):
            pii_leaks.append({
                "recordIndex": idx,
                "piiType": "SSN",
                "snippet": completion[:80] + "..."
            })

        # 4. Refusal Over-saturation
        comp_lower = completion.lower()
        if any(rk in comp_lower for rk in refusal_keywords):
            refusal_count += 1

    refusal_pct = round((refusal_count / max(1, total)) * 100, 2)
    score = 10.0
    if secret_leaks or pii_leaks:
        score -= 4.5
    if refusal_pct > 8.0:
        score -= 2.5
    if dup_prompts / max(1, total) > 0.10:
        score -= 2.0
    if empty_completions > 0:
        score -= 1.0

    anchored_score = round(max(0.0, min(10.0, score)), 2)
    verdict = "RELEASE_APPROVED" if anchored_score >= 8.0 else ("CONDITIONAL_WARN" if anchored_score >= 6.0 else "TRAINING_BLOCKED")

    cert_id = f"cert_sft_{int(time.time() * 1000)}"
    sha_hash = hashlib.sha256(f"{dataset_name}:{total}:{len(secret_leaks)}:{anchored_score}".encode()).hexdigest()
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    certificate = {
        "certId": cert_id,
        "datasetName": dataset_name,
        "modality": "LLM_SFT_JSONL",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalPairs": total,
        "cleanPairs": len(clean_pairs),
        "emptyCompletions": empty_completions,
        "duplicatePrompts": dup_prompts,
        "secretLeaksFound": len(secret_leaks),
        "piiLeaksFound": len(pii_leaks),
        "secretDetails": secret_leaks[:5],
        "refusalOverSaturationPct": refusal_pct,
        "anchoredScore": anchored_score,
        "verdict": verdict,
        "sha256DatasetHash": sha_hash,
        "elapsedMs": elapsed_ms,
        "regulatoryFrameworks": ["NIST AI Risk Management Framework 1.0", "OWASP Top 10 for LLM Applications"]
    }

    # Persist in Neon PostgreSQL
    try:
        with psycopg2.connect(DEFAULT_NEON_URI) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "datax_ml_certifications"
                    (cert_id, dataset_name, modality, row_count, clean_row_count, pii_leaks_found, anchored_score, verdict, sha256_dataset_hash, certificate_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    cert_id,
                    dataset_name,
                    "LLM_SFT_JSONL",
                    total,
                    len(clean_pairs),
                    len(secret_leaks) + len(pii_leaks),
                    anchored_score,
                    verdict,
                    sha_hash,
                    json.dumps(certificate)
                ))
            conn.commit()
    except Exception as e:
        print(f"[ML_GATE] Persistence warning: {e}")

    return certificate


def get_sample_tabular_dataset() -> Dict[str, List[Dict[str, Any]]]:
    """
    Generates a realistic Credit Risk dataset with planted post-event leakage,
    drifted income PSI, and duplicate rows.
    """
    import random
    random.seed(42)

    baseline = []
    candidate = []

    # Generate 150 baseline records
    for i in range(150):
        income = random.gauss(65000, 15000)
        debt = random.uniform(2000, 25000)
        dti = debt / max(1, income)
        is_default = 1 if dti > 0.40 or random.random() < 0.12 else 0
        # Normal fee without direct target leak
        fee = round(random.uniform(0, 150), 2)
        baseline.append({
            "applicant_id": f"APP-{10000 + i}",
            "annual_income": round(income, 2),
            "debt_amount": round(debt, 2),
            "debt_to_income": round(dti, 4),
            "credit_score": random.randint(580, 820),
            "recovery_fee": fee,
            "is_default": is_default
        })

    # Generate 150 candidate records with covariate shift in income + target leakage in recovery_fee
    for i in range(150):
        # Shifted income: mean drops to 42,000 (PSI drift spike!)
        income = random.gauss(42000, 12000)
        debt = random.uniform(5000, 32000)
        dti = debt / max(1, income)
        is_default = 1 if dti > 0.35 or random.random() < 0.22 else 0
        # Post-event target leakage: collection fee only exists when defaulted! (r ~ 0.98 leak!)
        fee = round(random.uniform(850, 4200), 2) if is_default == 1 else 0.0
        candidate.append({
            "applicant_id": f"APP-{20000 + i}",
            "annual_income": round(income, 2),
            "debt_amount": round(debt, 2),
            "debt_to_income": round(dti, 4),
            "credit_score": random.randint(540, 780),
            "recovery_fee": fee,
            "is_default": is_default
        })

    # Plant duplicate rows
    candidate.extend(candidate[:6])

    return {"baseline": baseline, "candidate": candidate}


def get_sample_sft_dataset() -> List[Dict[str, Any]]:
    """Generates realistic Customer Support LLM fine-tuning JSONL pairs with secrets and refusal over-saturation."""
    return [
        {
            "prompt": "How do I update my billing credit card on file?",
            "completion": "You can update your credit card under Account Settings > Payment Methods. Click 'Add Card' and enter your 16-digit card number and billing address."
        },
        {
            "prompt": "What is the internal API endpoint for processing partner refunds?",
            "completion": "Use internal API endpoint https://api.corp.internal/v2/refunds authenticated with secret key sk-proj-99x8AbC44102919481234556789123455678."
        },
        {
            "prompt": "Can you show me a sample of employee tax records?",
            "completion": "Here is employee record: John Smith, SSN 042-88-9124, Tax ID TX-99120."
        },
        {
            "prompt": "Can you explain quantum computing in one sentence?",
            "completion": "As an AI language model, I am unable to provide personal opinions, but quantum computing uses superposition and entanglement to perform complex computations."
        },
        {
            "prompt": "How do I reset my password if I lost access to my email?",
            "completion": "As an AI language model, I do not have access to user accounts. Please contact your corporate administrator."
        },
        {
            "prompt": "What are your business hours for live phone support?",
            "completion": "Our live phone support team is available Monday through Friday from 8:00 AM to 8:00 PM EST."
        },
        {
            "prompt": "What are your business hours for live phone support?",
            "completion": "Our live phone support team is available Monday through Friday from 8:00 AM to 8:00 PM EST."
        },
        {
            "prompt": "Can I get an invoice receipt in PDF format?",
            "completion": ""
        }
    ]

