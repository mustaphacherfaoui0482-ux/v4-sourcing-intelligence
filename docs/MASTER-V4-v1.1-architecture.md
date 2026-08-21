# MASTER V4 — v1.1

## Mise à jour — Architecture produit et commercialisation

### 1. Décision d’architecture
Sourcing Intelligence devient un module spécialisé indépendant du produit principal E-commerce Kit V4. Il possède son propre tableau de bord et son propre parcours afin d’éviter de surcharger le tableau de bord principal.

### 2. E-commerce Kit V4 — produit principal
Le tableau de bord principal reste dédié au pilotage quotidien du business : produits, commandes, stock, marketing, analytics et fonctions de gestion.

### 3. Sourcing Intelligence — module complémentaire
Sourcing Intelligence dispose de son propre Dashboard spécialisé : Radar Sourcing, opportunités, fournisseurs, comparaison des offres, coût rendu, rentabilité, CAC, Score qualité/prix, décision, échantillons et contrôle qualité.

### 4. Passerelle entre les deux
Lorsqu’une opportunité est suffisamment validée, Sourcing Intelligence transmet au produit principal uniquement les informations utiles : opportunité, score, coût rendu, marge, risque, décision et action suivante. Les calculs métier restent dans Sourcing afin d’éviter leur duplication.

### 5. Commercialisation
Sourcing Intelligence est conçu pour pouvoir être commercialisé ultérieurement comme une option ou extension complémentaire de l’E-commerce Kit V4, tout en restant fonctionnellement indépendant.

### 6. Règle UX
Ne pas fusionner les deux tableaux de bord. La séparation réduit la charge cognitive, clarifie les parcours et permet de faire évoluer Sourcing Intelligence sans déstabiliser l’application principale.

**Statut : ARCHITECTURE VALIDÉE**

Cette mise à jour complète le Master V4 existant. Elle ne remplace pas les règles moteur, données, sécurité ou design déjà verrouillées.
