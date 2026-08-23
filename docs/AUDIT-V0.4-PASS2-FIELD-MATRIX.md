# AUDIT V0.4 — PASS 2 FIELD MATRIX

Status: IN_PROGRESS / EVIDENCE-BASED
Contract: CANONICAL-OPPORTUNITY V0.4
Branch: feat/canonical-opportunity-contract-v0.4

## Method

TARGET = Canonical Opportunity Contract V0.4.
ACTUAL = current repository `main` behavior re-observed during PASS 2.

No conclusion is inferred from file names, comments, or absence of search results alone.
CODE proves observed behavior. Contract conformity requires Contract + Code, and preferably Test for executable behavior.

## Finding root

`AUDIT-SEM-001` — Non-canonical / not-yet-established semantics of absent or invalid information.

This PASS 2 records field-level observations and their contract status. It does not authorize production-engine changes.

## Matrix

| Field | Input state | Observed transformation / representation | Contract rule | Authorized? | Test | Proof | Verdict | Priority | findingConfidence |
|---|---|---|---|---|---|---|---|---|---|
| risk | MISSING / NULL | `opportunity-model.clamp()` converts to `0`; `risk-engine` starts `score=100` and only changes risk for selected conditions | Missing information must not silently become factual negative/positive values; risk is a structured domain with `categories`, `gates[]`, `overallStatus`, version and calculation timestamp | NO / NOT ESTABLISHED | No dedicated risk test found in `tests/` | CODE | CONTRADICTED for canonical risk shape/gates; transformation semantics require field-level policy confirmation | P0 | HIGH |
| landedCost | MISSING / NULL / non-number | Opportunity normalization converts to `0`; economics `nonNegative()` also converts to `0` | `null != 0`; missing values must not receive undocumented/unversioned magic defaults; economics is real financial data | NO | No adversarial null/missing landed-cost test found | CODE + CONTRACT | CONTRADICTED | P0 | HIGH |
| dataConfidence / confidence | MISSING / NULL | Legacy opportunity model stores `dimensions.dataConfidence` through `clamp()` → `0`; legacy schema uses `analysis.confidence: 0` | Confidence is a distinct canonical domain with score, coverage, freshness, verification, version and calculatedAt; `confidence.score = null` means not reliably calculable; missing values must not silently become 0 | NO | No dedicated null/unknown confidence invariant test found | CODE + CONTRACT | CONTRADICTED / legacy representation | P0 | HIGH |
| demand | MISSING / non-number | Radar `normalize()` converts non-number to `0`; legacy opportunity model also clamps demand to `0` | Radar owns `signals[]`; canonical Opportunity should expose signals/evidence/confidence/potential rather than silently converting absent input into a factual score | NOT ESTABLISHED | No adversarial missing-demand test found | CODE + CONTRACT | CONTRADICTED for silent default; canonical field semantics also incomplete | P0 | HIGH |
| potential | MISSING | Legacy Opportunity stores numeric `dimensions.potential` via clamp → `0`; no canonical `potential.total/breakdown/version/calculatedAt` structure observed in this model | `potential` is its own canonical domain and must not silently absorb confidence | NO for current representation | No dedicated canonical potential test found | CODE + CONTRACT | CONTRADICTED / legacy representation | P0 | HIGH |
| margin | MISSING / NULL | Opportunity normalization converts to `0`; risk engine condition is gated by truthiness, so missing/0 does not create LOW_MARGIN | Economics must contain real financial values; canonical economics is not a score | NOT ESTABLISHED for legacy field semantics | No dedicated margin-missing test found | CODE + CONTRACT | CONTRACT GAP for legacy field semantics; silent 0 remains observed | P1 | MEDIUM |
| availability | MISSING / NULL | Opportunity normalization converts to `0`; no canonical availability field is defined in V0.4 contract | Canonical Opportunity contract defines signals/evidence and domain ownership, but does not define this legacy dimension explicitly | UNKNOWN | No dedicated availability test found | CODE + CONTRACT | CONTRACT GAP / legacy field semantics | P1 | MEDIUM |
| easeOfTest | MISSING / NULL | Opportunity normalization converts to `0`; no canonical field definition observed in V0.4 contract | V0.4 does not define this legacy dimension as a canonical domain | UNKNOWN | No dedicated test found | CODE + CONTRACT | CONTRACT GAP / legacy field semantics | P1 | MEDIUM |

## Risk-specific observation

`modules/risk-engine.js` currently returns:

- `riskScore`
- `risks[]`
- `status`

It does not expose the canonical `risk.categories`, `risk.gates[]`, `risk.overallStatus`, `version`, or `calculatedAt` structure required by the V0.4 target.

This is a directly observable Contract ↔ Code mismatch. The exact semantics of missing risk inputs still require field-level policy analysis; no global UNKNOWN policy is invented here.

## Additional cross-field observation

Current code contains multiple local normalization policies:

- Opportunity: non-numeric/absent → `0`.
- Radar: non-number → `0`.
- Economics: absent/non-numeric → `0`.
- Decision: non-finite → `0`; absent `riskScore` defaults to `100`.
- Risk: absent/falsey `dataConfidence` creates `LOW_DATA_CONFIDENCE` and reduces a starting score of `100`.

The demonstrated fact is the existence of multiple local policies. This document does not assume that one global policy is required; authorization must be checked against field semantics in the Contract.

## Test evidence status

No dedicated risk-engine test file is present in the current `tests/` directory listing. Existing tests visible there cover dashboard runtime, module runtime, radar orchestrator and offer economics, but do not by themselves prove the PASS 2 field invariants above.

## STOP CODE

Production code modifications: 0.
Migration: 0.
Contract modification: 0.

Next legitimate step: continue the same field-by-field comparison for evidence, freshness, timestamps, provenance, calculation dependencies, determinism/idempotence, gates, decision trace and DEMO fixture isolation.
