# Git / Branch / Task Rules for personal-finance

## Branch model

- **main** — Always deployable / production-ready. Only merged into when changes are tested and approved (by human).
- **dev** — Integration branch. All feature work is merged into dev first. Human tests from dev; when happy, dev → main.
- **Feature branches** (per task) — Always branch from dev. Never commit directly to dev or main.

## Branch naming (must include task ID)

- `feat/T123-short-name` – new feature
- `fix/T123-short-name` – bug fix
- `chore/T123-short-name` – refactor, CI, infra, docs

Examples:
```
feat/T17-personal-economy-auth
fix/T32-curve-csv-parser
chore/T05-ci-setup
```

## Commit messages

Use conventional commits with task ID:

```
feat(T17): implement email/password signup
fix(T32): handle missing currency in curve csv
chore(T05): add lint step to ci
```

Guidelines:
- One logical change per commit where possible.
- Keep messages descriptive and concise.

## PR rules

- PR target: **dev** (not main).
- One main concern per PR: feature OR bug fix OR focused refactor.
- If touching multiple layers (backend + frontend), explain clearly in PR description.
- Wait for human approval before merging into dev.
- Only the human (or explicitly instructed main agent) merges dev → main.

## Safety

- No force-push to shared branches (dev, main).
- No direct commits to main.
- No secrets in the repo: use `.env.local` locally, use GitHub / Cloudflare secrets for deployment.

## Coding style

- Run formatter/linter before commits (e.g. `npm run lint`, `npm run format`).
- Prefer small, focused components/functions.
- Add or update tests when:
  - fixing a bug,
  - changing critical parsing or calculation logic.

## Agent behavior

Any coding agent (backend/frontend/integration):

1. Update dev & create branch:
   ```
   git checkout dev
   git pull
   git checkout -b feat/Txx-short-name
   ```
2. After changes: push branch, open PR into dev, reference task ID `Txx` in branch name + commits + PR description.
3. Wait for human to review/merge; do not merge into main themselves.
