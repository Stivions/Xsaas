# Xsaas

Xsaas is the separate SaaS product repo for turning the current X automation experience into a sellable membership platform.

## Vision

Sell a web product for creators, small brands, and agencies that want:

- better post ideas
- quote-tweet opportunities
- reply opportunities
- approval flows
- simple analytics
- membership billing

This repo is the SaaS foundation, not the personal bot repo.

## Product direction

Phase 1:

- landing page
- auth
- dashboard
- workspace creation
- plan management
- PayPal subscription wiring
- draft-first workflow

Phase 2:

- connect X accounts with official auth
- schedule and publish
- quote/reply suggestion engine
- content memory per workspace

Phase 3:

- multi-seat teams
- agency mode
- client workspaces
- autopilot with guardrails

## Suggested stack

- frontend: separate app generated elsewhere, then connected here
- backend: Node + Express
- database: MongoDB Atlas free tier to start
- deploy: Render for early validation
- billing: PayPal Subscriptions

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The API starts on `http://localhost:4000`.

## Main routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/billing/config`
- `POST /api/billing/checkout-link`
- `POST /api/billing/paypal/webhook`

## Repo structure

- `src/server.js`: API bootstrap
- `src/config.js`: env parsing
- `src/lib/db.js`: Mongo connection
- `src/models`: core SaaS models
- `src/routes`: auth, billing, health
- `docs/FOUNDATION.md`: business/product base
- `docs/FRONTEND_PROMPT.md`: copy-paste prompt for building the frontend elsewhere
