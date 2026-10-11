# DataGlow.ai & DataX Platform — Comprehensive QA & Tester Guide

This document is the standard testing guide for QA engineers, functional testers, and technical evaluators testing the **DataGlow.ai** company website and the **DataX** Decision Intelligence & Enterprise Data Transformation Platform.

---

## 🛠️ 1. Test Environment Setup

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: v3.10+ (tested on Python 3.14)
- **Browser**: Google Chrome, Microsoft Edge, or Mozilla Firefox (latest versions)
- **Project Directory**: `h:\AAVIL Inc\DataX\DataX`

### Starting the Application
Open PowerShell or your terminal in `h:\AAVIL Inc\DataX\DataX`:
```powershell
# 1. Install dependencies (if not already installed)
npm install

# 2. Launch Vite Development Server
npm run dev
```
- Local URL: **`http://localhost:5173/`**
- Direct DataX POC URL: **`http://localhost:5173/#poc`**

---

## 📋 2. Test Execution Matrix

| Test ID | Module | Feature Tested | Priority | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-WEB-01** | Website | Brand & Navigation Header | P1 | DataGlow.ai logo, dropdowns (Products, Expertise), and CTAs display properly |
| **TC-WEB-02** | Website | Hero Section & Dual Spotlight | P1 | Metrics render, Continuum & DataX spotlights displayed, CTAs functional |
| **TC-WEB-03** | Website | Products Section Toggle | P1 | Toggling between Continuum and DataX switches content smoothly |
| **TC-WEB-04** | Website | Core Expertise Section | P2 | Ontologies, Knowledge Graphs, and Agentic Harness cards display properly |
| **TC-WEB-05** | Website | Interactive Architecture Flow | P2 | Clicking 4 stages (SAP BW → Agentic → S/4HANA → Databricks) updates details |
| **TC-WEB-06** | Website | Book Demo Modal | P2 | Modal opens on click, form submits, and success card appears |
| **TC-POC-01** | DataX POC | SAP BW Dataset Ingestion | P1 | Displays 8 procurement rows, anomalies highlighted in red |
| **TC-POC-02** | DataX POC | Dataset Switcher & Export | P2 | Switches to Inventory stock data; Excel download button produces `.xlsx` |
| **TC-POC-03** | DataX POC | Custom Excel Upload | P2 | Drag & drop custom `.xlsx` parses and replaces table rows |
| **TC-POC-04** | DataX POC | Agentic Harness ReAct Loop | P1 | Telemetry streams Thought, Tool Calls, Observations in real-time |
| **TC-POC-05** | DataX POC | Knowledge Graph Lookup | P1 | "Plant-Dallas" is auto-resolved to S/4HANA code `P1000` via ontology |
| **TC-POC-06** | DataX POC | Dynamic Rule Generation | P1 | 4 rules evaluated, passes compliant rows and isolates quarantine rows |
| **TC-POC-07** | DataX POC | Add Custom Rule | P2 | User can type natural language rule (e.g. discount < 15%) and synthesize |
| **TC-POC-08** | DataX POC | SAP S/4HANA BAPI Staging | P1 | Staged JSON payload matches BAPI contract; 1-click approve posts document |
| **TC-POC-09** | DataX POC | Databricks Unity Catalog Sync | P1 | Delta Lake table `retaildata.default.sap_bw_modernized_gold` displays |
| **TC-POC-10** | DataX POC | End-to-End Lineage Graph | P2 | Lineage graph visually links SAP BW → Agent → S/4HANA → Databricks |
| **TC-CLI-01** | Python CLI | Standalone `agent_harness.py` | P1 | Terminal command `python agent_harness.py` completes with summary JSON |

---

## 🔍 3. Step-by-Step Test Procedures

### Test Case TC-WEB-01: Header & Navigation
1. Open `http://localhost:5173/` in your browser.
2. Verify top navigation bar displays:
   - DataGlow.ai logo with glowing cyan accent.
   - "Products" dropdown containing **DataGlow Continuum** and **DataX Platform**.
   - "Expertise" dropdown containing **Ontologies & Knowledge Graphs**, **Agentic Tool Calling**, and **SAP to Databricks Modernization**.
   - Quick action buttons: "Book Demo" and "Launch DataX POC".
3. **Pass Criteria**: All navigation items render without layout breaks; clicking "Launch DataX POC" scrolls to or switches to the POC view.

### Test Case TC-POC-01 & TC-POC-02: SAP BW Extraction View
1. Click **"Launch DataX POC"** in the top navigation or navigate to `http://localhost:5173/#poc`.
2. Click the **"1. SAP BW Extractor"** tab.
3. Observe the raw tabular records:
   - Row 1 & 2: Compliant Centrifugal Pump & Butterfly Valve records.
   - Row 4: Flagged with negative quantity (`QUANTITY: -10`) in red.
   - Row 5: Flagged with total price mismatch (`TOTAL_AMOUNT: $9999.00` vs Expected `8 * $850 = $6800.00`).
   - Row 6: Flagged with missing Vendor ID and legacy plant name `"Plant-Dallas"`.
4. Click the **"SAP Stock Extract"** button to switch datasets; confirm the table updates with inventory safety stock fields.
5. Click the download icon button; confirm an Excel file (`.xlsx`) downloads to your machine.
6. **Pass Criteria**: Data tables render accurately, deliberate anomalies are clearly tagged with warning pills, and Excel exports work.

### Test Case TC-POC-04 & TC-POC-05: Agentic Harness & Tool Calling Execution
1. Ensure the dataset is set to **"SAP BW POs (0PUR_C01)"**.
2. Click the large action button: **"Execute DataX Agent Harness"**.
3. Watch the **ReAct Telemetry Console**:
   - `[START]` Initialized DataX Orchestrator.
   - `[THOUGHT]` Legacy location strings detected. Calling `ontology_graph_lookup`.
   - `[TOOL_CALL]` `ontology_graph_lookup(entities=["Plant-Dallas", "Plant-Chicago"])`.
   - `[OBSERVATION]` "Plant-Dallas" mapped to S/4HANA code `P1000`; "Plant-Chicago" mapped to `P2000`.
   - `[TOOL_CALL]` `dynamic_rule_synthesizer()`.
   - `[TOOL_CALL]` `business_rule_evaluator()`.
   - `[OBSERVATION]` 6 Passed, 2 Quarantined.
   - `[TOOL_CALL]` `s4hana_payload_builder()`.
   - `[TOOL_CALL]` `databricks_delta_writer()`.
4. Check the **Rule Evaluation Outcome** card on the right:
   - Compliant (Passed): 6
   - Quarantined (Violations): 2
   - Quarantine Ledger shows Row 4 (Negative quantity) and Row 5 (Calculation mismatch).
5. **Pass Criteria**: Telemetry stream animates smoothly, knowledge graph resolves legacy plants, and violations are quarantined.

### Test Case TC-POC-08: SAP S/4HANA BAPI Staging & Approval Gate
1. Click the **"3. SAP S/4HANA"** tab.
2. Confirm the JSON inspector displays the formatted `BAPI_PO_CREATE1` payload.
3. Click the amber button: **"1-Click Approve & Post to S/4HANA"**.
4. Confirm the status turns green: **"POSTED TO S/4HANA (DOC #45000xxxxx)"** with latency `<40ms`.
5. **Pass Criteria**: Payload structure is verified and simulated confirmation ticket is generated.

### Test Case TC-POC-09: Databricks Unity Catalog Synchronization
1. Click the **"4. Databricks Lakehouse"** tab.
2. Confirm target catalog is listed as `retaildata.default.sap_bw_modernized_gold`.
3. Check the Databricks SQL query preview table; verify spend totals grouped by `P1000 (Dallas)`, `P2000 (Chicago)`, and `P3000 (Atlanta)`.
4. **Pass Criteria**: Delta Lake schema details and SQL execution results render cleanly.

### Test Case TC-CLI-01: Standalone Python Agent Harness
1. Open your terminal in `h:\AAVIL Inc\DataX\DataX`.
2. Run:
   ```powershell
   python agent_harness.py
   ```
3. Confirm console prints:
   - Tool calls for ontology graph lookup, rule synthesizer, evaluator, BAPI builder, and Delta writer.
   - Final JSON summary block with `compliance_rate`, `s4hana_staged_orders`, and `databricks_target`.
4. **Pass Criteria**: Exits with return code 0 and prints full telemetry.

---

## 🐞 4. Bug Reporting Format

When logging an issue, please use the following template:
- **Title**: `[DataX POC / Website] Brief summary of issue`
- **Environment**: OS (Windows 11 / macOS / Linux), Browser & version, Node.js version
- **Steps to Reproduce**: 1, 2, 3...
- **Expected Result**: What should happen
- **Actual Result**: What actually happened (include screenshots or console logs)
