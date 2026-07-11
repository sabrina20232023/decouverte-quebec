# Découverte Québec

## Présentation

Découverte Québec est une plateforme web de découverte touristique développée dans le cadre d'un projet de fin d'études en informatique.

L'objectif est de permettre aux utilisateurs de découvrir les attractions touristiques de toutes les régions du Québec, d'obtenir les informations essentielles sur chaque lieu et de consulter la météo en temps réel.

Le projet est développé selon une architecture **microservices** afin de favoriser la modularité, la maintenabilité et l'évolutivité.

---

## Fonctionnalités prévues

- Recherche de lieux touristiques
- Filtrage par région
- Filtrage par catégorie
- Consultation des détails d'un lieu
- Consultation de la météo
- Gestion des favoris
- Gestion des utilisateurs
- Authentification
- Carte interactive

---

## Architecture

Le projet est composé de plusieurs microservices :

```
Frontend (Next.js)
        │
        ▼
API Gateway (NestJS)
        │
 ┌──────┼──────────┐
 │      │          │
 ▼      ▼          ▼
Places Weather Users Favorites
Service Service Service Service
```

---

## Technologies utilisées

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- Architecture Microservices
- TCP Transport

### Base de données

- PostgreSQL
- Prisma ORM
- Supabase

### API externes

- OpenTripMap API
- OpenWeather API

### Outils

- Git
- GitHub
- Visual Studio
- PowerShell

---

## Structure du projet

```
decouverte-quebec
│
├── apps
│   ├── web
│   └── backend
│       ├── api-gateway
│       ├── places-service
│       ├── weather-service
│       ├── users-service
│       └── favorites-service
│
└── docs
```

---

## État du projet

### Sprint 0

- Initialisation du projet
- Architecture microservices
- Création du frontend Next.js
- Création du backend NestJS
- Création de l'API Gateway
- Création des microservices
- Communication Gateway ↔ Places Service
- Documentation du Sprint 0

### Sprint 1

En cours de développement.

---
## Encadrement

**Encadrant académique**

Pr. **Yacine Yaddaden**

Université du Québec à Rimouski (UQAR)

---

## Auteur

**Sabrina Ouali**

Projet réalisé dans le cadre du baccalauréat en informatique.
## Remerciements

Je tiens à remercier mon encadrant, **le professeur Yacine Yaddaden**, pour son accompagnement, ses conseils et son soutien tout au long de la réalisation de ce projet de fin d'études.
