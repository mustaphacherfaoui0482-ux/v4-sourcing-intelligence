# CHECKPOINT V4 — FINALISATION TECHNIQUE

**Date :** 21 août 2026  
**Projet :** V4 Sourcing Intelligence  
**Branche de travail :** `feat/dashboard-cost-breakdown-runtime`

## 1. Objet

Ce document est le checkpoint officiel de reprise de la phase de finalisation technique.

Il **ne remplace pas le MASTER V4** et ne modifie pas le MASTER. Il conserve l'état du travail pour permettre de reprendre exactement là où nous nous sommes arrêtés.

---

## 2. Ce que nous avons fait et vérifié

### Architecture Opportunity

- Le modèle canonique `Opportunity` existe.
- `createOpportunity()` est le point de normalisation de l'Opportunity.
- Le Radar / sourcing produit une Opportunity canonique.
- Le Radar Scoring Engine reste l'autorité du scoring.
- `ui-adapter.js` sert à transformer l'Opportunity en données de présentation.

### Data Layer

- Une collection `opportunities` existe dans le Data Layer.
- Le Data Layer permet la création, la lecture et la recherche d'Opportunities.
- Le Data Layer actuel est une couche mémoire.
- Aucune nouvelle base de données n'a été ajoutée pendant cette phase.

### Dashboard Runtime

- `modules/dashboard-runtime.js` existe.
- Le runtime consomme le modèle canonique Opportunity.
- Le Dashboard conserve `DEMO_OPPORTUNITY` comme fallback.
- Le bridge Active Opportunity a été ajouté sur la branche de travail.
- Ordre de priorité du bridge :

`window.V4SourcingOpportunity → localStorage → Data Layer opportunities → DEMO_OPPORTUNITY`

- Un mécanisme de rafraîchissement du runtime a été ajouté.
- Le runtime expose son état via `window.V4SourcingRuntime`.
- Une correction a été intégrée directement dans la branche active pour que le coût rendu affiché par le KPI/mobile provienne de `economics.inputs.landedCost`, et non de la dimension de scoring `dimensions.landedCost`.
- Le design existant n'a pas été volontairement refondu.

### Déploiement / GitHub / Vercel

- La branche `feat/dashboard-cost-breakdown-runtime` existe.
- Le PR #6 reste ouvert et pointe maintenant sur le commit `087eb82bbbcc017683757da0fded90737542ed9a`.
- Le commit finalisé de la correction runtime a généré un preview Vercel **READY** : `dpl_8UsYa5VUK12xVBcFLKRCyAwZrjMj`.
- Les deux checks Vercel associés au commit sont en état **success**.
- Le PR #7, qui portait séparément la correction du landed cost, a été fermé car sa correction a été intégrée directement dans la branche active.
- `main` n'a pas été fusionné à ce stade.

---

## 3. Ce qui a été volontairement préservé

- Pas de refonte graphique.
- Pas de nouvelle fonctionnalité métier non nécessaire.
- Pas de nouvelle infrastructure de base de données.
- Pas de déplacement du scoring hors du Radar Scoring Engine.
- Pas de remplacement inutile de l'architecture existante.
- Pas de fusion vers `main` tant que la validation finale dans le navigateur n'est pas prouvée.

---

## 4. Ce qui reste à accomplir

### A — Validation navigateur / preview

- [ ] Ouvrir le dernier preview Vercel dans un navigateur.
- [ ] Vérifier que le Dashboard se charge correctement.
- [ ] Vérifier que le runtime est effectivement exécuté.
- [ ] Vérifier que `V4SourcingRuntime` est disponible et prêt.
- [ ] Vérifier l'absence d'erreurs JavaScript dans la console.

**Limitation actuelle :** l'environnement de travail ne fournit pas actuellement un contrôle navigateur interactif exploitable. Je ne peux donc pas déclarer cette validation comme réussie sur la seule base du statut Vercel READY.

### B — Validation du flux Opportunity

- [ ] Vérifier le flux réel : `Radar → Opportunity → Data Layer → Dashboard`.
- [ ] Vérifier qu'une Opportunity réelle alimente effectivement le Dashboard.
- [ ] Vérifier que les valeurs affichées correspondent à l'Opportunity canonique.
- [ ] Vérifier le produit, score, coût rendu, marge, décision, fournisseurs et autres champs branchés.
- [ ] Vérifier que `DEMO_OPPORTUNITY` n'est utilisée qu'en fallback.
- [ ] Vérifier le comportement après rechargement de la page.

### C — Validation visuelle

- [ ] Comparer le Dashboard déployé avec la référence visuelle.
- [ ] Contrôler les éléments un par un.
- [ ] Conserver les éléments conformes.
- [ ] Corriger uniquement les écarts réellement constatés.
- [ ] Ne pas lancer de refonte graphique.

### D — Validation GitHub / CI

- [x] Vérifier le PR de la branche de travail : PR #6 ouvert et mergeable.
- [x] Vérifier les checks Vercel disponibles : success sur le commit `087eb82bbbcc017683757da0fded90737542ed9a`.
- [x] Vérifier que la correction landed-cost est intégrée à la branche active.
- [ ] Vérifier le diff final complet avant fusion.
- [ ] Vérifier qu'aucune modification parasite n'a été introduite.

### E — Finalisation Vercel

- [ ] Après validation navigateur/visuelle positive, fusionner PR #6 vers `main`.
- [ ] Vérifier le nouveau déploiement de production.
- [ ] Vérifier que la production correspond exactement au code validé.
- [ ] Effectuer un dernier contrôle fonctionnel.

### F — Clôture

- [ ] Créer le checkpoint final de clôture.
- [ ] Marquer la phase comme FINALISÉE uniquement lorsque toutes les validations sont factuellement établies.

---

## 5. RÈGLE D'EXÉCUTION AUTONOME

> **Les tâches de finalisation déjà définies dans ce checkpoint doivent être exécutées sans demander d'accord intermédiaire à l'utilisateur.**

Procédure normale :

`VÉRIFIER → CORRIGER AU MINIMUM → TESTER → VÉRIFIER → CONTINUER`

Il ne faut pas interrompre la séquence pour demander « OK ? » entre les tâches déjà définies.

Une confirmation utilisateur n'est nécessaire que si une décision nouvelle, destructive, irréversible ou clairement hors périmètre apparaît.

---

## 6. CONTRAINTES ABSOLUES

- Ne jamais inventer un résultat de test.
- Ne jamais déclarer une validation réussie sans preuve.
- Ne pas prétendre qu'une API ou une persistance existe si elle n'est pas vérifiée.
- Ne pas modifier le design sans nécessité démontrée.
- Ne pas ajouter de fonctionnalité hors périmètre.
- Préserver l'architecture existante lorsqu'elle répond au besoin.
- Ne pas recommencer inutilement une étape déjà validée.
- En cas d'incertitude, écrire clairement : **« Je ne peux pas confirmer ça. »**

---

## 7. CRITÈRE DE FINALISATION

V4 ne doit être déclaré **FINALISÉ** que lorsque les éléments suivants sont vérifiés factuellement :

`CODE → BUILD → RUNTIME → OPPORTUNITY RÉELLE → DASHBOARD DYNAMIQUE → CONSOLE → VISUEL → CI/PR → PRODUCTION`

Tant qu'un de ces éléments reste non vérifié, le statut doit rester :

**FINALISATION EN COURS**

---

## 8. POINT DE REPRISE EXACT

**Reprendre directement à la validation navigateur du dernier preview Vercel, puis exécuter automatiquement toutes les tâches restantes de ce checkpoint jusqu'à la finalisation, sans demander d'accord intermédiaire.**

Aucune étape déjà validée ne doit être recommencée sans raison.
