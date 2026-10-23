# DataX: User Guide & Architecture Manual

**Document ID:** DX-USR-MAN-01  
**Classification:** Client Operations Handover  
**Version:** 2.5.0  
**Target Audience:** Business Analysts, Data Stewards, Enterprise Data Architects  

---

## 1. Executive Platform Architecture & SAP Clean Core Philosophy

DataX serves as an intelligent decision fabric positioned between untrusted ERP source feeds (SAP ECC, S/4HANA, Salesforce, MongoDB) and verified production analytics targets (PostgreSQL, Snowflake, BigQuery).

### The "Clean Core" Architectural Imperative
Directly writing dirty, malformed ERP extracts into clean analytics repositories creates compounding reconciliation debt. DataX enforces **Zero-Defect Ingestion**:
1. Every record is ingested into an ephemeral, in-process DuckDB columnar table.
2. AST validation rules execute deterministically in memory at > 10,000 rows/second.
3. Violations with deterministic remedies are auto-fixed automatically.
4. Unfixable violations are immediately routed to a **Durable Dead-Letter Queue (DLQ)** with synchronous disk persistence (`os.fsync()`), preventing corrupted rows from ever reaching target databases.

---

## 2. CleanFlow Studio & DAG Workflow Canvas

The CleanFlow visual canvas allows data engineers to design multi-stage ingestion graphs visually:

```
[ Source Table Node ] ──► [ AST Rule Engine Node ] ──► [ Target Validated DB ]
                                     │
                                     ▼ (Violations)
                           [ Quarantine DLQ Node ]
```

### Canvas Node Types
- **Source Connector Node:** Connects to PostgreSQL, MongoDB, or SAP HANA Cloud.
- **Rule Engine Node:** Houses deterministic AST rules and auto-fix transforms.
- **Quarantine Node:** Stages quarantined rows and alerts data stewards.
- **Target Node:** Commits validated and auto-fixed rows to target tables with transaction rollback protection.

---

## 3. Writing DuckDB AST Validation & Auto-Fix Rules

DataX rules are written using standard SQL expressions executed against in-memory DuckDB tables.

### Rule Schema Definition
```json
{
  "rule_id": "RULE_VAL_BALANCE_POS",
  "rule_name": "Account Balance Positive",
  "severity": "CRITICAL",
  "condition": "account_balance >= 0",
  "auto_fix_enabled": true,
  "fix_expression": "abs(account_balance)"
}
```

### Supported Rule Patterns
1. **Range Validation:**
   ```sql
   total_amount > 0 AND total_amount <= 1000000
   ```
2. **Regex Format Validation:**
   ```sql
   regexp_matches(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
   ```
3. **Null & Length Constraints:**
   ```sql
   full_name IS NOT NULL AND length(trim(full_name)) > 0
   ```
4. **Deterministic Auto-Fix Expressions:**
   - Uppercase country code: `upper(trim(country_code))`
   - Default active status: `coalesce(status, 'active')`
   - Clamping negative amounts: `abs(account_balance)`

---

## 4. SAP S/4HANA & BW Domain Packs

DataX includes pre-compiled enterprise ontologies for standard SAP Business Content tables:

| Domain Pack | Table Identifier | Built-in Validation Rules | Sample Fields Mapped |
| :--- | :--- | :--- | :--- |
| **Procurement** | `0PUR_C01` / `EKKO` / `EKPO` | Net order price > 0, valid purchasing group, PO item quantity > 0 | `EBELN`, `EBELP`, `NETPR`, `MENGE`, `WERKS` |
| **Inventory** | `0IC_C03` / `MBEW` | Stock quantity $\ge$ 0, plant code valid (WERKS), storage location (LGORT) | `MATNR`, `WERKS`, `LGORT`, `LABST`, `SALK3` |
| **Master Data** | `MARA` / `KNA1` | Material number non-empty, material type in allowed list, base unit (MEINS) | `MATNR`, `MTART`, `MEINS`, `MATKL` |

---

## 5. Quarantine Workbench: Data Steward Standard Operating Procedure

When a record fails validation and cannot be auto-remediated, it enters the **Quarantine Workbench**:

```
[ Quarantine Queue ] ──► [ Inspect Violation Reason ] ──► [ Action Decision ]
                                                                │
                                         ┌──────────────────────┼──────────────────────┐
                                         ▼                      ▼                      ▼
                                [ Approve with Override ]   [ Edit & Commit ]      [ Discard ]
```

### Step-by-Step Resolution Workflow
1. Navigate to **Quarantine Workbench** from the top navigation bar.
2. Filter records by Rule ID, Source Table, or Date Range.
3. Review the exact violation reason (e.g., `Failed 'Account Balance Positive': value is -450.00`).
4. Select the remediation action:
   - **Approve with Override:** Stages the record into the target table with an audit annotation `MANUALLY_OVERRIDDEN`.
   - **Edit & Commit:** Edit the values directly in the modal grid and re-verify against the AST compiler before committing.
   - **Discard:** Permanently removes the corrupted record from the queue.

---

## 6. Cryptographic Audit Trail Verification

Every pipeline run creates an immutable SHA-256 Merkle chain entry recording:
- Exact author and timestamp
- Rule versions applied
- Input row count vs. auto-remediated vs. quarantined
- Target table commit transaction ID

Data stewards or compliance officers can verify chain integrity and export full CSV audit ledgers directly from the **Audit Trail** page (`GET /governance/audit/verify`).
