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
- Groq-powered recurring draft automation

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

- frontend: Next.js app inside `frontend`
- backend: Node + Express
- database: MongoDB Atlas free tier to start
- deploy: Render for early validation
- billing: PayPal Subscriptions

## Getting started

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env
npm --prefix frontend run dev
npm run dev
```

The API starts on `http://localhost:4000`.
The frontend starts on `http://localhost:3000`.

Use a dedicated MongoDB database name for Xsaas, even if you reuse the same Atlas cluster credentials.
Do not point this app at another project's database.

## Useful scripts

```bash
npm run dev:api
npm run dev:web
npm run check
```

## Main routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/workspace`
- `PATCH /api/workspace`
- `GET /api/billing/config`
- `POST /api/billing/checkout-link`
- `POST /api/billing/sync`
- `POST /api/billing/paypal/webhook`
- `GET /api/drafts`
- `POST /api/drafts`
- `PATCH /api/drafts/:draftId`
- `POST /api/drafts/:draftId/publish`
- `DELETE /api/drafts/:draftId`
- `GET /api/automation/status`
- `POST /api/automation/run`
- `GET /api/opportunities`
- `GET /api/x/status`
- `POST /api/x/connect/callback`
- `POST /api/x/disconnect`

## Repo structure

- `src/server.js`: API bootstrap
- `src/config.js`: env parsing
- `src/lib/db.js`: Mongo connection
- `src/lib/paypal.js`: PayPal catalog + checkout helpers
- `src/lib/automation.js`: Groq automation + scheduler
- `src/lib/trends.js`: Google Trends and Google News signal collection
- `src/lib/x.js`: X OAuth token exchange, refresh, and posting helpers
- `src/models`: core SaaS models
- `src/routes`: auth, billing, health
- `frontend`: Next.js marketing site + auth dashboard
- `docs/FOUNDATION.md`: business/product base
- `docs/FRONTEND_PROMPT.md`: copy-paste prompt for building the frontend elsewhere

## Production notes

- `APP_URL` must point to the public frontend URL so PayPal return/cancel links work correctly.
- If `APP_URL` is a public URL, the backend will try to create the PayPal webhook automatically.
- The API can bootstrap PayPal `Pro` and `Agency` plans automatically when credentials are present.
- Starter stays free and does not need a PayPal subscription.
- To connect real X accounts, you must create an X developer app and register `X_REDIRECT_URI`.
- `ENCRYPTION_SECRET` should be set in production so refresh/access tokens are encrypted with a stable secret.
