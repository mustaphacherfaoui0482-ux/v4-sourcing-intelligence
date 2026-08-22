# V4 Sourcing Intelligence — Decision Engine v3

## Objective

Implement the DECISION FIRST architecture:

`DATA → ANALYSE → GATES → DECISION → ACTION`

The global score is informative. It never overrides a blocking gate.

## Decision states

- `ACHETER`: economics validated, confidence sufficient, acceptable risk, no unresolved major gate.
- `TESTER`: viable opportunity whose remaining uncertainty can be reduced by a bounded experiment.
- `ATTENDRE`: critical information or condition remains unresolved and should be verified before commercial commitment.
- `EVITER`: confirmed blocking condition or structurally non-viable economics.

## Independent dimensions

- Potential: commercial attractiveness.
- Demand: demand evidence and market signals.
- Economics: contribution, margin, CAC headroom and resilience.
- Risk: exposure, represented by `riskScore` where 0 is low exposure and 100 is high exposure.
- Confidence: trust in the conclusion; it is not a positive opportunity factor.
- Evidence: P0 → P4 remains independent from Potential.

## Gates

Gate levels:

- `BLOQUANT`: can prevent ACHETER.
- `MAJEUR`: prevents a firm decision until resolved in critical cases.
- `MINEUR`: does not automatically block.

Critical examples:

- negative economics;
- confirmed regulatory incompatibility;
- incompatible supplier;
- confirmed critical quality failure;
- incompatible logistics.

An unresolved regulatory requirement is represented as an unresolved critical condition and produces `ATTENDRE`, not `EVITER`.

## Contradictions

The contradiction engine detects conflicts such as:

- high Potential + weak Economics;
- high Potential + low Confidence;
- high Potential + high Risk;
- strong commercial attractiveness + unresolved regulation;
- attractive opportunity + excessive MOQ.

Contradictions are not averaged away.

## Opportunity Index

The current calibration is:

- Potential: 30%
- Demand: 20%
- Economics: 35%
- Risk Quality: 15%

`Risk Quality = 100 - riskScore`.

Confidence is deliberately excluded from the weighted index because uncertainty changes how strongly the conclusion can be trusted; it does not make the underlying opportunity intrinsically better or worse.

## Initial BUY thresholds

- Potential ≥ 75
- Economics ≥ 75
- Risk Quality ≥ 70
- Confidence ≥ 75
- no major unresolved gate
- no critical contradiction

These are calibration parameters, not universal commercial truths. They must be validated against real V4 cases.
