# Cash Critters

A financial literacy app for kids, built with Next.js, Prisma, and Postgres. It combines short interactive lessons with hands-on games and goal-tracking so kids can practice money skills, not just read about them.

## Features

- **Learning tracks** — lessons organized into tracks with quiz gating and progress saved per user
- **Games**
  - Savings Race — a 10-round save-or-spend decision game with a leaderboard
  - Coin Counter — coin recognition and counting practice
  - Budget Challenge — budgeting under constraints
- **Savings Goals** — create, track, and delete personal savings goals
- **Auth** — sign in with Google OAuth or email/password credentials (Auth.js)

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
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
   cp .env.example .env.local
   ```
   You'll need a Postgres connection string and Google OAuth credentials (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`). Generate `NEXTAUTH_SECRET` with `npx auth secret`.
3. Push the Prisma schema to your database:
   ```bash
   npx prisma db push
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## License

MIT — see [LICENSE](LICENSE).
