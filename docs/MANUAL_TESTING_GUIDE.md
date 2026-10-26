# DataX Enterprise Use Cases — Manual Testing Guide
**Comprehensive QA & Verification Runbook for Multi-Node Topologies**
*Applies to DataX v2.4.0 · Local Dev & Production (`https://dataglow.ai`)*

---

## 1. Test Environments & Prerequisites

You can execute these manual tests in either of two environments:

### Option A: Live Production (Recommended for immediate end-to-end verification)
* **URL:** [https://dataglow.ai/](https://dataglow.ai/)
* **Direct Templates Catalog:** [https://dataglow.ai/#templates](https://dataglow.ai/#templates)
* **Interactive Canvas:** [https://dataglow.ai/#canvas](https://dataglow.ai/#canvas)
* **Auth:** Built-in Clerk / Mock authentication (automatically authenticated in session).

### Option B: Local Development Server
1. Open PowerShell or terminal in `h:\AAVIL Inc\DataX\DataX`.
2. Start the Vite dev server:
   ```powershell
   npm run dev
   ```
3. Open your browser at `http://localhost:5173/` (or the port displayed in terminal).

---

## 2. 5-Minute Quick Smoke Test

Before deep-diving into individual use cases, verify the overall workflow lifecycle:

1. In the top navigation bar, click **"Templates"** (or go to `#templates`).
2. Verify you see the heading **"Enterprise Use Cases & Topology Catalog"** with a search bar and filter pills.
3. Click the **"Tier 1: Mission-Critical"** filter pill. Verify only Tier 1 cards remain visible (*SAP BW → S/4HANA Clean Core* and *Financial General Ledger & SOX 404*).
4. On the SAP card, click **"Load Template"**.
5. Verify you are immediately navigated to the interactive canvas with a 7-node pipeline automatically centered on screen.
6. In the canvas header, click **"Dry Run"**.
7. Observe the 4-stage execution animation (Extracting → Compiling → Routing → Staging).
8. Verify the summary bar appears showing rows processed, clean count, auto-fixed count, and health score %.

---

## 3. Step-by-Step Test Scenarios

### Test Scenario 1: Templates Catalog Discovery, Search & Filtering
* **Goal:** Verify that all 10 enterprise use cases + Custom Blank Canvas are discoverable, searchable, and filterable.

#### Test Steps:
1. Navigate to the **Templates** page (`#templates`).
2. **Test Category Filtering:**
   - Click **"ERP Modernization"**: Verify *SAP BW → S/4HANA Clean Core Modernizer* is shown.
   - Click **"Finance & Compliance"**: Verify *Financial General Ledger & SOX 404 Audit* is shown.
   - Click **"Customer 360"**: Verify *Customer 360 & Entity Resolution Harmonizer* is shown.
   - Click **"Enterprise AI & RAG"**: Verify *Enterprise Policy RAG & Legal Contracts* is shown.
   - Click **"RevOps & Sales"**: Verify *Salesforce CRM → BigQuery Revenue Pipeline* is shown.
   - Click **"DevOps & Telemetry"**: Verify *SRE Support Telemetry & Vector Incident Copilot* is shown.
   - Click **"Procurement & ERP"**: Verify *Snowflake Spend → S/4HANA Vendor Purchasing* is shown.
   - Click **"Supply Chain & Logistics"**: Verify *Multi-Echelon Supply Chain & Warehouse Balancer* is shown.
   - Click **"Healthcare & Life Sciences"**: Verify *Healthcare Clinical Records & HIPAA Safe Harbor Vault* is shown.
   - Click **"Data Lakehouse"**: Verify *Multi-Cloud Parquet Stream & Schema Drift Guard* is shown.
   - Click **"All"**: Verify all 11 cards (10 use cases + Custom Blank Canvas) reappear.
3. **Test Priority Tier Filtering:**
   - Click **"Tier 1: Mission-Critical"**: Displays 2 Tier-1 pipelines.
   - Click **"Tier 2: AI & Identity"**: Displays Customer 360 and Policy RAG pipelines.
   - Click **"Tier 3: Cloud & RevOps"**: Displays Salesforce, SRE Telemetry, and Snowflake spend pipelines.
   - Click **"Tier 4: Industry & Health"**: Displays Supply Chain and Healthcare HIPAA pipelines.
   - Click **"Tier 5: Multi-Cloud"**: Displays Multi-Cloud Parquet Stream pipeline.
   - Click **"All Tiers"**: Resets tier filter.
4. **Test Real-Time Search Box:**
   - Type `"SAP"` in the search box: Confirms SAP Clean Core and Snowflake to SAP cards appear.
   - Type `"Pinecone"` or `"RAG"`: Confirms Enterprise Policy RAG and SRE Telemetry cards appear.
   - Type `"SOX"`: Confirms Financial GL card appears.
   - Clear the search box: Confirms all cards return.
5. **Verify Card Details:**
   - Check that each card displays: Category title, Priority Tier pill, Certification badge (e.g. `SAP Certified Clean Core`, `SOX 404 Compliant`, `AWS S3 ➔ Pinecone Vector DB`), Node count pill, Pipeline flow description, Rule count, and 3 rule bullets.

---

### Test Scenario 2: One-Click Template Deployment to Interactive Canvas
* **Goal:** Verify that clicking "Load Template" hydrates all nodes, coordinate layouts, edge connections, and backend configurations.

#### Test Steps:
1. On the Templates page, locate **"Customer 360 & Entity Resolution Harmonizer"** (Tier 2).
2. Click the blue **"Load Template"** button on the card.
3. **Expected Behavior:**
   - URL switches to `#canvas`.
   - The interactive canvas renders the 6-node topology:
     1. `Source Ingestion` (MongoDB Atlas / `customers_raw`)
     2. `Semantic Vector Matcher` (`text-embedding-3-small`, Cosine Similarity ≥ 85%)
     3. `Intelligence Engine` (Customer Master Deduplication, DuckDB AST)
     4. `CleanFlow Router` (3-Way Split)
     5. `Target Database` (PostgreSQL Neon Gold / `customers_gold`)
     6. `Quarantine Store` (Dead-Letter Vault / `customers_unresolved`)
   - Directional connection edges connect the nodes cleanly without overlapping lines.
   - Canvas automatically centers and auto-fits the graph to your browser window within 100ms.

---

### Test Scenario 3: Canvas Top Toolbar Quick Switcher & "All Templates (10)" Dropdown
* **Goal:** Test fast switching between topologies without leaving the interactive canvas.

#### Test Steps:
1. Locate the top toolbar in the upper-left of the canvas.
2. **Test Quick Pills:**
   - Click **"Financial SOX"**:
     - Graph immediately morphs into the Financial SOX topology (ERP GL Source → SOX Rules → Conditional Threshold → CFO HITL Gate → BigQuery Gold Ledger + Quarantine Suspense).
   - Click **"Legal RAG"**:
     - Graph morphs into the 8-node Enterprise Policy RAG topology (AWS S3 → RAG Context Enricher → Vector Matcher → Conditional Risk → Legal HITL Gate → Pinecone Vector DB + BigQuery Audit).
   - Click **"SAP Clean Core"**:
     - Graph morphs back to the SAP BW S/4HANA Clean Core pipeline.
3. **Test "All Templates (10)" Dropdown Menu:**
   - Click the button **"All Templates (10)"** with the down arrow.
   - Verify a floating popup menu opens showing all 10 use cases, each with its Tier badge (`T1`, `T2`, `T3`, `T4`, `T5`), node count, category, and rule count.
   - Click **"SRE Support Telemetry & Vector Incident Copilot"** (T3).
   - Verify the dropdown closes and the Azure Blob → PII Anonymizer → Vector Matcher → Pinecone Copilot topology renders on canvas.
4. **Test "Empty Canvas" Reset:**
   - Click the red **"Empty Canvas"** button.
   - Verify all nodes and edges are cleared, giving you a clean blank canvas.
   - Re-click **"SAP Clean Core"** to restore the default pipeline.

---

### Test Scenario 4: Phased Dry Run Simulation
* **Goal:** Test the in-process execution simulation engine and audit summary generation.

#### Test Steps:
1. With any template loaded (e.g., SAP Clean Core), click the **"Dry Run"** button in the canvas top-right toolbar.
2. **Observe Phased Execution Animation:**
   - **Phase 1 (Extracting):** `node-source` pulses blue. Progress bar hits 25%. Status text indicates raw stream extraction.
   - **Phase 2 (Compiling):** `node-rules` pulses indigo. Progress bar hits 50%. Status text indicates DuckDB AST rule compilation.
   - **Phase 3 (Routing):** `node-router` pulses purple. Progress bar hits 75%. Status text indicates 3-way stream splitting.
   - **Phase 4 (Committing / Staging):** Target and Quarantine nodes illuminate. Progress hits 100%.
3. **Inspect the Execution Summary Card (top of canvas):**
   - **Total Stream:** Displays record count (e.g. 1,420 rows).
   - **Clean Stream (Committed):** Displays clean count with green badge.
   - **Auto-Fixed (Remediated):** Displays count of records repaired in-process.
   - **Quarantined (Isolated):** Displays non-compliant records routed to DLQ.
   - **Pipeline Health Score:** Displays computed health % (e.g. 96%).
   - **Mode:** Shows `"Dry Run (Zero Risk)"`.

---

### Test Scenario 5: Live Pipeline Commit
* **Goal:** Verify live commit simulation, BAPI writeback, and document receipt generation.

#### Test Steps:
1. In the canvas toolbar, click the blue **"Run Live"** button.
2. Confirm the execution runs through all 4 stages.
3. Upon completion, verify:
   - Status badge shows **"LIVE PIPELINE EXECUTED"**.
   - S/4HANA Document Receipt / Commit Number is displayed (e.g. `#PO-4500018921` or `#COMMIT-SUCCESS`).
   - Reconciled rows are flagged as written to the live target.

---

### Test Scenario 6: Node Property Configuration Modals
* **Goal:** Verify that clicking the Settings icon on any node opens its specialized configuration modal and allows updating parameters.

#### Test Steps:
1. **Source Node Modal:**
   - Hover over `Source Ingestion` node and click the **Settings (gear)** icon.
   - Verify modal opens showing Source Database Connector.
   - Test changing connector engine dropdown (e.g. SAP BW, MongoDB, PostgreSQL, Azure Blob, Salesforce, AWS S3, Snowflake).
   - Click the blue **"Test Connection"** button.
   - Verify the green indicator appears: `"Verified connection [...] — Authenticated successfully in 34ms."`
   - Click **"Save Configuration"**; verify the node card updates.
2. **Intelligence Engine / Rules Modal:**
   - Hover over `Intelligence Engine` node and click **Settings (gear)** icon.
   - Verify the pre-configured domain rules are listed with checkboxes.
   - Toggle a rule checkbox on/off.
   - Test clicking **"Generate Rules via AI"**: Verify the AI synthesizer populates suggested validation rules.
   - Click **"Save Configuration"**.
3. **Human in the Loop (HITL) Modal:**
   - Hover over `Human in Loop` node and click **Settings (gear)** icon.
   - Verify reviewer roles dropdown (e.g., *Financial Controller*, *Chief Financial Officer (CFO)*, *General Counsel*, *RevOps Director*, *Chief Privacy Officer*).
   - Verify SLA Timeout setting (e.g., 4 hrs, 24 hrs, 48 hrs).
   - Click **"Save Gate"**; verify the node reflects the configured reviewer role.
4. **Conditional Router Modal:**
   - Hover over `Conditional Router` node and click **Settings (gear)** icon.
   - Verify condition builder: Field, Operator (`>`, `<`, `==`, `CONTAINS`), and Threshold value.
   - Click **"Save Condition"**.
5. **Pinecone Vector DB Modal:**
   - Switch to the Legal RAG or SRE Telemetry template.
   - Hover over `Pinecone Vector DB` node and click **Settings (gear)**.
   - Verify index name, dimension (`1536`), and metric (`cosine`).
6. **Google BigQuery Modal:**
   - Switch to Financial SOX or Salesforce CRM template.
   - Hover over `Google BigQuery` node and click **Settings (gear)**.
   - Verify GCP Project ID, Dataset, Table name, and Write Mode (`APPEND` / `STORAGE_WRITE_API`).

---

### Test Scenario 7: "Start a Workflow" Creation Wizard
* **Goal:** Verify creating a new workflow from the wizard initializes the selected template.

#### Test Steps:
1. In the top navigation, click **"Workflows"** (`#workflows` or `#threads`).
2. Click the **"Start a workflow"** or **"+ New Workflow"** button.
3. You will be on the creation wizard (`#new-thread`).
4. Under **"Start to point"**, inspect the available starter cards:
   - `Start from scratch` (Custom Canvas)
   - `SAP BW → S/4HANA Clean Core` (Tier 1)
   - `Financial GL & SOX 404 Audit` (Tier 1)
   - `Customer Master 360 & Vector` (Tier 2)
   - `Policy RAG & Legal Contracts` (Tier 2)
   - `Salesforce CRM → BigQuery` (Tier 3)
5. Click on **"Financial GL & SOX 404 Audit"**:
   - Verify the "Workflow name" field auto-fills with `"Financial General Ledger & SOX 404 Audit"`.
   - Verify the "Description" auto-fills with the audit scope description.
6. Click the blue **"Create workflow"** button at the bottom.
7. **Expected Behavior:** Directly opens the interactive canvas with the 7-node Financial GL pipeline ready for editing and execution.

---

## 4. Deep-Dive Test Steps for Top 5 Priority Use Cases

| # | Use Case | Specific Things to Check During Manual Test |
| :--- | :--- | :--- |
| **1** | **SAP BW → S/4HANA Clean Core** *(Tier 1)* | 1. Open template. Check plant ontology rule `DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')`.<br>2. Run Dry Run: Verify high-value POs (> $50K) split toward HITL Controller gate.<br>3. Verify clean POs target S/4HANA table `0PUR_C01_clean` with BAPI `BAPI_PO_CREATE1`. |
| **2** | **Financial GL & SOX 404 Audit** *(Tier 1)* | 1. Open template. Verify rule `ABS(DEBIT - CREDIT) < 0.01` (zero imbalance).<br>2. Check conditional split on material entries exceeding $100K.<br>3. Verify CFO Sign-off HITL node is armed with SLA: 24 hrs.<br>4. Target should show Google BigQuery `gl_ledger_audited_gold`. |
| **3** | **Customer 360 & Vector Harmonizer** *(Tier 2)* | 1. Open template. Confirm node 2 is `Semantic Vector Matcher` using cosine similarity ≥ 85%.<br>2. Confirm Source is MongoDB Atlas `raw_users` and Target is PostgreSQL Neon `customers_gold`.<br>3. Confirm RFC-5322 email syntax validation rule is active. |
| **4** | **Enterprise Policy RAG & Legal Contracts** *(Tier 2)* | 1. Open template. Verify 8-node graph including `RAG Context Enricher` and `Pinecone Vector DB`.<br>2. Confirm conditional check evaluates `INDEMNITY_RISK_SCORE <= 80`.<br>3. Verify General Counsel review node is connected to counsel-approved path. |
| **5** | **Healthcare Clinical HIPAA Vault** *(Tier 4)* | 1. Open template via All Templates dropdown.<br>2. Confirm Safe Harbor de-identification rule (`SSN IS NULL AND CREDIT_CARD IS NULL`).<br>3. Confirm 10-digit CMS NPI and institutional MRN format rules.<br>4. Target should route to BigQuery HIPAA clinical vault. |

---

## 5. QA Sign-Off Checklist

- [ ] All 10 use cases load without console errors (`F12` Developer Tools).
- [ ] No `ReferenceError`, `TypeError`, or TDZ errors occur during navigation.
- [ ] Node dragging, canvas panning (spacebar/mouse drag), and zoom in/out (`+` / `-`) function smoothly.
- [ ] Dry Run execution successfully animates through all 4 stages and displays summary metrics.
- [ ] The "All Templates (10)" dropdown popover opens, displays accurate metadata, and closes upon template selection.
- [ ] Node property modals open when clicking the gear icon and save changes to node state.
- [ ] Connecting ports to draw edges operates interactively.
- [ ] Both local dev server (`localhost:5173`) and remote production (`dataglow.ai`) reflect identical features.
