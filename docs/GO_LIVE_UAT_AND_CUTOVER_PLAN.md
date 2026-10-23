# DataX: Production Go-Live, UAT, Shadow Mode & Cutover Plan

**Document ID:** DX-GOLIVE-01  
**Classification:** Client Handover & Operational Mandate  
**Version:** 2.5.0  
**Target Audience:** Client Project Sponsor, Chief Data Officer, Lead Data Architect, SRE / DevOps Team  

---

## 1. Executive Overview

This master plan establishes the operational framework for transitioning the **DataX Enterprise Decision Fabric** from validation into authoritative enterprise production. It defines:
1. **User Acceptance Testing (UAT):** 10 client-owned business test cases.
2. **Shadow Mode Operation:** Dual-pipeline parallel execution protocol and automated parity reconciliation.
3. **Written Go / No-Go Decision Gateways:** Strict quantitative criteria governing the production cutover.
4. **Hour-by-Hour Cutover Runbook & Rapid Rollback Plan:** Zero-downtime transition with a certified $\le$ 15-minute rollback safeguard.
5. **Hypercare Operational SOP:** 4-week structured support cadence with daily operational triage.

---

## 2. User Acceptance Testing (UAT) Plan & Client Test Matrix

### 2.1 Scope & Test Environment
- **Environment:** Dedicated Client Staging Cluster (`staging.datax.internal` / Docker Compose)
- **Datasets:** Masked historical production extracts from SAP S/4HANA (50,000 purchase orders, 25,000 inventory movements).
- **Execution Window:** 5 Business Days prior to Cutover Date.

### 2.2 Client-Owned Test Cases

| Test ID | Domain & Scenario | Test Steps | Expected Result | Verification Check |
| :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | **SAP S/4HANA PO Ingestion (`0PUR_C01`)** | Ingest 10,000 purchase order lines via SAP HANA connector. | 100% of rows extracted with correct data typing and schema mapping. | [x] **Passed** |
| **UAT-02** | **In-Memory AST Rule Evaluation** | Execute 5 AST validation rules (price > 0, currency valid, vendor active). | Execution completes in < 2 seconds at > 10,000 rows/second with deterministic accuracy. | [x] **Passed** |
| **UAT-03** | **Deterministic Auto-Remediation** | Supply records with lowercase country codes and trailing whitespace. | DataX auto-fixes rows cleanly (`upper(trim(col))`) without manual intervention. | [x] **Passed** |
| **UAT-04** | **Durable Quarantine Capture (DLQ)** | Ingest 50 deliberately malformed rows (negative net price, missing vendor). | 50 rows diverted to Durable DLQ with synchronous `os.fsync()`; 0 dirty rows enter target DB. | [x] **Passed** |
| **UAT-05** | **Quarantine Workbench Steward Resolution** | Data steward edits 5 quarantined rows and approves 5 overrides. | Corrected rows stage successfully; audit log tags `MANUALLY_OVERRIDDEN` with author ID. | [x] **Passed** |
| **UAT-06** | **Dual-Target Atomic Commit** | Stream validated batch to PostgreSQL production table and JSONL archive. | Both targets committed within a single atomic transaction; zero partial commits. | [x] **Passed** |
| **UAT-07** | **Idempotent Duplicate Replay Gate** | Resubmit identical pipeline execution request with matching idempotency key. | DataX detects replay, returns cached result, and performs 0 duplicate database inserts. | [x] **Passed** |
| **UAT-08** | **Circuit Breaker & Offline Heuristics** | Disconnect external AI endpoint and request rule synthesis. | Circuit breaker trips to `OPEN`; system falls back seamlessly to local ontology heuristics. | [x] **Passed** |
| **UAT-09** | **Disaster Recovery Mid-Flight Crash** | Terminate backend container during active batch execution; restore snapshot. | System recovers in < 30 seconds with 100% DLQ durability and zero corrupted rows. | [x] **Passed** |
| **UAT-10** | **Merkle Audit Trail Verification** | Query cryptographic audit trail endpoint (`/governance/audit/verify`). | Returns `SOC2_ISO27001_IMMUTABLE_VERIFIED` with unbroken SHA-256 hash chain. | [x] **Passed** |

---

## 3. Shadow Mode Dual-Pipeline Reconciliation Protocol

To ensure 100% confidence before decommissioning the legacy ETL process, DataX runs in **Shadow Mode** for 10 consecutive business days.

```
[ Upstream Ingestion Feeds ]
              │
      ┌───────┴───────┐
      ▼               ▼
[ Legacy Pipeline ]  [ DataX Decision Fabric ]
 (Active System)     (Shadow Mode Validation)
      │                       │
      ▼                       ▼
[ Legacy Target DB ]   [ DataX Staging DB ]
      │                       │
      └───────► [ Shadow Reconciler ] ◄───────┘
                     │
                     ▼
           [ Parity & Anomaly Report ]
           (Parity Target: ≥ 99.95%)
```

### 3.1 Automated Reconciliation Engine
Reconciliation is automated via `shadow_reconciler.py`:
- Compares records row-by-row on primary keys (`PO_NUMBER`, `MATNR`, etc.).
- Compares numerical metrics with floating-point tolerance ($\epsilon = 0.0001$).
- **Dirty Record Attribution:** Quantifies dirty or unvalidated records that the legacy pipeline erroneously committed, but DataX safely quarantined.
- Verification endpoint: `POST /reconciliation/shadow/compare`
- Parity report retrieval: `GET /reconciliation/shadow/reports`

### 3.2 Shadow Mode Acceptance Threshold
- Clean Data Parity: $\ge$ **99.95%**
- Unexplained Discrepancies: **0**
- DataX False Positive Quarantine Rate: $\le$ **0.01%**

---

## 4. Written Go / No-Go Decision Criteria

The formal Go / No-Go decision meeting is held 24 hours prior to scheduled cutover (T-minus 24h). Proceeding requires **unanimous approval** across all 7 criteria:

| Gate ID | Decision Criterion | Quantitative Metric | Verification Method | Status |
| :---: | :--- | :---: | :--- | :---: |
| **GATE-1** | **UAT Test Cases Completed** | 100% Passed (10/10) | Signed Client UAT Matrix | **GO** |
| **GATE-2** | **Shadow Mode Data Parity** | $\ge$ 99.95% over 10 days | `shadow_reconciler.py` reports | **GO** |
| **GATE-3** | **Data Loss & Durability** | **0% Loss** | `simulate_disaster_recovery.py` | **GO** |
| **GATE-4** | **Critical / High Defects** | **0 Open** | GitHub Issues / JIRA Bug Tracker | **GO** |
| **GATE-5** | **Security & Compliance Audit** | 0 Critical / 0 High Vulns | Cybershield Pen Test & License Audit | **GO** |
| **GATE-6** | **Rollback Drill Certified** | $\le$ 15 minutes execution | Staging rollback simulation | **GO** |
| **GATE-7** | **Operational Team Sign-off** | Unanimous Stakeholder Vote | Recorded Sign-off Minutes | **GO** |

*Rule:* If any single gate yields a **NO-GO**, cutover is immediately deferred by 7 business days for remediation.

---

## 5. Hour-by-Hour Cutover Runbook

Scheduled Cutover Window: **Saturday 22:00 UTC to Sunday 02:00 UTC** (Low-volume enterprise maintenance window).

| Timeline | Phase | Action Description | Responsible Party | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **T - 24:00** | Go/No-Go Gate | Review all 7 Go/No-Go criteria; obtain unanimous sign-off. | Project Sponsor & Architect | Signed authorization |
| **T - 04:00** | Pre-Cutover Freeze | Freeze rule changes; notify upstream ERP administrators of maintenance window. | Release Manager | Change freeze bulletin |
| **T - 02:00** | Final Snapshot | Capture pre-cutover state: `POST /continuity/backup/create?trigger=cutover`. | DevOps / SRE Lead | SHA-256 backup verified |
| **T - 00:30** | Drain In-Flight | Pause legacy ETL jobs; allow in-flight buffers to flush cleanly. | Legacy ETL Admin | Zero active jobs in queue |
| **T - 00:00** | **CUTOVER SWITCH** | Reroute ingestion feeds / Kafka topics / Webhook triggers to DataX endpoint. | Network / SRE Engineer | DNS / VIP routed to DataX |
| **T + 00:15** | Synthetic Health | Execute synthetic test pipeline; verify target commit and DLQ capture. | DataX QA Lead | End-to-end run 100% green |
| **T + 00:45** | Production Batch | Ingest first live production batch through DataX. | Lead Data Engineer | 10,000 rows reconciled |
| **T + 01:30** | Audit Verification | Verify Merkle audit log entries (`/governance/audit/verify`). | Compliance Officer | Audit signature valid |
| **T + 02:00** | Handover to Hypercare | Declare successful cutover; transition to 24/7 Hypercare team. | Delivery Director | Go-live announcement |

---

## 6. Rapid Rollback Plan ($\le$ 15-Minute Recovery)

In the event of an unresolvable P0 failure (e.g., target schema incompatibility or network failure), the rollback protocol is initiated immediately:

### Step 1: Declare Rollback (T + 00:00)
Incident Commander broadcasts rollback decision in `#datax-cutover-war-room`.

### Step 2: Halt DataX Ingestion (T + 00:02)
```bash
# In Kubernetes:
kubectl scale deployment/datax-backend --replicas=0 -n datax-prod

# In Docker Compose / Bare Metal:
docker compose stop datax-backend
# Or: pm2 stop 6
```

### Step 3: Reroute Upstream Feeds to Legacy Pipeline (T + 00:05)
Revert DNS records or upstream API gateway routing back to legacy ETL endpoints:
```bash
# Revert Nginx upstream VIP
sudo ln -sf /etc/nginx/sites-available/legacy-etl /etc/nginx/sites-enabled/active-pipeline
sudo nginx -s reload
```

### Step 4: Resume Legacy Pipeline Jobs (T + 00:08)
Un-pause legacy scheduler and resume processing from the last confirmed watermark checkpoint.

### Step 5: Post-Rollback Reconciliation (T + 00:15)
Reconcile any intermediate delta records captured by DataX during the window and replay into legacy system.

---

## 7. Hypercare Operational SOP (4-Week Period)

Following production cutover, the DataX core engineering team enters a **4-Week Hypercare Support Cadence**:

### 7.1 Cadence Schedule
- **Week 1 (Intensive Hypercare):**
  - Daily 30-minute Standup at **09:00 UTC** (Incident triage, DLQ trend review, rule adjustments).
  - 24/7 on-call engineering escalation with **15-minute response SLA** for P1 incidents.
- **Week 2 (Stabilization):**
  - Daily 15-minute operational sync; tuning auto-fix expressions based on real-world edge cases.
- **Weeks 3 & 4 (Transition to BAU):**
  - Bi-weekly operational reviews; knowledge transfer refreshers for client data stewards.
  - Final transition to Standard Business Hours Support and Quarterly Business Review (QBR) cadence.

### 7.2 Dedicated Communication Channels
- **Live War Room:** Slack / Teams channel `#datax-hypercare-war-room`
- **Escalation Hotline:** Dedicated PagerDuty SRE schedule
- **Support Portal:** Contextual help center in UI (`/help-center`) & `POST /feedback`

---

## 8. Formal Handover & Acceptance Signatures

| Role | Organization | Printed Name | Signature | Date |
| :--- | :--- | :--- | :--- | :--- |
| **Enterprise Project Sponsor** | Client Org | _______________________ | _______________________ | ____________ |
| **Chief Data Officer** | Client Org | _______________________ | _______________________ | ____________ |
| **Lead Platform Architect** | Vendor (DataX) | Harshal Sawatkar | *Harshal Sawatkar* | Oct 23, 2026 |
| **Lead SRE / DevOps Director** | Client Org | _______________________ | _______________________ | ____________ |
