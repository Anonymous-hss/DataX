# DataX: Enterprise Production Readiness & Client Handover Checklist

This document outlines the end-to-end technical, operational, and architectural requirements necessary to transition DataX from staging/pilot status into a hardened, enterprise-grade production deployment.

---

## 1. Resilience, Fault Tolerance & Reliability

| ID | Item | Priority | Status | Implementation Scope & Verification | Definition of Done (DoD) |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **REL-01** | **Exponential Backoff & Jitter Retries** | **P0** | ✅ **Done** | Implemented `retry_with_backoff()` in `resilience.py` with exponential backoff and randomized full jitter. Applied to Azure OpenAI synthesis (`/rules/generate`) and database connectors (`connectors.py`). | Transient network drops or rate-limit HTTP 429s automatically recover without pipeline failure. |
| **REL-02** | **Circuit Breaker Pattern** | **P0** | ✅ **Done** | Implemented `CircuitBreaker` state machine in `resilience.py` (`CLOSED` -> `OPEN` -> `HALF_OPEN`). Dedicated instances guarding OpenAI (`openai_breaker`), Source DB (`source_db_breaker`), and Target DB (`target_db_breaker`). Live status queryable at `/resilience/status`. | Downstream failure fails fast with graceful fallback rather than hanging worker threads. |
| **REL-03** | **Idempotent Pipeline Execution** | **P0** | ✅ **Done** | Implemented `IdempotencyManager` in `resilience.py` with persistence to disk. Pipeline executions (`/pipeline/execute`) check and acquire idempotency keys. Repeated calls return cached responses marked with `idempotent_replay: true`. Verified live via curl. | Re-running a failed or aborted pipeline never creates duplicate rows in target systems. |
| **REL-04** | **Dead-Letter Queue (DLQ) Durability** | **P1** | ✅ **Done** | Implemented `DurableDLQManager` in `resilience.py` with atomic write and synchronous disk flush (`os.fsync()`). Quarantined records persist across restarts and queryable via `/quarantine/records` with `durability: FSYNC_VERIFIED`. Verified live via curl. | Process crashes or server restarts retain 100% of quarantined records for audit inspection. |
| **REL-05** | **Offline Fallback for AI Logic** | **P1** | ✅ **Done** | Implemented `OfflineAIHeuristics` in `resilience.py` mapping SAP Clean Core, Customer 360, Financial GL, and Healthcare HIPAA domains. When OpenAI is unreachable or circuit is open, engine seamlessly synthesizes deterministic domain rules. Verified live via curl. | Core data cleansing and validation continue operating even during cloud AI outages. |


---

## 2. Performance & Scalability Benchmarking

| ID | Item | Priority | Implementation Scope | Definition of Done (DoD) |
| :--- | :--- | :---: | :--- | :--- |
| **PRF-01** | **High-Throughput Load Testing** | **P0** | Benchmark ingestion, DuckDB AST evaluation, and target commit against 100K, 500K, and 1M record datasets using Locust or k6. | Sustained throughput $\ge$ 5,000 rows/sec; p95 latency under 15ms per batch; 0 dropped rows. |
| **PRF-02** | **Memory Leak & Footprint Profiling** | **P0** | Run `memray` or `tracemalloc` across 1,000 consecutive runs. Ensure batch garbage collection explicitly flushes PyArrow/DuckDB buffers. | Memory usage plateaus under 512MB RAM without creeping up over time. |
| **PRF-03** | **Database Connection Pooling** | **P0** | Replace ad-hoc connection instances with an enterprise connection pool (`asyncpg` pool or SQLAlchemy pooled sessions with max pool size = 20, max overflow = 10). | No "too many connections" errors under 50 concurrent tenant requests. |
| **PRF-04** | **Streaming / Chunked Iterators** | **P1** | Replace `read_all()` calls with cursor-based streaming generators (batch size = 5,000) for source extraction and target commits. | Large multi-gigabyte extracts process with constant memory footprint regardless of dataset size. |
| **PRF-05** | **Frontend Graph & Table Virtualization** | **P1** | Virtualize canvas DOM elements and table inspectors (`@tanstack/react-virtual` or CSS content-visibility) for runs with > 1,000 rows. | Canvas maintains 60 FPS scrolling and inspection without browser freezing. |

---

## 3. Enterprise Security & Access Governance

| ID | Item | Priority | Implementation Scope | Definition of Done (DoD) |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | **Role-Based Access Control (RBAC)** | **P0** | Enforce 4 discrete permission tiers: `Admin` (full system access), `Data Steward` (rule editing & quarantine resolution), `Operator` (trigger & view runs), `Auditor` (read-only logs). | API endpoints enforce JWT claim verification; unauthorized operations return HTTP 403. |
| **SEC-02** | **Production Secret Management** | **P0** | Migrate plaintext credentials from local files and `.env` to Azure Key Vault, AWS Secrets Manager, or HashiCorp Vault. | Zero hardcoded API keys or DB passwords in source code or client configs. |
| **SEC-03** | **TLS 1.3 & At-Rest Encryption** | **P0** | Enforce HTTPS/TLS 1.3 across all Nginx endpoints; encrypt all stored credentials in Vault using AES-256-GCM with envelope encryption. | Qualys SSL Labs rating of A+; zero plain-text passwords stored in the database. |
| **SEC-04** | **Prompt & Query Injection Hardening** | **P0** | Sanitize all user-entered natural language prompts and rule strings against SQL/AST injection. Disallow raw DDL (`DROP`, `TRUNCATE`, `ALTER`) in generated logic. | Malicious prompt tests fail gracefully without altering schema or executing unintended statements. |
| **SEC-05** | **Automated PII / Sensitive Data Masking** | **P1** | Automatically detect and mask SSNs, credit cards, and HIPAA identifiers in execution logs and telemetry views before persistence. | Telemetry and public log streams contain no raw unmasked PII. |
| **SEC-06** | **CORS & Rate Limiting** | **P1** | Restrict CORS `allow_origins` strictly to client domains; configure rate-limiting (`slowapi` / Nginx `limit_req`) to 60 req/min per IP. | Brute force or API flooding triggers HTTP 429 without service degradation. |

---

## 4. Observability, Alerting & Email Integration

| ID | Item | Priority | Implementation Scope | Definition of Done (DoD) |
| :--- | :--- | :---: | :--- | :--- |
| **OBS-01** | **Multi-Channel Alert Dispatcher** | **P0** | Implement an alerting service supporting SMTP/Email (SendGrid/AWS SES/corporate SMTP) and Slack/Teams Incoming Webhooks. | Critical alerts deliver within 30 seconds of an incident. |
| **OBS-02** | **Configurable Alert Thresholds** | **P0** | Allow data teams to define alert policies: (a) Pipeline failure, (b) Quarantine rate > $X\%$, (c) Connector timeout, (d) Schema drift detected. | Breaching an alert condition sends formatted HTML summary with direct link to the run audit. |
| **OBS-03** | **Health Probes (Liveness & Readiness)** | **P0** | Expose `/health/live` (process alive) and `/health/ready` (validates DB connectivity, AI API ping, disk space > 10%). | Orchestrators (Kubernetes / Docker) automatically detect unresponsive pods and restart them. |
| **OBS-04** | **Structured JSON Logging** | **P1** | Convert all `print` and ad-hoc logging to structured JSON logs (`structlog` or `loguru`) containing `trace_id`, `pipeline_id`, `tenant_id`, and `duration_ms`. | Logs are ingestible into Datadog, Splunk, CloudWatch, or ELK stack for rapid querying. |
| **OBS-05** | **Prometheus Metrics Endpoint** | **P1** | Expose standard `/metrics` endpoint exporting: `pipeline_runs_total`, `pipeline_duration_seconds`, `quarantine_records_total`, `active_connections`. | Out-of-the-box Grafana dashboard displays real-time platform metrics. |

---

## 5. Architectural Optimization & Data Governance

| ID | Item | Priority | Implementation Scope | Definition of Done (DoD) |
| :--- | :--- | :---: | :--- | :--- |
| **ARC-01** | **Target Safe Staging Protocol** | **P0** | Enforce staging pattern: write into `_staged_datax` temporary tables, perform consistency checks, and execute atomic rename or merge. | Target production tables are never left in a partial, dirty, or corrupted state during run failures. |
| **ARC-02** | **Data Retention & Lifecycle Policies** | **P1** | Implement automated purge/archive cron job for old execution logs and resolved quarantine records (e.g., 30-day active, 90-day cold archive). | Database storage does not bloat indefinitely over months of heavy execution. |
| **ARC-03** | **Database Index Optimization** | **P1** | Ensure all foreign keys, run IDs, thread IDs, and timestamp queries have composite indexes (`pipeline_id`, `created_at DESC`). | Querying run histories or quarantine workbench takes < 50ms even with millions of historical rows. |
| **ARC-04** | **Audit Trail Immutability** | **P1** | Store pipeline execution runs with cryptographic hash manifests (`sha256(source + rules + output)`). | Audit logs satisfy compliance standards (SOC 2, ISO 27001, SOX 404). |

---

## 6. Client Handover & Operational Deliverables

| ID | Item | Priority | Implementation Scope | Definition of Done (DoD) |
| :--- | :--- | :---: | :--- | :--- |
| **OPS-01** | **Automated Deployment Package** | **P0** | Complete Docker Compose and Helm charts with configurable environment variables and zero manual server interventions. | `docker compose up -d` boots the entire stack cleanly on client cloud infrastructure. |
| **OPS-02** | **Comprehensive Operations Runbook** | **P0** | Step-by-step documentation for backup/restore, certificate rotation, connector credential updates, and node scaling. | Client DevOps team can perform maintenance and recovery without vendor assistance. |
| **OPS-03** | **Client User & Architecture Manual** | **P1** | Executive architecture overview, domain pack authoring guide, and quarantine resolution SOP with screenshots. | Client business analysts and data stewards can author rules and manage quarantine independently. |
| **OPS-04** | **Disaster Recovery (DR) Simulation** | **P1** | Execute a full disaster recovery dry run: simulate VM/container termination mid-pipeline and verify zero data corruption. | System recovers in < 3 minutes with automated reconciliation of in-flight jobs. |
| **OPS-05** | **SLA & Acceptance Sign-off Matrix** | **P1** | Pre-agreed performance, uptime (99.9%), and accuracy benchmarks verified across test datasets. | Formal client sign-off achieved. |

---

# PART B — Product Completeness (Product Manager View)

> Part A covers platform hardening. Part B covers what turns DataX from "a working pipeline" into **a product a client can own, operate, trust, and renew**.
> Priority: **P0** = blocks handover · **P1** = needed within hypercare · **P2** = roadmap / post-handover.

---

## 7. Scheduling & Run Orchestration
- [ ] **P0** Cron-based schedules per pipeline (hourly / daily / custom) with timezone support
- [ ] **P0** Run controls: pause, resume, cancel, and per-run timeout
- [ ] **P0** Concurrency guard — prevent two overlapping runs of the same pipeline
- [ ] **P1** Re-run from failed stage only (not the whole pipeline)
- [ ] **P1** Event triggers: file landed (S3/ADLS/SFTP), webhook, upstream pipeline completed
- [ ] **P1** Pipeline dependencies (run B only after A succeeds)
- [ ] **P2** Historical backfill for a date range

## 8. Rule & Pipeline Change Management
- [ ] **P0** Version history for every rule and pipeline (who changed what, when)
- [ ] **P0** One-click rollback to a previous rule/pipeline version
- [ ] **P0** Maker-checker approval: Draft → Review → Approved → Published (no unreviewed rule goes live)
- [ ] **P1** Side-by-side diff between versions
- [ ] **P1** Environment promotion: Dev → Staging → Prod
- [ ] **P1** Import / export pipelines and domain packs as JSON/YAML
- [ ] **P2** Git sync for rules-as-code

## 9. AI / Intelligence Engine Governance
- [ ] **P0** AI-generated rules must compile + pass dry run before they can be activated
- [ ] **P0** Data-sharing control: only schema + masked samples go to the LLM; opt-in toggle per tenant
- [ ] **P0** Explainability on every auto-fix ("why was this changed, by which rule")
- [ ] **P1** Confidence threshold — low-confidence fixes go to human review instead of auto-applying
- [ ] **P1** LLM token/cost tracking per tenant with monthly budget caps
- [ ] **P1** Golden-dataset evaluation suite to measure rule-generation accuracy across model upgrades
- [ ] **P1** Model version pinning (no silent behaviour change when the provider updates a model)

## 10. Identity & Tenant Management
- [ ] **P0** SSO via SAML / OIDC (Azure AD, Okta, Google Workspace)
- [ ] **P0** Tenant / workspace data isolation (no cross-client data visibility)
- [ ] **P0** User invite, deactivate, and session timeout flows
- [ ] **P1** MFA enforcement for non-SSO users
- [ ] **P1** Scoped API keys / service accounts with rotation and expiry
- [ ] **P2** SCIM user provisioning

## 11. Connector Ecosystem
- [ ] **P0** Published certified-connector matrix (supported versions, auth modes, limits)
- [ ] **P0** Incremental loads with watermark / CDC (not full reload every run)
- [ ] **P1** File sources: S3, ADLS, SFTP — CSV, Parquet, Excel, JSON
- [ ] **P1** Schema evolution policy per connector (new column = auto-add / alert / block)
- [ ] **P1** Connector health page (last success, latency, error rate)
- [ ] **P2** Connector SDK so the client can build custom connectors

## 12. Product UX Completeness
- [ ] **P0** First-run onboarding wizard (connect source → pick domain pack → dry run → go live)
- [ ] **P0** Actionable error messages — no raw stack traces shown to users
- [ ] **P0** Meaningful empty states on every page (no blank screens)
- [ ] **P0** Confirmation dialogs on destructive actions (delete pipeline, purge quarantine)
- [ ] **P1** In-app notification centre (run finished, approval pending, threshold breached)
- [ ] **P1** Global search across pipelines, runs, rules, and quarantine records
- [ ] **P1** Browser support matrix (Chrome, Edge, Safari, Firefox — latest 2 versions)
- [ ] **P1** Accessibility baseline (WCAG 2.1 AA: contrast, keyboard navigation, labels)
- [ ] **P2** i18n readiness and user-level timezone / date-format preferences

## 13. Reporting & Business Value
- [ ] **P0** Data Quality Scorecard per pipeline / domain with trend over time
- [ ] **P0** Exportable audit report (PDF/CSV) for compliance auditors
- [ ] **P1** ROI dashboard — records auto-fixed, engineer-hours saved, failures prevented
- [ ] **P1** Scheduled stakeholder reports (weekly quality digest)
- [ ] **P2** BI connector / embeddable dashboards (Power BI, Tableau)

## 14. Developer Platform & Integrations
- [ ] **P0** Public REST API with OpenAPI/Swagger documentation
- [ ] **P0** API versioning (`/v1/...`) and deprecation policy
- [ ] **P1** Outbound webhooks: `run.completed`, `run.failed`, `quarantine.threshold_breached`
- [ ] **P1** Orchestrator operators: Airflow, Azure Data Factory, Databricks Workflows
- [ ] **P1** ITSM integration — auto-create ServiceNow / Jira ticket for critical quarantine
- [ ] **P2** CLI and Terraform provider

## 15. Engineering Quality & Release Management
- [ ] **P0** CI/CD pipeline with build, test, and lint gates (replace manual file-upload deploys)
- [ ] **P0** Separate Dev / Staging / Prod environments
- [ ] **P0** Deployment rollback in one step; clean-up of stale build assets on the server
- [ ] **P0** Remove all credentials from scripts and repos; rotate any credential that was ever stored in plaintext
- [ ] **P1** Test coverage targets (unit ≥ 70% on engine; E2E on the critical canvas → run → inspect flow)
- [ ] **P1** Semantic versioning + client-facing release notes / changelog
- [ ] **P1** Feature flags to roll out features per tenant
- [ ] **P1** Dependency vulnerability scanning (SCA) and SBOM generation

## 16. Data Lifecycle & Business Continuity
- [ ] **P0** Automated backups with a *tested* restore (not just configured)
- [ ] **P0** Defined RPO / RTO (e.g. RPO 15 min, RTO 1 hr) agreed with client
- [ ] **P1** Client data export / offboarding — client can take all their data and config
- [ ] **P1** Tenant data deletion on request (right-to-erasure)
- [ ] **P2** Data-residency region choice; multi-region failover

## 17. Commercial, Legal & Compliance
- [ ] **P0** MSA, DPA, Privacy Policy, and Terms of Service signed
- [ ] **P0** Sub-processor list disclosed (e.g. Azure OpenAI, cloud host)
- [ ] **P0** Third-party penetration test report
- [ ] **P1** License / entitlement enforcement (row volume, pipelines, connectors per plan)
- [ ] **P1** Usage metering for billing
- [ ] **P1** Security questionnaire pack ready (CAIQ / SIG-Lite)
- [ ] **P1** Open-source license audit of all dependencies
- [ ] **P2** SOC 2 Type I readiness

## 18. Support & Customer Success
- [ ] **P0** Support tiers with response-time SLAs (P1 incident: 1 hr, P2: 4 hrs, P3: 1 business day)
- [ ] **P0** Escalation matrix with named contacts
- [ ] **P0** Public status page for uptime and incidents
- [ ] **P1** Help centre / knowledge base and in-app contextual help
- [ ] **P1** Training: admin session, data-steward session, recorded videos
- [ ] **P1** Opt-in product usage analytics to see which features clients actually use
- [ ] **P1** Feedback channel and quarterly business review (QBR) cadence

## 19. Go-Live & Cutover Plan
- [ ] **P0** UAT plan with client-owned test cases and sign-off
- [ ] **P0** **Shadow mode** — run DataX in parallel with the legacy pipeline and reconcile outputs before switching
- [ ] **P0** Written go / no-go criteria
- [ ] **P0** Cutover runbook and rollback plan back to the legacy process
- [ ] **P0** 2–4 week hypercare period with daily check-ins after go-live

---

## 20. Handover Roadmap (indicative — nothing marked complete yet)

```mermaid
gantt
    title DataX Production Handover Roadmap
    dateFormat  YYYY-MM-DD
    section Hardening (Part A)
    Retries, Circuit Breakers, Idempotency  :a1, 2026-10-26, 5d
    Load Testing & Connection Pooling       :a2, after a1, 4d
    RBAC, Secrets Vault, Injection Hardening:a3, after a1, 6d
    Alerts, Email, Metrics, Health Probes   :a4, after a2, 4d
    section Product (Part B)
    Scheduling & Run Controls               :b1, 2026-10-26, 5d
    Rule Versioning & Maker-Checker         :b2, after b1, 5d
    SSO & Tenant Isolation                  :b3, after a3, 5d
    Onboarding, Errors, Empty States        :b4, after b1, 4d
    Scorecard & Audit Report Export         :b5, after b2, 4d
    CI/CD & Staging Environment             :b6, 2026-10-26, 5d
    section Go-Live
    Pen Test, Legal & Support Setup         :c1, after a4, 5d
    UAT & Shadow-Mode Reconciliation        :c2, after b5, 7d
    Cutover & Hypercare                     :c3, after c2, 14d
```
