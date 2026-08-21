# CHECKPOINT — TRANSITION V4 E-COMMERCE

**Date :** 21 août 2026  
**Projet source :** V4 Sourcing Intelligence  
**Statut :** Sourcing Intelligence en attente de validation finale / travail V4 E-commerce autorisé en parallèle

## 1. Où nous en sommes

La phase de branchement réel du Dashboard V4 Sourcing Intelligence est avancée.

### Réalisé

- Opportunity canonique identifiée comme source de vérité métier.
- Radar / scoring → Opportunity canonique → Dashboard identifié comme flux cible.
- Data Layer `opportunities` identifié.
- `dashboard-runtime.js` relié au modèle Opportunity.
- UI adapter identifié pour la présentation des données.
- Active Opportunity bridge ajouté.
- Fallback `DEMO_OPPORTUNITY` conservé.
- Correction du KPI Landed Cost pour utiliser la donnée économique `economics.inputs.landedCost`.
- Design du Dashboard conservé sans refonte graphique.
- Checkpoint de finalisation V4 créé dans `docs/`.
- PR #6 ouvert vers `main`, avec le travail runtime.
- PR #7 rendu inutile par intégration de sa correction dans la branche de travail.

## 2. État de validation actuel

- Le code de la branche de travail est exploitable.
- Un déploiement Vercel de la branche a déjà atteint l'état `READY`.
- Aucun runtime error n'est actuellement remonté sur les projets Vercel vérifiés.
- La validation navigateur complète n'est pas encore prouvée.
- La fusion définitive vers `main` n'est donc pas déclarée comme effectuée.

## 3. Ce qu'il reste à faire côté V4 Sourcing Intelligence

### Priorité 1 — Validation navigateur

- Vérifier le preview dans un navigateur réel.
- Vérifier que le runtime s'exécute réellement.
- Vérifier que `V4SourcingRuntime` est disponible.
- Vérifier la console JavaScript.
- Vérifier que l'Opportunity réelle alimente effectivement le Dashboard.
- Vérifier le fallback `DEMO_OPPORTUNITY`.
- Vérifier le comportement après rechargement.

### Priorité 2 — Contrôle visuel

- Comparer le Dashboard déployé à la référence visuelle.
- Corriger uniquement les écarts démontrés.
- Ne pas refaire le design.

### Priorité 3 — Git / production

- Vérifier les checks du PR #6.
- Fusionner vers `main` uniquement après validation factuelle.
- Vérifier le déploiement résultant.
- Faire le checkpoint final de clôture.

## 4. Pourquoi nous passons temporairement à V4 E-commerce

Le changement de priorité n'est **pas dû à un problème architectural du code Sourcing Intelligence**.

Le frein actuel est principalement la validation/déploiement Vercel : une nouvelle tentative a rencontré une limitation de déploiement liée au compte Free / rate limit. Un déploiement antérieur de la branche avait cependant été observé en `READY`.

Nous ne devons donc pas perdre du temps à attendre une infrastructure externe alors que le travail métier peut continuer.

**Décision :** poursuivre le développement de V4 E-commerce directement via GitHub, sans dépendre de Vercel pour chaque étape de développement.

Vercel restera nécessaire uniquement lorsqu'une validation de déploiement web sera réellement requise.

## 5. Règle pour V4 E-commerce

- Développer et structurer directement dans GitHub.
- Utiliser branches + commits + PR pour sécuriser les évolutions.
- Ne pas supposer que GitHub Pages convient avant d'avoir vérifié l'architecture de V4 E-commerce.
- Si l'application est entièrement statique côté client, GitHub Pages pourra être évalué comme option de déploiement.
- Si un backend, une base de données, une authentification serveur ou des secrets sont nécessaires, GitHub Pages seul ne suffira pas.

## 6. Ce que nous allons faire maintenant sur V4 E-commerce

1. Reprendre le MASTER V4 comme source de vérité.
2. Auditer l'état réel du dépôt / des fichiers disponibles.
3. Identifier le prochain bloc fonctionnel déjà prévu par le MASTER.
4. Vérifier ce qui existe déjà avant de créer quoi que ce soit.
5. Implémenter au minimum nécessaire.
6. Tester et documenter chaque étape.
7. Créer des checkpoints de reprise.
8. Continuer automatiquement les tâches définies sans demander un accord intermédiaire.
9. Revenir à V4 Sourcing Intelligence dès que la validation Vercel/navigateur peut être effectuée.

## 7. Règle d'exécution autonome

**Les tâches déjà définies et non destructives doivent être exécutées sans demander l'accord de l'utilisateur à chaque étape.**

Une confirmation n'est requise que pour une décision nouvelle, destructive, irréversible ou hors périmètre.

## 8. Contraintes absolues

- Ne rien inventer.
- Ne pas déclarer une validation sans preuve.
- Ne pas créer de fonctionnalités hors MASTER.
- Ne pas casser le travail Sourcing Intelligence existant.
- Ne pas confondre blocage Vercel et bug applicatif.
- Prioriser GitHub pour le développement V4 E-commerce lorsque Vercel n'est pas nécessaire.

## 9. Point de reprise

**Reprendre maintenant sur V4 E-commerce : auditer le dépôt et le MASTER, déterminer le prochain bloc fonctionnel réel, puis l'exécuter directement via GitHub.**

En parallèle, conserver V4 Sourcing Intelligence dans son état actuel jusqu'à la validation navigateur et au déploiement final.
