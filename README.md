# Cash Critters

A financial literacy app for kids, built with Next.js, Prisma, and Postgres. It combines short interactive lessons with hands-on games and goal-tracking so kids can practice money skills, not just read about them.

## Features

- **Learning tracks** — lessons organized into tracks with quiz gating and progress saved per user
- **Games**
  - Savings Race — a 10-round save-or-spend decision game with a leaderboard
  - Coin Counter — coin recognition and counting practice
  - Budget Challenge — budgeting under constraints
- **Savings Goals** — create, track, and delete personal savings goals
- **Personal dashboard** — real lesson progress, next available lesson, savings totals, and earned badges
- **Auth** — sign in with Google OAuth or email/password credentials (Auth.js)

## Tech stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Prisma](https://www.prisma.io/) + Postgres
- [Auth.js](https://authjs.dev/) (NextAuth v5)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to your Postgres connection strings. Both Next.js and Prisma CLI load `.env`. Set `NEXTAUTH_SECRET` to a random secret. Google sign-in additionally needs `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
3. Apply the checked-in migrations to a new database:
   ```bash
   npx prisma migrate deploy
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npx prisma generate
npm test
npm run typecheck
npm run lint
npm run build
```

On Windows PowerShell with restricted script execution, use `npm.cmd` and `npx.cmd`.
Tests cover game generation/scoring, savings validation, lesson gating, quiz scoring, and dashboard progress. Database-backed account, progress, and savings flows also need end-to-end testing against a configured test database.

For database-backed integration checks, configure a **development/test database**, build the app, and start it on port 3000 in one Git Bash terminal:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Then run in a second Git Bash terminal:

```bash
CASH_CRITTERS_TEST_DATABASE=1 node scripts/integration-test.cjs
```

The integration suite calls the local app's server actions, verifies persisted data and account isolation, and removes its uniquely named disposable accounts afterward. It reads action IDs from the current production build, so rebuild after changing server actions. Use the same environment files for the app and test process. Never point this suite at production.

For Vercel deployment tooling, install the CLI separately with `npm i -g vercel`.

## License

MIT — see [LICENSE](LICENSE).
