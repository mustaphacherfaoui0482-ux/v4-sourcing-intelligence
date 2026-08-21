# CHECKPOINT V4 — FINALISATION

**Date :** 21 août 2026  
**Projet :** V4 Sourcing Intelligence  
**Branche de travail :** `feat/dashboard-cost-breakdown-runtime`

## 1. Objet

Ce document est le checkpoint de reprise de la phase de finalisation technique. Il ne remplace pas le MASTER V4 et ne le modifie pas.

Il sert à conserver exactement :
- ce qui a été vérifié et construit ;
- ce qui reste à accomplir ;
- les règles à respecter pour terminer V4 sans repartir de zéro.

## 2. Travail accompli

- Modèle canonique `Opportunity` identifié et utilisé comme source de vérité du runtime.
- `createOpportunity()` identifié comme point de normalisation de l'Opportunity.
- Radar / sourcing relié au modèle canonique.
- `dashboard-runtime.js` relié à l'Opportunity canonique.
- Adaptateur de présentation Opportunity → Dashboard identifié.
- Data Layer avec collection `opportunities` identifié.
- Fallback `DEMO_OPPORTUNITY` conservé pour éviter de casser le Dashboard lorsqu'aucune Opportunity réelle n'est disponible.
- Bridge Active Opportunity ajouté sur la branche de travail.
- Priorité du bridge : `window.V4SourcingOpportunity` → `localStorage` → Data Layer → `DEMO_OPPORTUNITY`.
- Mécanisme de rafraîchissement du runtime ajouté.
- Aucun changement volontaire de design ou de direction graphique.
- Aucun ajout de nouvelle infrastructure de base de données.
- Preview Vercel observé en état `READY` lors de la vérification précédente.

## 3. Ce qui reste à accomplir

### A — Validation runtime

- Ouvrir le preview dans un navigateur.
- Vérifier que le runtime est effectivement exécuté.
- Vérifier l'absence d'erreurs JavaScript dans la console.
- Vérifier que `V4SourcingRuntime` est disponible et prêt.

### B — Validation Opportunity

- Vérifier qu'une Opportunity réelle peut alimenter le Dashboard.
- Vérifier que les valeurs affichées correspondent à l'Opportunity canonique.
- Vérifier que le fallback `DEMO_OPPORTUNITY` fonctionne uniquement lorsque nécessaire.
- Vérifier le comportement après rechargement de la page.

### C — Validation visuelle

- Comparer le Dashboard déployé à la référence visuelle.
- Conserver les éléments corrects.
- Corriger uniquement les écarts réellement constatés.
- Ne pas lancer de refonte graphique.

### D — Validation Git / Vercel

- Vérifier le PR et les contrôles disponibles.
- Vérifier le build du commit final.
- Si toutes les validations sont satisfaisantes, fusionner vers `main`.
- Vérifier ensuite le déploiement résultant de `main`.

### E — Clôture

- Effectuer un dernier contrôle fonctionnel.
- Vérifier qu'aucune modification parasite n'a été introduite.
- Créer le checkpoint final de clôture.

## 4. Règle d'exécution autonome

**Les tâches de finalisation déjà définies dans ce checkpoint doivent être exécutées sans demander d'accord intermédiaire à l'utilisateur.**

Procédure :

`VÉRIFIER → CORRIGER AU MINIMUM → TESTER → VÉRIFIER → CONTINUER`

Une confirmation utilisateur n'est nécessaire que si une décision nouvelle, destructive, irréversible ou clairement hors périmètre apparaît.

## 5. Contraintes absolues

- Ne rien inventer.
- Ne pas déclarer un test réussi sans preuve.
- Ne pas prétendre qu'une API ou une persistance existe si elle n'est pas vérifiée.
- Ne pas modifier le design sans nécessité démontrée.
- Ne pas ajouter de fonctionnalités hors périmètre.
- Préserver l'architecture existante lorsqu'elle répond au besoin.
- En cas d'incertitude, écrire clairement : **« Je ne peux pas confirmer ça. »**

## 6. Critère de finalisation

V4 ne doit être déclaré finalisé que lorsque les éléments suivants sont vérifiés factuellement :

`CODE → BUILD → RUNTIME → OPPORTUNITY → DASHBOARD DYNAMIQUE → CONSOLE → VISUEL → CI/PR → PRODUCTION`

## 7. Point de reprise

**Reprendre directement à la validation navigateur du preview, puis exécuter automatiquement toutes les tâches restantes de ce checkpoint sans demander d'accord intermédiaire.**

Aucune étape déjà validée ne doit être recommencée inutilement.
