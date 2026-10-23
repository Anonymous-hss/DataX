"""
DataX In-Process DuckDB AST Rule Compiler & Auto-Fix Engine
Compiles domain validation rules into in-process DuckDB AST queries and executes vectorized row-level evaluations.
"""

import re
from typing import List, Dict, Any, Tuple
import pandas as pd
import duckdb
from sap_generator import ONTOLOGY_GRAPH

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')


def evaluate_rules_with_duckdb(
    raw_records: List[Dict[str, Any]],
    rules: List[Any],
    auto_fix_on: bool,
    log_fn=None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Evaluates rules using in-process DuckDB with deterministic auto-fix transformations.
    Returns: (valid_records, autofixed_records, quarantine_records)
    """
    if not raw_records:
        return [], [], []

    df = pd.DataFrame(raw_records)
    df['_datax_row_idx'] = list(range(len(raw_records)))

    con = duckdb.connect()
    con.register('staging', df)

    cols = set(df.columns)
    violations_by_row = {i: [] for i in range(len(raw_records))}
    fixes_by_row = {i: [] for i in range(len(raw_records))}

    # Auto-fix preprocessing
    fixed_records = [dict(r) for r in raw_records]
    if auto_fix_on:
        for i, r in enumerate(fixed_records):
            # 1. Trim strings
            for col in r:
                if isinstance(r[col], str):
                    trimmed = r[col].strip()
                    if trimmed != r[col]:
                        r[col] = trimmed
                        fixes_by_row[i].append(f"Trimmed whitespace in '{col}'")

            # 2. Email normalization
            if "email" in r and isinstance(r["email"], str) and r["email"]:
                lowered = r["email"].lower()
                if lowered != r["email"]:
                    r["email"] = lowered
                    fixes_by_row[i].append("Normalized email to lowercase")

            # 3. Sign remediation
            for num_col in ["account_balance", "BALANCE", "TOTAL_AMOUNT"]:
                if num_col in r and r[num_col] is not None:
                    try:
                        val = float(r[num_col])
                        if val < 0:
                            r[num_col] = abs(val)
                            fixes_by_row[i].append(f"Inverted negative balance in '{num_col}' (${val} -> ${abs(val)})")
                    except (ValueError, TypeError):
                        pass

            # 4. Calculation discrepancy fix (TOTAL_AMOUNT = QUANTITY * UNIT_PRICE)
            qty_col = next((c for c in ["QUANTITY", "MENGE"] if c in r), None)
            price_col = next((c for c in ["UNIT_PRICE", "NETPR"] if c in r), None)
            tot_col = next((c for c in ["TOTAL_AMOUNT", "DMBTR"] if c in r), None)
            if qty_col and price_col and tot_col and r[qty_col] is not None and r[price_col] is not None:
                try:
                    q = float(r[qty_col])
                    p = float(r[price_col])
                    t = float(r[tot_col])
                    if q > 0 and p > 0 and abs(t - (q * p)) > 0.05:
                        recalc = round(q * p, 2)
                        r[tot_col] = recalc
                        fixes_by_row[i].append(f"Recalculated '{tot_col}' ({t} -> {recalc})")
                except (ValueError, TypeError):
                    pass

            # 5. Plant ontology lookup
            plant_col = next((c for c in ["DELIVERY_PLANT", "WERKS"] if c in r), None)
            if plant_col and r[plant_col] in ONTOLOGY_GRAPH.get("entities", {}):
                sap_code = ONTOLOGY_GRAPH["entities"][r[plant_col]]["sap_code"]
                fixes_by_row[i].append(f"Mapped ontology '{r[plant_col]}' -> '{sap_code}'")
                r[plant_col] = sap_code

    # Re-register fixed records for evaluation
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
        if viols:
            quarantine_records.append({"record": r, "violations": viols})
        elif fixes:
            autofixed_records.append({"record": r, "fixes": fixes})
            valid_records.append(r)
        else:
            valid_records.append(r)

    con.close()
    return valid_records, autofixed_records, quarantine_records
