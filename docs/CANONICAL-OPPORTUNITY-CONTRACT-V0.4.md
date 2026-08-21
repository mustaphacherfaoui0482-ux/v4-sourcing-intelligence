# CANONICAL OPPORTUNITY CONTRACT V0.4

**contractId:** `CANONICAL-OPPORTUNITY`  
**contractVersion:** `0.4`  
**schemaVersion:** `0.4.0`  
**status:** `DRAFT`

> This document is the normative target for the V4 Sourcing Intelligence contract. It does not claim that the current repository already conforms to it. Repository reality must be audited separately.

## 01. Purpose & Scope

Define the canonical Opportunity model, ownership, permissions, invariants, calculation context, engine boundaries, decision traceability, prediction/result history, migration rules and evolution rules for V0.4.

V0.4 is a contract/governance milestone. No production engine is modified merely because this document exists.

## 02. Contract Authority

After formal validation, this contract becomes the normative authority for the V0.4 target.

Lifecycle:

`DRAFT → REVIEW → VALIDATED → AUTHORITATIVE → SUPERSEDED`

V0.4 is not eternal truth. Any contract change must follow:

`CHANGE PROPOSAL → IMPACT ANALYSIS → NEW CONTRACT VERSION → MIGRATION PLAN → VALIDATION → AUTHORITATIVE`

No silent contract changes are permitted.

## 03. Canonical Opportunity

The Opportunity is the canonical decision dossier for a sourcing opportunity.

```text
Opportunity
├── identity
├── signals[]
├── evidence[]
├── confidence
├── potential
├── economics
├── risk
├── decision
├── action[]
├── prediction
├── result
└── learning
```

`opportunity.id` is a stable identity. Re-evaluation, engine-version changes and new results do not create a new Opportunity identity.

## 04. Sub-contracts / Access Projections

Opportunity is a canonical aggregate, not a God Object. Engines receive only the projection required by their contract.

**Rule:** `Read access ≠ ownership.`

The orchestrator may transport an Opportunity during execution but is not the owner of business data and must not silently mutate business values.

## 05. Field Definitions

### identity
Stable identity and source-independent identifiers required to track the Opportunity over time.

### signals[]
Raw or normalized market/sourcing signals detected by Radar.

### evidence[]
Documented evidence supporting claims or inputs. Evidence may carry provenance, freshness, verification state and source reference.

### confidence
Reliability of the analysis/data, not attractiveness of the Opportunity.

```text
confidence
├── score
├── coverage
├── freshness
├── verification
├── version
└── calculatedAt
```

### potential
Assessment of opportunity potential. It must not silently absorb confidence.

```text
potential
├── total
├── breakdown
├── version
└── calculatedAt
```

### economics
Real financial values, not an abstract economics score.

Minimum conceptual fields:

`sellingPrice`, `landedCost`, `variableCosts`, `CAC`, `contribution`, `contributionMargin`, `minimumSellingPrice`, `maxCAC`, `ROASBreakEven`, `status`.

### risk
Structured risks and gates. Risk is not merely a score deduction.

```text
risk
├── categories
├── gates[]
├── overallStatus
├── version
└── calculatedAt
```

### decision
The single principal system recommendation.

```text
decision
├── status
├── reason
├── blockers[]
├── trace[]
├── version
└── calculatedAt
```

### action[]
Concrete user actions owned by the Action domain, not embedded as a second decision system.

### prediction
Immutable snapshot of the analysis used for a test/decision.

### result
Observed real-world test outcome. It never rewrites the original prediction.

### learning
Reserved for a future Learning Engine. V0.4 defines the boundary but does not implement predictive ML/AI learning.

## 06. Data Ownership

| Data | Owner |
|---|---|
| `signals[]` | Radar |
| Opportunity assembly/identity | Opportunity Engine |
| `evidence[]` | Evidence Layer |
| `confidence` | Confidence Engine |
| `potential` | Potential Scoring Engine |
| `economics` | Profitability / Economics |
| `risk` | Risk Engine |
| `decision` | Decision Engine |
| `action[]` | Action domain |
| `prediction` | Evaluation / Prediction domain |
| `result` | Result / History |
| `learning` | Learning Engine — future version |

No other engine may silently become a secondary owner of a canonical value.

## 07. Read / Write Permissions

| Engine | May read | May write |
|---|---|---|
| Radar | source inputs/signals | `signals[]` |
| Opportunity Engine | signals + permitted raw inputs | identity/assembly |
| Evidence | source inputs/signals | `evidence[]` |
| Confidence | evidence | `confidence` |
| Potential | Opportunity + authorized signals/evidence | `potential` |
| Economics | economic inputs | `economics` |
| Risk | Opportunity + economics + evidence | `risk` |
| Decision | `potential`, `confidence`, `economics`, `risk` | `decision` |
| Action | `decision` + blockers | `action[]` |
| Result/History | real test data + prediction reference | `result` |
| Learning | prediction + result | `learning` in a future version |

A consumer may not recalculate a canonical value simply because it can read its inputs.

## 08. Invariants

1. `potential.total` never directly depends on `confidence.score`.
2. Economics remains real financial data; no canonical `economicsScore` may replace it.
3. `risk.gates[].status = BLOCKED` may block a decision independently of Potential.
4. Decision Engine produces no second global score.
5. `decision` does not own `actions[]`; Action owns actions.
6. Result never mutates Prediction retroactively.
7. `opportunity.id` is stable.
8. Canonical calculations are deterministic under the same declared inputs, engine version, configuration and calculation context.
9. `delta` is derived from Prediction + Result and is not a primary source of truth.
10. Missing information must never be silently converted into a negative factual value.
11. No engine may silently modify a canonical value owned by another engine.

## 09. Null / Unknown Semantics

The following distinctions are mandatory:

`null ≠ 0`  
`UNKNOWN ≠ LOW`  
`UNKNOWN ≠ SAFE`  
`INSUFFICIENT_DATA ≠ NON_VIABLE`

Example:

`confidence.score = null` means confidence could not be reliably calculated.  
`confidence.score = 0` means confidence was calculated and equals zero.

`economics.status = INSUFFICIENT_DATA` must not automatically become `DECISION = AVOID`.

## 10. Determinism

For a canonical calculation:

> Same declared input + same engineVersion + same configuration + same calculationContext → same result.

If an external deterministic reference changes, that reference/version must be identifiable so the result can be audited as `DATA_CHANGED`, `ENGINE_CHANGED` or `CONTRACT_CHANGED` rather than treated as unexplained drift.

## 11. Calculation Context

Economic or context-sensitive calculations must be traceable through a calculation context where applicable:

```text
calculationContext
├── references
├── configurationVersion
├── locale
├── currency
├── exchangeRateReference
└── calculatedAt
```

References may include versioned shipping, customs, fees, tax, exchange-rate or other economic tables.

## 12. Engine Contracts

The pipeline is:

`RADAR → SIGNALS → OPPORTUNITY ENGINE → EVIDENCE → CONFIDENCE → POTENTIAL → ECONOMICS → RISK → DECISION → ACTION → RESULT → LEARNING`

The Radar detects; Opportunity Engine assembles/normalizes; Evidence documents; Confidence measures reliability; Potential evaluates attractiveness; Economics calculates financial viability; Risk identifies obstacles/gates; Decision selects the principal recommendation; Action translates it into executable work; Result records reality; Learning is future scope.

No engine may silently duplicate another engine's canonical calculation.

## 13. Decision Contract

Decision is a recommendation, not another score.

Required conceptual structure:

```text
decision.status
 decision.reason
 decision.blockers[]
 decision.trace[]
```

Decision states must be explicit and machine-readable. At minimum, the system must be able to represent states such as `INVESTIGATE`, `TEST`, `WAIT`, `AVOID`, `BUY` where the current product rules permit them.

### Decision Trace

`decision.trace[]` is explanatory evidence about the inputs/rules used during the decision. It is not a second calculation engine, not a new score and not a source of canonical data.

## 14. Action Contract

Action is separate from Decision.

Decision answers: **what the system recommends.**  
Action answers: **what the user/system must do next.**

Actions should be explicit, actionable and traceable to the decision/blockers.

## 15. Prediction Contract

Prediction is an immutable snapshot created at decision/test time.

```text
prediction
├── createdAt
├── potential
├── confidence
├── economics
├── risk
├── decision
└── engine/context versions
```

Prediction must never be rewritten after Result exists.

## 16. Result Contract

Result records observed reality:

```text
result
├── testId
├── startedAt
├── endedAt
├── spend
├── unitsSold
├── revenue
├── CAC
├── ROAS
├── contribution
└── actualOutcome
```

Result is historical evidence, not a mechanism for retroactively correcting Prediction.

## 17. Derived Delta

Conceptually:

`delta = compare(prediction, result)`

Delta may expose differences such as CAC, ROAS, revenue, contribution and outcome. It is derived and must not become an independently editable source of truth.

## 18. Provenance & Versioning

At minimum, trace:

- `contractId`
- `contractVersion`
- `schemaVersion`
- relevant `engineVersion`
- `calculationContext`
- evidence/source provenance where applicable
- timestamps

A result must allow future analysis to distinguish changes in data/reference, engine logic and contract semantics.

## 19. Migration Rules

Legacy → Migration → Canonical V0.4 → Validation.

Migration must be deterministic and, where possible, idempotent.

Every migrated legacy field must have:

- target canonical field;
- transformation rule;
- target owner;
- compatibility status;
- deprecation plan.

No permanent legacy alias without a defined deprecation version/date.

## 20. Contract Evolution

Compatibility model:

- `V0.4.x` — compatible corrections/extensions where semantics and invariants remain intact;
- `V0.5` — contract evolution;
- `V1.0` — potential major/breaking evolution.

A change is **breaking** if it changes the meaning, ownership, type, permissions, invariants or mandatory dependencies of canonical data.

Every breaking change requires impact analysis and migration planning.

## 21. Validation & Testing

Validation has three levels:

1. **Structural** — schema and object structure are valid.
2. **Contractual** — ownership, permissions, null semantics and invariants are coherent.
3. **Repository** — the contract can be confronted against actual code, tests, schemas and configuration.

Audit evidence categories:

`CODE · TEST · SCHEMA · CONFIGURATION · DOCUMENTATION`

For executable behavior, prefer `CODE + TEST`.

Audit findings use stable IDs such as `AUDIT-OPP-001` and should connect:

`CONTRACT → FINDING → MIGRATION → COMMIT → TEST → VERIFIED`

## 22. Non-Goals

V0.4 does not introduce:

- ML;
- predictive AI;
- a parallel Radar;
- a new Decision Engine;
- a second global score;
- a UI redesign;
- mass scraping before the data model is validated;
- a supplier marketplace;
- complex automation;
- duplicated engines;
- silent contract changes.

## Audit Method — mandatory execution rule

The contract defines the target; the repository provides the facts.

```text
TARGET
  = V0.4 requirement

ACTUAL
  = repository behavior

GAP
  = demonstrated difference
```

A finding must never be marked `CONFORME` by intuition. It requires localizable evidence.

Closed GAP taxonomy:

`CONFORME · À_ADAPTER · CONTRADICTORY · DUPLICATED · MISSING · LEGACY · À_SUPPRIMER · UNKNOWN`

`UNKNOWN` means evidence is insufficient; it is not a synonym for probable conformity.

## Current Status

**DRAFT — ready for repository confrontation.**

Production engines must remain unchanged until this specification has been reviewed against the real repository and the resulting gap register, migration plan and test plan have been validated.
