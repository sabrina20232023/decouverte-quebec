# Sprint 0 — Initialisation et architecture du projet

## 1. Informations générales

**Nom du projet :** Découverte Québec
**Type de projet :** Projet de fin d’études
**Méthodologie :** Scrum
**Responsable du développement :** Sabrina Ouali

## 2. Objectif du Sprint

L’objectif du Sprint 0 était de préparer l’environnement de développement et de mettre en place l’architecture technique du projet Découverte Québec.

Ce sprint devait permettre de disposer d’une base stable avant le développement des fonctionnalités métier.

## 3. Technologies retenues

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* ESLint

### Backend

* NestJS
* Architecture microservices
* API Gateway
* Communication TCP entre les services

### Gestion de projet et versionnement

* Git
* GitHub
* PowerShell
* Visual Studio / Visual Studio Code

### Technologies prévues pour les prochains sprints

* Prisma ORM
* Supabase / PostgreSQL
* OpenTripMap
* OpenWeather
* GitHub Actions
* Vercel
* Render

## 4. Architecture mise en place

Le projet utilise une architecture monorepo.

```text
decouverte-quebec/
├── apps/
│   ├── web/
│   └── backend/
│       ├── apps/
│       │   ├── api-gateway/
│       │   ├── places-service/
│       │   ├── weather-service/
│       │   ├── users-service/
│       │   └── favorites-service/
│       ├── nest-cli.json
│       └── package.json
├── docs/
└── .git/
```

## 5. Responsabilités des composants

### Frontend Next.js

Le frontend représente l’interface visible par les utilisateurs. Il communiquera uniquement avec l’API Gateway.

### API Gateway

L’API Gateway constitue le point d’entrée HTTP principal du backend.

Elle reçoit les requêtes du frontend et les transmet aux microservices concernés.

### Places Service

Le Places Service sera responsable de la gestion des lieux touristiques, des régions, des catégories et de l’intégration avec OpenTripMap.

### Weather Service

Le Weather Service sera responsable de la météo actuelle et des prévisions provenant d’OpenWeather.

### Users Service

Le Users Service sera responsable de l’inscription, de la connexion, des profils et de l’authentification.

### Favorites Service

Le Favorites Service sera responsable de l’ajout, de la suppression et de la consultation des lieux favoris.

## 6. Communication entre les services

La première communication microservices a été mise en place entre l’API Gateway et le Places Service.

```text
Navigateur
    ↓ HTTP
API Gateway
    ↓ TCP
Places Service
    ↓
Réponse JSON
```

### Route de vérification de l’API Gateway

```text
GET http://localhost:3001/api/health
```

Résultat obtenu :

```json
{
  "service": "api-gateway",
  "status": "ok"
}
```

### Route de vérification du Places Service

```text
GET http://localhost:3001/api/places/health
```

Résultat obtenu :

```json
{
  "service": "places-service",
  "status": "ok",
  "timestamp": "date et heure du test"
}
```

Ce test confirme que l’API Gateway communique correctement avec le Places Service par TCP.

## 7. Tâches réalisées

| Tâche                                    | État     |
| ---------------------------------------- | -------- |
| Installation et mise à jour de Node.js   | Terminée |
| Création du dépôt GitHub                 | Terminée |
| Initialisation du dépôt Git à la racine  | Terminée |
| Création du frontend Next.js             | Terminée |
| Activation de TypeScript                 | Terminée |
| Configuration de Tailwind CSS            | Terminée |
| Création du backend NestJS               | Terminée |
| Conversion du backend en monorepo NestJS | Terminée |
| Création de l’API Gateway                | Terminée |
| Création du Places Service               | Terminée |
| Création du Weather Service              | Terminée |
| Création du Users Service                | Terminée |
| Création du Favorites Service            | Terminée |
| Configuration de la communication TCP    | Terminée |
| Test Gateway vers Places Service         | Terminé  |
| Premier commit et premier push GitHub    | Terminés |

## 8. Difficultés rencontrées

### Version de Node.js incompatible

La version initiale de Node.js était trop ancienne pour la version de Prisma prévue pour le projet.

**Solution :** mise à jour vers une version récente de Node.js.

### Politique d’exécution PowerShell

PowerShell empêchait l’exécution du script `npx.ps1`.

**Solution :**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Dépôts Git imbriqués

Next.js et NestJS avaient créé leurs propres dossiers `.git`, ce qui empêchait le dépôt principal de suivre correctement tous les fichiers.

**Solution :** suppression des sous-dépôts Git et conservation d’un seul dépôt à la racine.

### Problèmes ESLint et Prettier

Des erreurs liées aux fins de lignes CRLF et aux anciens tests générés automatiquement ont été rencontrées.

**Solution :**

* configuration de Prettier ;
* formatage des fichiers ;
* adaptation des tests ;
* redémarrage de l’environnement de développement.

## 9. Résultat du Sprint

Le Sprint 0 est terminé avec succès.

Le projet possède désormais :

* une structure monorepo ;
* un frontend Next.js ;
* un backend NestJS en microservices ;
* une API Gateway ;
* quatre microservices métier ;
* une communication TCP fonctionnelle ;
* un dépôt GitHub opérationnel.

Le projet est prêt pour commencer le Sprint 1 consacré au développement du Places Service et à la gestion des lieux touristiques.

## 10. Rétrospective du Sprint

### Ce qui a bien fonctionné

* L’architecture microservices a été mise en place avec succès.
* Le dépôt GitHub est correctement configuré.
* La communication Gateway vers Places Service fonctionne.
* Les problèmes techniques rencontrés ont été résolus progressivement.

### Ce qui doit être amélioré

* Vérifier l’architecture complète avant de créer plusieurs dossiers.
* Éviter les dépôts Git imbriqués.
* Utiliser un environnement mieux adapté aux projets TypeScript.
* Tester et valider chaque étape avant de passer à la suivante.

### Actions pour le prochain Sprint

* Créer une branche dédiée au Sprint 1.
* Définir les User Stories du Places Service.
* Configurer Prisma et Supabase.
* Créer le modèle de données des lieux.
* Développer les premières routes de consultation.
