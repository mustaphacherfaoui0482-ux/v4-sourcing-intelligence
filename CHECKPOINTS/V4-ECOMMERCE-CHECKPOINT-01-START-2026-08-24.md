# CHECKPOINT 01 — V4 E-COMMERCE — DÉMARRAGE

**Date :** 24 août 2026
**Projet :** V4 E-commerce / V4 Sourcing Intelligence
**Modes actifs :** RED TEAM · AUDIT · ARCHITECT · BUILDER · EMPIRICAL · AUTONOMIE ACCÉLÉRÉE
**Contrat :** V4 Contract V0.4 verrouillé ; évolution uniquement par V0.5.

## TARGET

Construire et valider un écosystème cohérent :
1. Ebook V4 — référence pédagogique.
2. Business Control Center Excel — référence numérique/calculatoire.
3. PowerPoint V4 — analyse et présentation.
4. Application V4 — pilotage et décision.

Règles : TARGET ≠ ACTUAL ; UNKNOWN ≠ 0 ; NULL ≠ 0 ; NOT_CALCULABLE ≠ 0 ; données réelles, hypothèses, estimations et résultats calculés séparés ; KPI canoniques communs aux quatre livrables ; aucune fonctionnalité sans impact décisionnel démontrable.

## ACTUAL — 24/08/2026

### E-commerce Kit V4
Le dépôt contient une application/runtime V4, des moteurs de rentabilité et coût rendu, des diagnostics business et une suite de tests npm incluant profitability, landed-cost, business-health, runtime et validation runtime.

### V4 Sourcing Intelligence
Le dépôt est actif. L'architecture validée sépare Sourcing Intelligence du produit principal E-commerce Kit V4 ; Sourcing possède son propre dashboard spécialisé et transmet au produit principal uniquement les informations utiles après validation.

### Business Control Center
Une couche de présentation a été ajoutée le 23/08/2026 avec huit KPI : Revenue, Orders, AOV, CAC, ROAS, Contribution, Margin, Stock. Elle affiche UNKNOWN lorsque les données opérationnelles ne sont pas connectées et n'invente pas de chiffres. Elle est branchée depuis `modules/ui-adapter.js` vers `modules/business-kpi-runtime.js`.

### Données
L'alimentation opérationnelle réelle du Business Control Center n'est pas démontrée dans l'état observé. Une page sans chiffres peut donc être un état UNKNOWN attendu, et non une panne, tant que la source réelle n'est pas connectée.

### Sourcing / Alibaba
Des correctifs récents migrent les anciennes valeurs 0 vers null pour préserver UNKNOWN. Des tests couvrent les entrées économiques/coût rendu incomplètes. Le fallback de lecture Alibaba a également été renforcé et testé.

## GAP GLOBAL

**G1 — Business Control Center :** couche UI présente, source opérationnelle réelle non démontrée. Gap = source + modèle de données + provenance + fraîcheur + mapping canonique.

**G2 — Excel :** aucune preuve empirique d'un workbook final intégré et validé dans les dépôts consultés. Gap = livrable Excel réel + formules + règles UNKNOWN/NULL/NOT_CALCULABLE + tests + rapprochement avec l'application.

**G3 — Ebook :** plans et documentation présents ; preuve insuffisante d'un ebook final éditorialisé et validé comme livrable final. Gap = contenu final + cohérence inter-livrables + export/contrôle éditorial.

**G4 — PowerPoint :** preuve insuffisante d'un deck final validé. Gap = deck final + contrôle de cohérence canonique.

**G5 — Application :** architecture et moteurs présents, dashboard spécialisé présent, garde-fous UNKNOWN/0 en cours de durcissement ; alimentation business réelle non démontrée. Gap = intégration réelle + validation end-to-end + tests sous données complètes/incomplètes.

**G6 — CI/CD :** le workflow GitHub Actions contient encore une étape qui modifie automatiquement `modules/dashboard-runtime.js` et son test lors d'un push sur main pour appliquer un correctif UNKNOWN-vs-zero. Gap = code source corrigé directement + CI purement vérificateur. Risque = dérive entre dépôt, commit et artefact déployé.

## IMPACT

Le projet a dépassé le stade du prototype isolé. Le risque principal est maintenant la divergence entre :

**contrat → moteur → données → KPI → interface → déploiement → décision.**

Le Business Control Center est actuellement plus avancé comme architecture de présentation que comme système de contrôle réellement alimenté.

## RED TEAM — CONSTATS PRIORITAIRES

1. `UNKNOWN` sans source réelle n'est pas une panne démontrée.
2. Le `V4 Business KPI Engine v1` historique est insuffisant comme moteur KPI canonique : il enregistre des métriques génériques et produit un compteur, sans définition, unité, inputs, périmètre ni règles UNKNOWN/NOT_CALCULABLE.
3. Le CI modifie encore du code métier : anomalie de gouvernance à corriger.
4. `business-kpi-runtime.js` mélange présentation Business Control Center et garde-fous Alibaba/dashboard : responsabilité excessive à auditer.
5. Les migrations répétées 0 → null montrent qu'une normalisation centrale des états hérités est préférable à l'empilement de patches.

## REPRISE DU CHECKPOINT 08 — BUSINESS CONTROL CENTER

**Niveau de preuve : reconstruction empirique. Le fichier exact du CHECKPOINT 08 n'a pas été retrouvé dans les dépôts accessibles.**

Architecture reprise :

**SOURCE DATA → CANONICAL KPI CONTRACT → KPI ENGINE / ECONOMICS → CONTROL CENTER → DECISION**

et non :

**UI → calculs improvisés → affichage.**

KPI actuellement présents dans la couche de présentation : Revenue, Orders, AOV, CAC, ROAS, Contribution, Margin, Stock.

Décision d'architecture reprise : le Control Center doit rester une couche de pilotage ; il ne doit pas devenir un second moteur économique indépendant. Les calculs métier restent dans leurs moteurs propriétaires et sont exposés au dashboard via un contrat canonique.

## DÉCISION

Projet **ACTIF**. Pas de retour au prototype V0.3. Priorité immédiate : audit de l'architecture de données du Business Control Center et du contrat KPI, puis validation end-to-end de l'alimentation réelle.

Aucune fonctionnalité décorative supplémentaire avant résolution de ce GAP.

## ACTION

1. Auditer les modèles de données business et moteurs économiques.
2. Comparer chaque KPI du Control Center aux définitions canoniques V4.
3. Définir source, provenance et états VALUE / UNKNOWN / NOT_CALCULABLE pour chaque KPI.
4. Séparer présentation, calcul, provenance et décision.
5. Auditer le workflow CI/CD qui modifie actuellement le code métier.
6. Formaliser le contrat KPI minimal avant toute extension.
7. Tester normal, zéro, missing, invalide, extrême et non calculable.

**Condition d'implémentation : toute modification de code nécessite une autorisation explicite selon le protocole V4.**

## TEST / VERDICT

**Test :** inspection empirique des dépôts, commits récents, fichiers Business Control Center, workflow CI/CD et moteurs.

**Verdict :** architecture partiellement construite et active ; alimentation business réelle non démontrée ; gouvernance CI/CD à corriger ; contrat KPI canonique à formaliser avant extension.

## PROCHAINE ÉTAPE

**CHECKPOINT 02 — Audit détaillé de l'architecture Business Control Center et du contrat KPI.**
