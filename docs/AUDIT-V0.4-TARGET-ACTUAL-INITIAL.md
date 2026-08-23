# V0.4 REPOSITORY AUDIT — INITIAL TARGET / ACTUAL

**Contract:** `CANONICAL-OPPORTUNITY` v0.4  
**Audit status:** INITIAL — evidence-backed where inspected, otherwise `UNKNOWN`  
**Production code:** unchanged

## Audit method

`TARGET = contract requirement`  
`ACTUAL = repository behavior`  
`GAP = demonstrated difference`

Evidence classes: `CODE`, `TEST`, `SCHEMA`, `CONFIGURATION`, `DOCUMENTATION`.

## Findings

### AUDIT-OPP-001 — Opportunity model mixes canonical concepts

**Target**

Opportunity separates `signals[]`, `evidence[]`, `confidence`, `potential`, `economics` and `risk`. Confidence must not be part of Potential.

**Actual**

`modules/opportunity-model.js` currently stores `potential`, `risk` and `dataConfidence` together under `dimensions`, while `evidence[]` and `economics` are separate top-level fields. The model therefore does not yet expose the V0.4 canonical projections.

**Gap:** `À_ADAPTER`

**Evidence:** CODE — `modules/opportunity-model.js`.

**Action:** Refactor only after contract audit is complete.

---

### AUDIT-RADAR-001 — Radar orchestrator owns scoring behavior indirectly

**Target**

Radar detects signals and Opportunity Engine assembles the Opportunity. The orchestrator coordinates but does not own business calculations.

**Actual**

`modules/radar-orchestrator.js` directly imports and invokes `calculateRadarScore()`, builds `radarSignals`, and returns legacy `score`, `scoreBreakdown` and `scoreStatus` fields. It also maps `confidence` into `radarSignals`.

**Gap:** `CONTRADICTORY`

**Evidence:** CODE — `modules/radar-orchestrator.js`.

**Action:** Later separate orchestration from scoring and remove confidence from Potential scoring according to the migration plan.

---

### AUDIT-SCORE-001 — Confidence is explicitly weighted into Radar Score

**Target**

`potential.total` must never directly depend on `confidence.score`.

**Actual**

`modules/radar-scoring-engine.js` assigns `confidence: 10` and includes `normalize(signals.confidence) * weights.confidence / 100` in the score calculation.

**Gap:** `CONTRADICTORY`

**Evidence:** CODE — `modules/radar-scoring-engine.js`.

**Action:** Remove this dependency during the controlled Potential/Confidence migration.

---

### AUDIT-DEC-001 — Decision Engine creates a second global score

**Target**

Decision Engine reads canonical Potential, Confidence, Economics and Risk and writes `decision`. It must not manufacture another global score.

**Actual**

`modules/decision-engine.js` calculates a local `score` from demand, sourcing, profitability, confidence and risk. It can also recalculate profitability from an offer's economics and resilience.

**Gap:** `CONTRADICTORY`

**Evidence:** CODE — `modules/decision-engine.js`.

**Action:** Replace with a contract-compliant decision projection only after migration design and tests are approved.

---

### AUDIT-ECON-001 — Profitability module is a real calculation, but incomplete for V0.4

**Target**

Economics remains real financial data and should expose the canonical economic outputs needed for decision-making.

**Actual**

`modules/profitability.js` calculates `contribution` and `margin` from sale price, landed cost, fees and CAC. It does not currently expose the full V0.4 economic contract such as `minimumSellingPrice`, `maxCAC`, `ROASBreakEven`, versioning or calculation context.

**Gap:** `À_ADAPTER`

**Evidence:** CODE — `modules/profitability.js`.

**Action:** Map existing outputs to the canonical Economics contract before expanding the implementation.

---

### AUDIT-SCHEMA-001 — Legacy schema still uses flat analysis fields

**Target**

Canonical V0.4 separates `potential`, `confidence`, `risk`, `decision`, provenance and versioning.

**Actual**

`data/opportunity-schema.js` currently contains `analysis.scoreV4`, `analysis.confidence`, `analysis.risks` and `analysis.decision`, plus economics values under a simpler structure.

**Gap:** `LEGACY`

**Evidence:** SCHEMA — `data/opportunity-schema.js`.

**Action:** Define deterministic legacy-to-canonical migration mapping; do not remove legacy fields until migration/tests exist.

---

### AUDIT-HISTORY-001 — History is not yet Prediction/Result based

**Target**

Prediction is immutable; Result records observed reality; Delta is derived from Prediction + Result.

**Actual**

`modules/history.js` stores a generic `score`, `decision` and `confidence` history entry. It does not currently model Prediction, Result or derived Delta.

**Gap:** `À_ADAPTER`

**Evidence:** CODE — `modules/history.js`.

**Action:** Adapt history after the canonical contract and migration rules are validated.

---

### AUDIT-RISK-001 — Risk Engine ownership not yet proven

**Target**

Risk Engine owns structured risk categories and Risk Gates. A blocked gate can independently block a decision.

**Actual**

The inspected initial file set does not yet provide sufficient evidence for a dedicated canonical Risk Engine contract.

**Gap:** `UNKNOWN`

**Evidence:** INSUFFICIENT — repository tree and inspected modules; dedicated Risk Engine behavior requires further repository search/audit.

**Action:** Continue repository audit before changing Risk implementation.

---

### AUDIT-TRACE-001 — Decision Trace not yet present as canonical contract

**Target**

`decision.trace[]` is an explanatory artifact and never a second calculation engine.

**Actual**

The inspected `decision-engine.js` returns decision, score, profitability, offer and reason, but no canonical `trace[]` structure.

**Gap:** `MISSING`

**Evidence:** CODE — `modules/decision-engine.js`.

**Action:** Define trace format in contract; implementation only after migration/test plan.

## Initial audit summary

| Area | Status |
|---|---|
| Opportunity model | `À_ADAPTER` |
| Radar orchestrator | `CONTRADICTORY` |
| Radar scoring | `CONTRADICTORY` |
| Decision Engine | `CONTRADICTORY` |
| Economics | `À_ADAPTER` |
| Legacy schema | `LEGACY` |
| History | `À_ADAPTER` |
| Risk Engine | `UNKNOWN` |
| Decision Trace | `MISSING` |

## Important conclusion

These findings **do not authorize production refactoring yet**.

They demonstrate why the contract-first method is necessary. The repository already contains useful components, but several boundaries contradict the V0.4 target.

Next required phase:

`COMPLETE AUDIT → GAP REGISTER → OWNERSHIP/READ-WRITE VALIDATION → MIGRATION PLAN → TEST PLAN → IMPLEMENTATION`
