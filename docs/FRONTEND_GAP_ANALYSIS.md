# DataX Frontend — Gap Analysis (Internal)

Scope: `src/` (68 files), `package.json`, build config. Static review only.
Severity: **S0** = stop-ship / incident · **P0** = blocks handover · **P1** = needed soon · **P2** = polish.

---

## 0. S0 — Malicious code in the build pipeline (INCIDENT)

| File | Finding |
| :--- | :--- |
| `api.js` | Obfuscated script, padded with ~300 leading tabs so it looks empty in an editor. Recreates `require`, builds code via the `Function` constructor, and executes a decoded payload. Not application code. |
| `package.json` | `dev` and `build` were changed to `node api.js && vite ...`, so the payload runs on **every** `npm run dev` / `npm run build`. |
| `tailwind.config.js` | Contains a second obfuscated payload (ends in `v8("",x8)(...)`). Tailwind config is loaded by PostCSS on every Vite build/dev — a second execution path. |
| `postcss.config.js` | Held the payload from commit `3c9feca` (16 Oct) until a **force-push** on 18 Oct (`686dc1a`) moved it into `tailwind.config.js`, re-using an existing commit message and author date. |

Provenance: introduced in `3c9feca` ("fix(pipeline): resolve client memory leak…"), authored as Harshal Sawatkar, 16 Oct 2026. The remote branch was later force-rewritten. Pattern matches self-propagating dev-environment malware that injects into JS config files and pushes using local git credentials.

**Exposure:** any machine that ran `npm run dev`/`build` since 16 Oct — including this workstation and any server that built the frontend.

---

## 1. Security (P0)

- [ ] **Real database credentials hardcoded in the client bundle** — shipped to every browser:
  `RuleEngineContext.jsx` L309, L323, L398, L412, L502, L516, L550, L564 (incl. a Neon `npg_…` password);
  `workflowTemplates.js` L93–515; `WorkflowCanvasBuilder.jsx` L875; fallback password in `ConnectionsPage.jsx` L122.
- [ ] **Credentials persisted in `localStorage`** via canvas nodes/threads. `datax_canvas_nodes` is **not scoped per user** — a second user on the same browser inherits the first user's connections.
- [ ] **API calls carry no auth token.** No Clerk `getToken()` / `Authorization` header on any `fetch`. Tenant identity is a client-supplied `X-User-Id` header (spoofable), and `GET /threads` + `GET /runs` (L736, L839, L873) send no identity at all → cross-tenant data risk.
- [x] **Clerk dependency removed.** Migrated to self-hosted enterprise JWT authentication engine (`AuthContext.jsx`, `auth_engine.py`, `security_rbac.py`) with secure session storage and zero third-party auth vendor lock-in.
- [ ] **`xlsx@0.18.5`** — npm build is unmaintained with known advisories (prototype pollution, ReDoS). Move to the SheetJS CDN build ≥ 0.20 or another parser.

## 2. Trust & honesty of the UI (P0)

- [ ] **Connection test always reports success.** `ConnectionsPage.jsx` L141–155: on API failure *or* network error, status is set to `'success'` with a random "ping" latency. Must show real failure.
- [ ] **Dry run silently falls back to local simulation** when `/pipeline/execute` fails (`RuleEngineContext.jsx` L1457–1475). The user sees results without knowing the backend never ran. Show an explicit "backend unavailable" state.
- [ ] **Random S/4HANA document number** generated client-side (`SapBwPocDashboard.jsx` L245).
- [ ] **Hardcoded result copy** ("Legacy plant code P999…") in root `DryRunResultsPage.jsx` L83.

## 3. Backend features with no UI (P0)

| Backend endpoint | Frontend status |
| :--- | :--- |
| `GET /quarantine/records`, `POST /quarantine/resolve` | Not called anywhere. **No Quarantine Workbench** (only a settings label). |
| `GET /threads/{id}/audit-logs` | Not called. No audit trail viewer. |
| `DELETE /threads/{id}` | Not called. **No way to delete/archive a workflow.** |

## 4. Missing product surfaces (P0/P1)

- [ ] **P0** Settings: profile, organisation, API keys, notification preferences
- [ ] **P0** Team & role management UI (invite, roles, deactivate)
- [ ] **P0** Pipeline scheduling UI (no cron/schedule anywhere in `src/`)
- [ ] **P0** Alert/notification rule configuration (email/Slack/Teams)
- [ ] **P1** Rule versioning, diff, approval and rollback screens
- [ ] **P1** First-run onboarding flow
- [ ] **P1** Pagination / virtualisation on Workflows and Run History (currently render everything)
- [ ] **P1** Run detail page with a deep-linkable URL (`#/runs/{id}`)

## 5. Architecture & code health (P1)

- [ ] **No router.** Navigation is a hash `switch` with ~40 aliases (`DataXPoc.jsx`). No deep links to a specific workflow/run, no 404, unreliable back button. Adopt React Router.
- [ ] **God files:** `WorkflowCanvasBuilder.jsx` (2,610 lines / 130 KB), `RuleEngineContext.jsx` (67 KB). One context holds all state → app-wide re-renders. Split by domain (connections, workflows, runs, rules).
- [ ] **Dead / duplicate code:** root `DryRunResultsPage`, `RunningDryRunPage`, `ConnectTargetPage`, `LiveAutoFixPage` duplicate `pages/cleanflow/*`; `StartThreadPage` is unused; `ConnectSourcePage`, `GenerateRulesPage`, `LiveAutoFixPage` are imported in `DataXPoc.jsx` but never routed.
- [ ] **API base URL hardcoded in 3 places** (`RuleEngineContext`, `aiRuleSynthesizer`, absolute URL in `ConnectionsPage`). Use `import.meta.env.VITE_API_BASE` so staging/prod can differ.
- [ ] **No central API client:** no timeouts, no `AbortController`, no retry, no cancellation on unmount, inconsistent error shapes. Add one `apiClient` (or TanStack Query).
- [ ] **No Error Boundary** — any render exception = blank white screen.
- [ ] **Swallowed errors:** 5 empty `catch (e) {}` blocks in `RuleEngineContext.jsx`; `alert()` used for errors in `SapBwPocDashboard.jsx`.

## 6. Quality engineering (P1)

- [ ] Zero test files (no unit, component, or E2E tests)
- [ ] No ESLint / Prettier config; no TypeScript or PropTypes
- [ ] No CI build/lint/test gate
- [ ] No frontend error monitoring (Sentry or equivalent)

## 7. UX polish & accessibility (P2)

- [ ] Accessibility: only 6 `aria-*` attributes, 3 `alt` attributes, and no keyboard handlers across the app
- [ ] No per-page `document.title`
- [ ] No unsaved-changes warning on the canvas (`beforeunload`)
- [ ] No offline / connectivity detection
- [ ] No i18n or user timezone preferences

---

## Recommended order

1. **S0 incident response** (section 0) — before any further builds.
2. Remove client-side secrets, add auth tokens to API calls, fix fake success states (sections 1–2).
3. Quarantine Workbench, audit log, delete workflow (section 3).
4. Router + API client + Error Boundary (section 5), then tests/CI.
