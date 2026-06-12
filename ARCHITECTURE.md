# MatoFlow Prospection — Architecture V1

Agent IA de prospection commerciale pour les entreprises du paysage.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Base de données | Supabase (PostgreSQL) |
| IA | OpenAI API (gpt-4o-mini) |
| Validation | Zod |

## Structure du projet

```
matoflow-prospection/
├── src/
│   ├── app/                        # Pages et API Routes Next.js
│   │   ├── page.tsx                # Dashboard
│   │   ├── prospects/
│   │   │   ├── page.tsx            # Liste
│   │   │   ├── nouveau/page.tsx    # Création
│   │   │   └── [id]/page.tsx       # Détail + actions IA
│   │   └── api/
│   │       ├── prospects/          # CRUD prospects
│   │       ├── qualify/            # Qualification IA
│   │       ├── generate-content/   # Contenu commercial
│   │       └── dashboard/          # Stats agrégées
│   ├── components/
│   │   ├── dashboard/              # Composants dashboard
│   │   ├── prospects/              # Formulaires, table, actions
│   │   ├── layout/                 # Sidebar, shell
│   │   └── ui/                     # Composants réutilisables
│   ├── modules/                    # Logique métier modulaire
│   │   ├── prospects/              # Repository, service, déduplication
│   │   ├── qualification/          # Analyseur IA, scorer
│   │   ├── content/                # Générateur de contenu
│   │   ├── scraping/               # [V2] Recherche automatisée
│   │   ├── follow-up/              # [V2] Relances automatiques
│   │   └── crm/                    # [V2] Intégration CRM MatoFlow
│   ├── lib/
│   │   ├── supabase/               # Clients Supabase
│   │   ├── openai.ts               # Client OpenAI
│   │   └── utils.ts                # Utilitaires
│   ├── types/                      # Types TypeScript
│   └── config/                     # Constantes
└── supabase/
    └── migrations/                 # Schémas SQL
```

## Flux de données

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Interface  │────▶│  API Routes  │────▶│    Modules      │
│  Next.js    │     │  /api/*      │     │  (services)     │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                     ┌──────────────┐     ┌────────▼────────┐
                     │  OpenAI API  │◀────│   Supabase      │
                     │  (scoring,   │     │   PostgreSQL    │
                     │   contenu)   │     └─────────────────┘
                     └──────────────┘
```

## Déduplication

Avant chaque insertion, la fonction RPC `upsert_prospect` vérifie :

1. **SIRET** normalisé (14 chiffres)
2. **Email** normalisé (lowercase)
3. **Domaine** du site web (sans www, sans protocole)

Si un doublon est trouvé → mise à jour des champs, jamais de création.

## Scoring IA (0-100)

| Critère | Poids |
|---------|-------|
| Entreprise du paysage | 30 |
| Contrats d'entretien | 25 |
| Taille entreprise | 15 |
| Présence d'équipes | 15 |
| Besoin devis/planning/facturation | 15 |

## Roadmap V2+

- **Scraping** : Google Maps, annuaires professionnels
- **Relances** : séquences email/LinkedIn automatisées
- **Agent conversationnel** : chatbot de qualification
- **CRM MatoFlow** : sync bidirectionnelle
- **Scoring avancé** : ML sur historique de conversion
- **Statistiques** : funnel de conversion, A/B testing messages

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local

# 3. Appliquer la migration Supabase
# Coller supabase/migrations/001_create_prospects.sql dans l'éditeur SQL Supabase

# 4. Lancer le serveur de dev
npm run dev
```
