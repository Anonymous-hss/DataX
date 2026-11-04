// Generates the DataX roadmap workbook (xlsx) + one TSV per tab (paste-ready for Google Sheets).
// Run from the DataX project root:  node docs/roadmap/build_workbook.mjs
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------------------------
// SPRINT CALENDAR (2-week sprints, Sprint 1 starts Mon 9 Nov 2026)
// ---------------------------------------------------------------------------------------------
const SPRINTS = [
  { n: 1, start: '2026-11-09', end: '2026-11-20', cap: 40, goal: 'Foundations: architecture decisions, data-plane packaging, PII detector benchmark, canvas UX design',
    demo: 'DataX runner boots via docker-compose against a LOCAL Postgres (no Neon). PII detector benchmark report. Canvas design prototype reviewed.' },
  { n: 2, start: '2026-11-23', end: '2026-12-04', cap: 55, goal: 'Hybrid link + Privacy Gateway MVP + shared canvas framework',
    demo: 'Runner enrols to control plane over outbound-only mTLS. Point OpenAI SDK at the gateway: PII is tokenised before leaving, restored in the reply. New node-based canvas shell runs a 2-node graph.' },
  { n: 3, start: '2026-12-07', end: '2026-12-18', cap: 55, goal: 'Zero-exposure UI path + gateway streaming/policies + AI Firewall canvas nodes',
    demo: 'Row data flows browser<->runner only (proved by network log). Streaming chat is de-tokenised live. Firewall canvas: Source -> Injection/Secrets/PII -> Router -> HITL built by drag-and-drop.' },
  { n: 4, start: '2026-12-21', end: '2027-01-01', cap: 40, goal: 'Kubernetes packaging, multi-provider gateway, admin UI, vector-DB sinks (reduced capacity: year-end holidays)',
    demo: 'Helm install on a K8s cluster. Gateway admin UI shows "what the provider actually saw" diff. Firewall canvas commits clean chunks to pgvector.' },
  { n: 5, start: '2027-01-04', end: '2027-01-15', cap: 58, goal: 'Air-gap bundle + SSO/RBAC + local-LLM routing + Agent Guard canvas + ML canvas (analysis nodes)',
    demo: 'Air-gapped install with offline licence. SSO login. Sensitive prompt auto-routes to on-prem model. ML canvas: Source -> Profile -> PSI -> Leakage -> Fairness.' },
  { n: 6, start: '2027-01-18', end: '2027-01-29', cap: 48, goal: 'ML canvas repair/SFT/certify nodes + hardening (audit, upgrades, egress proof, load tests, security review)',
    demo: 'End-to-end ML certification graph incl. repair + signed certificate. Egress test proves ZERO outbound calls in Off mode. Gateway load-test report.' },
  { n: 7, start: '2027-02-01', end: '2027-02-12', cap: 45, goal: 'Templates, scheduling, canvas polish, red-team evaluation, design-partner pilot start',
    demo: 'Template gallery (built from real nodes). Pilot customer installs on their own infra. Red-team PII leakage report.' },
  { n: 8, start: '2027-02-15', end: '2027-02-26', cap: 40, goal: 'Pilot feedback, pen-test remediation, docs, GA readiness (deliberately light: mostly contingency buffer for slippage)',
    demo: 'Go / No-Go review with management. Docs site + quickstarts live.' },
];

// ---------------------------------------------------------------------------------------------
// TASKS: [ID, Epic, Task, Description / Acceptance Criteria, Role, Points, Depends On, Sprint, Priority]
// ---------------------------------------------------------------------------------------------
const T = [
  // ---- E2 On-prem / hybrid deployment ----
  ['D-01','E2 On-Prem & Hybrid','Architecture decision record + threat model','Control-plane vs data-plane split, data-flow diagram, list of every byte that may leave the customer network, STRIDE threat model. Signed off by Security + management.','Architect / Backend',5,'-',1,'P0'],
  ['D-02','E2 On-Prem & Hybrid','Make all storage configurable (remove hard-wired Neon)','Today vault.DEFAULT_NEON_URI is the default store for firewall events, policies, RAG ledger and ML certificates. Replace with env/config-driven local Postgres; migrations auto-run. Acceptance: app starts with zero Neon references.','Backend',5,'D-01',1,'P0'],
  ['D-03','E2 On-Prem & Hybrid','Package the data-plane runner as a container','Single image: FastAPI services + DuckDB + built UI static files. docker-compose with local Postgres. One-command start, health endpoint, non-root user.','DevOps',8,'D-02',1,'P0'],
  ['D-04','E2 On-Prem & Hybrid','CI/CD for versioned on-prem images','Pipeline builds, tests and publishes versioned images + changelog. Reproducible builds.','DevOps',5,'D-03',1,'P1'],
  ['D-05','E2 On-Prem & Hybrid','Runner <-> control-plane enrolment (outbound-only)','Enrolment token, mutual-TLS, WebSocket/long-poll initiated BY the runner. No inbound firewall ports required. Control plane only sends workflow definitions and receives status.','Backend',8,'D-03',2,'P0'],
  ['D-06','E2 On-Prem & Hybrid','Telemetry modes: Off / Metadata-only / Full + "What leaves my network" page','Admin chooses mode. UI page lists every outbound payload type with a live log. Off mode makes zero external calls.','Backend + Frontend',5,'D-05',3,'P0'],
  ['D-07','E2 On-Prem & Hybrid','Browser-to-runner direct data path','UI served by (or pointed at) the runner so record-level data never transits the SaaS. Control plane UI handles only metadata. Verified with browser network capture.','Frontend',8,'D-05',3,'P0'],
  ['D-08','E2 On-Prem & Hybrid','Customer-managed secrets','Source/target DB credentials live ONLY in customer vault. Support env, Kubernetes Secrets and HashiCorp Vault. No credentials ever sent to control plane.','Backend',5,'D-05',3,'P0'],
  ['D-09','E2 On-Prem & Hybrid','Helm chart + Kubernetes manifests','Values for replicas, resources, ingress/TLS, HPA, persistence. Tested on a clean cluster (e.g. AKS/EKS/OpenShift).','DevOps',8,'D-03',4,'P1'],
  ['D-10','E2 On-Prem & Hybrid','Air-gapped install bundle + offline signed licence','Offline image tarball, no CDN/font/telemetry calls, licence file verified locally (signature + expiry + feature flags).','DevOps',8,'D-09',5,'P1'],
  ['D-11','E2 On-Prem & Hybrid','Image signing, SBOM and vulnerability scanning','cosign signatures, SBOM per release, CVE scan gate in CI.','DevOps',3,'D-04',5,'P1'],
  ['D-12','E2 On-Prem & Hybrid','SSO (OIDC/SAML) + RBAC on the runner','Okta/Azure AD/Google login, role mapping (Admin, Steward, Security, Auditor), session policies.','Backend',8,'D-05',5,'P0'],
  ['D-13','E2 On-Prem & Hybrid','Local tamper-evident audit log + SIEM export','Hash-chained audit records stored locally; syslog/Splunk/webhook export.','Backend',5,'D-12',6,'P1'],
  ['D-14','E2 On-Prem & Hybrid','Upgrade / rollback with versioned DB migrations','Zero-downtime upgrade path, backup/restore commands, rollback tested.','DevOps',5,'D-09',6,'P1'],
  ['D-15','E2 On-Prem & Hybrid','Network egress proof test-suite','Automated test that blocks all outbound traffic and proves every feature still works in Off mode.','QA',3,'D-06',6,'P0'],
  ['D-16','E2 On-Prem & Hybrid','Runbooks, sizing guide, install docs','CPU/RAM/disk sizing by rows/day and requests/sec; troubleshooting guide.','DevOps',3,'D-14',7,'P2'],

  // ---- E3 Privacy gateway ----
  ['G-01','E3 Privacy Gateway','PII detector benchmark spike','Compare regex, Microsoft Presidio, spaCy NER and GLiNER on labelled corpora (support chats, contracts, medical-style text). Output: recall/precision/latency table and chosen stack; set target recall.','ML / Security Eng',5,'-',1,'P0'],
  ['G-02','E3 Privacy Gateway','Gateway service skeleton (OpenAI-compatible)','Reverse proxy exposing /v1/chat/completions and /v1/embeddings; adapters for OpenAI and Azure OpenAI; drop-in via base_url change only.','Backend',8,'D-03',2,'P0'],
  ['G-03','E3 Privacy Gateway','PII detection pipeline','Layered: regex + checksum validators (Luhn etc.) + NER + custom dictionaries. Entity types: names, emails, phones, SSN, cards, IBAN, addresses, secrets/keys, custom terms.','ML / Security Eng',8,'G-01',2,'P0'],
  ['G-04','E3 Privacy Gateway','Reversible tokenisation + local token vault','Replace entities with stable placeholders (e.g. <PERSON_1>). Mapping stored locally, AES-GCM encrypted, scoped per request/session, TTL purge. Mapping never leaves the customer network.','Backend',8,'G-03',2,'P0'],
  ['G-05','E3 Privacy Gateway','Response re-hydration (non-streaming)','Restore original values in the provider response before returning to the app. Handles missing/altered placeholders safely.','Backend',3,'G-04',2,'P0'],
  ['G-06','E3 Privacy Gateway','Streaming (SSE) re-hydration','Buffer partial placeholders across stream chunks; no added visible lag. Tested against OpenAI streaming.','Backend',8,'G-05',3,'P0'],
  ['G-07','E3 Privacy Gateway','Policy engine per route/model','Rules: block / mask / tokenise / allow per entity type and per destination model. Secret blocking, fail-closed vs fail-open, latency budget, per-team policies.','Backend',8,'G-04',3,'P0'],
  ['G-08','E3 Privacy Gateway','More providers: Anthropic, Gemini, Bedrock, Mistral','Adapter layer normalises request/response/streaming formats.','Backend',5,'G-02',4,'P1'],
  ['G-09','E3 Privacy Gateway','Admin UI: policies, live traffic, "what the provider saw"','Side-by-side: original prompt vs the sanitised prompt actually sent. Redaction preview/testing tool. Policy editor with versioning.','Frontend',8,'G-07',4,'P0'],
  ['G-10','E3 Privacy Gateway','Gateway audit log (hashes, not raw data)','Per-request record: entities found, actions, destination, latency, hash of payload. Raw prompt never stored unless customer opts in.','Backend',3,'G-07',4,'P1'],
  ['G-11','E3 Privacy Gateway','Format-preserving pseudonyms (FF3-1) + session-consistent fake values','Option to keep format (valid-looking card/phone/ID) so downstream models still reason correctly; same person = same pseudonym within a session.','ML / Backend',5,'G-04',5,'P1'],
  ['G-12','E3 Privacy Gateway','Injection / exfiltration guard on gateway traffic','Reuse firewall engine on inbound prompts, retrieved context and outbound answers; tool-call interception passthrough.','Backend',5,'G-07',5,'P1'],
  ['G-13','E3 Privacy Gateway','Smart routing to on-prem LLM','If prompt contains restricted classes, route to local model (Ollama/vLLM/TGI) instead of the cloud; configurable per policy.','Backend',5,'G-07',5,'P1'],
  ['G-14','E3 Privacy Gateway','Locale PII packs (India, EU, US)','Aadhaar, PAN, GSTIN, IFSC, UPI IDs, IBAN, NHS/NI, SSN etc. with validators.','ML / Security Eng',5,'G-03',5,'P1'],
  ['G-15','E3 Privacy Gateway','Load & latency testing','Target: added p95 latency < 50 ms (regex tier) and < 150 ms (NER tier) at 200 req/s; memory soak test.','QA + Backend',5,'G-06',6,'P1'],
  ['G-16','E3 Privacy Gateway','Developer docs + SDK snippets','OpenAI SDK, LangChain, LlamaIndex, curl; migration guide "change one URL".','Backend',3,'G-09',6,'P2'],
  ['G-17','E3 Privacy Gateway','Red-team evaluation + limitations report','Measure PII recall on held-out data; test quasi-identifier / context re-identification; publish honest limitations and recommended defence-in-depth.','ML / QA',5,'G-15',7,'P0'],

  // ---- E1 Interactive canvas ----
  ['C-01','E1 Interactive Canvas','Unified canvas UX design','Node anatomy, palette, ports, inspector, run/preview states for AI Firewall, Agent Guard and ML Gate; align with existing product guidelines. Clickable prototype.','Design / Frontend',5,'-',1,'P0'],
  ['C-02','E1 Interactive Canvas','Shared canvas framework','Extract existing workflow canvas into reusable module: node registry, typed ports, schema propagation between nodes, validation, per-node status.','Frontend',8,'C-01',2,'P0'],
  ['C-03','E1 Interactive Canvas','Generic graph execution API','Endpoints to validate/run a graph; per-node sample preview, metrics and errors; run-from-node; cancel.','Backend',8,'D-03',2,'P0'],
  ['C-04','E1 Interactive Canvas','Firewall nodes: Sources','File upload, DB table (Postgres/Mongo), URL, S3/MinIO, SharePoint/Confluence connector stubs, agent-trace webhook.','Frontend + Backend',8,'C-02',3,'P0'],
  ['C-05','E1 Interactive Canvas','Firewall nodes: Detectors and Policy gates','Prompt-injection, secrets, PII, custom terms, entropy, chunker, router (if/else), human-in-the-loop approval node.','Frontend + Backend',8,'C-03',3,'P0'],
  ['C-06','E1 Interactive Canvas','Firewall nodes: Sinks','Postgres, Mongo, pgvector, Qdrant/Chroma/Pinecone connectors, JSONL/CSV download, quarantine store.','Frontend + Backend',8,'C-05',4,'P0'],
  ['C-07','E1 Interactive Canvas','Agent Guard canvas','Agent -> Tool -> Policy -> HITL -> Execute visual flow; replay any past event from the ledger onto the canvas.','Frontend + Backend',8,'C-05',5,'P1'],
  ['C-08','E1 Interactive Canvas','ML nodes: Source, Profile, PSI drift, Leakage, Fairness','Each node outputs a preview + metrics; thresholds configured in the node inspector.','Frontend + Backend',8,'C-03',5,'P0'],
  ['C-09','E1 Interactive Canvas','Per-node live preview panel (before/after diff)','Click any node to see sample rows/chunks before and after; quarantine tap shows what was removed.','Frontend',5,'C-06',6,'P1'],
  ['C-10','E1 Interactive Canvas','ML nodes: Repair, SFT cleanse, Certify, Export/Commit','Drop/dedupe/impute/clip nodes; SFT redact/refusal-strip/dedupe/format nodes; signed certificate node; DB commit node.','Frontend + Backend',8,'C-08',6,'P0'],
  ['C-11','E1 Interactive Canvas','Graph versioning, templates, import/export','Save versions, diff, clone, JSON export/import, shareable within workspace.','Frontend + Backend',5,'C-02',6,'P1'],
  ['C-12','E1 Interactive Canvas','Triggers & scheduling nodes','Cron, webhook, "on new file / new rows" triggers; run history per graph.','Backend',5,'C-11',7,'P1'],
  ['C-13','E1 Interactive Canvas','Canvas UX polish','Undo/redo, minimap, keyboard shortcuts, resizable/draggable inspector, autosave, accessibility pass.','Frontend',5,'C-09',7,'P2'],
  ['C-14','E1 Interactive Canvas','Template gallery (real nodes, no fake data)','"Poisoned-document defence", "Refund-agent guard", "Credit-risk dataset gate", "SFT corpus cleanse" - each is a saved graph the user points at their own data.','Frontend',3,'C-11',7,'P2'],
  ['C-15','E1 Interactive Canvas','Quick-mode wrappers over canvas graphs','Keep current simple upload pages as a one-click "Quick mode" that generates and runs a graph, so both audiences are served.','Frontend',3,'C-11',7,'P2'],

  // ---- E4 Platform & security ----
  ['P-01','E4 Platform & Security','Licensing and feature flags per deployment tier','SaaS / Hybrid / Self-hosted / Air-gapped entitlements enforced locally.','Backend',5,'D-05',4,'P1'],
  ['P-02','E4 Platform & Security','Observability','Prometheus metrics, OpenTelemetry traces, health/readiness probes, Grafana dashboards (local only).','DevOps',3,'D-09',5,'P1'],
  ['P-03','E4 Platform & Security','Internal security review + secrets scanning','Dependency audit, SAST, hardening checklist, pen-test preparation.','Security Eng',5,'D-12',6,'P0'],
  ['P-04','E4 Platform & Security','Compliance mapping pack','Data-flow diagrams and control mapping for SOC 2, GDPR, India DPDP Act, EU AI Act, ISO 27001 for customer security questionnaires.','PM / Security Eng',3,'D-06',7,'P1'],

  // ---- E5 QA, pilot, launch ----
  ['Q-01','E5 QA, Pilot & Launch','Test strategy + environments','Test pyramid, synthetic-data generators for TESTS only (never shipped in product), CI gates.','QA',3,'-',1,'P1'],
  ['Q-02','E5 QA, Pilot & Launch','Automated E2E tests for canvas flows','Playwright suites for build graph -> run -> export for each module.','QA',5,'C-04',3,'P1'],
  ['Q-03','E5 QA, Pilot & Launch','API contract tests','Schema-validated contract tests for gateway, graph API, studio I/O.','QA',3,'G-08',4,'P2'],
  ['Q-04','E5 QA, Pilot & Launch','Design-partner pilot (1-2 customers, own infra)','On-prem install with customer, success criteria agreed up-front, weekly feedback.','PM / DevOps',8,'D-16',7,'P0'],
  ['Q-05','E5 QA, Pilot & Launch','External penetration test','Third-party test of runner, gateway and control plane.','Security Eng',5,'P-03',7,'P0'],
  ['Q-06','E5 QA, Pilot & Launch','Pen-test and pilot remediation','Fix findings and pilot feedback; re-test.','All Engineering',8,'Q-05',8,'P0'],
  ['Q-07','E5 QA, Pilot & Launch','Documentation site, quickstarts, demo videos','Install, gateway, canvas, ML gate guides; screen-recorded walkthroughs.','PM / Docs',5,'Q-04',8,'P1'],
  ['Q-08','E5 QA, Pilot & Launch','GA readiness review + support runbooks','Go/No-Go checklist, on-call and escalation process, SLAs.','PM',3,'Q-06',8,'P0'],
];

// ---------------------------------------------------------------------------------------------
// Other tabs
// ---------------------------------------------------------------------------------------------
const EPICS = [
  ['Epic','Goal','Business outcome','Key risks','Sprints','Total Points'],
  ['E1 Interactive Canvas','Replace upload-style pages for AI Firewall, Agent Guard and ML Gate with a drag-and-drop node canvas (same paradigm as the Core workflow canvas).','Users build, preview and reuse their own protection/certification pipelines; stronger product differentiation and stickiness.','Scope creep on node library; performance with large graphs.','S1-S7',null],
  ['E2 On-Prem & Hybrid','Run the data plane inside the customer network so databases and records are never exposed to DataX systems.','Unblocks regulated buyers (banks, health, gov). Removes the #1 sales objection.','Support burden of customer-run installs; upgrade complexity.','S1-S7',null],
  ['E3 Privacy Gateway','OpenAI-compatible proxy that tokenises/encrypts PII before any prompt reaches an external LLM and restores it in the reply.','Customers can use cloud LLMs without sending raw PII outside; also routes sensitive prompts to local models.','Detection is never 100% (names, context, quasi-identifiers); latency; streaming edge cases.','S1-S7',null],
  ['E4 Platform & Security','Cross-cutting licensing, observability, security review and compliance documentation.','Passes enterprise security questionnaires faster.','Compliance claims must match reality.','S4-S7',null],
  ['E5 QA, Pilot & Launch','Quality gates, design-partner pilot, pen test and GA readiness.','De-risked launch with a reference customer.','Finding a pilot partner in time.','S1-S8',null],
];

const ARCH = [
  ['Component','Runs where','Touches customer data?','What may leave the customer network','Tech'],
  ['Control Plane (SaaS)','DataX cloud','No','Receives: workflow definitions it authored, run status, aggregate counts (if Metadata-only mode is enabled)','FastAPI, Postgres, React'],
  ['Data-Plane Runner','Customer VPC / on-prem / K8s','Yes - all record processing','Nothing in Off mode. Metadata-only mode: counts, scores, hashes, versions','FastAPI, DuckDB, local Postgres, container'],
  ['Browser UI path','User browser','Yes (renders records)','Talks directly to the runner; SaaS UI only loads static assets and metadata','React, Vite'],
  ['Credential Vault','Customer side','Holds DB creds','Never','Env / K8s Secrets / HashiCorp Vault'],
  ['Privacy Gateway','Customer side (sidecar or gateway)','Yes - sees raw prompts','Only sanitised prompts go to the external LLM provider','FastAPI/ASGI proxy, Presidio/spaCy/GLiNER, AES-GCM token vault'],
  ['Token Vault (placeholder map)','Customer side, encrypted, TTL','Holds PII<->placeholder map','Never','In-memory + encrypted local store'],
  ['Local LLM (optional)','Customer side','Yes','Never','Ollama / vLLM / TGI'],
  ['Audit Ledger','Customer side','Hashes + metadata only','Optional SIEM export to customer SIEM','Postgres hash-chain, syslog/Splunk'],
  ['Graph Execution Engine','Runner','Yes','Never','Python DAG executor, DuckDB'],
];

const TIERS = [
  ['Deployment tier','Where UI + control plane run','Where data is processed','Data leaves customer network?','Best for','Internet needed?'],
  ['SaaS (today)','DataX cloud','DataX cloud','Yes (to DataX)','Trials, startups, non-sensitive data','Yes'],
  ['Hybrid (recommended default)','DataX cloud (metadata only)','Customer runner','No (optional metadata)','Most enterprises','Outbound-only HTTPS'],
  ['Self-hosted','Customer','Customer','No','Regulated industries','Optional'],
  ['Air-gapped','Customer','Customer','No','Defence, banking core, government','No (offline licence + image bundle)'],
];

const RISKS = [
  ['ID','Risk','Likelihood','Impact','Mitigation','Owner'],
  ['R1','PII detection misses entities (names, context, free text) so some PII still reaches the cloud LLM','High','High','Layered detection, locale packs, fail-closed policy for restricted classes, local-LLM routing for sensitive prompts, measured recall targets, honest customer-facing limitations. Do NOT market as "100% safe".','ML / Security'],
  ['R2','Gateway latency hurts user experience','Medium','Medium','Tiered detectors (fast regex first, NER only when needed), async batching, p95 targets in CI load test','Backend'],
  ['R3','Streaming rehydration bugs corrupt answers','Medium','Medium','Chunk-boundary buffering, fuzz tests, fallback to non-streaming per policy','Backend'],
  ['R4','Customer-run installs create heavy support load','High','Medium','Docker/Helm with preflight checks, diagnostic bundle command, runbooks, supported-version matrix','DevOps'],
  ['R5','Canvas scope creep (too many node types)','High','Medium','MVP node set per module; extensibility via node registry; defer connectors to backlog','Product'],
  ['R6','Compliance claims outpace actual certifications','Medium','High','Describe "mapped to / supports" not "certified"; start SOC 2 readiness separately','PM'],
  ['R7','No design-partner available for pilot','Medium','High','Start outreach in Sprint 2; offer discounted pilot; use internal pilot as fallback','PM'],
  ['R8','Hidden dependency on managed cloud services (Neon, CDN, fonts) breaks air-gap','Medium','High','D-02 removes hard-wired Neon; D-15 egress-block test in CI','DevOps'],
  ['R9','Year-end holiday reduces Sprint 4 capacity','High','Low','Sprint 4 planned at ~70% capacity','PM'],
  ['R10','Team capacity assumption (7 FTE) not met','Medium','High','Re-baseline after Sprint 2 velocity; P2 items are the first to drop','PM'],
];

const KPIS = [
  ['Area','Metric','Target','How measured'],
  ['On-prem','Install time from zero to running workflow','< 30 minutes (docker-compose), < 2 hours (Helm)','Timed install in pilot'],
  ['On-prem','Outbound calls in Off telemetry mode','0','Egress-block automated test (D-15)'],
  ['On-prem','Record-level data transiting DataX cloud in Hybrid mode','0 bytes','Network capture + audit'],
  ['Gateway','PII recall on held-out benchmark (structured entities)','>= 99%','Red-team evaluation (G-17)'],
  ['Gateway','PII recall on free-text names/addresses','>= 90% (publish actual figure)','Red-team evaluation (G-17)'],
  ['Gateway','Added p95 latency (regex tier / NER tier)','< 50 ms / < 150 ms at 200 req/s','Load test (G-15)'],
  ['Gateway','Round-trip fidelity (de-tokenised reply equals expectation)','>= 99.5% on test prompts','Automated replay'],
  ['Canvas','Time for a new user to build and run first graph','< 10 minutes','Usability sessions'],
  ['Canvas','Graph run success rate on pilot data','>= 98%','Run history'],
  ['Quality','Critical/High pen-test findings open at GA','0','Pen-test report'],
  ['Delivery','Sprint commitment reliability','>= 85% of committed points','Sprint reports'],
];

const DECISIONS = [
  ['#','Decision needed from management','Recommended option','Needed by'],
  ['1','Default deployment model to sell','Hybrid (SaaS control plane + customer runner); Self-hosted/air-gapped as premium tiers','Sprint 1'],
  ['2','Team size and roles','7 FTE: 2 backend, 2 frontend, 1 DevOps, 1 ML/security engineer, 1 QA (+ part-time PM/design)','Sprint 1'],
  ['3','Positioning of the privacy gateway','"Reduces PII exposure to external LLMs; routes restricted data to local models" - avoid absolute guarantees','Sprint 2'],
  ['4','Pilot customer','Identify 1-2 design partners; start outreach now','Sprint 2'],
  ['5','Budget for external pen test and PII benchmark datasets','Approve in Sprint 3','Sprint 3'],
  ['6','Open-source components policy (Presidio, spaCy, GLiNER licences)','Legal review of licences before Sprint 2 build','Sprint 2'],
];

// ---------------------------------------------------------------------------------------------
// Derived tabs
// ---------------------------------------------------------------------------------------------
const taskHeader = ['Task ID','Epic','Task','Description / Acceptance Criteria','Role','Story Points','Depends On','Sprint','Priority','Status'];
const taskRows = T.map(r => [...r, 'Not started']);

const epicPoints = {};
T.forEach(r => { epicPoints[r[1]] = (epicPoints[r[1]] || 0) + r[5]; });
const epicRows = EPICS.map((r, i) => i === 0 ? r : [r[0], r[1], r[2], r[3], r[4], epicPoints[r[0]] || 0]);

const sprintHeader = ['Sprint','Start','End','Sprint Goal','Planned Points','Capacity (pts)','Utilisation','Tasks (IDs)','Demo / Exit Criteria'];
const sprintRows = SPRINTS.map(s => {
  const ts = T.filter(t => t[7] === s.n);
  const pts = ts.reduce((a, t) => a + t[5], 0);
  return [`Sprint ${s.n}`, s.start, s.end, s.goal, pts, s.cap, `${Math.round(pts / s.cap * 100)}%`, ts.map(t => t[0]).join(', '), s.demo];
});

const roadmapHeader = ['Epic', ...SPRINTS.map(s => `S${s.n} (${s.start.slice(5)})`)];
const roadmapRows = EPICS.slice(1).map(e => [e[0], ...SPRINTS.map(s => {
  const pts = T.filter(t => t[1] === e[0] && t[7] === s.n).reduce((a, t) => a + t[5], 0);
  return pts ? pts : '';
})]);
roadmapRows.push(['TOTAL POINTS', ...SPRINTS.map(s => T.filter(t => t[7] === s.n).reduce((a, t) => a + t[5], 0))]);

const overview = [
  ['DataX - Next Phase Implementation & Sprint Plan'],
  ['Prepared','2026-11-03'],
  ['Scope','(1) Interactive canvas for AI Firewall, Agent Guard and ML Gate  (2) On-prem / hybrid architecture so customer data is never exposed to DataX  (3) Privacy Gateway so external LLM APIs can be used without sending raw PII'],
  ['Timeline','8 sprints x 2 weeks, 9 Nov 2026 -> 26 Feb 2027 (Sprint 4 at reduced capacity for holidays)'],
  ['Team assumption','7 FTE: 2 backend, 2 frontend, 1 DevOps, 1 ML/security engineer, 1 QA; part-time PM/design. Re-baseline after Sprint 2.'],
  ['Estimation','Story points (1 pt ~ half a developer-day). Total planned points: ' + T.reduce((a, t) => a + t[5], 0)],
  ['Product rule','No dummy/sample data shipped in product. Test data generators live in the test suite only.'],
  ['Honest limitation','PII detection can reduce, not eliminate, leakage. The gateway is positioned as risk reduction with measurable recall, not an absolute guarantee.'],
  ['Tabs','Epics | Roadmap | Sprint Plan | Task Backlog | Architecture | Deployment Tiers | Risks | KPIs | Decisions Needed'],
];

const tabs = [
  ['Overview', overview],
  ['Epics', epicRows],
  ['Roadmap', [roadmapHeader, ...roadmapRows]],
  ['Sprint Plan', [sprintHeader, ...sprintRows]],
  ['Task Backlog', [taskHeader, ...taskRows]],
  ['Architecture', ARCH],
  ['Deployment Tiers', TIERS],
  ['Risks', RISKS],
  ['KPIs', KPIS],
  ['Decisions Needed', DECISIONS],
];

// ---------------------------------------------------------------------------------------------
// Write xlsx + TSVs
// ---------------------------------------------------------------------------------------------
const clean = (v) => (v === null || v === undefined ? '' : String(v).replace(/[\t\r\n]+/g, ' '));
const wb = XLSX.utils.book_new();
tabs.forEach(([name, rows], i) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const widths = [];
  rows.forEach(r => r.forEach((c, ci) => { widths[ci] = Math.min(70, Math.max(widths[ci] || 8, clean(c).length + 2)); }));
  ws['!cols'] = widths.map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, name);
  const tsv = rows.map(r => r.map(clean).join('\t')).join('\n');
  fs.writeFileSync(path.join(outDir, `${String(i + 1).padStart(2, '0')}_${name.replace(/[^A-Za-z]+/g, '_')}.tsv`), tsv, 'utf8');
});
fs.writeFileSync(path.join(outDir, 'DataX_Implementation_and_Sprint_Plan.xlsx'), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

console.log('Tasks:', T.length, '| Total points:', T.reduce((a, t) => a + t[5], 0));
sprintRows.forEach(r => console.log(r[0], r[1], '->', r[2], '| planned', r[4], '/ cap', r[5], '(' + r[6] + ')'));
// Sanity: every dependency exists
const ids = new Set(T.map(t => t[0]));
T.forEach(t => t[6].split(',').map(s => s.trim()).filter(d => d && d !== '-').forEach(d => {
  if (!ids.has(d)) console.log('MISSING DEPENDENCY', t[0], '->', d);
  const dep = T.find(x => x[0] === d);
  if (dep && dep[7] > t[7]) console.log('ORDER PROBLEM', t[0], '(S' + t[7] + ') depends on', d, '(S' + dep[7] + ')');
}));
