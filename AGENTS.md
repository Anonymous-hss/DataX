# DataX Repository AI Agent Directives & Code Excellence Rules

> **Authoritative Specification**: This repository is governed by the project-level [`.agent`](file:///D:/DATAX/.agent) configuration file. All AI coding assistants, code generators, and contributors must strictly adhere to the standards outlined below.

---

## 1. Non-Negotiable Core Laws

### 1.1. Zero Hardcoding Policy
- **Absolute ban on static metrics**: No hardcoded summary numbers (e.g., `14 Clean`, `4 Fixed`, `2 Held`, `90% Pass Rate`, `1,240 rows`). All summary figures, percentages, and metrics must be dynamically derived via pure array reducers (`computeDatasetMetrics(records, rules)`).
- **No hardcoded heuristics in Semantic Lookups**: Never use `if (plant === "Plant-Dallas")` string checks in Knowledge Graph resolution. Lookups must traverse dynamic graph nodes and relationship edges.
- **Dynamic Target & Form Schemas**: Target databases (PostgreSQL, Snowflake, Databricks, BigQuery) must be populated from configuration drivers, not static HTML `<option>` tags.

### 1.2. Mandatory Dynamicity
- Every view and table must respond dynamically to dataset switching, row-level mutations, and rule edits.
- Adding a custom rule in the UI must compile into an executable predicate that runs across the records dynamically.

### 1.3. Complexity Ceiling & Monolith Deconstruction
- **350-Line Limit**: No single component or module may exceed 350 lines of code.
- **Decompose Legacy Monoliths**: Monolithic files like the legacy `DataXCleanFlow.jsx` (1,340 lines) and `DataXPoc.jsx` (1,003 lines) must be broken into composable atomic components.
- **No File Duplication**: Maintain a single source of truth; eliminate duplicate folders like `src/components/cleanapp/` in favor of modular `src/pages/cleanflow/`.

### 1.4. Code Integrity & Asynchronous Resilience
- **Prohibited**: Naked nested `setTimeout` cascades.
- **Mandatory**: Use async step runners and deterministic state machines equipped with `AbortController` to cancel pending executions on component unmount and eliminate memory leaks.
- **Error Boundaries**: Wrap data tables and file parsers in defensive React Error Boundaries.

### 1.5. Bundle & Performance Standards
- Single JavaScript chunks must not exceed 500 kB.
- Heavy libraries (`xlsx`, `framer-motion`, `lottie-react`, `lucide-react`) must be placed into manual vendor chunks in `vite.config.js`.
- Top-level routes (`flow`, `website`, `poc`) must be dynamically imported via `React.lazy` and `<Suspense>`.

---

## 2. Pre-Analysis Protocol

Before outputting code modifications, agents must execute a **4-Step Pre-Analysis**:
1. **Audit Impact**: Identify any existing hardcoded constants, duplicate files, or timers.
2. **Priority Classification**: Map the task against the Frontend Excellence Priority Framework (**P0**, **P1**, or **P2**).
3. **Complexity Check**: Ensure proposed components comply with the 350-line ceiling and single-responsibility principle.
4. **Build & Integrity Verification**: Verify that types, dynamic calculations, and `npm run build` execute cleanly without bundle warnings.

---

## 3. Frontend Excellence Priority Matrix

- **P0 (Critical Foundation)**:
  - Monolith deconstruction (split `DataXCleanFlow.jsx` and `DataXPoc.jsx`).
  - Pure dynamic metric computation (`computeDatasetMetrics`).
  - Bundle optimization and route-level code splitting (<180 kB target).
- **P1 (Domain Dynamicity)**:
  - Graph-traversal Knowledge Engine (`ontologyGraph.js`).
  - AST / Predicate-based dynamic Rule Evaluation Engine.
  - Deterministic pipeline runner with `AbortSignal`.
- **P2 (UX & Resilience)**:
  - Pluggable Database Target Registry (`targetDrivers.js`).
  - Defensive Error Boundaries and runtime schema validation.
  - Full WCAG 2.1 AA keyboard accessibility and ARIA live regions.
