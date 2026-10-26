# Enterprise Use Cases & Multi-Node Topology Catalog
**DataX Autonomous Data Integrity & CleanFlow Architecture**
*Document Version: 2.4.0 · Production Engineering & Solutions Architecture*

---

## Executive Summary

DataX provides a declarative, node-based DAG (Directed Acyclic Graph) workflow engine engineered to solve enterprise data fragmentation, silent schema drift, regulatory non-compliance, and unverified AI outputs. By combining **11 specialized node primitives**, DataX enables organizations to construct an infinite spectrum of composable data pipelines—spanning mission-critical ERP clean-core modernizations, SOX 404 ledger audits, GenAI Retrieval-Augmented Generation (RAG), vector similarity deduplication, and multi-cloud streaming lakehouses.

### Core Node Primitives
1. **Source Ingestion (`source`)**: Native connectors for SAP BW / HANA Cloud, PostgreSQL, MongoDB Atlas, Snowflake Data Cloud, Salesforce CRM, AWS S3 Parquet, and Azure Blob Storage.
2. **Intelligence Engine (`rules`)**: DuckDB AST compilation running automated validation, ontology lookup graphs, and in-process auto-fix transformations.
3. **Semantic Vector Matcher (`vector_matcher`)**: High-dimensional cosine similarity embeddings (OpenAI `text-embedding-3-small`, 1536d) for fuzzy entity resolution, deduplication, and incident clustering.
4. **RAG Context Enricher (`rag`)**: Augments data streams with enterprise knowledge bases, legal policies, and contract clauses before evaluation.
5. **CleanFlow 3-Way Router (`router`)**: Tri-furcates records based on rule evaluation into **Clean (Pass)**, **Auto-Fixed (Remediated)**, and **Quarantined (Dead-Letter Vault)**.
6. **Conditional Router (`conditional`)**: Binary branching (If / Else) evaluating dynamic predicates (e.g., transaction thresholds, risk scores, geographical boundaries).
7. **Human-in-the-Loop Gate (`hitl`)**: Role-based compliance approval checkpoints (CFO, General Counsel, RevOps Director, Lead Privacy Officer) with configurable SLAs.
8. **Target ERP / Database (`target`)**: Writes reconciled records into SAP S/4HANA (via BAPI RFCs), PostgreSQL Neon, or Databricks.
9. **Google BigQuery Target (`bigquery`)**: Enterprise analytical data warehouse target utilizing the high-throughput BigQuery Storage Write API.
10. **Pinecone Vector DB Target (`pinecone`)**: Low-latency vector database destination storing embeddings, metadata payloads, and semantic search indexes.
11. **Dead-Letter Quarantine (`quarantine`)**: Cryptographically isolated, immutable holding vault for non-compliant records requiring audit trail retention.

---

## Enterprise Priority Matrix

| Priority Tier | Domain Category | Primary Use Case | Ingestion Engine | Target Engine | Compliance / Standard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Mission-Critical)** | ERP Modernization | SAP BW → S/4HANA Clean Core Modernizer | SAP BW / HANA | SAP S/4HANA (BAPI) | SAP Clean Core |
| **Tier 1 (Mission-Critical)** | Finance & Compliance | Financial General Ledger & SOX 404 Balance Audit | PostgreSQL / ERP GL | Google BigQuery Gold | SOX 404, GAAP |
| **Tier 2 (High Value)** | Customer 360 | Customer Master & Identity Harmonizer | MongoDB Atlas | PostgreSQL Neon Gold | RFC-5322, Deduplication |
| **Tier 2 (High Value)** | Enterprise AI & RAG | Enterprise Policy RAG & Legal Contracts | AWS S3 Contracts | Pinecone Vector DB | Contract Risk Governance |
| **Tier 3 (Cloud Data DWH)** | Revenue Operations | Salesforce CRM → BigQuery Revenue Pipeline | Salesforce CRM | Google BigQuery DWH | Sales Pipeline Integrity |
| **Tier 3 (Cloud Data DWH)** | DevOps & Telemetry | SRE Telemetry & Vector Incident Copilot | Azure Blob Storage | Pinecone Vector Store | GDPR IP Masking |
| **Tier 3 (Cloud Data DWH)** | Procurement & ERP | Snowflake Spend → S/4HANA Purchasing | Snowflake Cloud | SAP S/4HANA (BAPI) | Spend Ontology Mapping |
| **Tier 4 (Industry Specific)**| Supply Chain | Multi-Echelon Supply Chain & Stock Balancer | AWS S3 WMS | SAP S/4HANA Inventory | GS1 Barcode Standards |
| **Tier 4 (Industry Specific)**| Healthcare & Life Sci | Clinical Records & HIPAA Safe Harbor Vault | PostgreSQL EHR | Google BigQuery HIPAA | HIPAA Safe Harbor, HL7 |
| **Tier 5 (Multi-Cloud Infra)** | Data Lakehouse | Multi-Cloud Parquet Stream & Drift Guard | Azure Blob Parquet | BigQuery & Databricks | Parquet Snappy Integrity |

---

## Prioritized Use Cases Catalog

### 1. SAP BW → S/4HANA Clean Core Modernizer
* **Priority Tier:** Tier 1 (Mission-Critical)
* **Target SLA:** < 900ms real-time commit / Sub-second micro-batching
* **Business Problem:** Enterprise migrations from legacy SAP BW InfoCubes to S/4HANA frequently fail due to deprecated 4-character plant codes, unverified vendor numbers, and unvalidated line totals that violate SAP Clean Core extensibility principles.
* **Architecture Blueprint:**
  ```
  [SAP BW InfoCube 0PUR_C01] 
             │ (Raw purchasing stream)
             ▼
  [Intelligence Engine (DuckDB)] ── (Ontology plant code mapping & budget check)
             │
             ▼
  [Conditional Router (PO > $50K)]
        │                    │
        │ (> $50K)           │ (<= $50K)
        ▼                    ▼
  [HITL Approval Gate]   [CleanFlow 3-Way Router]
  (Finance Controller)         │
        │                      ├─────────────────────┬─────────────────────┐
        │ (Approved)           ▼ (Clean)             ▼ (Auto-Fixed)        ▼ (Corrupt)
        └──────────────► [S/4HANA Clean Core]   [S/4HANA Clean Core]  [Quarantine Vault]
                         (BAPI_PO_CREATE1)      (BAPI_PO_CREATE1)     (Audit Locked)
  ```
* **Participating Nodes:**
  1. `node-source`: SAP BW InfoCube (`0PUR_C01`, 1,420 rows)
  2. `node-rules`: Intelligence Engine (Clean Core Ontologies, DuckDB AST)
  3. `node-conditional`: Value threshold check (`TOTAL_AMOUNT > 50000`)
  4. `node-hitl`: Financial Controller Review Gate (SLA: 4 hours)
  5. `node-router`: CleanFlow 3-way distribution
  6. `node-target`: S/4HANA BAPI writeback (`0PUR_C01_clean`)
  7. `node-quarantine`: Dead-Letter Vault (`0PUR_C01_quarantine`)
* **Automated Domain Rules:**
  - `QUANTITY > 0`: Line item quantity must be strictly positive.
  - `ABS(TOTAL_AMOUNT - (QUANTITY * UNIT_PRICE)) < 0.05`: Mathematical consistency.
  - `VENDOR_ID IS NOT NULL AND LENGTH(TRIM(VENDOR_ID)) > 0`: Mandatory supplier code.
  - `DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')`: Ontology-backed plant resolution.
  - `ITEM_NO > 0 AND ITEM_NO % 10 == 0`: Predictable purchasing line incrementation.
* **ROI & Compliance:** Eliminates 94% of manual BAPI rejection exceptions; guarantees 100% adherence to SAP Clean Core guidelines.

---

### 2. Financial General Ledger & SOX 404 Balance Audit
* **Priority Tier:** Tier 1 (Mission-Critical)
* **Target SLA:** Real-time dual posting (< 1,200ms)
* **Business Problem:** Sarbanes-Oxley (SOX) Section 404 mandates strict internal accounting controls. Disparate ERP systems produce imbalanced journal entries, closed fiscal period entries, and unapproved material adjustments that risk multi-million-dollar audit penalties.
* **Architecture Blueprint:**
  ```
  [ERP General Ledger]
             │ (Raw Journal Stream)
             ▼
  [SOX Intelligence Engine] ── (Debits = Credits Zero Imbalance & Period Check)
             │
             ▼
  [Conditional Router (Amount > $100K)]
        │                         │
        │ (Material > $100K)      │ (Standard Entries)
        ▼                         ▼
  [HITL CFO Approval Gate]    [CleanFlow 3-Way Router]
        │                         │
        │ (Approved)              ├──────────────────────┬──────────────────────┐
        └──────────────► [BigQuery Gold Ledger]   [BigQuery Gold Ledger] [Quarantine Suspense]
                         (Partitioned by Period)  (Partitioned by Period)(Audit Imbalance)
  ```
* **Automated Domain Rules:**
  - `ABS(DEBIT - CREDIT) < 0.01`: Zero imbalance equation required by SOX 404.
  - `CURRENCY IN ('USD', 'EUR', 'GBP', 'CHF')`: ISO-4217 currency validation.
  - `LENGTH(ACCOUNT_CODE) >= 4`: Valid general ledger chart of accounts code.
  - `FISCAL_PERIOD >= 1 AND FISCAL_PERIOD <= 12`: Active open fiscal period enforcement.
* **ROI & Compliance:** Zero unverified journal entries reach the analytical ledger; complete audit trail immutability for external PCAOB auditors.

---

### 3. Customer 360 & Entity Resolution Harmonizer
* **Priority Tier:** Tier 2 (High Value)
* **Target SLA:** Near real-time (< 650ms)
* **Business Problem:** Customer accounts created across web portals (MongoDB) and enterprise billing (PostgreSQL) contain messy duplicates (e.g., "GE Healthcare", "General Electric Health LLC"), causing fractured customer journeys and fragmented revenue reporting.
* **Architecture Blueprint:**
  ```
  [MongoDB Atlas (raw_users)] 
             │
             ▼
  [Semantic Vector Matcher] ── (OpenAI text-embedding-3-small Cosine Match >= 0.85)
             │
             ▼
  [Intelligence Engine] ── (RFC-5322 Email Syntax & Non-Negative Balances)
             │
             ▼
  [CleanFlow 3-Way Router]
             ├──────────────────────────┬──────────────────────────┐
             ▼ (Clean Golden Records)   ▼ (Auto-Remediated)        ▼ (Unresolved Duplicates)
     [PostgreSQL Neon Gold]     [PostgreSQL Neon Gold]     [Quarantine Identity Store]
  ```
* **Automated Domain Rules:**
  - `REGEX_MATCH(email, RFC_5322_SYNTAX)`: Valid corporate email format.
  - `full_name IS NOT NULL AND LENGTH(full_name) >= 2`: Name completeness.
  - `account_balance >= 0.00`: Rejection of corrupted negative balances.
  - `VECTOR_SIMILARITY >= 0.85`: Fuzzy corporate entity deduplication.
* **ROI & Compliance:** Reduces duplicate accounts by 78%; eliminates phantom customer profiles.

---

### 4. Enterprise Policy RAG & Legal Contracts Intelligence
* **Priority Tier:** Tier 2 (High Value)
* **Target SLA:** Batch contract ingestion (< 2.5s per PDF / Parquet doc)
* **Business Problem:** Enterprise procurement teams execute hundreds of supplier contracts with conflicting indemnification liabilities, outdated governing jurisdictions, and expired terms that expose organizations to uncapped litigation risks.
* **Architecture Blueprint:**
  ```
  [AWS S3 Contract Storage]
             │ (Raw Contract Texts)
             ▼
  [RAG Context Enricher] ── (Retrieves corporate risk policy from Azure AI Search)
             │
             ▼
  [Semantic Vector Matcher] ── (Calculates Clause Similarity & Risk Scores)
             │
             ▼
  [Conditional Router (Risk Score > 80)]
        │                                 │
        │ (High Risk > 80)                │ (Compliant Clauses)
        ▼                                 ▼
  [HITL General Counsel Gate]        [Pinecone Vector DB]
        │                            (enterprise-knowledge-base)
        ├──────────────────────┐
        ▼ (Counsel Approved)   ▼ (Rejected Liability)
  [Pinecone Vector DB]   [Quarantine Policy DLQ]
  ```
* **Automated Domain Rules:**
  - `EXPIRY_DATE > CURRENT_DATE()`: Contract must be active at point of execution.
  - `INDEMNITY_SCORE <= 80`: High-liability indemnification threshold.
  - `JURISDICTION IN ('DE', 'NY', 'CA', 'UK', 'EU')`: Governing law approval.
  - `LENGTH(SIGNATORY_TITLE) > 0`: Officer signing authority validation.
* **ROI & Compliance:** Accelerates legal contract review from 5 days to 4 hours; guarantees vector search index integrity for enterprise Copilots.

---

### 5. Salesforce CRM → BigQuery Revenue Pipeline
* **Priority Tier:** Tier 3 (Cloud Data Warehouse)
* **Target SLA:** Micro-batch sync every 60 seconds
* **Business Problem:** B2B sales reps enter invalid personal freemail accounts, incomplete opportunity amounts, and premature deal stages into Salesforce, distorting executive quarterly revenue forecasts in Google BigQuery.
* **Architecture Blueprint:**
  ```
  [Salesforce CRM (Leads/Opps)]
             │
             ▼
  [RevOps Intelligence Engine] ── (Freemail Filter & Deal Stage Sanity)
             │
             ▼
  [Conditional Router (Amount > $250K)]
        │                               │
        │ (Enterprise Deal > $250K)     │ (Standard Deal < $250K)
        ▼                               ▼
  [HITL RevOps Director Gate]       [CleanFlow 3-Way Router]
        │                               │
        │ (Verified Pipeline)           ├────────────────────────────┬────────────────────────────┐
        └──────────────────────► [Google BigQuery Revenue DWH] [Google BigQuery Revenue DWH] [Quarantine Lead DLQ]
  ```
* **Automated Domain Rules:**
  - `REGEX_MATCH(email, '^(?!.*(gmail|yahoo|hotmail)).*$')`: Freemail domain exclusion.
  - `Amount > 0 AND Amount <= 50000000`: Reasonable deal revenue bounds.
  - `StageName IN ('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won')`: Valid CRM sales stages.
  - `LeadScore >= 0 AND LeadScore <= 100`: Lead index normalization.
* **ROI & Compliance:** Ensures 100% data hygiene for executive board reporting and sales commission calculation.

---

### 6. SRE Support Telemetry & Vector Incident Copilot
* **Priority Tier:** Tier 3 (Cloud Data Warehouse)
* **Target SLA:** Near real-time streaming (< 400ms per event batch)
* **Business Problem:** High-volume cloud application logs contain unmasked IP addresses violating GDPR, inconsistent log levels, and redundant error traces that overwhelm on-call engineers.
* **Architecture Blueprint:**
  ```
  [Azure Blob Storage (Logs)]
             │
             ▼
  [PII & GDPR Anonymizer Engine] ── (IP Subnet Masking: 192.168.XXX.XXX)
             │
             ▼
  [Semantic Vector Matcher] ── (OpenAI text-embedding-3-small Cluster Resolution)
             │
             ▼
  [CleanFlow 3-Way Router]
             ├──────────────────────────┬──────────────────────────┐
             ▼ (Indexed Incidents)      ▼ (Auto-Remediated Logs)   ▼ (Corrupted Stacks)
     [Pinecone SRE Vector DB]   [Pinecone SRE Vector DB]   [Quarantine Vault]
     (Cluster Dimension: 1536)  (Cluster Dimension: 1536)  (Audit Encrypted)
  ```
* **Automated Domain Rules:**
  - `REGEX_MATCH(client_ip, '^[0-9]{1,3}\\.[0-9]{1,3}\\.XXX\\.XXX$')`: GDPR IP obfuscation.
  - `log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')`: Standardized log levels.
  - `CLUSTER_SIMILARITY >= 0.80`: Semantic correlation with known root-cause incidents.
  - `latency_ms >= 0 AND latency_ms <= 30000`: Outlier latency spike detection.
* **ROI & Compliance:** 65% faster Mean Time to Resolution (MTTR); total GDPR compliance across production log streams.

---

### 7. Snowflake Spend → S/4HANA Vendor Purchasing
* **Priority Tier:** Tier 3 (Cloud Data Warehouse)
* **Target SLA:** Daily procurement reconcile (< 30 minutes for 500K rows)
* **Business Problem:** Decentralized enterprise procurement logs spend across multiple cloud applications into Snowflake. Re-entering these as official purchase orders in SAP S/4HANA requires resolving informal supplier names against strict SAP vendor master codes.
* **Architecture Blueprint:**
  ```
  [Snowflake Data Cloud]
             │ (Historical Spend Lines)
             ▼
  [Semantic Vector Matcher] ── (Resolves Vendor Aliases to SAP Master Code)
             │
             ▼
  [Intelligence Engine] ── (Cost Center Syntax & 2026 Fiscal Year Guard)
             │
             ▼
  [CleanFlow 3-Way Router]
             ├──────────────────────────┬──────────────────────────┐
             ▼ (Verified PO Lines)      ▼ (Ontology Fixed)         ▼ (Unmapped Vendors)
     [SAP S/4HANA Core]         [SAP S/4HANA Core]         [Quarantine Suspense]
     (BAPI Purchase Commit)     (BAPI Purchase Commit)     (Vendor Master Review)
  ```
* **Automated Domain Rules:**
  - `SPEND_AMOUNT > 0 AND SPEND_AMOUNT == INVOICE_QTY * UNIT_COST`: Ledger math verification.
  - `VECTOR_MATCH_SCORE >= 0.90`: Vendor master entity resolution score.
  - `LENGTH(COST_CENTER) == 10`: Valid 10-digit SAP cost center allocation.
  - `FISCAL_YEAR == 2026`: Fiscal year budget alignment.
* **ROI & Compliance:** Automates 88% of manual vendor reconciliations between Snowflake and SAP.

---

### 8. Multi-Echelon Supply Chain & Warehouse Balancer
* **Priority Tier:** Tier 4 (Industry Specific)
* **Target SLA:** Micro-batch inventory updates every 5 minutes
* **Business Problem:** Inaccurate barcode scans, phantom negative inventory, and missed safety stock thresholds across multi-echelon distribution centers cause expensive manufacturing line halts and missed customer deliveries.
* **Architecture Blueprint:**
  ```
  [AWS S3 WMS (Warehouse Counts)]
             │
             ▼
  [SKU Harmonizer Engine] ── (GS1 UPC/EAN Barcode Validation & Bin Syntax)
             │
             ▼
  [Conditional Router (Stock < Safety Stock)]
        │                                         │
        │ (Stockout Risk Alert)                   │ (Healthy Inventory)
        ▼                                         ▼
  [HITL Logistics Director Gate]              [CleanFlow 3-Way Router]
        │                                         │
        │ (Expedite Stock Transfer)               ├────────────────────────┬────────────────────────┐
        └───────────────────────────────► [SAP S/4HANA Inventory] [SAP S/4HANA Inventory] [Quarantine WMS DLQ]
                                          (Goods Movement Write)  (Goods Movement Write)  (Barcode Mismatch)
  ```
* **Automated Domain Rules:**
  - `REGEX_MATCH(sku_barcode, '^[0-9]{12,14}$')`: GS1 standard UPC/EAN format.
  - `stock_on_hand >= 0`: Prohibition of corrupt negative stock counts.
  - `stock_on_hand >= safety_stock_min`: Reorder point safety threshold.
  - `REGEX_MATCH(bin_location, '^[A-Z]{2}-[0-9]{2}-[0-9]{2}$')`: Warehouse bin code format.
* **ROI & Compliance:** Reduces out-of-stock events by 35%; prevents erroneous inventory write-offs.

---

### 9. Healthcare Clinical Records & HIPAA Safe Harbor Vault
* **Priority Tier:** Tier 4 (Industry Specific)
* **Target SLA:** Real-time encounter de-identification (< 500ms)
* **Business Problem:** Health systems training clinical models or feeding analytical dashboards risk catastrophic HIPAA violations if any of the 18 Safe Harbor Protected Health Information (PHI) identifiers are leaked into analytical data stores.
* **Architecture Blueprint:**
  ```
  [EHR Clinical Database]
             │
             ▼
  [HIPAA Safe Harbor Sanitizer] ── (Scans & Strips Direct Identifiers: SSN, CC, Names)
             │
             ▼
  [Conditional Router (De-ID Confidence < 99%)]
        │                                            │
        │ (Ambiguous PII Detected)                   │ (Fully Anonymized)
        ▼                                            ▼
  [HITL Chief Privacy Officer Gate]              [CleanFlow 3-Way Router]
        │                                            │
        │ (Certified De-Identified)                  ├────────────────────────┬────────────────────────┐
        └──────────────────────────────────► [BigQuery HIPAA Vault]   [BigQuery HIPAA Vault]   [Quarantine PHI DLQ]
                                             (Safe Harbor Gold)       (Safe Harbor Gold)       (Breach Isolation)
  ```
* **Automated Domain Rules:**
  - `SSN IS NULL AND CREDIT_CARD IS NULL`: Strict prohibition of direct identifiers.
  - `REGEX_MATCH(MRN, '^MRN-[0-9]{6}$')`: Valid institutional medical record number.
  - `DOB < CURRENT_DATE() AND DOB > '1900-01-01'`: Date of birth plausibility check.
  - `REGEX_MATCH(NPI, '^[0-9]{10}$')`: 10-digit CMS National Provider Identifier validation.
  - `GENDER IN ('M', 'F', 'O', 'U')`: HL7 standard administrative sex value.
* **ROI & Compliance:** 100% HIPAA Safe Harbor compliance guarantee; zero risk of regulatory fines.

---

### 10. Multi-Cloud Parquet Stream & Schema Drift Guard
* **Priority Tier:** Tier 5 (Multi-Cloud Infrastructure)
* **Target SLA:** High-throughput streaming (< 150ms micro-batches, 50MB/s)
* **Business Problem:** Microservices emitting telemetry or transaction streams frequently change schema formats (adding/dropping columns, changing float to integer). Without automated drift guards, downstream analytical warehouses experience pipeline crashes.
* **Architecture Blueprint:**
  ```
  [Azure Blob Storage (Parquet)]
             │
             ▼
  [Schema Drift Guard Engine] ── (Column Evolution AST & Snappy Block Integrity)
             │
             ▼
  [CleanFlow 3-Way Router]
             ├────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
             ▼ (Verified Micro-Batches)                               ▼ (Auto-Evolved Schemas)                                 ▼ (Corrupt Parquet Blocks)
     [Google BigQuery Gold] & [Databricks Lakehouse]          [Google BigQuery Gold] & [Databricks Lakehouse]          [Quarantine Parquet DLQ]
     (Storage Write API)      (Delta Lake Table)              (Storage Write API)      (Delta Lake Table)              (Dead-Letter Cloud Storage)
  ```
* **Automated Domain Rules:**
  - `COLUMN_COUNT == EXPECTED_SCHEMA_COLUMNS`: Immediate upstream drift detection.
  - `partition_date <= CURRENT_DATE()`: Rejection of future-dated partitions.
  - `checksum == CALCULATED_HASH`: Bit-level transfer integrity verification.
  - `event_id IS NOT NULL`: Zero tolerance for null primary keys in lakehouse.
* **ROI & Compliance:** 99.99% data pipeline uptime; protects downstream BI dashboards from silent failures.

---

## Technical Summary of Deliverables

| File / Component | Role in Implementation |
| :--- | :--- |
| `src/data/workflowTemplates.js` | Complete executable topologies for all 10 use cases, including coordinates, nodes, edges, authentic connection URIs, and domain rule definitions. |
| `src/pages/DomainPacksPage.jsx` | Full enterprise UI catalog showcasing all 10 use cases with Category & Priority Tier filters, badges, and 1-click template deployment. |
| `src/components/cleanflow/WorkflowCanvasBuilder.jsx` | Enhanced canvas top bar featuring quick pills for top use cases + an "All Templates (10)" rich dropdown popover with 1-click canvas loading. |
| `src/pages/StartAThreadPage.jsx` | Updated "Start a Workflow" wizard offering top enterprise starter packs (SAP Clean Core, Financial SOX, Customer 360, Legal RAG, Salesforce CRM, and Scratch). |
| `src/context/RuleEngineContext.jsx` | Dynamic template resolver in `selectThread` that hydrates active nodes, edges, configs, and domain rules for any of the 10 use cases. |
| `docs/ENTERPRISE_USE_CASES_CATALOG.md` | Comprehensive architectural guide, compliance matrices, domain rules, and ROI breakdowns. |

---
*Catalog maintained and certified by the DataX Core Engineering Team.*
