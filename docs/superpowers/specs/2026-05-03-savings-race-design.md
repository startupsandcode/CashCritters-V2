# CashCritters V2 — Savings Race Game Design

**Date:** 2026-05-03
**Status:** Approved
**Scope:** First game implementation — Savings Race

---

## 1. Goals

- Make the "Play" button on the Savings Race card navigate to a working game
- Teach kids that saving is an active choice (the default is spending)
- Track high scores per player and surface a global leaderboard
- Establish the pattern for future game implementations (Budget Challenge, Coin Counter)

---

## 2. Game Overview

**Savings Race** is a 10-round, ~60-second financial decision game. Each round the player earns income from a fun source and is immediately presented with a spending event. They must actively tap **Save it** to keep their money — if they hesitate or tap **Spend it**, the purchase happens and only the remainder is saved.

The pedagogical intent is deliberate: saving requires conscious effort. Spending is the path of least resistance.

---

## 3. Game Loop

### Round Structure

Each of the 10 rounds proceeds as follows:

1. **Income announcement** — "You earned $15 walking the neighbor's dog 🐕"
2. **Spending event** — "Your friends are going to the movies! Tickets cost $10."
3. **Decision window** — 6-second countdown bar drains toward a spend
4. **Resolution:**
   - Tap **Save it** → full income added to savings
   - Tap **Spend it** (or timer expires) → event cost subtracted, remainder saved
5. **Result flash** — brief feedback ("You saved $15! 💪" or "You spent $10, saved $5"), then next round

### Timer

- Total game duration: ~60 seconds (10 rounds × 6 seconds)
- A per-round countdown bar is visible during the decision window
- The global countdown is shown in the top bar throughout
- When the round timer expires with no action: auto-spend

### End of Game

After round 10, the game ends. The player's score (savings balance in cents) is saved to the database. The results screen shows:
- Final savings amount
- Rounds where they saved vs. spent
- Leaderboard position
- "Play Again" button

---

## 4. Scoring

- **Score** = savings balance at the end of round 10, stored as an integer in cents (e.g., $47 → 4700)
- Stored in the existing `GameScore` table with `gameId: "savings-race"`
- Every completed game writes one row — multiple plays produce multiple rows
- Personal best = highest score across all of a user's rows
- Leaderboard = top 10 personal bests globally

### Leaderboard Query Logic

`getLeaderboard("savings-race")` groups `GameScore` by `userId`, takes `MAX(score)` per user, sorts descending (ties broken by earliest `createdAt` — first to achieve the score ranks higher), returns top 10 with user display names (via `User` join). The current user's personal best is shown below the top 10 if they don't appear in it.

The existing `@@index([gameId, score])` on `GameScore` makes this query efficient.

---

## 5. Content Structure

All game content is static TypeScript — no database, no CMS.

```
src/content/games/
└── savings-race.ts    — 50+ scenarios
```

### Scenario Type

```typescript
export interface GameScenario {
  id: string
  incomeSource: string      // e.g. "walked the neighbor's dog"
  incomeAmount: number      // dollars, e.g. 15
  incomeEmoji: string       // e.g. "🐕"
  eventDescription: string  // e.g. "Your friends are going to the movies!"
  eventCost: number         // dollars, e.g. 10
  eventEmoji: string        // e.g. "🎬"
}

export const SCENARIOS: GameScenario[]
```

### Scenario Design Rules

- **Income range:** $5–$25 per round
- **Event cost range:** $3–$18 (always less than the income, so the player always saves something even if they spend)
- **50 minimum scenarios** — 10 are randomly sampled without replacement each game for replayability
- Income sources: chores, pet-sitting, birthday money, selling crafts, lemonade stand, helping a neighbor, recycling cans, etc.
- Spending events: movies, snacks, video games, school bake sale, fair/carnival, app purchase, trading cards, etc.

### Maximum Possible Score

Because income and costs are fixed per scenario, the theoretical maximum score per game is deterministic (sum of all 10 sampled income amounts). This is shown on the results screen as context ("You saved $X out of a possible $Y").

---

## 6. Server Actions

```typescript
// src/actions/games.ts

// Save a completed game score
export async function saveGameScore(
  gameId: string,
  score: number   // in cents
): Promise<void>

// Get leaderboard + current user's personal best
export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  score: number   // in cents
  isCurrentUser: boolean
}

export async function getLeaderboard(
  gameId: string,
  limit?: number  // default 10
): Promise<{
  topScores: LeaderboardEntry[]
  personalBest: number | null   // current user's best in cents, null if never played
}>
```

Both actions call `auth()` for the session. `saveGameScore` only saves if the game is complete (enforced by the client — all 10 rounds must finish). `getLeaderboard` uses a Prisma `groupBy` query.

---

## 7. Page Architecture

### `/games/savings-race` — Server Component shell

- Calls `getLeaderboard("savings-race")` to pre-fetch leaderboard
- Passes `leaderboard` and `personalBest` as props to `SavingsRaceClient`
- No lock/gating — any logged-in user can play any time

### `SavingsRaceClient` — Client Component

Owns all game state:

```typescript
type GamePhase = "intro" | "playing" | "result"

interface GameState {
  phase: GamePhase
  round: number            // 1–10
  savings: number          // cents accumulated so far
  scenarios: GameScenario[] // 10 randomly sampled for this run
  roundOutcomes: RoundOutcome[]
}

interface RoundOutcome {
  scenarioId: string
  saved: boolean           // true = chose Save it
  amountSaved: number      // cents
  amountSpent: number      // cents
}
```

**Game phases:**
- `intro` — shows rules + leaderboard, "Start Game" button
- `playing` — the 10-round game loop with timers
- `result` — score, breakdown, updated leaderboard position, "Play Again"

On transition from `playing` → `result`: calls `saveGameScore` server action, then `router.refresh()` to reload the leaderboard with the new score.

### Timer Implementation

- Per-round timer: `useEffect` + `setInterval` at 100ms ticks, 6000ms total per round
- Auto-advances to next round (with spend resolution) on expiry
- Game phase `"playing"` gate prevents timer from running in intro/result phases

---

## 8. Routes & Files

### New Files

```
src/content/games/savings-race.ts
src/actions/games.ts
src/app/(protected)/games/savings-race/page.tsx
src/app/(protected)/games/savings-race/SavingsRaceClient.tsx
```

### Modified Files

```
src/app/(protected)/games/page.tsx    — update Savings Race "Play" button to link to /games/savings-race
```

### No Schema Changes

The existing `GameScore` model is sufficient:

```prisma
model GameScore {
  id        String   @id @default(cuid())
  userId    String
  gameId    String
  score     Int       // stored in cents
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, gameId])
  @@index([gameId, score])
}
```

---

## 9. Out of Scope (Future Games)

- **Coin Counter** — separate spec, separate implementation cycle
- **Budget Challenge** — separate spec, separate implementation cycle
- **Streak tracking / badges** — planned future work across all games
- **Multiplayer / real-time racing** — deferred indefinitely
- **Sound effects / animations** — deferred; CSS transitions only for now
