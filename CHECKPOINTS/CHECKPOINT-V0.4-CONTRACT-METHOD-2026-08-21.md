# CHECKPOINT — V0.4 CONTRACT METHOD — 21 AOÛT 2026

## Statut

**GO officiel — méthode verrouillée.**

## Ce qui vient d'être verrouillé

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

## Contract Authority

Le fichier normatif est :

`docs/CANONICAL-OPPORTUNITY-CONTRACT-V0.4.md`

Identité :

- `contractId = CANONICAL-OPPORTUNITY`
- `contractVersion = 0.4`
- `schemaVersion = 0.4.0`
- statut initial : `DRAFT`

Cycle :

`DRAFT → REVIEW → VALIDATED → AUTHORITATIVE → SUPERSEDED`

Une évolution suit :

`CHANGE PROPOSAL → IMPACT ANALYSIS → NEW CONTRACT VERSION → MIGRATION PLAN → VALIDATION → AUTHORITATIVE`

## STOP CODE

Aucun moteur de production ne doit être modifié avant :

`CONTRACT → REPOSITORY AUDIT → GAPS → MIGRATION PLAN → TEST PLAN → IMPLEMENTATION`

Le contrat définit la cible ; le dépôt fournit les faits.

## Méthode d'audit

Deux réalités doivent rester séparées :

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

Chaque constat important reçoit un Finding ID, par exemple :

`AUDIT-OPP-001`
`AUDIT-RADAR-002`
`AUDIT-DEC-003`

Chaîne de traçabilité :

`CONTRACT → FINDING → MIGRATION → COMMIT → TEST → VERIFIED`

## Taxonomie GAP fermée

| État | Signification |
|---|---|
| `CONFORME` | ACTUAL respecte TARGET |
| `À_ADAPTER` | architecture correcte mais implémentation différente |
| `CONTRADICTORY` | ACTUAL viole une règle du contrat |
| `DUPLICATED` | responsabilité détenue par plusieurs composants |
| `MISSING` | responsabilité absente |
| `LEGACY` | ancien contrat encore présent |
| `À_SUPPRIMER` | logique incompatible sans valeur à conserver |
| `UNKNOWN` | preuves insuffisantes |

`UNKNOWN` ne doit jamais être transformé en `CONFORME` par supposition.

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

**Confronter le contrat au dépôt réel, fichier par fichier, sans modifier les moteurs de production.**

Premiers composants à auditer :

`modules/opportunity-model.js`  
`modules/radar-orchestrator.js`  
`modules/radar-scoring-engine.js`  
`modules/profitability.js`  
`modules/decision-engine.js`  
`modules/history.js`  
`data/opportunity-schema.js`

Le résultat attendu est un registre `TARGET / ACTUAL / GAP / EVIDENCE / FINDING / ACTION / STATUS`.

## Point de référence

État de départ de ce checkpoint : commit `30292cd01fdeb895bcf304d1b71445255e10f83e` sur `main`.

**Aucune modification de production n'est incluse dans ce checkpoint.**
