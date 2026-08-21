# Runtime V1 — Deployment Checkpoint

Date: 2026-08-21

## State

- Canonical Opportunity is the runtime source of truth.
- Dashboard Runtime consumes Opportunity data.
- Radar, sourcing signals, cost breakdown, decision state, and suppliers are wired to the canonical model.
- Production `main` is not modified by this checkpoint.
- This file intentionally records the deployment checkpoint and triggers the Vercel Git integration for `feat/dashboard-cost-breakdown-runtime`.

## Validation gate

Runtime V1 is not considered fully validated until the deployment generated from this branch is opened in a browser and the rendered dashboard is checked against the canonical Opportunity state.
