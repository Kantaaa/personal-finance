# Personal Finance

A personal finance tracker for managing income, expenses, and financial insights. Built with Next.js and deployed on Cloudflare Workers.

**Live:** https://personal-finance.kantasitms1.workers.dev

## Features

- Email/password authentication via Supabase
- CSV upload & parsing (Sparebanken, Curve, Trumf)
- Transaction list with filters
- Dashboard with spending charts, category breakdown, and monthly trends
- Budget tracking
- Recurring expense detection

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + Shadcn UI
- **Auth & Database:** Supabase (Postgres + Auth)
- **Deployment:** Cloudflare Workers via @opennextjs/cloudflare
- **CI/CD:** GitHub Actions

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run locally
npm run dev
```

## Deployment

Pushes to `main` automatically deploy to Cloudflare Workers via GitHub Actions.

To deploy manually:
```bash
npm run cf:build
npm run cf:deploy
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch model, commit conventions, and PR rules.
