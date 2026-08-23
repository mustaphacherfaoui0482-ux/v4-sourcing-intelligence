# CANONICAL OPPORTUNITY CONTRACT V0.4 — GUARDRAILS

This document is an addendum to `CANONICAL-OPPORTUNITY-CONTRACT-V0.4.md`. It contains only governance safeguards to be incorporated into the 22 existing contract sections before the contract becomes AUTHORITATIVE. It introduces no product functionality.

## 1. Value-level provenance

Provenance applies to every important auditable value, not only to its containing object.

Where relevant:

```text
value
├── source
├── collectedAt
├── method
├── currency
├── reference
├── verification
├── freshness
└── asOf
```

Example: `landedCost = 8.42` must be traceable to its source, collection time, method, currency and applicable reference/context.

## 2. Verification is not freshness

`verification` answers: "Was this data checked?"

`freshness` answers: "Is this data still temporally relevant?"

Therefore:

`verified = true` does not imply `freshness = HIGH`.

A supplier price verified six months ago may remain verified while having low freshness.

## 3. Evidence status semantics

Evidence must distinguish:

`NOT_FOUND · UNKNOWN · UNVERIFIED · CONFLICTING · VERIFIED`

- `NOT_FOUND` = no supporting evidence found;
- `UNKNOWN` = status cannot currently be determined;
- `UNVERIFIED` = evidence exists but has not been verified;
- `CONFLICTING` = relevant sources disagree;
- `VERIFIED` = evidence has been checked.

`NOT_FOUND` is not negative proof. `CONFLICTING` must never be silently averaged into a false consensus.

## 4. Units are mandatory where relevant

Measured or quantitative values must carry explicit units whenever units are meaningful.

Examples:

```text
7.80 EUR/unit
2.4 kg
20 units
14 days
39.90 EUR
32 %
```

The unit must not be inferred silently from field names.

## 5. Timestamp semantics

These timestamps have distinct meanings:

- `collectedAt` — source/data collection time;
- `calculatedAt` — calculation execution time;
- `updatedAt` — operational record update time;
- `startedAt` — test/action start;
- `endedAt` — test/action end;
- `asOf` — effective date/time of a time-dependent reference/value.

`calculatedAt` and `asOf` are not interchangeable.

## 6. Calculation dependencies

Economic and other derived calculations must expose or reference enough dependency information to explain their outputs.

```text
calculation
├── inputs
├── outputs
├── calculationContext
└── version
```

Inputs may be referenced rather than duplicated when stable canonical references exist.

## 7. Selective immutability

Lifecycle classes are explicit:

- `IMMUTABLE` — identity and historical snapshots such as Prediction;
- `VERSIONED` — recalculable evaluations such as Potential, Confidence and Risk;
- `MUTABLE` — current operational state such as active Actions.

Versioned evaluations append historical versions rather than overwriting the evidence required to audit prior decisions.

## 8. Historical preservation

No destructive deletion of historical evaluations merely because a newer version exists.

Example:

```text
Opportunity #247
├── Evaluation 0.4.0
├── Evaluation 0.5.0
└── Evaluation 0.5.1
```

Historical records needed to reconstruct prior decisions remain addressable.

## 9. Reference time (`asOf`)

Time-dependent economic data must distinguish:

- when the calculation happened (`calculatedAt`);
- when the referenced economic value was valid (`asOf`).

Example:

```text
exchangeRate
reference: EUR/CNY
asOf: 2026-08-21
```

## 10. Idempotence

Deterministic operations must be idempotent where specified:

- migration;
- normalization;
- calculation;
- identity generation;
- validation.

Repeating an operation with the same declared inputs must not create divergent canonical data, duplicate identities or unexplained historical records.

## 11. Magic-default prohibition

Missing information must not silently become a factual value.

Examples prohibited unless explicitly defined, documented and versioned:

```text
CAC absent → CAC = 0
MOQ absent → MOQ = 1
```

Defaults must be explicit, documented, versioned and distinguishable from observed data.

## 12. Semantic conservation during migration

A contract refactor must preserve the meaning of data even when its name or location changes.

Example:

```text
dataConfidence
      ↓ migration
confidence.score
```

The mapping is valid only when semantic equivalence is demonstrated against the old and new definitions. Similar field names are not proof.

## Integration rule

These guardrails are normative additions to the existing 22 sections; they do not create additional contract sections or product features.

Before `AUTHORITATIVE`, the guardrails must be merged into the canonical contract and validated against the repository using:

`TARGET → ACTUAL → GAP → EVIDENCE → FINDING → MIGRATION → TEST`
