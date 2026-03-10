# Personal Finance — Project Conventions

## Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI (new-york style)
- **Auth & DB**: Supabase (Postgres + Auth, `@supabase/ssr`)
- **Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`

## Project Structure
```
src/
  app/             # Next.js App Router pages
    (auth)/        # Login, register, reset-password (public)
    auth/          # Auth callback route
    dashboard/     # Main dashboard
    transactions/  # Transaction list with filters
    upload/        # CSV upload flow
    api/upload/    # Upload API route
  components/      # Shared React components
    dashboard/     # Dashboard-specific components
    transactions/  # Transaction table & filters
    ui/            # Shadcn UI primitives
  hooks/           # Client-side data hooks (SWR)
  lib/             # Utilities, Supabase clients, CSV parsers
    parsers/       # CSV parsers per source (sparebanken, curve, trumf)
supabase/
  migrations/      # SQL migrations
docs/              # Project documentation
```

## Key Patterns
- **Supabase browser client**: `src/lib/supabase.ts` — singleton, safe for 'use client'
- **Supabase server client**: `src/lib/supabase-server.ts` — per-request, reads cookies
- **RLS**: All tables use `auth.uid() = user_id` policies — never bypass in user-facing code
- **Summaries**: Computed on-the-fly from `transactions` table (no precomputed table)
- **Data fetching**: SWR hooks in `src/hooks/`
- **Auth guard**: `src/middleware.ts` — Edge middleware (Cloudflare Workers compatible)

## Commands
- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run cf:build` — Cloudflare build
- `npm run cf:deploy` — deploy to Cloudflare Workers

## Conventions
- Use `@/` path alias for imports
- Norwegian locale for currency formatting (NOK)
- Amounts: positive = income, negative = expense
- Categories: Housing, Groceries, Eating out, Transport, Subscriptions, Other
