# DataX — Client Sales Demo Script
**Goal of this meeting:** Get the client to agree to a paid pilot on *their own* data.
**Length:** 35–40 min (25 min demo + 10–15 min discussion). A 15-min short version is at the end.
**Live URL:** https://dataglow.ai/ · **Presenter:** You · **Audience:** CDO / VP Data / Data Engineering lead / Finance or SAP owner

---

## 0. Read This First — What Is Live vs. Simulated

You will be asked "is this real?" Know the answer before you walk in. Never claim a simulated item is live.

| Capability | Status today | How to talk about it |
| :--- | :--- | :--- |
| Connect to **PostgreSQL / MongoDB** source, Test Connection, live preview | **Live** | "This is hitting your database right now." |
| Rules engine, auto-fix, 3-way routing (clean / fixed / quarantine) | **Live** | Show it freely. |
| **Run Live** writing clean + quarantine tables into a **PostgreSQL** target | **Live** | The strongest proof point. Show rows landing in the target. |
| Dry Run on pre-loaded demo tables | **Live engine, demo data** | "These are sample tables we ship so you can try it without wiring up a database." |
| Run History, audit JSON download, SHA-256 digest | **Live** | Show it. |
| Quarantine Workbench | **Live UI** | Show it. |
| SAP S/4HANA BAPI writeback, BigQuery, Pinecone, Snowflake, Salesforce **writers** | **Designed / simulated in UI** | "That connector is on the pilot roadmap. We build it against your sandbox in the pilot." |
| S/4HANA document numbers shown after a live run | **Simulated** | Don't show these as proof of a real SAP post. |
| Template sources with `••••••••` passwords | **Placeholders** | Run Live on a template will **not** reach a real DB until you enter real credentials. |

> **Watch out:** After you connect a live database, the row count on the Source node card still comes from the demo catalog. Point to the **Live Data Preview** in the Source modal and to the Dry Run / Run Live totals instead.

---

## 1. Pre-Demo Checklist (do this 1 hour before)

**Environment**
- [ ] Open https://dataglow.ai/ in Chrome, at 100% zoom, 1920×1080. Close other tabs and turn on Do Not Disturb.
- [ ] Log in and check that **Templates**, **Workflows**, **Runs**, and **Connections** all load.
- [ ] Do one rehearsal **Dry Run** on *SAP Clean Core* and confirm non-zero CLEAN / FIXED / QUARANTINED counts.

**Your "bring-your-own-data" demo database** (the moment that wins the deal)
- [ ] Set up a **dedicated demo Postgres** (not your personal DB). Fill it with a table of deliberately dirty data, for example `demo_customers`: bad emails, null names, negative balances, duplicates.
- [ ] Set up a **target Postgres** schema for clean and quarantine output. It can be the same server.
- [ ] Keep the connection string in a password manager, ready to paste. **Never type a password on a shared screen.** Use the masked field.
- [ ] Open a second tab with a SQL console on the target (psql, pgAdmin, DBeaver or the cloud console), ready to run `SELECT COUNT(*) …`.
- [ ] Rehearse the full Run Live once and note the exact numbers you got.

**Client research (fill this in)**
- Industry: ________ · Core systems (SAP? Salesforce? Snowflake?): ________
- Biggest data pain they've mentioned: ________
- Who signs: ________ · Who will use it day to day: ________
- Which template to feature as the "second vertical" (see §8): ________

---

## 2. Opening & Discovery (3 min) — *don't touch the product yet*

> "Thanks for the time. Before I show you anything, I want to make sure I show you the *right* thing. Can I ask three quick questions?"

1. "When bad data gets into your downstream systems — ERP, warehouse, AI models — how do you find out today?"
2. "Roughly how many hours a week does your team spend fixing, reconciling or re-running data loads?"
3. "If a regulator or auditor asked *why* a record was changed or rejected, how long would it take you to answer?"

**Write down their numbers.** You will reuse them in the ROI section (§10). If they answer "we find out when finance complains" or "days", say:

> "That's exactly what DataX is built for. Let me show you."

---

## 3. The Problem (2 min) — *talk to their pain, not our features*

> "Every company we talk to has the same pattern. Data moves from source systems into ERPs, warehouses and now AI models. The checks along the way are scattered: SQL scripts, Excel macros, someone's tribal knowledge.
>
> So three things happen:
> 1. **Bad records reach production**, and you find out from the business, not the pipeline.
> 2. **Engineers spend their week firefighting** instead of building.
> 3. **There's no audit trail.** Nobody can prove what was changed, why, or who approved it.
>
> DataX puts one governed checkpoint between your sources and your targets. Every record gets checked, fixed or quarantined, and every decision is logged."

---

## 4. Product in One Sentence & Architectural Positioning (45 sec)

> "DataX is **not** a single-point tool, and it is **not** just an ERP migration utility. 
> 
> DataX is a **universal, composable enterprise data intelligence and governance platform**.
> 
> Think of it as a visual operating system for your enterprise data estate:
> You connect any source (relational, NoSQL, ERP, cloud storage), wire up business validation and **specialized AI nodes** (DuckDB rule engines, Semantic Vector Matchers, RAG Context Enrichers, PII Maskers), route records through **Human-in-the-Loop governance gates**, and dispatch clean data to any target warehouse or vector database—while isolating bad records into an audited quarantine workbench.
> 
> One platform, infinite topologies, zero unvetted data in production."

---

## 5. Demo Act 1 — Templates Catalog (3 min)

**Click:** top nav → **Templates**
**Screen:** *Enterprise Use Cases & Topology Catalog* — 10 templates plus a blank canvas.

> "We don't start you from a blank page. These are pre-built pipelines for the most common enterprise scenarios."

**Click** the tier pills one by one: **Tier 1 → Tier 2 → Tier 3**.

> "Tier 1 is mission-critical: SAP modernization and Financial SOX audit. Tier 2 is AI and identity: Customer 360 de-duplication and contract RAG. Then RevOps, supply chain, healthcare HIPAA, and multi-cloud."

**Type** the client's world into the search box (e.g. `SAP`, `SOX`, `HIPAA`, `Salesforce`).

> "Every card shows the pipeline shape, how many rules ship with it, and which compliance standard it targets. Each one is a starting point. Your team edits it."

**Click** **Load Template** on **SAP BW → S/4HANA Clean Core**.

---

## 6. Demo Act 2 — The Pipeline Canvas (6 min)

**Screen:** a 7-node pipeline auto-fits on the canvas.

> "This is the entire pipeline on one screen. Business users can read it; engineers can configure it. Left to right:"

Point at each node as you name it:
1. **Source Ingestion** — "where data comes from."
2. **Intelligence Engine** — "the rules."
3. **Conditional Router** — "if/else business logic, e.g. high-value orders go a different way."
4. **Human in Loop** — "a person approves the risky ones."
5. **CleanFlow Router** — "splits every record three ways."
6. **Target** and **Quarantine Store** — "where good data goes, and where bad data waits safely."

> "Notice the connections are already wired. You don't drag lines around to get started."

### 6a. Source node (1 min)
**Click** the ⚙ on **Source Ingestion**.

> "You can point this at PostgreSQL, MongoDB, SAP, Snowflake, S3, Azure Blob or Salesforce. The amber badge says **Demo Sandbox Tables Active**. These are sample tables we ship so you can try everything before connecting anything. Your real tables appear in a separate **Live Discovered Tables** group once you connect."

**Close.**

### 6b. Rules (2 min)
**Click** ⚙ on **Intelligence Engine**.

> "These are the business rules for this pipeline, e.g. *vendor code is mandatory*, *plant must be P1000, P2000 or P3000*. Each rule has a severity. **Critical** means quarantine. **Warning** means try to auto-fix."

> "Your team can type a rule or describe it in plain English and let AI draft it. A human still approves every rule before it runs."

*(Optional: top nav → Rules → **Create rules with AI** → type "emails must be valid and balances can't be negative" → **Generate rules**.)*

**Close.**

### 6c. Human-in-the-Loop (2 min) — *this lands well with Finance and Compliance*
**Click** ⚙ on **Human in Loop**.

> "Some decisions shouldn't be automated. This gate pauses the pipeline and notifies a reviewer on Slack, Teams or email."

**Show Table-Aware Triggers:**
> "DataX reads the source table and suggests sensible triggers, e.g. *Total amount over $50,000* for purchase orders."

**Switch to Custom Condition Builder:**
> "Or define your own: pick any column, an operator and a threshold. For example: `TOTAL_AMOUNT > 25000`."

> "You choose the reviewer role, the SLA, and whether they can only approve and reject or also edit values."

**Save** → point at the node card now showing the condition.

### 6d. Beyond a Single Pipeline: The Composable Node Library & AI Systems (+ Add Node) (2 min)
**Click** the blue **+ Add Node** button in the canvas top-right toolbar.

> "A crucial architectural point: DataX is **not hardwired to this one SAP pipeline**.
> Look at this node library. Every node here is a composable enterprise building block you can drag and connect:
> 
> * **Data Sources:** Relational (PostgreSQL, MySQL), Document (MongoDB Atlas), Enterprise ERP (SAP BW), Cloud Warehouses (Snowflake), Object Storage (AWS S3, Azure Blob), CRMs (Salesforce), and Streaming (Kafka).
> * **Specialized AI & Transformation Nodes:**
>   - **Intelligence Engine:** DuckDB AST compiler executing SQL and Boolean rules at microsecond latency with AI rule synthesis.
>   - **Semantic Vector Matcher:** Generates vector embeddings (`text-embedding-3-small`) and calculates cosine similarity thresholds (e.g. ≥ 85%) for customer entity resolution, fuzzy matching, and deduplication.
>   - **RAG Context Enricher:** Dynamically injects legal policies, corporate ontologies, and regulatory standards into streaming records before decisions are made.
>   - **Conditional Router (If / Else):** Dynamic business routing based on any field predicate.
>   - **CleanFlow 3-Way Splitter:** Simultaneously partitions streams into clean, remediated, and isolated quarantine queues.
> * **Human Governance Gate:**
>   - **Human in the Loop (HITL):** SLA-governed human approvals with multi-channel webhooks (Slack/Teams).
> * **Storage & Lakehouse Targets:**
>   - **PostgreSQL, MySQL, Google BigQuery, Snowflake, and Pinecone Vector DB**.
>
> You are never constrained by rigid pipeline architectures. You can start with an empty canvas, drag any combination of nodes, and solve literally any data engineering, governance, or GenAI workflow."

---

## 7. Demo Act 3 — Dry Run, Zero Risk (3 min)

**Click** **Dry Run** (top right).

> "Before anything touches production, you rehearse. Watch the stages: extract, apply rules, route, stage."

Wait for the banner: *Dry Run Completed · N rows evaluated · Health score · CLEAN / FIXED / QUARANTINED*.

> "So out of this batch: this many were clean, this many DataX **repaired automatically** (trimmed vendor codes, mapped legacy plant names), and this many were **quarantined with the exact reason**. Nothing was written anywhere. That's the confidence step your team is missing today."

**Click** **Inspect** to show the record-level detail.

---

## 8. Demo Act 4 — "Now Let's Use Real Data" (6 min) ★ the deal-winning moment

> "Everything so far used sample data. Let me show you this working against a real database."

1. **Click** ⚙ **Source Ingestion** → Database Engine **PostgreSQL** (or MongoDB) → **Connection URI String** tab → paste your **demo** URI into the masked field.
2. **Click** **Test Connection** → wait for the green **Connected (xx ms)** badge.
   > "That's a live round-trip to the database."
3. Pick your table under **⚡ Live Discovered Tables** → scroll to **Live Data Preview**.
   > "These are real rows. See the bad email on row 3, the empty name on row 5."
4. **Save Source Settings.** The node now shows **Connected** with a green dot.
5. Open **Intelligence Engine** and check that the rules match your demo columns (email, full_name, account_balance). Add one live with **Add Custom Rule** if you want to show how easy it is.
6. Open the **Target** node → point it at your demo target Postgres.
7. **Click** **Run Live**.
   > "This is the real commit. Clean and fixed rows go to the target table; failures go to a quarantine table with the violation attached."
8. **Switch to your SQL tab** and run:
   ```sql
   SELECT COUNT(*) FROM <clean_table>;
   SELECT record_id, violations FROM <quarantine_table> LIMIT 5;
   ```
   > "There it is, in your database, with the reason for every rejection."

> **If the live connection fails on stage:** stay calm. Say *"This is a firewall allow-list thing. We'd whitelist our IP in the pilot."* Then go back to the Dry Run results. Don't debug in front of the client.

---

## 9. Demo Act 5 — Quarantine Workbench & Audit (4 min)

**Click** top nav → **Quarantine** (Quarantine Workbench).

> "Here's where your data stewards work. Nothing bad gets silently dropped. It waits here."

Click a record → **Record Inspector** → **Rule Violation Details**.

> "They can see exactly which rule failed, then **Apply Auto-Fix & Push**, **Override** with a reason, or **Dismiss**. Every action goes to the **Audit Trail**."

**Click** top nav → **Runs**.

> "Every execution is recorded: volume, clean, auto-fixed, quarantined, duration, and a **SHA-256 provenance digest**."

**Click** a run → **Download Run Audit JSON**.

> "When an auditor asks 'what happened to record 4,281 on the 14th?', this is the answer. Minutes, not days."

---

## 10. Demo Act 6 — "Not Just One Use Case: Cross-Department Enterprise Scale" (3 min)

> "A common misconception when executives see our SAP demo is: *'Is this just an SAP migration tool?'*
>
> **Absolutely not.**
>
> In fact, treating data quality as a one-off tool for one department is why enterprises end up with 15 different fragmented point solutions.
>
> DataX is built to be your enterprise-wide data governance and AI transformation backbone. The exact same platform and modular node architecture solves completely different business problems across your entire company:"

**Action:** Go to the canvas → click **All Templates (10)** dropdown → open and show the rich variety:

| Department / Problem | Load Template | Specialized AI & Node Topology | The Business Outcome |
| :--- | :--- | :--- | :--- |
| **Enterprise ERP Modernization** | `SAP BW → S/4HANA Clean Core` | Ingestion → Rule Engine → Conditional → HITL Gate → S/4HANA + DLQ | Zero bad transactions in the new S/4HANA ERP. |
| **Corporate Finance & SOX Audit** | `Financial GL & SOX 404 Audit` | ERP GL → Zero Imbalance Check → CFO Gate → BigQuery Gold Ledger | 100% balanced journals, audited CFO sign-off on >$100K entries. |
| **Customer Experience & RevOps** | `Customer 360 & Vector Harmonizer` | MongoDB → **Semantic Vector Matcher** (Cosine ≥ 85%) → Rule Engine → Golden DB | Eliminates duplicate customer profiles across CRM and ERP. |
| **Legal Counsel & Procurement** | `Enterprise Policy RAG & Contracts` | AWS S3 → **RAG Context Enricher** → **Vector Matcher** → General Counsel Gate → **Pinecone Vector DB** | High-risk indemnity clauses flagged and reviewed before contract execution. |
| **DevOps & Cloud SRE** | `SRE Telemetry & Vector Copilot` | Azure Blob → PII Anonymizer → **Semantic Vector Matcher** → **Pinecone Vector DB** | Sanitize system telemetry and route incident embeddings to AI copilot. |
| **Healthcare & Life Sciences** | `Healthcare HIPAA Safe Harbor Vault` | Clinical EHR → Safe Harbor De-identifier → BigQuery HIPAA Vault | 18 HIPAA identifiers scrubbed before analytics and research use. |
| **Global Supply Chain** | `Multi-Echelon Supply Chain` | SAP Movements → Balance Engine → Warehouse Reconciler | Reconciles stock discrepancies between central distribution and retail hubs. |

> "Your IT team doesn't have to procure one tool for finance, another for customer deduplication, and another for vector search. You adopt DataX once, and your engineers and business stewards can compose solutions for any department."

---

## 11. Business Case — ROI on *Their* Numbers (3 min)

**Don't quote made-up industry stats.** Use what they told you in §2:

| Input (from discovery) | Value |
| :--- | :--- |
| A. Engineer hours/week on data fixes & re-runs | ____ |
| B. Loaded hourly cost of an engineer | ____ |
| C. Incidents/month caused by bad data | ____ |
| D. Avg cost of one incident (rework, delay, penalty) | ____ |
| E. Days to answer an audit query today | ____ |

> **Annual cost of the problem ≈ (A × B × 48) + (C × D × 12)**
>
> "If DataX removes even half of that, the pilot pays for itself. And your audit answer drops from **E days** to minutes."

Write the numbers live on a whiteboard or slide. Clients believe their own numbers.

---

## 12. Objection Handling

| They say… | You say… |
| :--- | :--- |
| "Is this tool only for ERP migrations or one specific use case?" | "No. That's a common initial thought because our SAP template is so visual. But notice the node catalog: we have Semantic Vector Matchers, Pinecone Vector DB, RAG Context Enrichers, and BigQuery connectors. The exact same engine powers customer identity, legal contract compliance, and telemetry copilot. You buy the platform once and scale it across all data initiatives." |
| "Can our team build completely custom pipelines from scratch?" | "Yes. You can click 'Empty Canvas' or 'Start from Scratch' in the creation wizard. You have full freedom to drag, connect, branch, and configure any combination of sources, AI engines, human gates, and targets." |
| "We already have dbt / Great Expectations / custom SQL." | "Those are great for engineers. DataX adds what they don't: auto-fix, a quarantine workbench for business stewards, human approval gates and an audit trail. Many teams run both." |
| "Is our data safe? Where does it go?" | "Credentials are encrypted at rest in a vault. In the pilot we can run inside your network or VPC so data never leaves your environment." *(Confirm the deployment option before promising it.)* |
| "Does it work with SAP / Snowflake / BigQuery?" | "Postgres and MongoDB are live today, as you saw. The SAP, Snowflake and BigQuery connectors are designed in the canvas, and we build and certify the one you need against your sandbox during the pilot." |
| "AI-generated rules sound risky." | "AI only *drafts*. Nothing runs until a human approves it, and you can dry-run every rule first." |
| "What if it blocks good data?" | "Nothing is deleted. Quarantined records sit in the workbench and can be overridden in one click with a reason." |
| "How long to implement?" | "A template on your own data runs in an afternoon. A production pilot on one pipeline is typically a few weeks." *(Adjust to what you can commit to.)* |
| "What does it cost?" | "It depends on pipelines and volume. Let's scope the pilot first so the number reflects your use case." *(Bring your pricing sheet.)* |
| "We need to think about it." | "Of course. What would you need to see to be confident? Usually it's seeing it on your own data, which is exactly what the pilot is for." |

---

## 13. Close — Ask for the Pilot (2 min)

> "Here's what I'd propose. We pick **one pipeline** that hurts today, say [their pain from §2]. We connect DataX to a copy of that data and, in [X] weeks, show you:
> 1. how many bad records it catches that you miss today,
> 2. how many it fixes automatically,
> 3. a full audit trail your compliance team can review.
>
> If it doesn't prove value, you walk away. Can we pick that pipeline today?"

**Lock in before you leave:**
- [ ] Pilot pipeline chosen: ________
- [ ] Data access contact (DBA / IT): ________
- [ ] Success criteria agreed (e.g. "catch X% of known bad records"): ________
- [ ] Decision-maker and date for the follow-up: ________
- [ ] Send the recap email within 24 hours.

---

## 14. Recovery Plays (if something breaks)

| Problem | What to do |
| :--- | :--- |
| Page won't load | Refresh once. If it's still broken, switch to your pre-recorded backup video (record one during rehearsal). |
| Dry Run shows 0 rows | Reload the template via **SAP Clean Core** pill and run again. Rehearsal should catch this. |
| Live connection fails | "Firewall allow-list, we handle that in onboarding." Go back to Dry Run results. |
| Run Live shows a permission error | Log out and back in to refresh the session, then retry. Otherwise demo with Dry Run. |
| Client asks for a feature we don't have | "Great question, that's not in the product today. Let me note it." Never improvise a yes. |

---

## 15. Things NOT to Say

- ❌ "This writes to SAP right now." (It's simulated. Say "pilot roadmap.")
- ❌ Specific customer counts, record volumes or "% uplift" stats we can't back with a reference customer.
- ❌ "Fully autonomous." (The value is *governed* automation with human approval.)
- ❌ "SOC 2 / HIPAA certified." (Unless certification is actually complete. Say "built to support SOX/HIPAA controls".)

---

## 16. 15-Minute Short Version

1. Discovery questions — 2 min (§2)
2. Problem + one-liner — 2 min (§3–4)
3. Load the client's template → walk the canvas → open HITL — 3 min (§6, §10)
4. Dry Run — 2 min (§7)
5. Live connect + Run Live + SQL proof — 4 min (§8)
6. Close for pilot — 2 min (§13)
