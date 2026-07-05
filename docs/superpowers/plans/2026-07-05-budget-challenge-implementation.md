# Budget Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Budget Challenge game (allocate $50 across Food/Fun/Savings, watch a week auto-resolve in two halves with one mid-week reallocation) so the "Coming Soon" card on `/games` becomes a working "Play" link, per `docs/superpowers/specs/2026-07-05-budget-challenge-design.md`.

**Architecture:** A static-scenario-pool content file (Savings Race's pattern, not Coin Counter's procedural-generation pattern) holds the event data and pure day-resolution logic. The existing shared `src/lib/gameScoring.ts` gets one more entry. A server page shell pre-fetches the leaderboard; a client component owns all game state across 6 phases (intro → allocating → resolving-first-half → reallocating → resolving-second-half → result), with no countdown timer — only a fixed-delay auto-advance chain during the two resolving phases.

**Tech Stack:** Next.js 14 (App Router), React client components, Prisma (existing `GameScore` model, no schema changes), Tailwind, `lucide-react`, shadcn `Input`/`Label` for the allocation form. No test framework is installed in this repo — pure-logic modules are verified with plain `node:assert` scripts run via the existing `ts-node` devDependency; UI is verified by manual browser drive against the dev server (matching Coin Counter and Savings Race).

## Global Constraints

- Starting allowance: $50 (5000 cents), split across exactly 3 categories: Food, Fun, Savings.
- Score for `budget-challenge` is an integer in cents, range **-10000 to 5000** (-$100 to $50), and **can be negative**.
- Week = 7 events, sampled as 4 Food + 3 Fun from two pools, shuffled into day order.
- Days 1-3 auto-resolve first (no player input), then one reallocation checkpoint (any remaining money re-split across all 3 categories), then days 4-7 auto-resolve, then the result screen.
- Event resolution rule: cost deducts from its category first; any shortfall pulls from Savings; Savings can go negative; there is no skip/partial-payment state.
- No per-day taps, no countdown timer. The only two decision points are the two allocation forms.
- Day-reveal pacing: ~1.2s per day during the two resolving phases, auto-advancing.
- No new npm dependencies, no schema changes, no new test framework.

---

### Task 1: Budget week content + day-resolution logic

**Files:**
- Create: `src/content/games/budget-challenge.ts`
- Test: `src/content/games/budget-challenge.test.ts`

**Interfaces:**
- Consumes: nothing (pure logic, no imports from other new files)
- Produces (used by Task 3's client component):
  - `export type BudgetCategory = "food" | "fun"`
  - `export interface BudgetEvent { id: string; category: BudgetCategory; description: string; cost: number; emoji: string }`
  - `export interface CategoryBalances { food: number; fun: number; savings: number }` (all cents)
  - `export interface DayResult { event: BudgetEvent; paidFromCategory: number; paidFromSavings: number }` (cents)
  - `export function sampleWeek(): BudgetEvent[]` — always returns exactly 7 events (4 food + 3 fun, shuffled)
  - `export function resolveDayEvent(balances: CategoryBalances, event: BudgetEvent): { balances: CategoryBalances; result: DayResult }`

- [ ] **Step 1: Write the failing test**

Create `src/content/games/budget-challenge.test.ts`:

```typescript
import assert from "node:assert"
import {
  sampleWeek,
  resolveDayEvent,
  type BudgetEvent,
  type CategoryBalances,
} from "./budget-challenge"

let failures = 0
function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    failures++
    console.error(`FAIL: ${name}`)
    console.error(err)
  }
}

test("sampleWeek returns exactly 7 events", () => {
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(sampleWeek().length, 7)
  }
})

test("sampleWeek always returns exactly 4 food and 3 fun events", () => {
  for (let i = 0; i < 50; i++) {
    const week = sampleWeek()
    const foodCount = week.filter((e) => e.category === "food").length
    const funCount = week.filter((e) => e.category === "fun").length
    assert.strictEqual(foodCount, 4, `expected 4 food events, got ${foodCount}`)
    assert.strictEqual(funCount, 3, `expected 3 fun events, got ${funCount}`)
  }
})

test("sampleWeek never repeats the same event id within one week", () => {
  for (let i = 0; i < 50; i++) {
    const week = sampleWeek()
    const ids = week.map((e) => e.id)
    assert.strictEqual(new Set(ids).size, ids.length, "duplicate event id in one sampled week")
  }
})

const foodEvent: BudgetEvent = {
  id: "test-food",
  category: "food",
  description: "Test lunch",
  cost: 6,
  emoji: "🍕",
}

test("resolveDayEvent deducts fully from category when it has enough", () => {
  const balances: CategoryBalances = { food: 1000, fun: 500, savings: 2000 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 600)
  assert.strictEqual(result.paidFromSavings, 0)
  assert.strictEqual(next.food, 400)
  assert.strictEqual(next.fun, 500)
  assert.strictEqual(next.savings, 2000)
})

test("resolveDayEvent pulls the shortfall from savings when category is short", () => {
  const balances: CategoryBalances = { food: 200, fun: 500, savings: 2000 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 200)
  assert.strictEqual(result.paidFromSavings, 400)
  assert.strictEqual(next.food, 0)
  assert.strictEqual(next.savings, 1600)
})

test("resolveDayEvent lets savings go negative when it can't fully cover the shortfall", () => {
  const balances: CategoryBalances = { food: 0, fun: 500, savings: 100 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 0)
  assert.strictEqual(result.paidFromSavings, 600)
  assert.strictEqual(next.food, 0)
  assert.strictEqual(next.savings, -500)
})

test("resolveDayEvent never touches the category not referenced by the event", () => {
  const balances: CategoryBalances = { food: 1000, fun: 500, savings: 2000 }
  const { balances: next } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(next.fun, 500)
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/content/games/budget-challenge.test.ts`

Expected: FAIL — `Cannot find module './budget-challenge'`

- [ ] **Step 3: Write minimal implementation**

Create `src/content/games/budget-challenge.ts`:

```typescript
// src/content/games/budget-challenge.ts

export type BudgetCategory = "food" | "fun"

export interface BudgetEvent {
  id: string
  category: BudgetCategory
  description: string
  cost: number // dollars
  emoji: string
}

export interface CategoryBalances {
  food: number    // cents
  fun: number     // cents
  savings: number // cents, can go negative
}

export interface DayResult {
  event: BudgetEvent
  paidFromCategory: number // cents
  paidFromSavings: number  // cents, 0 if the category covered it fully
}

// 16 food scenarios — everyday costs, $3-$12
const FOOD_EVENTS: BudgetEvent[] = [
  { id: "f01", category: "food", description: "School lunch pizza day", cost: 5, emoji: "🍕" },
  { id: "f02", category: "food", description: "Vending machine snack", cost: 3, emoji: "🍫" },
  { id: "f03", category: "food", description: "Ice cream after school", cost: 4, emoji: "🍦" },
  { id: "f04", category: "food", description: "Bagel and juice before school", cost: 4, emoji: "🥯" },
  { id: "f05", category: "food", description: "Fast food with friends", cost: 8, emoji: "🍔" },
  { id: "f06", category: "food", description: "Smoothie from the corner shop", cost: 6, emoji: "🥤" },
  { id: "f07", category: "food", description: "Bakery treat on the way home", cost: 4, emoji: "🥐" },
  { id: "f08", category: "food", description: "School cafeteria taco day", cost: 6, emoji: "🌮" },
  { id: "f09", category: "food", description: "Hot chocolate on a cold day", cost: 4, emoji: "☕" },
  { id: "f10", category: "food", description: "Fruit cup from the cafeteria", cost: 3, emoji: "🍎" },
  { id: "f11", category: "food", description: "Pizza slice at the mall", cost: 5, emoji: "🍕" },
  { id: "f12", category: "food", description: "Sandwich shop lunch", cost: 7, emoji: "🥪" },
  { id: "f13", category: "food", description: "Popcorn at the movies", cost: 5, emoji: "🍿" },
  { id: "f14", category: "food", description: "Breakfast sandwich", cost: 5, emoji: "🥚" },
  { id: "f15", category: "food", description: "Cafeteria pasta day", cost: 6, emoji: "🍝" },
  { id: "f16", category: "food", description: "Snack bar chips and soda", cost: 4, emoji: "🥤" },
]

// 16 fun scenarios — discretionary wants, $4-$15
const FUN_EVENTS: BudgetEvent[] = [
  { id: "u01", category: "fun", description: "Movie with friends", cost: 10, emoji: "🎬" },
  { id: "u02", category: "fun", description: "New mobile game", cost: 6, emoji: "📱" },
  { id: "u03", category: "fun", description: "Trading card pack", cost: 7, emoji: "🃏" },
  { id: "u04", category: "fun", description: "Mini golf with friends", cost: 9, emoji: "⛳" },
  { id: "u05", category: "fun", description: "Bowling night", cost: 12, emoji: "🎳" },
  { id: "u06", category: "fun", description: "Arcade tokens", cost: 8, emoji: "🕹️" },
  { id: "u07", category: "fun", description: "New sticker pack", cost: 4, emoji: "✨" },
  { id: "u08", category: "fun", description: "Skating rink admission", cost: 10, emoji: "⛸️" },
  { id: "u09", category: "fun", description: "Comic book", cost: 6, emoji: "📚" },
  { id: "u10", category: "fun", description: "Roller coaster ride at the fair", cost: 8, emoji: "🎢" },
  { id: "u11", category: "fun", description: "Photo booth with friends", cost: 5, emoji: "📸" },
  { id: "u12", category: "fun", description: "New app purchase", cost: 5, emoji: "📲" },
  { id: "u13", category: "fun", description: "Laser tag session", cost: 12, emoji: "🔫" },
  { id: "u14", category: "fun", description: "Trampoline park", cost: 15, emoji: "🤸" },
  { id: "u15", category: "fun", description: "Board game with friends", cost: 9, emoji: "🎲" },
  { id: "u16", category: "fun", description: "Music download", cost: 4, emoji: "🎵" },
]

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// Returns 7 events for one game: 4 food + 3 fun, sampled without
// replacement, shuffled into day order
export function sampleWeek(): BudgetEvent[] {
  const food = shuffleAndTake(FOOD_EVENTS, 4)
  const fun = shuffleAndTake(FUN_EVENTS, 3)
  return shuffleAndTake([...food, ...fun], 7)
}

// Applies one event's cost against the current balances: deducts from
// the event's category first (never below 0), then pulls any shortfall
// from savings (savings can go negative).
export function resolveDayEvent(
  balances: CategoryBalances,
  event: BudgetEvent
): { balances: CategoryBalances; result: DayResult } {
  const costCents = event.cost * 100
  const categoryBalance = balances[event.category]
  const paidFromCategory = Math.min(categoryBalance, costCents)
  const paidFromSavings = costCents - paidFromCategory

  const newBalances: CategoryBalances = {
    ...balances,
    [event.category]: categoryBalance - paidFromCategory,
    savings: balances.savings - paidFromSavings,
  }

  return {
    balances: newBalances,
    result: { event, paidFromCategory, paidFromSavings },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/content/games/budget-challenge.test.ts`

Expected: `PASS:` for all 6 tests, then `All tests passed`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/content/games/budget-challenge.ts src/content/games/budget-challenge.test.ts
git commit -m "feat: add budget week content and day-resolution logic"
```

---

### Task 2: Add budget-challenge score range

**Files:**
- Modify: `src/lib/gameScoring.ts`
- Modify: `src/lib/gameScoring.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `isValidScore("budget-challenge", score)` now returns `true` for integers in `[-10000, 5000]` — used by Task 3's client component via the existing `saveGameScore("budget-challenge", score)` call

The current content of `src/lib/gameScoring.ts` is:

```typescript
// src/lib/gameScoring.ts

interface ScoreRange {
  min: number
  max: number
}

const SCORE_RANGES: Record<string, ScoreRange> = {
  "savings-race": { min: -50000, max: 20000 },
  "coin-counter": { min: 0, max: 10 },
}

export function isValidScore(gameId: string, score: number): boolean {
  const range = SCORE_RANGES[gameId]
  if (!range) return false
  return Number.isInteger(score) && score >= range.min && score <= range.max
}
```

- [ ] **Step 1: Write the failing test**

Add these two test cases to the existing `src/lib/gameScoring.test.ts` (insert after the existing `"coin-counter rejects scores outside 0..10"` test, before the `"rejects non-integer scores"` test):

```typescript
test("budget-challenge accepts integer scores -10000..5000", () => {
  assert.strictEqual(isValidScore("budget-challenge", -10000), true)
  assert.strictEqual(isValidScore("budget-challenge", 5000), true)
  assert.strictEqual(isValidScore("budget-challenge", -1200), true)
  assert.strictEqual(isValidScore("budget-challenge", 0), true)
})

test("budget-challenge rejects scores outside -10000..5000", () => {
  assert.strictEqual(isValidScore("budget-challenge", -10001), false)
  assert.strictEqual(isValidScore("budget-challenge", 5001), false)
})
```

Also update the existing `"rejects non-integer scores"` test to add a budget-challenge case:

```typescript
test("rejects non-integer scores", () => {
  assert.strictEqual(isValidScore("coin-counter", 5.5), false)
  assert.strictEqual(isValidScore("savings-race", 100.1), false)
  assert.strictEqual(isValidScore("budget-challenge", -50.5), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/gameScoring.test.ts`

Expected: FAIL — the two new `budget-challenge accepts/rejects` tests fail because `SCORE_RANGES` has no `"budget-challenge"` entry yet (`isValidScore` returns `false` for all budget-challenge cases, including the ones asserted `true`)

- [ ] **Step 3: Write minimal implementation**

In `src/lib/gameScoring.ts`, change:

```typescript
const SCORE_RANGES: Record<string, ScoreRange> = {
  "savings-race": { min: -50000, max: 20000 },
  "coin-counter": { min: 0, max: 10 },
}
```

to:

```typescript
const SCORE_RANGES: Record<string, ScoreRange> = {
  "savings-race": { min: -50000, max: 20000 },
  "coin-counter": { min: 0, max: 10 },
  "budget-challenge": { min: -10000, max: 5000 },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/gameScoring.test.ts`

Expected: `PASS:` for all 8 tests (6 existing + 2 new), then `All tests passed`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/gameScoring.ts src/lib/gameScoring.test.ts
git commit -m "feat: add budget-challenge score range"
```

---

### Task 3: Page shell + game client component

**Files:**
- Create: `src/app/(protected)/games/budget-challenge/page.tsx`
- Create: `src/app/(protected)/games/budget-challenge/BudgetChallengeClient.tsx`

**Interfaces:**
- Consumes:
  - `getLeaderboard(gameId: string, limit?: number): Promise<{ topScores: LeaderboardEntry[]; personalBest: number | null }>` from `@/actions/games` (already exists, unchanged)
  - `sampleWeek(): BudgetEvent[]`, `resolveDayEvent(balances, event)`, and `type BudgetEvent`, `type CategoryBalances`, `type DayResult` from `@/content/games/budget-challenge` (Task 1)
  - `saveGameScore(gameId: string, score: number): Promise<void>` and `type LeaderboardEntry` from `@/actions/games` (Task 2 made `"budget-challenge"` a valid gameId)
  - `Header` from `@/components/layout/Header`; `Button`/`Card`/`CardContent`/`CardHeader`/`CardTitle` from `@/components/ui/*`; `Input` from `@/components/ui/input`; `Label` from `@/components/ui/label` (all exist already)
- Produces: nothing consumed by later tasks — this is the last file pair before wiring up the index page in Task 4

These two files are one task because neither type-checks in isolation: the page shell imports `BudgetChallengeClient`, so they must land together. No automated tests for the client component (stateful UI; this repo has no component-testing framework, matching the precedent set by `SavingsRaceClient.tsx` and `CoinCounterClient.tsx`, neither of which has any). Verification is a type-check here, plus the manual end-to-end browser check in Task 4.

- [ ] **Step 1: Write the page shell**

Create `src/app/(protected)/games/budget-challenge/page.tsx`:

```typescript
import { getLeaderboard } from "@/actions/games"
import { BudgetChallengeClient } from "./BudgetChallengeClient"

export default async function BudgetChallengePage() {
  const { topScores, personalBest } = await getLeaderboard("budget-challenge")

  return (
    <BudgetChallengeClient leaderboard={topScores} personalBest={personalBest} />
  )
}
```

- [ ] **Step 2: Write the client component**

Create `src/app/(protected)/games/budget-challenge/BudgetChallengeClient.tsx`:

```typescript
// src/app/(protected)/games/budget-challenge/BudgetChallengeClient.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/Header"
import { saveGameScore } from "@/actions/games"
import type { LeaderboardEntry } from "@/actions/games"
import {
  sampleWeek,
  resolveDayEvent,
  type BudgetEvent,
  type CategoryBalances,
  type DayResult,
} from "@/content/games/budget-challenge"
import { Trophy } from "lucide-react"

type GamePhase =
  | "intro"
  | "allocating"
  | "resolving-first-half"
  | "reallocating"
  | "resolving-second-half"
  | "result"

interface GameState {
  phase: GamePhase
  week: BudgetEvent[]
  balances: CategoryBalances
  dayResults: DayResult[]
  currentDayIndex: number // index into week[], 0-7
}

const INITIAL_STATE: GameState = {
  phase: "intro",
  week: [],
  balances: { food: 0, fun: 0, savings: 0 },
  dayResults: [],
  currentDayIndex: 0,
}

const ALLOWANCE_CENTS = 5000
const FIRST_HALF_END = 3
const SECOND_HALF_END = 7
const DAY_REVEAL_MS = 1200

function formatDollars(cents: number): string {
  const dollars = cents / 100
  const sign = dollars < 0 ? "-" : ""
  return `${sign}$${Math.abs(dollars).toFixed(0)}`
}

interface AllocationFormProps {
  target: number // cents, must sum to this (can be negative)
  onSubmit: (balances: CategoryBalances) => void
  submitLabel: string
}

function AllocationForm({ target, onSubmit, submitLabel }: AllocationFormProps) {
  const [food, setFood] = useState("0")
  const [fun, setFun] = useState("0")
  const [savings, setSavings] = useState("0")

  const foodCents = Math.round((parseFloat(food) || 0) * 100)
  const funCents = Math.round((parseFloat(fun) || 0) * 100)
  const savingsCents = Math.round((parseFloat(savings) || 0) * 100)
  const allocated = foodCents + funCents + savingsCents
  const remaining = target - allocated
  const canSubmit = remaining === 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="alloc-food">Food</Label>
          <Input
            id="alloc-food"
            type="number"
            value={food}
            onChange={(e) => setFood(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="alloc-fun">Fun</Label>
          <Input
            id="alloc-fun"
            type="number"
            value={fun}
            onChange={(e) => setFun(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="alloc-savings">Savings</Label>
          <Input
            id="alloc-savings"
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
          />
        </div>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        {remaining === 0
          ? "Fully allocated!"
          : `${formatDollars(remaining)} left to allocate`}
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({ food: foodCents, fun: funCents, savings: savingsCents })
        }
      >
        {submitLabel}
      </Button>
    </div>
  )
}

function DayLogRow({ result, dayNumber }: { result: DayResult; dayNumber: number }) {
  const total = result.paidFromCategory + result.paidFromSavings
  return (
    <div className="flex items-center justify-between text-sm border-b py-2 last:border-0">
      <span>
        Day {dayNumber}: {result.event.description} {result.event.emoji}
      </span>
      <span className="text-muted-foreground">
        -{formatDollars(total)}
        {result.paidFromSavings > 0 && (
          <span className="text-red-600">
            {" "}
            ({formatDollars(result.paidFromSavings)} from savings)
          </span>
        )}
      </span>
    </div>
  )
}

interface Props {
  leaderboard: LeaderboardEntry[]
  personalBest: number | null
}

export function BudgetChallengeClient({ leaderboard, personalBest }: Props) {
  const router = useRouter()
  const [state, setState] = useState<GameState>(INITIAL_STATE)

  // --- Finish game — save score, refresh leaderboard, show result ---
  const finishGame = useCallback(
    (finalSavings: number) => {
      setState((prev) => ({ ...prev, phase: "result" }))
      saveGameScore("budget-challenge", finalSavings)
        .then(() => router.refresh())
        .catch(console.error)
    },
    [router]
  )

  // --- Start / restart game ---
  const startGame = useCallback(() => {
    setState({
      phase: "allocating",
      week: sampleWeek(),
      balances: { food: 0, fun: 0, savings: 0 },
      dayResults: [],
      currentDayIndex: 0,
    })
  }, [])

  const handleAllocate = useCallback((balances: CategoryBalances) => {
    setState((prev) => ({ ...prev, balances, phase: "resolving-first-half" }))
  }, [])

  const handleReallocate = useCallback((balances: CategoryBalances) => {
    setState((prev) => ({ ...prev, balances, phase: "resolving-second-half" }))
  }, [])

  const resetToIntro = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  // Effect 1: reveal one day at a time during a resolving phase
  useEffect(() => {
    if (state.phase !== "resolving-first-half" && state.phase !== "resolving-second-half") return
    const halfEnd = state.phase === "resolving-first-half" ? FIRST_HALF_END : SECOND_HALF_END
    if (state.currentDayIndex >= halfEnd) return

    const id = setTimeout(() => {
      setState((prev) => {
        const event = prev.week[prev.currentDayIndex]
        const { balances, result } = resolveDayEvent(prev.balances, event)
        return {
          ...prev,
          balances,
          dayResults: [...prev.dayResults, result],
          currentDayIndex: prev.currentDayIndex + 1,
        }
      })
    }, DAY_REVEAL_MS)
    return () => clearTimeout(id)
  }, [state.phase, state.currentDayIndex])

  // Effect 2: move to the next phase once a half finishes revealing
  useEffect(() => {
    if (state.phase === "resolving-first-half" && state.currentDayIndex >= FIRST_HALF_END) {
      setState((prev) => ({ ...prev, phase: "reallocating" }))
    }
    if (state.phase === "resolving-second-half" && state.currentDayIndex >= SECOND_HALF_END) {
      finishGame(state.balances.savings)
    }
  }, [state.phase, state.currentDayIndex, state.balances.savings, finishGame])

  // ===== RENDER: INTRO =====

  if (state.phase === "intro") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🛒</div>
              <h1 className="text-3xl font-bold mb-2">Budget Challenge</h1>
              <p className="text-muted-foreground">
                Split a $50 allowance across Food, Fun, and Savings, then
                watch your week play out. You'll get one chance to
                re-plan halfway through!
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">How to play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>
                  💵 <strong>Allocate your $50</strong> across Food, Fun,
                  and Savings before the week starts.
                </p>
                <p>
                  📅 <strong>Days 1-3 happen automatically</strong> —
                  costs come out of their category, and any shortfall
                  comes out of Savings.
                </p>
                <p>
                  🔄 <strong>Re-plan at the midpoint</strong> based on how
                  the week's gone, then days 4-7 play out the same way.
                </p>
                <p>
                  🏆 <strong>Your score is your final Savings</strong> —
                  it can go negative if you overspend!
                </p>
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Top Budgeters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between text-sm ${
                          entry.isCurrentUser ? "font-semibold text-primary" : ""
                        }`}
                      >
                        <span>
                          #{entry.rank} {entry.displayName}
                          {entry.isCurrentUser ? " (you)" : ""}
                        </span>
                        <span>{formatDollars(entry.score)}</span>
                      </div>
                    ))}
                  </div>
                  {personalBest !== null && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Your best: {formatDollars(personalBest)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Button size="lg" className="w-full text-lg py-6" onClick={startGame}>
              Start Game
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // ===== RENDER: ALLOCATING =====

  if (state.phase === "allocating") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">Plan Your Week</h1>
              <p className="text-muted-foreground text-sm">
                Split your {formatDollars(ALLOWANCE_CENTS)} allowance across
                Food, Fun, and Savings.
              </p>
            </div>
            <AllocationForm
              target={ALLOWANCE_CENTS}
              onSubmit={handleAllocate}
              submitLabel="Start Week"
            />
          </div>
        </main>
      </div>
    )
  }

  // ===== RENDER: RESOLVING (first or second half) =====

  if (state.phase === "resolving-first-half" || state.phase === "resolving-second-half") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-4">
          <div className="container max-w-md">
            <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-5 py-3 mb-4">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Food
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatDollars(state.balances.food)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fun
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatDollars(state.balances.fun)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Savings
                </div>
                <div
                  className={`text-xl font-bold ${
                    state.balances.savings < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatDollars(state.balances.savings)}
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Week So Far</CardTitle>
              </CardHeader>
              <CardContent>
                {state.dayResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    The week is starting...
                  </p>
                ) : (
                  state.dayResults.map((result, i) => (
                    <DayLogRow key={result.event.id} result={result} dayNumber={i + 1} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // ===== RENDER: REALLOCATING =====

  if (state.phase === "reallocating") {
    const currentTotal =
      state.balances.food + state.balances.fun + state.balances.savings

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">Halfway There!</h1>
              <p className="text-muted-foreground text-sm">
                Re-plan the rest of your week with what's left:{" "}
                {formatDollars(currentTotal)}.
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Days 1-3</CardTitle>
              </CardHeader>
              <CardContent>
                {state.dayResults.map((result, i) => (
                  <DayLogRow key={result.event.id} result={result} dayNumber={i + 1} />
                ))}
              </CardContent>
            </Card>

            <AllocationForm
              target={currentTotal}
              onSubmit={handleReallocate}
              submitLabel="Continue"
            />
          </div>
        </main>
      </div>
    )
  }

  // ===== RENDER: RESULT =====

  const currentUserRank = leaderboard.find((e) => e.isCurrentUser)?.rank

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              {state.balances.savings >= 2000
                ? "🏆"
                : state.balances.savings >= 0
                ? "🛒"
                : "😬"}
            </div>
            <h1 className="text-3xl font-bold mb-1">Week Complete!</h1>
            <div
              className={`text-5xl font-extrabold my-3 ${
                state.balances.savings < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatDollars(state.balances.savings)}
            </div>
            <p className="text-muted-foreground">
              That's your final savings for the week.
            </p>
          </div>

          {currentUserRank !== undefined && (
            <Card className="mb-6 border-primary">
              <CardContent className="pt-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-lg font-bold">
                  You ranked #{currentUserRank} globally!
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Your Full Week</CardTitle>
            </CardHeader>
            <CardContent>
              {state.dayResults.map((result, i) => (
                <DayLogRow key={result.event.id} result={result} dayNumber={i + 1} />
              ))}
            </CardContent>
          </Card>

          {leaderboard.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between text-sm ${
                        entry.isCurrentUser ? "font-semibold text-primary" : ""
                      }`}
                    >
                      <span>
                        #{entry.rank} {entry.displayName}
                        {entry.isCurrentUser ? " (you)" : ""}
                      </span>
                      <span>{formatDollars(entry.score)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" onClick={startGame}>
              Play Again
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={resetToIntro}
            >
              Back to Intro
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/games/budget-challenge/page.tsx" "src/app/(protected)/games/budget-challenge/BudgetChallengeClient.tsx"
git commit -m "feat: add Budget Challenge page and game client component"
```

---

### Task 4: Wire up the games index + end-to-end verification

**Files:**
- Modify: `src/app/(protected)/games/page.tsx:22-29` (the `budget-challenge` entry's `route` field)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing consumed by later tasks (this is the last task)

- [ ] **Step 1: Update the route**

In `src/app/(protected)/games/page.tsx`, change:

```typescript
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Manage a weekly budget and make smart choices",
    icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
    difficulty: "Medium",
    route: null,
  },
```

to:

```typescript
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Manage a weekly budget and make smart choices",
    icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
    difficulty: "Medium",
    route: "/games/budget-challenge",
  },
```

- [ ] **Step 2: Full build check**

Run: `npx tsc --noEmit && npx next lint`

Expected: no type errors, no new lint errors. (If run inside a nested git worktree under the main repo checkout, `next lint` may report a `Plugin "@next/next" was conflicted` error unrelated to this change — this was a known artifact confirmed during the Coin Counter build; if you hit it, confirm via `git stash` that it reproduces identically without this change, and note it as an environment issue rather than a regression.)

- [ ] **Step 3: Manual end-to-end verification**

Start the dev server and confirm the full flow works for a logged-in user (same approach used for Savings Race and Coin Counter):

```bash
npm run dev &> /tmp/budget-challenge-dev.log &
for i in $(seq 1 30); do curl -sf http://localhost:3000 -o /dev/null && break; sleep 1; done
```

Then, as a logged-in test user:
1. Visit `/games` — confirm the Budget Challenge card now shows a "Play" button (not "Coming Soon")
2. Click through to `/games/budget-challenge` — confirm the intro screen renders with rules and a "Start Game" button
3. Click "Start Game" — confirm the allocation form appears with 3 inputs (Food/Fun/Savings) and a "$50 left to allocate" message that updates as you type, with "Start Week" disabled until the three inputs sum to exactly $50
4. Enter a valid split (e.g. Food $20 / Fun $10 / Savings $20) and click "Start Week" — confirm days 1-3 auto-reveal one at a time (~1.2s apart) into a growing log, with the top bar's Food/Fun/Savings numbers updating as each day resolves
5. Confirm the reallocation screen appears after day 3, showing the days-1-3 log and a fresh allocation form pre-targeted to whatever's left — confirm "Continue" is disabled until the 3 inputs sum to that remaining total
6. Submit a reallocation and confirm days 4-7 auto-reveal the same way
7. Confirm the result screen shows the final (possibly negative) savings amount, the full 7-day log, and the leaderboard
8. Check the browser console for errors — expect none
9. As a second check, deliberately over-allocate Fun and under-allocate Food (e.g. Food $5 / Fun $40 / Savings $5) to confirm a category shortfall correctly pulls from Savings during resolution, and that Savings can display as negative if it's driven below zero

Stop the dev server afterward: `pkill -f "next dev"`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/games/page.tsx"
git commit -m "feat: wire up Budget Challenge route on the games index"
```
