# AUDIT V0.4 — GAP REGISTER

Status: INITIAL / EVIDENCE-BASED
Contract: CANONICAL-OPPORTUNITY V0.4
Branch: feat/canonical-opportunity-contract-v0.4

## Method

TARGET = Canonical Opportunity Contract V0.4.
ACTUAL = repository implementation.
GAP = demonstrated difference.

No finding is marked CONFORME without localizable repository evidence.

## Initial Findings

| Finding ID | Component | Target V0.4 | Actual observed | Gap | Status | Priority |
|---|---|---|---|---|---|---|
| AUDIT-OPP-001 | opportunity-model | `potential`, `confidence`, `economics`, `risk` are distinct canonical domains | Legacy structure still groups `potential`, `risk` and `dataConfidence` under shared dimensions in the current model | ownership/semantic separation incomplete | À_ADAPTER | P0 |
| AUDIT-SCORE-001 | radar-scoring-engine | Potential must not directly depend on confidence | Radar scoring still assigns confidence a weighting in the global score | confidence contaminates potential | CONTRADICTORY | P0 |
| AUDIT-RADAR-001 | radar-orchestrator | Orchestrator transports data but does not own business calculations | Orchestrator exposes/calculates legacy score, breakdown and status while coordinating scoring | hidden/duplicated business responsibility | CONTRADICTORY | P0 |
| AUDIT-DEC-001 | decision-engine | Decision consumes canonical outputs and produces status/reason/blockers/trace; no global score | Decision path still computes/reconstructs a global score and profitability-related values | decision engine duplicates scoring/economics | CONTRADICTORY | P0 |
| AUDIT-ECO-001 | economics | One canonical owner for economics | Multiple economics/cost calculation paths exist | duplicated canonical calculation responsibility | DUPLICATED | P0 |
| AUDIT-DEFAULT-001 | normalization/economics | Missing values remain null/unknown unless defaults are explicit, documented and versioned | Legacy paths use zero/other fallback values for absent inputs | UNKNOWN is converted into a factual value | CONTRADICTORY | P0 |
| AUDIT-LEGACY-001 | legacy opportunity schema | Canonical fields are authoritative; legacy aliases have deprecation plan | Legacy score/confidence/risks/decision fields remain active | legacy contract still participates in runtime | LEGACY | P0 |
| AUDIT-DEC-002 | decision engines | One Decision owner | Multiple decision-related engines coexist | ownership duplication requires consolidation mapping | DUPLICATED | P0 |
| AUDIT-SCORE-002 | master scoring | One Potential owner, no second global score | Additional master/global scoring engine exists | parallel scoring responsibility | DUPLICATED | P0 |
| AUDIT-LEARN-001 | learning engines | Learning reserved for future scope; prediction/result boundary defined without premature ML | Multiple learning/feedback/optimization engines already exist | out-of-scope implementation must be contained, not expanded | LEGACY | P1 |
| AUDIT-HISTORY-001 | history | Prediction immutable; Result append-only; Delta derived | History still relies on legacy score/decision/confidence model | historical contract must migrate | À_ADAPTER | P0 |
| AUDIT-TRACE-001 | decision explainability | `decision.trace[]` records inputs/rules without recalculation | Explainability exists but is not yet canonical decision trace contract | trace semantics need normalization | À_ADAPTER | P1 |
| AUDIT-DASH-001 | dashboard | Dashboard consumes canonical Opportunity projections | Dashboard still consumes legacy `score` fields | UI contract depends on legacy scoring | LEGACY | P1 |
| AUDIT-TEST-001 | tests | Tests must encode V0.4 invariants and ownership boundaries | Existing tests still assert legacy score/scoreBreakdown behavior in key paths | test suite currently protects legacy behavior | CONTRADICTORY | P0 |
| AUDIT-PERSIST-001 | persistence | Audit-relevant history must not be destructively deleted | Persistence exposes state removal behavior requiring usage-level audit | deletion safety not yet proven | UNKNOWN | P1 |

## Evidence Standard

Each finding must be upgraded with exact file/function/line evidence before implementation.

Evidence categories:

- CODE
- TEST
- SCHEMA
- CONFIGURATION
- DOCUMENTATION

For runtime behavior, prefer CODE + TEST.

## Next Audit Pass

1. Verify every finding against exact current branch files and line ranges.
2. Build complete ownership matrix.
3. Build complete read/write matrix.
4. Identify every duplicate producer of `score`, `confidence`, economics and decision.
5. Trace dashboard/API consumers of legacy fields.
6. Trace persistence and history mutation paths.
7. Produce migration mapping legacy → canonical V0.4.
8. Produce non-regression test plan.
9. Only then begin production implementation.

## Non-Modification Rule

This register is an audit artifact. It does not authorize production-engine changes.
