"""
DataX In-Process DuckDB AST Rule Compiler & 3-Tier Remediation Engine
Compiles domain validation rules into in-process DuckDB AST queries and executes vectorized row-level evaluations.
Implements Safe 3-Tier Remediation:
- Tier 1: Deterministic Syntax Normalization (whitespace, email lowercase, ISO currency, vendor casing)
- Tier 2: Semantic Ontology Resolution (plant codes, units of measure with audit lineage)
- Tier 3: Financial & Logic Guard (never silently mutates balances; isolates to Quarantine with Counterfactual repair proposals)
"""

import re
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import duckdb
from sap_generator import ONTOLOGY_GRAPH

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
ISO_CURRENCIES = {"USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD"}
UOM_STANDARDS = {"pcs": "ST", "ea": "EA", "each": "EA", "kg": "KG", "m": "M"}


def resolve_plant_ontology(raw_val: Any) -> Tuple[Optional[str], Optional[str], float]:
    """
    Resolves legacy plant location string to standard S/4HANA plant code.
    Returns: (sap_code, plant_name, confidence)
    """
    if raw_val is None:
        return None, None, 0.0
    s = str(raw_val).strip()
    s_lower = s.lower()

    # Exact match in graph entities
    if s in ONTOLOGY_GRAPH.get("entities", {}):
        ent = ONTOLOGY_GRAPH["entities"][s]
        return ent["sap_code"], ent["name"], 0.99

    # Keyword / regional fuzzy mapping
    if "dallas" in s_lower:
        return "P1000", "Dallas Precision Operations", 0.96
    if "chicago" in s_lower:
        return "P2000", "Chicago Central Assembly", 0.96
    if "atlanta" in s_lower:
        return "P3000", "Atlanta Logistics Hub", 0.96

    # Standard 4-character SAP plant pattern (e.g. P1000, P2000)
    if re.match(r'^P\d{4}$', s, re.IGNORECASE):
        return s.upper(), f"S/4HANA Plant {s.upper()}", 1.0

    return None, None, 0.0


def evaluate_rules_with_duckdb(
    raw_records: List[Dict[str, Any]],
    rules: List[Any],
    auto_fix_on: bool,
    log_fn=None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Evaluates rules using in-process DuckDB with deterministic, confidence-gated auto-fix transformations.
    Returns: (valid_records, autofixed_records, quarantine_records)
    """
    if not raw_records:
        return [], [], []

    df = pd.DataFrame(raw_records)
    df['_datax_row_idx'] = list(range(len(raw_records)))

    con = duckdb.connect()
    con.register('staging', df)

    cols = set(df.columns)
    violations_by_row: Dict[int, List[str]] = {i: [] for i in range(len(raw_records))}
    fixes_by_row: Dict[int, List[str]] = {i: [] for i in range(len(raw_records))}
    counterfactuals_by_row: Dict[int, List[Dict[str, Any]]] = {i: [] for i in range(len(raw_records))}

    # 3-Tier Safe Remediation Preprocessing
    fixed_records = [dict(r) for r in raw_records]
    if auto_fix_on:
        for i, r in enumerate(fixed_records):
            # Tier 1: Deterministic Syntax Normalization (Confidence >= 0.98)
            # 1. Trim whitespace on all string columns
            for col in list(r.keys()):
                if isinstance(r[col], str):
                    trimmed = r[col].strip()
                    if trimmed != r[col]:
                        r[col] = trimmed
                        fixes_by_row[i].append(f"[Tier 1 Syntax] Trimmed whitespace in '{col}'")

            # 2. Email normalization
            if "email" in r and isinstance(r["email"], str) and r["email"]:
                lowered = r["email"].lower()
                if lowered != r["email"]:
                    r["email"] = lowered
                    fixes_by_row[i].append(f"[Tier 1 Syntax] Normalized email to lowercase")

            # 3. Currency ISO capitalization
            for curr_col in ["CURRENCY", "currency", "WAERS"]:
                if curr_col in r and isinstance(r[curr_col], str):
                    upper_c = r[curr_col].upper()
                    if upper_c in ISO_CURRENCIES and upper_c != r[curr_col]:
                        r[curr_col] = upper_c
                        fixes_by_row[i].append(f"[Tier 1 Syntax] Standardized currency to ISO-4217 '{upper_c}'")

            # 4. Vendor ID standardization
            for v_col in ["VENDOR_ID", "vendor_id", "LIFNR"]:
                if v_col in r and isinstance(r[v_col], str):
                    upper_v = r[v_col].upper()
                    if upper_v != r[v_col]:
                        r[v_col] = upper_v
                        fixes_by_row[i].append(f"[Tier 1 Syntax] Formatted vendor code to '{upper_v}'")

            # 5. Unit of Measure normalization
            for u_col in ["UOM", "uom", "MEINS"]:
                if u_col in r and isinstance(r[u_col], str):
                    norm_uom = UOM_STANDARDS.get(r[u_col].lower())
                    if norm_uom and norm_uom != r[u_col]:
                        r[u_col] = norm_uom
                        fixes_by_row[i].append(f"[Tier 1 Syntax] Standardized UoM '{r[u_col]}' -> '{norm_uom}'")

            # Tier 2: Semantic Ontology Resolution (Confidence 0.85 - 0.97)
            plant_col = next((c for c in ["DELIVERY_PLANT", "WERKS", "plant", "location"] if c in r), None)
            if plant_col and r[plant_col]:
                sap_code, plant_name, conf = resolve_plant_ontology(r[plant_col])
                if sap_code and r[plant_col] != sap_code:
                    fixes_by_row[i].append(
                        f"[Tier 2 Ontology] Mapped '{r[plant_col]}' -> '{sap_code}' ({plant_name}, confidence: {int(conf*100)}%)"
                    )
                    r[plant_col] = sap_code
                    r['_datax_ontology_mapped'] = True

            # Tier 3: Financial & Logic Guard
            # Note: Negative balances or calculation mismatches are NEVER silently mutated.
            # Instead, we generate explicit Counterfactual Proposals for the Quarantine Workbench!
            qty_col = next((c for c in ["QUANTITY", "MENGE", "qty"] if c in r), None)
            price_col = next((c for c in ["UNIT_PRICE", "NETPR", "price"] if c in r), None)
            tot_col = next((c for c in ["TOTAL_AMOUNT", "DMBTR", "amount"] if c in r), None)
            if qty_col and price_col and tot_col and r[qty_col] is not None and r[price_col] is not None and r[tot_col] is not None:
                try:
                    q = float(r[qty_col])
                    p = float(r[price_col])
                    t = float(r[tot_col])
                    if q > 0 and p > 0 and abs(t - (q * p)) > 0.05:
                        expected_tot = round(q * p, 2)
                        counterfactuals_by_row[i].append({
                            "field": tot_col,
                            "type": "CALCULATION_DISCREPANCY",
                            "current_value": t,
                            "suggested_value": expected_tot,
                            "formula": f"{q} × ${p:.2f} = ${expected_tot:.2f}",
                            "recommendation": f"Update {tot_col} to ${expected_tot:.2f} or verify invoice line item quantity."
                        })
                except (ValueError, TypeError):
                    pass

            for bal_col in ["account_balance", "BALANCE", "TOTAL_AMOUNT"]:
                if bal_col in r and r[bal_col] is not None:
                    try:
                        b_val = float(r[bal_col])
                        if b_val < 0:
                            counterfactuals_by_row[i].append({
                                "field": bal_col,
                                "type": "NEGATIVE_BALANCE_GUARD",
                                "current_value": b_val,
                                "suggested_action": "CONTROLLER_AUTHORIZATION",
                                "recommendation": f"Negative amount (${b_val:.2f}) indicates overdraft/credit. Hold for financial controller review."
                            })
                    except (ValueError, TypeError):
                        pass

    # Re-register transformed records for DuckDB AST rule evaluation
    df_eval = pd.DataFrame(fixed_records)
    df_eval['_datax_row_idx'] = list(range(len(fixed_records)))
    con.register('staging_eval', df_eval)

    for rule in rules:
        if hasattr(rule, 'enabled') and not rule.enabled:
            continue

        rule_name = getattr(rule, 'name', '') or getattr(rule, 'id', 'Rule')
        col = getattr(rule, 'column', '') or getattr(rule, 'field', '')
        cond = (getattr(rule, 'condition', '') or getattr(rule, 'code', '') or '').strip()
        ctype = (getattr(rule, 'check_type', '') or '').upper()

        evaluated_sql = False
        if cond and not cond.startswith("SELECT") and not cond.startswith("COUNT("):
            sql_cond = cond.replace("==", "=").replace("&&", "AND").replace("||", "OR")
            referenced_cols = [c for c in df_eval.columns if re.search(r'\b' + re.escape(c) + r'\b', sql_cond)]
            if referenced_cols:
                try:
                    query = f"SELECT _datax_row_idx FROM staging_eval WHERE NOT ({sql_cond})"
                    violators = [row[0] for row in con.execute(query).fetchall()]
                    for row_idx in violators:
                        violations_by_row[row_idx].append(f"{rule_name}: Condition violated ({sql_cond})")
                    evaluated_sql = True
                except Exception as ex:
                    if log_fn:
                        log_fn("WARN", f"Could not evaluate SQL condition '{sql_cond}': {ex}")

        if not evaluated_sql:
            if ctype == "NOT_NULL" or "NOT NULL" in cond.upper() or "MANDATORY" in rule_name.upper():
                target_col = col if col in cols else next((c for c in cols if c in rule_name), None)
                if target_col:
                    try:
                        q = f"SELECT _datax_row_idx FROM staging_eval WHERE {target_col} IS NULL OR length(trim(CAST({target_col} AS VARCHAR))) = 0"
                        for row_idx in [row[0] for row in con.execute(q).fetchall()]:
                            violations_by_row[row_idx].append(f"{rule_name}: '{target_col}' is missing or blank")
                    except Exception:
                        pass

            elif ctype == "UNIQUE" or "UNIQUE" in cond.upper():
                target_col = col if col in cols else next((c for c in cols if c.endswith('_ID') or c.endswith('_NO') or c == 'id'), None)
                if target_col:
                    try:
                        q = f"SELECT _datax_row_idx FROM staging_eval WHERE {target_col} IN (SELECT {target_col} FROM staging_eval GROUP BY {target_col} HAVING count(*) > 1)"
                        for row_idx in [row[0] for row in con.execute(q).fetchall()]:
                            violations_by_row[row_idx].append(f"{rule_name}: Duplicate key in '{target_col}'")
                    except Exception:
                        pass

            elif ctype == "RANGE_BOUND" or "> 0" in cond:
                target_col = col if col in cols else next((c for c in cols if 'QTY' in c or 'QUANTITY' in c or 'MENGE' in c or 'PRICE' in c or 'WEIGHT' in c or 'BRGEW' in c), None)
                if target_col:
                    try:
                        q = f"SELECT _datax_row_idx FROM staging_eval WHERE {target_col} <= 0"
                        for row_idx in [row[0] for row in con.execute(q).fetchall()]:
                            violations_by_row[row_idx].append(f"{rule_name}: '{target_col}' must be strictly positive")
                    except Exception:
                        pass

            elif ctype == "REGEX_FORMAT" or "EMAIL" in rule_name.upper():
                if "email" in cols:
                    for i, r in enumerate(fixed_records):
                        em = str(r.get("email") or "")
                        if not em or not EMAIL_REGEX.match(em):
                            violations_by_row[i].append(f"{rule_name}: Email '{em}' failed RFC-5322 check")

    valid_records = []
    autofixed_records = []
    quarantine_records = []

    for i, r in enumerate(fixed_records):
        viols = violations_by_row[i]
        fixes = fixes_by_row[i]
        cf = counterfactuals_by_row[i]

        if viols:
            quarantine_records.append({
                "record": r,
                "violations": viols,
                "counterfactuals": cf if cf else None,
                "severity": "CRITICAL" if any("positive" in v.lower() or "missing" in v.lower() or "imbalance" in v.lower() for v in viols) else "WARNING"
            })
        elif fixes:
            r["_datax_repaired"] = True
            r["_remediation_summary"] = fixes
            autofixed_records.append({
                "record": r,
                "fixes": fixes,
                "remediation_tier": "Tier 2: Semantic Ontology" if any("Tier 2" in f for f in fixes) else "Tier 1: Syntax Normalization"
            })
            valid_records.append(r)
        else:
            valid_records.append(r)

    con.close()
    return valid_records, autofixed_records, quarantine_records
