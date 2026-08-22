# CHECKPOINT — V0.4 CONTRACT METHOD — 21 AOÛT 2026

## Statut

**GO officiel — méthode verrouillée. Canonical Opportunity Contract V0.4 DRAFT mis à jour avec les garde-fous. Initial repository audit completed. Production code untouched.**

## Ce qui est verrouillé

V4 Sourcing Intelligence passe d'une logique d'ajouts fonctionnels à une logique de **gouvernance contractuelle** avant refactoring.

Architecture cible :

`RADAR → SIGNALS → OPPORTUNITY ENGINE → EVIDENCE → CONFIDENCE → POTENTIAL → ECONOMICS → RISK → DECISION → ACTION → RESULT → LEARNING`

L'Opportunity est le dossier décisionnel canonique.

## Règles non négociables

1. `SIGNAL ≠ OPPORTUNITY`.
2. `EVIDENCE ≠ CONFIDENCE`.
3. `potential ≠ confidence`.
4. Economics reste une réalité financière calculée, pas un score arbitraire.
5. Risk Gates peuvent bloquer une décision indépendamment du Potential.
6. Decision Engine ne produit aucun second score global.
7. Une donnée canonique n'est calculée qu'à un seul endroit.
8. `Read access ≠ ownership`.
9. L'orchestrateur transporte l'Opportunity mais ne possède pas les données métier.
10. `opportunity.id` reste stable.
11. Prediction est immutable.
12. Result ne réécrit jamais Prediction.
13. Delta est dérivé de Prediction + Result.
14. `null ≠ 0`, `UNKNOWN ≠ LOW`, `INSUFFICIENT_DATA ≠ NON_VIABLE`.
15. Les calculs déterministes doivent tracer leur version et leur calculation context.
16. La provenance s'applique au niveau de chaque donnée importante, pas seulement du bloc.
17. `Verification ≠ Freshness`.
18. Evidence distingue `NOT_FOUND`, `UNKNOWN`, `UNVERIFIED`, `CONFLICTING`, `VERIFIED`.
19. Les unités sont obligatoires lorsque pertinentes.
20. `collectedAt`, `calculatedAt`, `updatedAt`, `startedAt`, `endedAt` et `asOf` ont des sémantiques distinctes.
21. Les calculs exposent ou référencent leurs dépendances.
22. L'immutabilité est sélective : `IMMUTABLE`, `VERSIONED`, `MUTABLE`.
23. L'historique nécessaire à l'audit n'est jamais supprimé de façon destructive.
24. Les opérations déterministes doivent être idempotentes lorsqu'elles sont spécifiées comme telles.
25. Aucun magic default implicite (`CAC absent → 0`, `MOQ absent → 1`, etc.).
26. Toute migration doit démontrer la conservation sémantique des données.
27. V0.4 n'ajoute que des garde-fous de cohérence, auditabilité, déterminisme et migration ; les nouvelles fonctionnalités restent hors périmètre.

## Contract Authority

Le fichier normatif est :

`docs/CANONICAL-OPPORTUNITY-CONTRACT-V0.4.md`

Identité :

- `contractId = CANONICAL-OPPORTUNITY`
- `contractVersion = 0.4`
- `schemaVersion = 0.4.0`
- statut actuel : `DRAFT`

Cycle :

`DRAFT → REVIEW → VALIDATED → AUTHORITATIVE → SUPERSEDED`

Une évolution suit :

`CHANGE PROPOSAL → IMPACT ANALYSIS → NEW CONTRACT VERSION → MIGRATION PLAN → VALIDATION → AUTHORITATIVE`

Le contrat V0.4 est maintenant la **cible normative DRAFT**. Les garde-fous ont été intégrés directement dans les 22 sections ; ils ne constituent pas une nouvelle fonctionnalité ni une section contractuelle supplémentaire.

## STOP CODE

Aucun moteur de production ne doit être modifié avant :

`CONTRACT → REPOSITORY AUDIT → GAPS → MIGRATION PLAN → TEST PLAN → IMPLEMENTATION`

Le contrat définit la cible ; le dépôt fournit les faits.

## Méthode d'audit

Deux réalités restent séparées :

### TARGET
Ce que V0.4 exige.

### ACTUAL
Ce que le dépôt fait réellement.

### GAP
La différence démontrée entre TARGET et ACTUAL.

Aucune conclusion ne doit être tirée par intuition.

## Preuves d'audit

Une affirmation architecturale doit être soutenue par une preuve localisable parmi :

- `CODE`
- `TEST`
- `SCHEMA`
- `CONFIGURATION`
- `DOCUMENTATION`

Pour un comportement exécutable : préférence à `CODE + TEST`.

Chaque constat reçoit un Finding ID :

`AUDIT-OPP-001`, `AUDIT-RADAR-001`, `AUDIT-SCORE-001`, `AUDIT-DEC-001`, etc.

Chaîne de traçabilité :

`CONTRACT → FINDING → MIGRATION → COMMIT → TEST → VERIFIED`

## Taxonomie GAP fermée

`CONFORME · À_ADAPTER · CONTRADICTORY · DUPLICATED · MISSING · LEGACY · À_SUPPRIMER · UNKNOWN`

`UNKNOWN` signifie preuves insuffisantes et ne doit jamais être transformé en `CONFORME` par supposition.

## Périmètre V0.4

Le document contractuel couvre 22 sections :

1. Purpose & Scope
2. Contract Authority
3. Canonical Opportunity
4. Sub-contracts / Access Projections
5. Field Definitions
6. Data Ownership
7. Read / Write Permissions
8. Invariants
9. Null / Unknown Semantics
10. Determinism
11. Calculation Context
12. Engine Contracts
13. Decision Contract
14. Action Contract
15. Prediction Contract
16. Result Contract
17. Derived Delta
18. Provenance & Versioning
19. Migration Rules
20. Contract Evolution
21. Validation & Testing
22. Non-Goals

## Garde-fous intégrés au contrat

Les 12 garde-fous sont maintenant intégrés au document canonique :

1. provenance valeur par valeur ;
2. séparation verification/freshness ;
3. états Evidence `NOT_FOUND / UNKNOWN / UNVERIFIED / CONFLICTING / VERIFIED` ;
4. unités explicites ;
5. sémantique stricte des timestamps ;
6. dépendances de calcul traçables ;
7. immutabilité sélective ;
8. conservation historique non destructive ;
9. référence temporelle `asOf` ;
10. idempotence ;
11. interdiction des magic defaults ;
12. conservation sémantique lors des migrations.

Ces garde-fous ne sont pas des fonctionnalités : ils protègent la cohérence, l'auditabilité, le déterminisme et la migration du contrat.

## Initial repository audit — terminé sur le premier périmètre

Audit détaillé : `docs/AUDIT-V0.4-TARGET-ACTUAL-INITIAL.md`

| Finding | Composant | Gap initial |
|---|---|---|
| `AUDIT-OPP-001` | `modules/opportunity-model.js` | `À_ADAPTER` |
| `AUDIT-RADAR-001` | `modules/radar-orchestrator.js` | `CONTRADICTORY` |
| `AUDIT-SCORE-001` | `modules/radar-scoring-engine.js` | `CONTRADICTORY` |
| `AUDIT-DEC-001` | `modules/decision-engine.js` | `CONTRADICTORY` |
| `AUDIT-ECON-001` | `modules/profitability.js` | `À_ADAPTER` |
| `AUDIT-SCHEMA-001` | `data/opportunity-schema.js` | `LEGACY` |
| `AUDIT-HISTORY-001` | `modules/history.js` | `À_ADAPTER` |
| `AUDIT-RISK-001` | Risk Engine | `UNKNOWN` — preuves encore insuffisantes |
| `AUDIT-TRACE-001` | Decision Trace | `MISSING` |

### Constats critiques déjà prouvés

- Radar Scoring Engine pondère actuellement `confidence` à hauteur de 10%.
- Radar Orchestrator construit et transmet actuellement les signaux de scoring et expose les anciens champs `score` / `scoreBreakdown` / `scoreStatus`.
- Decision Engine recalcule actuellement un score global et peut recalculer une composante de profitability.
- Opportunity Model mélange actuellement `potential`, `risk` et `dataConfidence` dans `dimensions`.
- Legacy schema utilise encore `scoreV4`, `confidence`, `risks` et `decision` sous `analysis`.
- History conserve actuellement `score`, `decision` et `confidence`, sans modèle Prediction/Result/Delta V0.4.

## Non-goals immédiats

Pas de :

- ML ;
- IA prédictive ;
- nouveau Radar parallèle ;
- nouveau Decision Engine ;
- second score global ;
- redesign UI ;
- scraping massif prématuré ;
- marketplace fournisseur ;
- automatisation complexe ;
- duplication des moteurs.

## Prochaine étape

**STOP AJOUTS.** Le cadre contractuel est maintenant suffisamment complet.

Prochaine séquence obligatoire :

1. compléter l'audit exhaustif du dépôt réel ;
2. produire le Gap Register complet ;
3. valider Ownership Matrix ;
4. valider Read/Write Matrix ;
5. produire Migration Plan ;
6. produire Test Plan ;
7. seulement après validation, commencer les modifications de production.

**Aucune modification de moteur de production avant ces étapes.**

## Point de référence

État de départ : commit `30292cd01fdeb895bcf304d1b71445255e10f83e` sur `main`.

Le travail de cette branche reste **documentaire uniquement** : contrat, gouvernance, Master et checkpoint/audit. Aucun moteur de production n'a été modifié.
