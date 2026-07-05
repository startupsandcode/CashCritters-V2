# Coin Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Coin Counter game (10-round, timed, multiple-choice coin-counting game) so the "Coming Soon" card on `/games` becomes a working "Play" link, per `docs/superpowers/specs/2026-07-05-coin-counter-design.md`.

**Architecture:** Follows the Savings Race pattern exactly: a pure-logic content file for game generation, a shared server action for score persistence/leaderboard, a server component page shell that pre-fetches the leaderboard, and a client component owning all game state via a `useState` + `useEffect` timer loop.

**Tech Stack:** Next.js 14 (App Router), React client components, Prisma (existing `GameScore` model, no schema changes), Tailwind for styling, `lucide-react` for icons. No test framework is installed in this repo (no jest/vitest) — pure-logic modules are verified with plain `node:assert` scripts run via the existing `ts-node` devDependency; UI is verified by manual browser drive against the dev server (matching how Savings Race was verified).

## Global Constraints

- Score for `coin-counter` is an integer 0–10 (correct-answer count), stored in the existing `GameScore.score` column via `gameId: "coin-counter"`.
- Round timer is 10000ms (10s) per round, 10 rounds total.
- Coins are penny(1¢)/nickel(5¢)/dime(10¢)/quarter(25¢) only.
- Difficulty ramp: rounds 1–3 easy (2–3 coins, 1–2 denominations), rounds 4–7 medium (4–5 coins, 2–3 denominations), rounds 8–10 hard (6–7 coins, 3–4 denominations).
- 3 multiple-choice answers per round (1 correct + 2 distractors), shuffled.
- No new npm dependencies, no schema changes, no new test framework.

---

### Task 1: Coin pile generation logic

**Files:**
- Create: `src/content/games/coin-counter.ts`
- Test: `src/content/games/coin-counter.test.ts`

**Interfaces:**
- Consumes: nothing (pure logic, no imports from other new files)
- Produces (used by Task 3's client component):
  - `export type CoinDenomination = 1 | 5 | 10 | 25`
  - `export interface CoinPile { coins: CoinDenomination[]; totalCents: number }`
  - `export type DifficultyTier = "easy" | "medium" | "hard"`
  - `export interface GeneratedRound { pile: CoinPile; choices: number[] }`
  - `export function tierForRound(round: number): DifficultyTier`
  - `export function generatePile(tier: DifficultyTier): CoinPile`
  - `export function generateDistractors(totalCents: number): [number, number]`
  - `export function buildChoices(totalCents: number): number[]`
  - `export function generateRound(round: number): GeneratedRound`

- [ ] **Step 1: Write the failing test**

Create `src/content/games/coin-counter.test.ts`:

```typescript
import assert from "node:assert"
import {
  tierForRound,
  generatePile,
  generateDistractors,
  buildChoices,
  generateRound,
  type CoinDenomination,
} from "./coin-counter"

const ALL_DENOMINATIONS: CoinDenomination[] = [1, 5, 10, 25]
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

test("tierForRound returns easy for rounds 1-3", () => {
  assert.strictEqual(tierForRound(1), "easy")
  assert.strictEqual(tierForRound(2), "easy")
  assert.strictEqual(tierForRound(3), "easy")
})

test("tierForRound returns medium for rounds 4-7", () => {
  assert.strictEqual(tierForRound(4), "medium")
  assert.strictEqual(tierForRound(5), "medium")
  assert.strictEqual(tierForRound(6), "medium")
  assert.strictEqual(tierForRound(7), "medium")
})

test("tierForRound returns hard for rounds 8-10", () => {
  assert.strictEqual(tierForRound(8), "hard")
  assert.strictEqual(tierForRound(9), "hard")
  assert.strictEqual(tierForRound(10), "hard")
})

test("generatePile respects coin-count and denomination-count bounds for each tier", () => {
  const bounds = {
    easy: { minCoins: 2, maxCoins: 3, minDenoms: 1, maxDenoms: 2 },
    medium: { minCoins: 4, maxCoins: 5, minDenoms: 2, maxDenoms: 3 },
    hard: { minCoins: 6, maxCoins: 7, minDenoms: 3, maxDenoms: 4 },
  } as const

  for (const tier of ["easy", "medium", "hard"] as const) {
    const { minCoins, maxCoins, minDenoms, maxDenoms } = bounds[tier]
    for (let i = 0; i < 200; i++) {
      const pile = generatePile(tier)
      assert.ok(
        pile.coins.length >= minCoins && pile.coins.length <= maxCoins,
        `${tier} coin count out of range: ${pile.coins.length}`
      )
      const distinctDenoms = new Set(pile.coins).size
      assert.ok(
        distinctDenoms >= minDenoms && distinctDenoms <= maxDenoms,
        `${tier} denomination count out of range: ${distinctDenoms}`
      )
      for (const coin of pile.coins) {
        assert.ok(
          (ALL_DENOMINATIONS as number[]).includes(coin),
          `unexpected denomination: ${coin}`
        )
      }
      const expectedTotal = pile.coins.reduce((sum, c) => sum + c, 0)
      assert.strictEqual(pile.totalCents, expectedTotal)
    }
  }
})

test("generateDistractors returns two distinct non-negative values different from the total", () => {
  for (const total of [0, 1, 2, 5, 10, 25, 47, 100, 175]) {
    for (let i = 0; i < 50; i++) {
      const [d1, d2] = generateDistractors(total)
      assert.notStrictEqual(d1, total)
      assert.notStrictEqual(d2, total)
      assert.notStrictEqual(d1, d2)
      assert.ok(d1 >= 0, `d1 negative: ${d1}`)
      assert.ok(d2 >= 0, `d2 negative: ${d2}`)
    }
  }
})

test("buildChoices returns 3 unique values including the correct total", () => {
  for (const total of [2, 47, 175]) {
    for (let i = 0; i < 100; i++) {
      const choices = buildChoices(total)
      assert.strictEqual(choices.length, 3)
      assert.ok(choices.includes(total))
      assert.strictEqual(new Set(choices).size, 3)
    }
  }
})

test("generateRound produces a pile matching the round's tier and 3 valid choices", () => {
  for (const round of [1, 5, 9]) {
    const { pile, choices } = generateRound(round)
    assert.strictEqual(choices.length, 3)
    assert.ok(choices.includes(pile.totalCents))
    assert.strictEqual(new Set(choices).size, 3)
  }
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/content/games/coin-counter.test.ts`

Expected: FAIL — `Cannot find module './coin-counter'` (the file doesn't exist yet)

- [ ] **Step 3: Write minimal implementation**

Create `src/content/games/coin-counter.ts`:

```typescript
// src/content/games/coin-counter.ts

export type CoinDenomination = 1 | 5 | 10 | 25

export interface CoinPile {
  coins: CoinDenomination[]
  totalCents: number
}

export type DifficultyTier = "easy" | "medium" | "hard"

export interface GeneratedRound {
  pile: CoinPile
  choices: number[]
}

const ALL_DENOMINATIONS: CoinDenomination[] = [1, 5, 10, 25]
const NUDGE_VALUES: CoinDenomination[] = [1, 5, 10, 25]

interface TierConfig {
  minCoins: number
  maxCoins: number
  minDenominations: number
  maxDenominations: number
}

const TIER_CONFIG: Record<DifficultyTier, TierConfig> = {
  easy: { minCoins: 2, maxCoins: 3, minDenominations: 1, maxDenominations: 2 },
  medium: { minCoins: 4, maxCoins: 5, minDenominations: 2, maxDenominations: 3 },
  hard: { minCoins: 6, maxCoins: 7, minDenominations: 3, maxDenominations: 4 },
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Rounds 1-3 = easy, 4-7 = medium, 8-10 = hard
export function tierForRound(round: number): DifficultyTier {
  if (round <= 3) return "easy"
  if (round <= 7) return "medium"
  return "hard"
}

export function generatePile(tier: DifficultyTier): CoinPile {
  const config = TIER_CONFIG[tier]
  const denominationCount = randomInt(
    config.minDenominations,
    config.maxDenominations
  )
  const denominations = shuffle(ALL_DENOMINATIONS).slice(0, denominationCount)
  const coinCount = randomInt(config.minCoins, config.maxCoins)

  const coins: CoinDenomination[] = []
  for (let i = 0; i < coinCount; i++) {
    coins.push(denominations[randomInt(0, denominations.length - 1)])
  }

  const totalCents = coins.reduce((sum, c) => sum + c, 0)
  return { coins, totalCents }
}

// Generates 2 distractor totals near the correct total by nudging +/- one
// coin's value, clamped non-negative, distinct from the total and each other.
export function generateDistractors(totalCents: number): [number, number] {
  const seen = new Set<number>([totalCents])
  const distractors: number[] = []

  let attempts = 0
  while (distractors.length < 2 && attempts < 50) {
    attempts++
    const nudge = NUDGE_VALUES[randomInt(0, NUDGE_VALUES.length - 1)]
    const sign = Math.random() < 0.5 ? -1 : 1
    const candidate = totalCents + sign * nudge
    if (candidate < 0 || seen.has(candidate)) continue
    seen.add(candidate)
    distractors.push(candidate)
  }

  // Fallback for edge cases where random nudging can't find 2 distinct
  // non-negative values fast enough (e.g. totalCents = 0 or 1)
  let offset = 1
  while (distractors.length < 2) {
    const candidate = totalCents + offset
    if (!seen.has(candidate)) {
      seen.add(candidate)
      distractors.push(candidate)
    }
    offset++
  }

  return [distractors[0], distractors[1]]
}

export function buildChoices(totalCents: number): number[] {
  const [d1, d2] = generateDistractors(totalCents)
  return shuffle([totalCents, d1, d2])
}

export function generateRound(round: number): GeneratedRound {
  const tier = tierForRound(round)
  const pile = generatePile(tier)
  const choices = buildChoices(pile.totalCents)
  return { pile, choices }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/content/games/coin-counter.test.ts`

Expected: `PASS:` for all 7 tests, then `All tests passed`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/content/games/coin-counter.ts src/content/games/coin-counter.test.ts
git commit -m "feat: add coin pile generation logic for Coin Counter game"
```

---

### Task 2: Game-aware score validation

**Files:**
- Create: `src/lib/gameScoring.ts`
- Test: `src/lib/gameScoring.test.ts`
- Modify: `src/actions/games.ts:15-29` (the `saveGameScore` function)

**Interfaces:**
- Consumes: nothing new
- Produces (used by Task 3's client component indirectly, via `saveGameScore`):
  - `export function isValidScore(gameId: string, score: number): boolean`

**Why a separate file:** `src/actions/games.ts` has `"use server"` at the top and imports `@/auth` and `@/lib/prisma` at module scope — importing it from a plain `ts-node` script (outside the Next.js runtime) would try to construct the NextAuth instance and Prisma client without the app's request context. Pulling the pure validation logic into its own module keeps it independently testable, matching the "each file has one clear responsibility" principle. `src/actions/games.ts` imports and uses it, so the exact same logic guards the real DB write.

- [ ] **Step 1: Write the failing test**

Create `src/lib/gameScoring.test.ts`:

```typescript
import assert from "node:assert"
import { isValidScore } from "./gameScoring"

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

test("savings-race accepts scores within -50000..20000", () => {
  assert.strictEqual(isValidScore("savings-race", 0), true)
  assert.strictEqual(isValidScore("savings-race", -50000), true)
  assert.strictEqual(isValidScore("savings-race", 20000), true)
})

test("savings-race rejects scores outside -50000..20000", () => {
  assert.strictEqual(isValidScore("savings-race", -50001), false)
  assert.strictEqual(isValidScore("savings-race", 20001), false)
})

test("coin-counter accepts integer scores 0..10", () => {
  assert.strictEqual(isValidScore("coin-counter", 0), true)
  assert.strictEqual(isValidScore("coin-counter", 10), true)
  assert.strictEqual(isValidScore("coin-counter", 7), true)
})

test("coin-counter rejects scores outside 0..10", () => {
  assert.strictEqual(isValidScore("coin-counter", -1), false)
  assert.strictEqual(isValidScore("coin-counter", 11), false)
})

test("rejects non-integer scores", () => {
  assert.strictEqual(isValidScore("coin-counter", 5.5), false)
  assert.strictEqual(isValidScore("savings-race", 100.1), false)
})

test("rejects unknown gameId", () => {
  assert.strictEqual(isValidScore("not-a-real-game", 5), false)
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/gameScoring.test.ts`

Expected: FAIL — `Cannot find module './gameScoring'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/gameScoring.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/gameScoring.test.ts`

Expected: `PASS:` for all 6 tests, then `All tests passed`, exit code 0

- [ ] **Step 5: Wire it into the server action**

Open `src/actions/games.ts`. Replace lines 15-19 (the inline `VALID_GAME_IDS` set and score-range check):

```typescript
  const VALID_GAME_IDS = new Set(["savings-race"])
  if (!VALID_GAME_IDS.has(gameId)) throw new Error("Invalid gameId")
  if (!Number.isInteger(score) || score < -50000 || score > 20000) throw new Error("Invalid score")
```

with:

```typescript
  if (!isValidScore(gameId, score)) throw new Error("Invalid gameId or score")
```

And add the import at the top of the file (alongside the existing `import { prisma } from "@/lib/prisma"` line):

```typescript
import { isValidScore } from "@/lib/gameScoring"
```

The full `saveGameScore` function should now read:

```typescript
export async function saveGameScore(gameId: string, score: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  if (!isValidScore(gameId, score)) throw new Error("Invalid gameId or score")

  await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      gameId,
      score,
    },
  })
}
```

- [ ] **Step 6: Type-check the modified file**

Run: `npx tsc --noEmit`

Expected: no errors (existing `savings-race` behavior is unchanged — same ranges, just routed through `isValidScore`)

- [ ] **Step 7: Commit**

```bash
git add src/lib/gameScoring.ts src/lib/gameScoring.test.ts src/actions/games.ts
git commit -m "feat: extract game-aware score validation, add coin-counter range"
```

---

### Task 3: Page shell + game client component

**Files:**
- Create: `src/app/(protected)/games/coin-counter/page.tsx`
- Create: `src/app/(protected)/games/coin-counter/CoinCounterClient.tsx`

**Interfaces:**
- Consumes:
  - `getLeaderboard(gameId: string, limit?: number): Promise<{ topScores: LeaderboardEntry[]; personalBest: number | null }>` from `@/actions/games` (already exists, unchanged)
  - `generateRound(round: number): GeneratedRound` and `type CoinDenomination`, `type CoinPile` from `@/content/games/coin-counter` (Task 1)
  - `saveGameScore(gameId: string, score: number): Promise<void>` and `type LeaderboardEntry` from `@/actions/games` (Task 2)
  - `Header` from `@/components/layout/Header`, `Button`/`Card`/`CardContent`/`CardHeader`/`CardTitle` from `@/components/ui/*` (existing)
- Produces: nothing consumed by later tasks — this is the last file pair before wiring up the index page in Task 4

These two files are one task because neither type-checks in isolation: the page shell imports `CoinCounterClient`, so they must land together. No automated tests for the client component (it's stateful UI; this repo has no component-testing framework, matching the precedent set by `SavingsRaceClient.tsx`, which also has none). Verification is a type-check here, plus the manual end-to-end browser check in Task 4.

- [ ] **Step 1: Write the page shell**

Create `src/app/(protected)/games/coin-counter/page.tsx`:

```typescript
import { getLeaderboard } from "@/actions/games"
import { CoinCounterClient } from "./CoinCounterClient"

export default async function CoinCounterPage() {
  const { topScores, personalBest } = await getLeaderboard("coin-counter")

  return <CoinCounterClient leaderboard={topScores} personalBest={personalBest} />
}
```

- [ ] **Step 2: Write the client component**

Create `src/app/(protected)/games/coin-counter/CoinCounterClient.tsx`:

```typescript
// src/app/(protected)/games/coin-counter/CoinCounterClient.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { saveGameScore } from "@/actions/games"
import type { LeaderboardEntry } from "@/actions/games"
import {
  generateRound,
  type CoinDenomination,
  type CoinPile,
} from "@/content/games/coin-counter"
import { Trophy } from "lucide-react"

type GamePhase = "intro" | "playing" | "result"
type RoundPhase = "deciding" | "resolved"

interface RoundRecord {
  pile: CoinPile
  choices: number[]
  selectedCents: number | null
  correct: boolean
}

interface GameState {
  phase: GamePhase
  round: number // 1-10
  score: number // correct count so far
  rounds: RoundRecord[]
  roundPhase: RoundPhase
  currentPile: CoinPile | null
  currentChoices: number[]
  lastSelection: number | null
  lastCorrect: boolean | null
}

const INITIAL_STATE: GameState = {
  phase: "intro",
  round: 1,
  score: 0,
  rounds: [],
  roundPhase: "deciding",
  currentPile: null,
  currentChoices: [],
  lastSelection: null,
  lastCorrect: null,
}

const ROUND_DURATION_MS = 10000
const RESULT_FLASH_MS = 1500
const URGENT_THRESHOLD_MS = 3000

function formatCents(cents: number): string {
  if (cents >= 100) return `$${(cents / 100).toFixed(2)}`
  return `${cents}¢`
}

const DENOMINATION_STYLES: Record<
  CoinDenomination,
  { size: string; bg: string; label: string }
> = {
  1: { size: "w-10 h-10", bg: "bg-orange-300 border-orange-400", label: "1¢" },
  5: { size: "w-12 h-12", bg: "bg-slate-300 border-slate-400", label: "5¢" },
  10: { size: "w-11 h-11", bg: "bg-slate-200 border-slate-400", label: "10¢" },
  25: { size: "w-14 h-14", bg: "bg-slate-100 border-slate-500", label: "25¢" },
}

function CoinPileDisplay({ coins }: { coins: CoinDenomination[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-6">
      {coins.map((coin, i) => {
        const style = DENOMINATION_STYLES[coin]
        const rotation = ((i * 37) % 21) - 10 // deterministic -10..10deg per index
        return (
          <div
            key={i}
            className={`${style.size} ${style.bg} rounded-full border-2 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {style.label}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  leaderboard: LeaderboardEntry[]
  personalBest: number | null
}

export function CoinCounterClient({ leaderboard, personalBest }: Props) {
  const router = useRouter()
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION_MS)
  const hasAnsweredRef = useRef(false)

  // --- Answer handler (useRef lock prevents double-firing) ---
  const handleAnswer = useCallback((selected: number | null) => {
    if (hasAnsweredRef.current) return
    hasAnsweredRef.current = true

    setState((prev) => {
      if (!prev.currentPile) return prev
      const correct = selected === prev.currentPile.totalCents
      const record: RoundRecord = {
        pile: prev.currentPile,
        choices: prev.currentChoices,
        selectedCents: selected,
        correct,
      }
      return {
        ...prev,
        score: prev.score + (correct ? 1 : 0),
        rounds: [...prev.rounds, record],
        roundPhase: "resolved",
        lastSelection: selected,
        lastCorrect: correct,
      }
    })
  }, [])

  // --- Advance to next round ---
  const nextRound = useCallback(() => {
    hasAnsweredRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    setState((prev) => {
      const round = prev.round + 1
      const { pile, choices } = generateRound(round)
      return {
        ...prev,
        round,
        roundPhase: "deciding",
        currentPile: pile,
        currentChoices: choices,
        lastSelection: null,
        lastCorrect: null,
      }
    })
  }, [])

  // --- Finish game — save score, refresh leaderboard, show result ---
  const finishGame = useCallback(
    (finalScore: number) => {
      setState((prev) => ({ ...prev, phase: "result" }))
      saveGameScore("coin-counter", finalScore)
        .then(() => router.refresh())
        .catch(console.error)
    },
    [router]
  )

  // --- Reset to intro screen ---
  const resetToIntro = useCallback(() => {
    hasAnsweredRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    setState(INITIAL_STATE)
  }, [])

  // --- Start / restart game ---
  const startGame = useCallback(() => {
    hasAnsweredRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    const { pile, choices } = generateRound(1)
    setState({
      phase: "playing",
      round: 1,
      score: 0,
      rounds: [],
      roundPhase: "deciding",
      currentPile: pile,
      currentChoices: choices,
      lastSelection: null,
      lastCorrect: null,
    })
  }, [])

  // Effect 1: per-round countdown tick (100ms intervals)
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "deciding") return
    if (roundTimeLeft <= 0) return
    const id = setTimeout(() => setRoundTimeLeft((t) => t - 100), 100)
    return () => clearTimeout(id)
  }, [state.phase, state.roundPhase, roundTimeLeft])

  // Effect 2: auto-resolve as incorrect when the round timer expires
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "deciding") return
    if (roundTimeLeft > 0) return
    handleAnswer(null)
  }, [state.phase, state.roundPhase, roundTimeLeft, handleAnswer])

  // Effect 3: advance to next round or finish game after the result flash
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "resolved") return
    const scoreSnapshot = state.score
    const id = setTimeout(() => {
      if (state.round >= 10) {
        finishGame(scoreSnapshot)
      } else {
        nextRound()
      }
    }, RESULT_FLASH_MS)
    return () => clearTimeout(id)
  }, [state.phase, state.roundPhase, state.round, state.score, finishGame, nextRound])

  // ===== RENDER: INTRO =====

  if (state.phase === "intro") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🪙</div>
              <h1 className="text-3xl font-bold mb-2">Coin Counter</h1>
              <p className="text-muted-foreground">
                10 rounds. Add up the coin pile and pick the right total
                before time runs out!
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">How to play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>
                  🪙 <strong>Count the pile:</strong> Add up the
                  pennies, nickels, dimes, and quarters shown.
                </p>
                <p>
                  ✅ <strong>Pick the total:</strong> Choose the correct
                  amount from 3 choices.
                </p>
                <p>
                  ⏱️ <strong>You have 10 seconds</strong> per round.
                  Rounds get harder as you go!
                </p>
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Top Counters
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
                        <span>{entry.score}/10</span>
                      </div>
                    ))}
                  </div>
                  {personalBest !== null && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Your best: {personalBest}/10
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

  // ===== RENDER: PLAYING =====

  if (state.phase === "playing") {
    const pile = state.currentPile
    if (!pile) return null
    const timerPct = (roundTimeLeft / ROUND_DURATION_MS) * 100
    const isUrgent = roundTimeLeft <= URGENT_THRESHOLD_MS

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-4">
          <div className="container max-w-md">
            {/* Top bar: time, score, round */}
            <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-5 py-3 mb-4">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Time Left
                </div>
                <div
                  className={`text-2xl font-bold tabular-nums ${
                    isUrgent ? "text-red-600" : "text-foreground"
                  }`}
                >
                  {Math.ceil(roundTimeLeft / 1000)}s
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Score
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {state.score}/10
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Round
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {state.round}/10
                </div>
              </div>
            </div>

            {/* Coin pile */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <div className="text-center text-xs font-semibold uppercase tracking-wide text-amber-700 pt-3">
                How much is this pile worth?
              </div>
              <CoinPileDisplay coins={pile.coins} />
            </div>

            {/* Per-round countdown bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Decide in...</span>
                <span>{Math.ceil(roundTimeLeft / 1000)}s</span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isUrgent ? "bg-red-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>

            {/* Result flash */}
            {state.roundPhase === "resolved" && (
              <div className="text-center py-6">
                {state.lastCorrect ? (
                  <>
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-xl font-bold text-green-600">
                      Correct! It was {formatCents(pile.totalCents)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">🤔</div>
                    <div className="text-xl font-bold text-amber-600">
                      Not quite — it was {formatCents(pile.totalCents)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Answer choices */}
            {state.roundPhase === "deciding" && (
              <div className="grid grid-cols-1 gap-3">
                {state.currentChoices.map((choice) => (
                  <Button
                    key={choice}
                    size="lg"
                    variant="outline"
                    className="py-6 text-lg font-bold"
                    onClick={() => handleAnswer(choice)}
                  >
                    {formatCents(choice)}
                  </Button>
                ))}
              </div>
            )}
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
              {state.score >= 8 ? "🏆" : state.score >= 5 ? "🪙" : "💪"}
            </div>
            <h1 className="text-3xl font-bold mb-1">Game Over!</h1>
            <div className="text-5xl font-extrabold text-green-600 my-3">
              {state.score}/10
            </div>
            <p className="text-muted-foreground">
              You got {state.score} out of 10 piles right!
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {state.rounds.map((r, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  r.correct
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                }`}
                title={`Round ${i + 1}: ${formatCents(r.pile.totalCents)}`}
              >
                {i + 1}
              </div>
            ))}
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
                      <span>{entry.score}/10</span>
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
git add "src/app/(protected)/games/coin-counter/page.tsx" "src/app/(protected)/games/coin-counter/CoinCounterClient.tsx"
git commit -m "feat: add Coin Counter page and game client component"
```

---

### Task 4: Wire up the games index + end-to-end verification

**Files:**
- Modify: `src/app/(protected)/games/page.tsx:9-16` (the `coin-counter` entry's `route` field)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing consumed by later tasks (this is the last task)

- [ ] **Step 1: Update the route**

In `src/app/(protected)/games/page.tsx`, change:

```typescript
  {
    id: "coin-counter",
    title: "Coin Counter",
    description: "Practice counting coins and making change",
    icon: <Coins className="h-8 w-8 text-primary" />,
    difficulty: "Easy",
    route: null,
  },
```

to:

```typescript
  {
    id: "coin-counter",
    title: "Coin Counter",
    description: "Practice counting coins and making change",
    icon: <Coins className="h-8 w-8 text-primary" />,
    difficulty: "Easy",
    route: "/games/coin-counter",
  },
```

- [ ] **Step 2: Full build check**

Run: `npx tsc --noEmit && npx next lint`

Expected: no type errors, no new lint errors

- [ ] **Step 3: Manual end-to-end verification**

Start the dev server and confirm the full flow works for a logged-in user (same approach used earlier this session to verify Savings Race and auth):

```bash
npm run dev &> /tmp/coin-counter-dev.log &
for i in $(seq 1 30); do curl -sf http://localhost:3000 -o /dev/null && break; sleep 1; done
```

Then, as a logged-in test user:
1. Visit `/games` — confirm the Coin Counter card now shows a "Play" button (not "Coming Soon")
2. Click through to `/games/coin-counter` — confirm the intro screen renders with rules and a "Start Game" button
3. Click "Start Game" — confirm round 1 shows a small coin pile (2-3 coins) with 3 answer buttons and a 10s countdown
4. Answer a few rounds (both correct and incorrect taps) — confirm the flash message and score update correctly, and that later rounds (8-10) show larger, more varied piles
5. Let the game reach round 10 and finish — confirm the result screen shows `X/10`, the round-by-round correct/incorrect indicators, and the leaderboard
6. Check the browser console for errors — expect none

Stop the dev server afterward: `pkill -f "next dev"`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/games/page.tsx"
git commit -m "feat: wire up Coin Counter route on the games index"
```
