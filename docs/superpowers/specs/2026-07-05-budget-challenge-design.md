# CashCritters V2 — Budget Challenge Game Design

**Date:** 2026-07-05
**Status:** Approved
**Scope:** Third game implementation — Budget Challenge

---

## 1. Goals

- Make the "Play" button on the Budget Challenge card (currently "Coming Soon") navigate to a working game
- Teach kids to plan a budget across competing priorities (needs, wants, savings) and adapt that plan as circumstances unfold
- Deliberately differ from Savings Race and Coin Counter's round-by-round, timed-tap structure — the tension here lives in *planning*, not moment-to-moment reaction
- Reuse the established pattern (content file, server actions, server page shell, client component) where it fits, without forcing this game into the other two games' shape

---

## 2. Game Overview

**Budget Challenge** is a two-phase weekly budgeting game. The player starts with a fixed $50 allowance and splits it across three categories — Food, Fun, and Savings. The week then plays out in two auto-resolving halves (days 1–3, then days 4–7), with a single mid-week checkpoint where the player can reallocate whatever's left based on how the week has gone so far.

There are no per-day taps and no countdown timer. The player's only decisions are the two budget allocations. Everything else — each day's event firing, its cost being deducted, any shortfall spilling into Savings — happens automatically. This is the deliberate point of differentiation from Savings Race (real-time willpower against temptation, every round) and Coin Counter (fast recall under time pressure): Budget Challenge is about foresight and adapting a plan, not reflexes.

---

## 3. Game Loop

### Phase 1: Allocate

- Player starts with $50 (5000 cents) and 3 number inputs: Food, Fun, Savings
- The 3 inputs must sum to exactly $50; a running "remaining to allocate" total is shown
- "Start Week" is disabled until the full $50 is allocated

### Phase 2: Days 1–3 auto-resolve

- 3 events are drawn from the sampled week (see Section 5) and resolve one at a time, animated:
  - Each day flashes in for ~1.2s ("Day 1: Lunch with friends 🍕 — $6 from Food"), then adds to a running log below and auto-advances to the next day
  - No player input during this phase
- **Resolution rule for each event:** the event's cost is deducted from its category (Food or Fun).
  - If that category's remaining balance covers it, deduct in full.
  - If not, deduct what's available from the category (bringing it to $0) and pull the shortfall from Savings.
  - If Savings can't cover its share either, Savings goes negative. The event is always considered "paid" — there's no partial-payment or skip state during auto-resolve.

### Phase 3: Mid-week reallocation

- After day 3, the player sees: remaining Food balance, remaining Fun balance, remaining (possibly negative) Savings balance, and the day-by-day log so far
- Whatever's left across all 3 categories combined (Food + Fun + Savings, which can be less than $50 if Savings went negative) is re-split via the same 3-input UI used in Phase 1
- The 3 inputs must sum to exactly the current combined remaining total (which may itself be negative — see Section 4 edge case)
- "Continue" is disabled until fully reallocated

### Phase 4: Days 4–7 auto-resolve

- Same mechanic as Phase 2, for the remaining 4 sampled events

### Phase 5: Result

- Final Savings balance (can be negative) is the score, saved via `saveGameScore("budget-challenge", score)`
- Results screen shows: final savings, the full 7-day log (all 7 events with their category and outcome), leaderboard position, "Play Again"

### Edge Case: Negative Total at Reallocation Checkpoint

If Savings has gone negative enough that Food + Fun + Savings sums to a negative or very small number at the Phase 3 checkpoint, the reallocation UI still requires the 3 inputs to sum to that (possibly negative) total — e.g., if the combined total is -$5, the player must distribute a $5 deficit across the 3 categories (any combination summing to -5, such as Food $0 / Fun $0 / Savings -$5). This keeps the invariant (3 inputs always sum to the true remaining total) simple and consistent across both allocation phases, rather than adding a special case.

---

## 4. Scoring

- **Score** = final Savings balance in cents, an integer that **can be negative** (e.g., -$12 → -1200)
- Stored in the existing `GameScore` table with `gameId: "budget-challenge"`
- Score range for validation: **-10000 to 5000** (-$100 to $50) — tighter than Savings Race's range (-50000 to 20000) since the starting allowance ($50) and realistic shortfalls are both smaller in this game
- Every completed game writes one row; personal best = highest score across all of a user's rows; leaderboard = top 10 personal bests globally, via the existing `getLeaderboard` action (unchanged, just a different `gameId`)

---

## 5. Content Structure

`src/content/games/budget-challenge.ts` follows Savings Race's static-scenario-pool pattern (not Coin Counter's procedural-generation pattern, since these are themed, hand-written events like Savings Race's, not combinatorial coin piles).

```typescript
export type BudgetCategory = "food" | "fun"

export interface BudgetEvent {
  id: string
  category: BudgetCategory
  description: string    // e.g. "Lunch with friends"
  cost: number            // dollars, e.g. 6
  emoji: string
}

export const FOOD_EVENTS: BudgetEvent[]   // 15+ scenarios, cost $3-$12
export const FUN_EVENTS: BudgetEvent[]    // 15+ scenarios, cost $4-$15

// Returns 7 events for one game: ~4 Food + ~3 Fun, sampled without
// replacement from the pools, then shuffled into day order (days 1-7)
export function sampleWeek(): BudgetEvent[]
```

### Sampling Rules

- **15+ Food scenarios** — everyday costs a kid actually faces: school lunch, snacks, a bus fare, etc. Cost $3–$12.
- **15+ Fun scenarios** — discretionary wants: movies, games, treats with friends. Cost $4–$15.
- **7 sampled per game** — 4 from Food, 3 from Fun (soft-constrained by sampling separately, same technique as Savings Race's `sampleScenarios`), then shuffled together into a single day-ordered list of 7.
- Day 1–3 of the sampled list resolves in Phase 2; days 4–7 resolves in Phase 4.

---

## 6. Server Actions

Extend the existing `src/lib/gameScoring.ts` (no new file needed — same pattern as Coin Counter):

```typescript
const SCORE_RANGES: Record<string, ScoreRange> = {
  "savings-race": { min: -50000, max: 20000 },
  "coin-counter": { min: 0, max: 10 },
  "budget-challenge": { min: -10000, max: 5000 },
}
```

`src/actions/games.ts` needs no changes — `saveGameScore` and `getLeaderboard` are already generic over `gameId` and already call `isValidScore`.

---

## 7. Page Architecture

### `/games/budget-challenge` — Server Component shell

- Calls `getLeaderboard("budget-challenge")` to pre-fetch leaderboard
- Passes `leaderboard` and `personalBest` as props to `BudgetChallengeClient`
- No lock/gating — any logged-in user can play any time

### `BudgetChallengeClient` — Client Component

Owns all game state:

```typescript
type GamePhase =
  | "intro"
  | "allocating"
  | "resolving-first-half"
  | "reallocating"
  | "resolving-second-half"
  | "result"

interface CategoryBalances {
  food: number      // cents
  fun: number       // cents
  savings: number   // cents, can go negative
}

interface DayResult {
  event: BudgetEvent
  paidFromCategory: number   // cents taken from food/fun
  paidFromSavings: number    // cents taken from savings (0 if category covered it)
}

interface GameState {
  phase: GamePhase
  week: BudgetEvent[]           // all 7 sampled events, in day order
  balances: CategoryBalances
  dayResults: DayResult[]       // grows as days resolve
  currentDayIndex: number       // which day is currently animating in
}
```

**Phase behavior:**
- `intro` — rules + leaderboard, "Start Game" button → `allocating`
- `allocating` — 3-input allocation form (must sum to $50) → `resolving-first-half`
- `resolving-first-half` — auto-advances through days 1–3 (`setTimeout` per day, ~1.2s), then → `reallocating`
- `reallocating` — 3-input allocation form (must sum to current combined remaining total) → `resolving-second-half`
- `resolving-second-half` — auto-advances through days 4–7, then → `result` (calls `saveGameScore` here)
- `result` — final savings, full 7-day log, leaderboard, "Play Again"

### Timer Implementation

None — this game has no countdown timer, per the design's deliberate differentiation from Savings Race/Coin Counter. The only timing is the fixed ~1.2s-per-day auto-advance during the two resolving phases, implemented as a single `setTimeout` chain (not a per-100ms countdown loop, since there's nothing being counted down for the player to see).

---

## 8. Routes & Files

### New Files

```
src/content/games/budget-challenge.ts
src/app/(protected)/games/budget-challenge/page.tsx
src/app/(protected)/games/budget-challenge/BudgetChallengeClient.tsx
```

### Modified Files

```
src/lib/gameScoring.ts                — add "budget-challenge" to SCORE_RANGES
src/app/(protected)/games/page.tsx    — update Budget Challenge card's route to /games/budget-challenge
```

### No Schema Changes

The existing `GameScore` model is sufficient — `score` already stores an arbitrary (including negative) integer per `gameId`.

---

## 9. Out of Scope

- **Timed decisions / per-day taps** — deliberately excluded; see Section 2
- **More than one reallocation checkpoint** — one mid-week checkpoint is enough to test "adapt the plan"; more would dilute the two-decision-point structure
- **Category-specific sub-goals or achievements** (e.g. "never skip a Food day") — future polish, not this pass
- **Sound effects / animations beyond the day-by-day reveal** — deferred; CSS transitions only, matching the other two games
