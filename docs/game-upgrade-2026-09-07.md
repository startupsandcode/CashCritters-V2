# Cash Critters game upgrade

Approved scope: Checkout Challenge, untimed practice for existing timed games, and visible score-saving feedback. Deploy to the existing cash-critters-v2 Vercel project (cashcritters.com).

## Design and implementation

Checkout uses the existing Cash Critters rounded sans-serif typography and palette: cream background, green actions, dark blue text, amber receipt borders, white controls. A shop receipt sits beside a change register on desktop and above it on mobile. Prices, payment, and change are the visual focus.

Ten customers progress from whole dollars to quarters and multiple-item baskets, ending with arbitrary cents. Players enter a total and add bills/coins to a change tray with undo and clear controls. Every answer shows how to count from the price up to the payment. Timed mode allows 45 seconds per customer; practice has no timer. Both pause on feedback until the learner continues.

Coin Counter and Savings Race now offer practice without countdowns or automatic decisions/advancement. Timed behavior remains available. Practice scores use separate validated game IDs and leaderboards. Budget Challenge retains its existing week simulation.

All four games display saving, saved, or retry feedback. Each run receives a UUID; server-side upsert records it once and rejects conflicting owner, game, or score reuse. Existing scores remain compatible. No schema migration is required. Scores still originate in the client, as in the existing games; this does not provide competitive anti-cheat protection.

Local environment files are explicitly excluded from deployment with .vercelignore. Production uses the environment variables configured on Vercel.

## Validation

- Production build, lint, and TypeScript checks passed.
- Unit suite passed, including 1,000 generated checkout orders, count-up arithmetic, input parsing, and game/mode score bounds.
- 14 database/HTTP integration checks passed. New checks verify all four games, practice separation, duplicate retries, invalid run IDs, and conflicting-account attempts. Fixture accounts are removed afterward.
- Browser: completed Checkout, Coin Counter practice, and Savings Race practice. Confirmed correct/incorrect feedback, manual advancement, saved statuses, and refreshed personal bests.
- Independent static review found no critical or important issues.
- Phone viewport (390 × 844): receipt and register stack correctly, no horizontal overflow. Timed checkout expires and reveals the learning explanation. Browser console had no errors during these checks.

## Release

Production deployment READY: https://cash-critters-v2-mrs82290k-jmanns-projects.vercel.app

Aliased to https://cashcritters.com. Verified authenticated production game rendering, total/change submission, and count-up feedback with no browser console errors. Production smoke test stopped before completing a run, so it did not add a test score to the user's account. Deployment used the current workspace; no Git commit or push was performed.
