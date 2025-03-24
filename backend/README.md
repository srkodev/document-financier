# API de Gestion Financière

Cette API REST constitue le backend de l'application de gestion financière. Elle gère l'authentification, les factures, les transactions, les budgets, les remboursements et les utilisateurs.

## Technologies utilisées

- Node.js
- Express
- TypeScript
- Supabase (PostgreSQL + Authentication)
- JWT pour l'authentification

## Installation

1. Cloner le dépôt
2. Installer les dépendances
```bash
cd backend
npm install
```

3. Créer un fichier .env à la racine du projet et configurer les variables d'environnement:
```
PORT=5000
SUPABASE_URL=votre_url_supabase
SUPABASE_KEY=votre_cle_supabase
JWT_SECRET=votre_secret_jwt
NODE_ENV=development
```

## Développement

Pour lancer l'API en mode développement:
```bash
npm run dev
```

## Production

Pour compiler et exécuter en production:
```bash
npm run build
npm start
```

## Structure du projet

- `src/config`: Configuration et connexion à Supabase
- `src/controllers`: Contrôleurs pour chaque fonctionnalité
- `src/middlewares`: Middlewares, y compris l'authentification
- `src/models`: Interfaces et types
- `src/routes`: Définitions des routes de l'API
- `src/services`: Logique métier et interactions avec la base de données

## API Endpoints

### Authentification
- `POST /api/auth/login`: Connexion d'un utilisateur
- `POST /api/auth/register`: Inscription d'un nouvel utilisateur
- `POST /api/auth/logout`: Déconnexion d'un utilisateur
- `GET /api/auth/profile`: Obtenir le profil de l'utilisateur authentifié

### Factures
- `GET /api/invoices`: Liste des factures
- `GET /api/invoices/:id`: Détails d'une facture
- `POST /api/invoices`: Créer une nouvelle facture
- `PUT /api/invoices/:id`: Mettre à jour une facture
- `PUT /api/invoices/:id/status`: Mettre à jour le statut d'une facture
- `DELETE /api/invoices/:id`: Supprimer une facture
- `GET /api/invoices/export`: Exporter les factures en CSV

### Utilisateurs
- `GET /api/users`: Liste des utilisateurs (admin seulement)
- `GET /api/users/profile/:id`: Détails d'un utilisateur
- `PUT /api/users/profile/:id`: Mettre à jour le profil d'un utilisateur
- `PUT /api/users/:id/role`: Mettre à jour le rôle d'un utilisateur (admin seulement)
- `DELETE /api/users/:id`: Supprimer un utilisateur (admin seulement)

## Sécurité

L'API utilise:
- JWT pour l'authentification
- Middleware de contrôle d'accès basé sur les rôles (utilisateur, responsable, admin)
- CORS configuré pour limiter les domaines autorisés 