# AUDIT V0.4 — PASS 2 CONTINUATION

Status: IN PROGRESS / EVIDENCE-BASED
Contract: CANONICAL-OPPORTUNITY V0.4
Branch: feat/canonical-opportunity-contract-v0.4

## Additional re-observed findings

### AUDIT-SEM-002 — Potential canonical representation mismatch

**Contract:** `potential` is a canonical domain with `total`, `breakdown`, `version`, `calculatedAt`, and must not silently absorb confidence.

**Actual:** `modules/opportunity-model.js` stores `dimensions.potential` as a scalar normalized by `clamp()` and does not expose the canonical potential structure. `dashboard-runtime.js` also transports `potential` as a scalar dimension into the Radar Opportunity.

**Verdict:** 🔴 CONTRADICTED / legacy representation.

**Evidence:** CODE + CONTRACT.
**Test:** no dedicated canonical potential contract test identified in the current visible test set.
**Priority:** P0.
**findingConfidence:** HIGH.

### AUDIT-SEM-003 — Decision remains a second global score producer

**Contract:** Decision Engine produces no second global score; decision is `status/reason/blockers/trace/version/calculatedAt`.

**Actual:** `modules/decision-engine.js` explicitly computes `score` from demand, sourcing, profitability, confidence and risk, and returns that score in every decision result. It also reconstructs profitability from offer economics.

**Verdict:** 🔴 CONTRADICTED.

**Evidence:** CODE + CONTRACT.
**Test:** visible tests include runtime/orchestrator/economics tests, but no dedicated assertion was identified here proving the V0.4 no-second-score invariant.
**Priority:** P0.
**findingConfidence:** HIGH.

### AUDIT-SEM-004 — Decision trace contract not represented

**Contract:** `decision.trace[]`, blockers, version and calculatedAt are required conceptual decision fields.

**Actual:** `evaluateOpportunity()` returns `decision`, `score`, `profitability`, `offer`, and `reason`; it does not return canonical `trace[]`, `blockers[]`, `version`, or `calculatedAt`.

**Verdict:** 🔴 CONTRADICTED / missing canonical structure.

**Evidence:** CODE + CONTRACT.
**Test:** no dedicated decision-trace contract test identified.
**Priority:** P0/P1.
**findingConfidence:** HIGH.

### AUDIT-SEM-005 — Legacy opportunity schema still uses factual magic defaults

**Contract:** Missing values must not receive undocumented/unversioned magic defaults; canonical domains are explicit.

**Actual:** `data/opportunity-schema.js` initializes economics fields such as `purchaseCost`, `shippingCost`, `customsCost`, `landedCost`, `sellingPrice`, `margin`, `cac` to `0`; `analysis.scoreV4` and `analysis.confidence` also default to `0`, with `decision: 'PENDING'`.

**Verdict:** 🔴 CONTRADICTED for the missing-value/default invariant; additionally LEGACY for canonical structure.

**Evidence:** CODE + CONTRACT.
**Test:** no dedicated schema/default invariant test identified.
**Priority:** P0.
**findingConfidence:** HIGH.

### AUDIT-SEM-006 — Provenance/freshness not demonstrated at important-value level

**Contract:** Important auditable values require provenance at value level, including source/collectedAt/method/reference/verification/freshness/asOf where relevant; verification and freshness are distinct.

**Actual:** visible legacy `opportunity-schema.js` exposes only `traceability.sources[]`, `createdAt`, and `updatedAt`. `modules/opportunity-model.js` exposes `evidence[]` but does not define an auditable evidence item structure. The canonical contract itself explicitly requires value-level provenance.

**Verdict:** ⚪ NON VÉRIFIABLE as a repository-wide absence; 🔴 CONTRADICTED for the visible legacy schema representation.

**Evidence:** CODE + CONTRACT.
**Test:** not established.
**Priority:** P0/P1.
**findingConfidence:** MEDIUM-HIGH.

### AUDIT-SEM-007 — Timestamp semantics are not represented in the visible canonical model

**Contract:** `collectedAt`, `calculatedAt`, `updatedAt`, `startedAt`, `endedAt`, and `asOf` have distinct semantics.

**Actual:** visible `opportunity-schema.js` only has `createdAt` and `updatedAt`; `opportunity-model.js` only has `createdAt`; `v4-data-layer.js` automatically assigns `createdAt`. No canonical timestamp semantics are visible in these models.

**Verdict:** 🔴 CONTRADICTED / incomplete canonical representation.

**Evidence:** CODE + CONTRACT.
**Test:** not established.
**Priority:** P1.
**findingConfidence:** HIGH.

### AUDIT-SEM-008 — Deterministic identity is not demonstrated by data layer

**Contract:** `opportunity.id` is stable and identity generation must be deterministic under declared identity inputs/configuration.

**Actual:** `data/v4-data-layer.js` generates record IDs using `crypto.randomUUID()` or `Date.now()`.

**Verdict:** 🔴 CONTRADICTED for the identity-generation contract when this path is used for canonical Opportunity identity.

**Important limitation:** this proves the data-layer identity generator is non-deterministic; it does not prove every Opportunity identity path uses it. Consumer/ownership tracing remains required.

**Evidence:** CODE + CONTRACT.
**Test:** no deterministic identity test identified.
**Priority:** P0/P1.
**findingConfidence:** HIGH for the generator; MEDIUM for canonical consumer impact.

### AUDIT-SEM-009 — History uses legacy score/confidence/decision representation

**Contract:** Prediction is immutable, Result append-only, and historical evaluations required for audit must be preserved; history must distinguish the canonical evaluation domains.

**Actual:** `modules/history.js` creates entries with `score`, `decision`, and `confidence`, using `Date.now()` as ID and `data.score || null` / `data.confidence || 'unknown'` fallbacks.

**Verdict:** 🔴 CONTRADICTED / LEGACY representation. Destructive deletion was not observed in this file, so no deletion claim is made.

**Evidence:** CODE + CONTRACT.
**Test:** no dedicated history immutability/versioning test identified.
**Priority:** P0/P1.
**findingConfidence:** HIGH.

## Explicit non-conclusions

- No conclusion is made here about the existence/absence of every possible Evidence Engine or connector because repository search is not sufficient proof of absence.
- No conclusion is made that every local normalization policy must be identical across fields; field-level authorization remains the rule.
- No production patch is authorized by these findings.

## STOP CODE

Production code modifications: 0.
Migration: 0.
Contract modification: 0.

Next audit target: source/evidence implementation, confidence engine, freshness/verification fields, ownership/read-write consumers, single scoring authority, and DEMO fixture isolation with exact current-branch evidence.
