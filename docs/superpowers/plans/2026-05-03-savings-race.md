# Savings Race Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Savings Race game — a 10-round financial decision game where kids earn income and decide whether to save or spend, ending with a leaderboard.

**Architecture:** Static TypeScript content file holds all 68+ scenarios; server actions handle score persistence and leaderboard queries against the existing `GameScore` table; a server component shell pre-fetches the leaderboard; a client component owns all game state across three phases (intro → playing → result) using `useCallback`/`useRef` for the decision lock and `useEffect` for countdown timers.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Prisma + Vercel Postgres, Auth.js v5, Tailwind CSS, shadcn/ui

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/content/games/savings-race.ts` | Create | Types, 68 scenarios, `isIncomeRound`, `sampleScenarios` |
| `src/actions/games.ts` | Create | `saveGameScore`, `getLeaderboard`, `LeaderboardEntry` |
| `src/app/(protected)/games/savings-race/page.tsx` | Create | Server shell — pre-fetches leaderboard, renders client |
| `src/app/(protected)/games/savings-race/SavingsRaceClient.tsx` | Create | All game state, timer logic, three-phase UI |
| `src/app/(protected)/games/page.tsx` | Modify | Wire Savings Race "Play" button to `/games/savings-race` |

---

## Task 1: Game Content

**Files:**
- Create: `src/content/games/savings-race.ts`

- [ ] **Step 1: Create the content file with types, helper, and all scenarios**

```typescript
// src/content/games/savings-race.ts

export interface GameScenario {
  id: string
  incomeSource: string | null   // null = no-income round
  incomeAmount: number | null   // dollars, null for no-income rounds
  incomeEmoji: string | null
  eventDescription: string
  eventCost: number             // dollars
  eventEmoji: string
}

export interface RoundOutcome {
  scenarioId: string
  isIncomeRound: boolean
  protected: boolean      // true = chose Save it / Skip it
  amountSaved: number     // cents; negative if dipped into savings
  amountSpent: number     // cents
}

export function isIncomeRound(scenario: GameScenario): boolean {
  return scenario.incomeAmount !== null
}

// 52 income scenarios — income $5–$25, event cost always less than income
const INCOME_SCENARIOS: GameScenario[] = [
  { id: "i01", incomeSource: "walked the neighbor's dog", incomeAmount: 15, incomeEmoji: "🐕", eventDescription: "Your friends are going to the movies!", eventCost: 10, eventEmoji: "🎬" },
  { id: "i02", incomeSource: "mowed the lawn", incomeAmount: 20, incomeEmoji: "🌿", eventDescription: "There's a new video game you've been wanting.", eventCost: 15, eventEmoji: "🎮" },
  { id: "i03", incomeSource: "birthday money from grandma", incomeAmount: 25, incomeEmoji: "🎂", eventDescription: "You found the perfect pair of sneakers.", eventCost: 18, eventEmoji: "👟" },
  { id: "i04", incomeSource: "running a lemonade stand", incomeAmount: 12, incomeEmoji: "🍋", eventDescription: "Your school is having a bake sale!", eventCost: 5, eventEmoji: "🧁" },
  { id: "i05", incomeSource: "babysitting the kids next door", incomeAmount: 15, incomeEmoji: "👶", eventDescription: "The carnival is in town! Ride tickets cost $8.", eventCost: 8, eventEmoji: "🎡" },
  { id: "i06", incomeSource: "selling craft bracelets", incomeAmount: 10, incomeEmoji: "📿", eventDescription: "Your friends want to grab pizza after school.", eventCost: 7, eventEmoji: "🍕" },
  { id: "i07", incomeSource: "collecting and recycling cans", incomeAmount: 8, incomeEmoji: "♻️", eventDescription: "A shiny pack of trading cards caught your eye.", eventCost: 5, eventEmoji: "🃏" },
  { id: "i08", incomeSource: "raking leaves for a neighbor", incomeAmount: 15, incomeEmoji: "🍂", eventDescription: "There's a cool new book in the school store.", eventCost: 6, eventEmoji: "📚" },
  { id: "i09", incomeSource: "helping a neighbor move boxes", incomeAmount: 20, incomeEmoji: "📦", eventDescription: "Movie night calls for snacks from the corner store!", eventCost: 8, eventEmoji: "🍿" },
  { id: "i10", incomeSource: "watering plants for a vacationing neighbor", incomeAmount: 10, incomeEmoji: "🌱", eventDescription: "The ice cream shop just opened a new flavor!", eventCost: 4, eventEmoji: "🍦" },
  { id: "i11", incomeSource: "washing three cars on the street", incomeAmount: 25, incomeEmoji: "🚗", eventDescription: "A new game add-on just dropped.", eventCost: 18, eventEmoji: "🕹️" },
  { id: "i12", incomeSource: "shoveling snow from the driveway", incomeAmount: 20, incomeEmoji: "🌨️", eventDescription: "The cozy hot chocolate kit at the store looks perfect.", eventCost: 7, eventEmoji: "☕" },
  { id: "i13", incomeSource: "selling lemonade at the park", incomeAmount: 10, incomeEmoji: "🍋", eventDescription: "You spotted an epic sticker pack at the bookstore.", eventCost: 3, eventEmoji: "✨" },
  { id: "i14", incomeSource: "pet-sitting a cat for the weekend", incomeAmount: 15, incomeEmoji: "🐱", eventDescription: "The craft supply store has exactly what you need.", eventCost: 9, eventEmoji: "🎨" },
  { id: "i15", incomeSource: "doing extra chores around the house", incomeAmount: 12, incomeEmoji: "🧹", eventDescription: "You need some school supplies for a project.", eventCost: 6, eventEmoji: "📐" },
  { id: "i16", incomeSource: "delivering newspapers on the block", incomeAmount: 20, incomeEmoji: "📰", eventDescription: "Your old soccer ball has a slow leak — new one time!", eventCost: 14, eventEmoji: "⚽" },
  { id: "i17", incomeSource: "helping organize the garage", incomeAmount: 15, incomeEmoji: "🔧", eventDescription: "There's a beautiful art set on sale at the store.", eventCost: 10, eventEmoji: "🖌️" },
  { id: "i18", incomeSource: "selling handmade bookmarks at school", incomeAmount: 8, incomeEmoji: "🔖", eventDescription: "A smoothie shop opened near school — your favorite!", eventCost: 4, eventEmoji: "🥤" },
  { id: "i19", incomeSource: "tutoring the neighbor's kid in math", incomeAmount: 25, incomeEmoji: "📐", eventDescription: "A science experiment kit you've been eyeing is in stock.", eventCost: 15, eventEmoji: "🔬" },
  { id: "i20", incomeSource: "walking three dogs every morning", incomeAmount: 18, incomeEmoji: "🐾", eventDescription: "Your favorite store has sneakers on sale this weekend.", eventCost: 12, eventEmoji: "👟" },
  { id: "i21", incomeSource: "babysitting your siblings for an afternoon", incomeAmount: 15, incomeEmoji: "👧", eventDescription: "Friends are heading to mini golf — want to join?", eventCost: 8, eventEmoji: "⛳" },
  { id: "i22", incomeSource: "baking and selling cookies at school", incomeAmount: 12, incomeEmoji: "🍪", eventDescription: "The arcade by school has new games — tokens cost $7.", eventCost: 7, eventEmoji: "🕹️" },
  { id: "i23", incomeSource: "helping grandma with her garden", incomeAmount: 10, incomeEmoji: "🌻", eventDescription: "The school book fair has a book you really want.", eventCost: 5, eventEmoji: "📗" },
  { id: "i24", incomeSource: "cleaning the gutters for a neighbor", incomeAmount: 20, incomeEmoji: "🏠", eventDescription: "Your earbuds just broke and you found a good deal.", eventCost: 16, eventEmoji: "🎧" },
  { id: "i25", incomeSource: "selling old toys at a garage sale", incomeAmount: 15, incomeEmoji: "🪀", eventDescription: "An escape room is doing a group discount this weekend!", eventCost: 10, eventEmoji: "🔐" },
  { id: "i26", incomeSource: "washing windows around the house", incomeAmount: 12, incomeEmoji: "🪟", eventDescription: "There's a movie rental you've been waiting to see.", eventCost: 6, eventEmoji: "🎥" },
  { id: "i27", incomeSource: "helping set up decorations for a party", incomeAmount: 15, incomeEmoji: "🎉", eventDescription: "Your friend's birthday is coming — you need a gift!", eventCost: 10, eventEmoji: "🎁" },
  { id: "i28", incomeSource: "doing yardwork for the family down the street", incomeAmount: 20, incomeEmoji: "🌳", eventDescription: "Game night calls for a brand new board game!", eventCost: 14, eventEmoji: "🎲" },
  { id: "i29", incomeSource: "organizing the classroom supply closet", incomeAmount: 10, incomeEmoji: "📦", eventDescription: "You ran out of paint for your art project.", eventCost: 6, eventEmoji: "🖌️" },
  { id: "i30", incomeSource: "walking the neighbor's dog every day this week", incomeAmount: 25, incomeEmoji: "🐕", eventDescription: "Your backpack zipper broke — new backpack needed.", eventCost: 18, eventEmoji: "🎒" },
  { id: "i31", incomeSource: "helping run a school bake sale", incomeAmount: 12, incomeEmoji: "🧁", eventDescription: "The bake sale has some leftover cupcakes for sale!", eventCost: 4, eventEmoji: "🍰" },
  { id: "i32", incomeSource: "carrying groceries for an elderly neighbor", incomeAmount: 8, incomeEmoji: "🛍️", eventDescription: "The checkout lane has your favorite candy bars.", eventCost: 3, eventEmoji: "🍫" },
  { id: "i33", incomeSource: "selling painted rocks at the farmer's market", incomeAmount: 10, incomeEmoji: "🪨", eventDescription: "You found the perfect poster to put up in your room.", eventCost: 5, eventEmoji: "🖼️" },
  { id: "i34", incomeSource: "making and selling slime kits", incomeAmount: 15, incomeEmoji: "🟢", eventDescription: "You need more supplies for your slime business!", eventCost: 9, eventEmoji: "🧪" },
  { id: "i35", incomeSource: "helping coach the little league team", incomeAmount: 20, incomeEmoji: "⚾", eventDescription: "The sporting goods store has new batting gloves.", eventCost: 12, eventEmoji: "🧤" },
  { id: "i36", incomeSource: "cleaning and polishing bikes for neighbors", incomeAmount: 12, incomeEmoji: "🚲", eventDescription: "There's a cool set of reflective stickers for your bike.", eventCost: 5, eventEmoji: "⭐" },
  { id: "i37", incomeSource: "setting up a neighborhood pet-sitting service", incomeAmount: 25, incomeEmoji: "🐾", eventDescription: "The pet store has a toy your dog would absolutely love.", eventCost: 8, eventEmoji: "🦴" },
  { id: "i38", incomeSource: "helping with fall yard cleanup", incomeAmount: 18, incomeEmoji: "🍁", eventDescription: "You've been wanting a new sports headband.", eventCost: 6, eventEmoji: "🏃" },
  { id: "i39", incomeSource: "selling homemade jam at the farmer's market", incomeAmount: 15, incomeEmoji: "🍓", eventDescription: "You need cooking supplies to make your next batch.", eventCost: 10, eventEmoji: "🫙" },
  { id: "i40", incomeSource: "helping a family pack boxes for a move", incomeAmount: 20, incomeEmoji: "📦", eventDescription: "Lunch at the food court sounds really good right now.", eventCost: 8, eventEmoji: "🍔" },
  { id: "i41", incomeSource: "planting a neighbor's spring garden", incomeAmount: 15, incomeEmoji: "🌷", eventDescription: "You want to grow your own flowers — seeds are $5.", eventCost: 5, eventEmoji: "🌱" },
  { id: "i42", incomeSource: "organizing bookshelves at the local library", incomeAmount: 10, incomeEmoji: "📚", eventDescription: "The library gift shop has a beautiful leather bookmark.", eventCost: 3, eventEmoji: "🔖" },
  { id: "i43", incomeSource: "fixing bikes for kids on your street", incomeAmount: 18, incomeEmoji: "🔩", eventDescription: "You need fresh chain oil and a repair kit.", eventCost: 7, eventEmoji: "🛠️" },
  { id: "i44", incomeSource: "looking after the neighbor's rabbit", incomeAmount: 15, incomeEmoji: "🐰", eventDescription: "The craft store has a beading kit on clearance!", eventCost: 9, eventEmoji: "📿" },
  { id: "i45", incomeSource: "reading to younger kids at the library", incomeAmount: 10, incomeEmoji: "📖", eventDescription: "You spotted an amazing set of colored pens.", eventCost: 4, eventEmoji: "🖊️" },
  { id: "i46", incomeSource: "helping at a family friend's restaurant", incomeAmount: 25, incomeEmoji: "🍽️", eventDescription: "There's a beginner's cookbook you've been eyeing.", eventCost: 12, eventEmoji: "👨‍🍳" },
  { id: "i47", incomeSource: "selling your drawings online", incomeAmount: 12, incomeEmoji: "🎨", eventDescription: "You need higher-quality drawing pencils for your next work.", eventCost: 8, eventEmoji: "✏️" },
  { id: "i48", incomeSource: "collecting bottles and cans from the block", incomeAmount: 8, incomeEmoji: "🧴", eventDescription: "The corner store has gummy bears in bulk — just $3.", eventCost: 3, eventEmoji: "🐻" },
  { id: "i49", incomeSource: "helping decorate for a holiday party", incomeAmount: 15, incomeEmoji: "🎄", eventDescription: "There's a gorgeous ornament you want to keep for yourself.", eventCost: 6, eventEmoji: "🌟" },
  { id: "i50", incomeSource: "assisting a photographer at an event", incomeAmount: 20, incomeEmoji: "📸", eventDescription: "You want a nice frame for your favorite photo.", eventCost: 10, eventEmoji: "🖼️" },
  { id: "i51", incomeSource: "helping out at grandpa's farm for the weekend", incomeAmount: 25, incomeEmoji: "🚜", eventDescription: "The farm stand has incredible homemade jam — just $8.", eventCost: 8, eventEmoji: "🍯" },
  { id: "i52", incomeSource: "sorting recycling bins for your whole street", incomeAmount: 10, incomeEmoji: "♻️", eventDescription: "You've been meaning to get a nice reusable water bottle.", eventCost: 7, eventEmoji: "💧" },
]

// 16 no-income scenarios — event cost $3–$15
const NO_INCOME_SCENARIOS: GameScenario[] = [
  { id: "n01", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your friends want to go to the movies tonight!", eventCost: 10, eventEmoji: "🎬" },
  { id: "n02", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The school book fair is open — you found a great book!", eventCost: 6, eventEmoji: "📗" },
  { id: "n03", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The carnival is in town! Ride tickets are just $8.", eventCost: 8, eventEmoji: "🎡" },
  { id: "n04", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The ice cream truck is outside — your favorite flavor!", eventCost: 4, eventEmoji: "🍦" },
  { id: "n05", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "There's a new app game everyone is playing — it costs $5.", eventCost: 5, eventEmoji: "📱" },
  { id: "n06", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "A limited edition trading card pack just arrived at the store!", eventCost: 7, eventEmoji: "🃏" },
  { id: "n07", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your class is putting together a pizza party fund.", eventCost: 6, eventEmoji: "🍕" },
  { id: "n08", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The pet store has an adorable toy your pet would love.", eventCost: 8, eventEmoji: "🐾" },
  { id: "n09", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The school bake sale has fresh brownies today!", eventCost: 4, eventEmoji: "🍫" },
  { id: "n10", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Friends are going to the amusement park this weekend!", eventCost: 15, eventEmoji: "🎢" },
  { id: "n11", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your favorite artist just dropped a new album — $9 to download.", eventCost: 9, eventEmoji: "🎵" },
  { id: "n12", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "An escape room is doing a group deal this weekend!", eventCost: 12, eventEmoji: "🔐" },
  { id: "n13", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "There's a movie everyone's talking about — $5 to rent online.", eventCost: 5, eventEmoji: "🎥" },
  { id: "n14", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Art supplies are on sale — the set you've wanted is $11.", eventCost: 11, eventEmoji: "🎨" },
  { id: "n15", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "A food truck with your absolute favorite meal just parked outside!", eventCost: 8, eventEmoji: "🚚" },
  { id: "n16", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The stationary store has an epic holographic sticker pack!", eventCost: 5, eventEmoji: "✨" },
]

export const SCENARIOS: GameScenario[] = [...INCOME_SCENARIOS, ...NO_INCOME_SCENARIOS]

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// Returns 10 scenarios: 7 income + 3 no-income, in randomized order
export function sampleScenarios(): GameScenario[] {
  const income = shuffleAndTake(INCOME_SCENARIOS, 7)
  const noIncome = shuffleAndTake(NO_INCOME_SCENARIOS, 3)
  return shuffleAndTake([...income, ...noIncome], 10)
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `src/content/games/savings-race.ts`

- [ ] **Step 3: Commit**

```bash
git add src/content/games/savings-race.ts
git commit -m "feat: add savings race game scenarios and types"
```

---

## Task 2: Server Actions

**Files:**
- Create: `src/actions/games.ts`

- [ ] **Step 1: Create server actions file**

```typescript
// src/actions/games.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  score: number        // in cents
  isCurrentUser: boolean
}

export async function saveGameScore(gameId: string, score: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      gameId,
      score,
    },
  })
}

export async function getLeaderboard(
  gameId: string,
  limit = 10
): Promise<{ topScores: LeaderboardEntry[]; personalBest: number | null }> {
  const session = await auth()

  // Fetch all scores ordered by score desc, then earliest createdAt for ties
  const allScores = await prisma.gameScore.findMany({
    where: { gameId },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  // Deduplicate: first occurrence of each userId = their personal best
  const seen = new Set<string>()
  const personalBests: typeof allScores = []
  for (const row of allScores) {
    if (!seen.has(row.userId)) {
      seen.add(row.userId)
      personalBests.push(row)
    }
  }

  const topScores: LeaderboardEntry[] = personalBests
    .slice(0, limit)
    .map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      displayName: row.user.name ?? row.user.email ?? "Anonymous",
      score: row.score,
      isCurrentUser: row.userId === session?.user?.id,
    }))

  const userRecord = session?.user?.id
    ? personalBests.find((r) => r.userId === session.user!.id)
    : undefined
  const personalBest = userRecord?.score ?? null

  return { topScores, personalBest }
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from `src/actions/games.ts`

- [ ] **Step 3: Commit**

```bash
git add src/actions/games.ts
git commit -m "feat: add saveGameScore and getLeaderboard server actions"
```

---

## Task 3: Server Page Shell

**Files:**
- Create: `src/app/(protected)/games/savings-race/page.tsx`

- [ ] **Step 1: Create the server component page**

```typescript
// src/app/(protected)/games/savings-race/page.tsx
import { getLeaderboard } from "@/actions/games"
import { SavingsRaceClient } from "./SavingsRaceClient"

export default async function SavingsRacePage() {
  const { topScores, personalBest } = await getLeaderboard("savings-race")

  return <SavingsRaceClient leaderboard={topScores} personalBest={personalBest} />
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit 2>&1 | head -30
```

Expected: error about `SavingsRaceClient` not existing yet — that is expected and will be resolved in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/games/savings-race/page.tsx
git commit -m "feat: add savings race server page shell"
```

---

## Task 4: Client Component

**Files:**
- Create: `src/app/(protected)/games/savings-race/SavingsRaceClient.tsx`

This is the core of the game. It implements three phases: `intro`, `playing`, and `result`.

- [ ] **Step 1: Create the client component**

```typescript
// src/app/(protected)/games/savings-race/SavingsRaceClient.tsx
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { saveGameScore } from "@/actions/games"
import type { LeaderboardEntry } from "@/actions/games"
import {
  sampleScenarios,
  isIncomeRound,
  type GameScenario,
  type RoundOutcome,
} from "@/content/games/savings-race"
import { Trophy, PiggyBank, Zap, Shield } from "lucide-react"

type GamePhase = "intro" | "playing" | "result"

interface GameState {
  phase: GamePhase
  round: number
  savings: number            // cents
  scenarios: GameScenario[]
  roundOutcomes: RoundOutcome[]
  roundPhase: "deciding" | "resolved"
  lastOutcome: RoundOutcome | null
}

const INITIAL_STATE: GameState = {
  phase: "intro",
  round: 1,
  savings: 0,
  scenarios: [],
  roundOutcomes: [],
  roundPhase: "deciding",
  lastOutcome: null,
}

const ROUND_DURATION_MS = 6000
const RESULT_FLASH_MS = 1500

function formatDollars(cents: number): string {
  const abs = Math.abs(cents)
  const dollars = (abs / 100).toFixed(0)
  return cents < 0 ? `-$${dollars}` : `$${dollars}`
}

function formatTime(ms: number): string {
  const totalSecs = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface Props {
  leaderboard: LeaderboardEntry[]
  personalBest: number | null
}

export function SavingsRaceClient({ leaderboard, personalBest }: Props) {
  const router = useRouter()
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_DURATION_MS)
  const hasDecidedRef = useRef(false)

  // Compute total time left for display
  const totalTimeLeftMs =
    (10 - state.round) * ROUND_DURATION_MS + roundTimeLeft

  // Compute maximum possible score for result screen
  const maxPossibleCents = state.scenarios
    .filter(isIncomeRound)
    .reduce((sum, s) => sum + (s.incomeAmount ?? 0) * 100, 0)

  // --- Decision handler ---
  const handleDecision = useCallback(
    (choice: "save" | "spend") => {
      if (hasDecidedRef.current) return
      hasDecidedRef.current = true

      const scenario = state.scenarios[state.round - 1]
      if (!scenario) return
      const isIncome = isIncomeRound(scenario)

      let amountSaved: number
      let amountSpent: number
      let isProtected: boolean

      if (isIncome) {
        const income = (scenario.incomeAmount ?? 0) * 100
        const cost = scenario.eventCost * 100
        if (choice === "save") {
          amountSaved = income
          amountSpent = 0
          isProtected = true
        } else {
          amountSaved = income - cost
          amountSpent = cost
          isProtected = false
        }
      } else {
        const cost = scenario.eventCost * 100
        if (choice === "save") {
          amountSaved = 0
          amountSpent = 0
          isProtected = true
        } else {
          amountSaved = -cost
          amountSpent = cost
          isProtected = false
        }
      }

      const outcome: RoundOutcome = {
        scenarioId: scenario.id,
        isIncomeRound: isIncome,
        protected: isProtected,
        amountSaved,
        amountSpent,
      }

      setState((prev) => ({
        ...prev,
        savings: prev.savings + amountSaved,
        roundOutcomes: [...prev.roundOutcomes, outcome],
        roundPhase: "resolved",
        lastOutcome: outcome,
      }))
    },
    [state.scenarios, state.round]
  )

  // --- Advance to next round ---
  const nextRound = useCallback(() => {
    hasDecidedRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    setState((prev) => ({
      ...prev,
      round: prev.round + 1,
      roundPhase: "deciding",
      lastOutcome: null,
    }))
  }, [])

  // --- Finish game ---
  const finishGame = useCallback(
    (finalSavings: number) => {
      setState((prev) => ({ ...prev, phase: "result" }))
      saveGameScore("savings-race", finalSavings).then(() => {
        router.refresh()
      })
    },
    [router]
  )

  // --- Start / restart game ---
  const startGame = useCallback(() => {
    hasDecidedRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    setState({
      phase: "playing",
      round: 1,
      savings: 0,
      scenarios: sampleScenarios(),
      roundOutcomes: [],
      roundPhase: "deciding",
      lastOutcome: null,
    })
  }, [])

  // Effect 1: Per-round countdown tick
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "deciding") return
    if (roundTimeLeft <= 0) return
    const id = setTimeout(() => {
      setRoundTimeLeft((t) => t - 100)
    }, 100)
    return () => clearTimeout(id)
  }, [state.phase, state.roundPhase, roundTimeLeft])

  // Effect 2: Auto-spend when round timer expires
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "deciding") return
    if (roundTimeLeft > 0) return
    handleDecision("spend")
  }, [state.phase, state.roundPhase, roundTimeLeft, handleDecision])

  // Effect 3: Advance to next round or finish game after result flash
  useEffect(() => {
    if (state.phase !== "playing" || state.roundPhase !== "resolved") return
    const savingsSnapshot = state.savings
    const id = setTimeout(() => {
      if (state.round >= 10) {
        finishGame(savingsSnapshot)
      } else {
        nextRound()
      }
    }, RESULT_FLASH_MS)
    return () => clearTimeout(id)
  }, [state.phase, state.roundPhase, state.round, state.savings, finishGame, nextRound])

  // ===== RENDER =====

  if (state.phase === "intro") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-2xl">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🐷</div>
              <h1 className="text-3xl font-bold mb-2">Savings Race</h1>
              <p className="text-muted-foreground">
                10 rounds. Each round you may earn income and face a spending
                temptation. Save as much as you can!
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">How to play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-muted-foreground">
                <p>💰 <strong>Income rounds:</strong> You earned money. Decide to save it all or spend some on an event.</p>
                <p>🛡️ <strong>No-income rounds:</strong> No earnings today. Decide to protect your savings or spend from them.</p>
                <p>⏱️ <strong>You have 6 seconds</strong> to decide each round. Run out of time → auto-spend!</p>
              </CardContent>
            </Card>

            {leaderboard.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Top Savers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between text-sm ${entry.isCurrentUser ? "font-semibold text-primary" : ""}`}
                      >
                        <span>#{entry.rank} {entry.displayName}{entry.isCurrentUser ? " (you)" : ""}</span>
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

  if (state.phase === "playing") {
    const scenario = state.scenarios[state.round - 1]
    if (!scenario) return null
    const isIncome = isIncomeRound(scenario)
    const timerPct = (roundTimeLeft / ROUND_DURATION_MS) * 100
    const isUrgent = roundTimeLeft <= 2000

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-4">
          <div className="container max-w-md">

            {/* Top bar */}
            <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-5 py-3 mb-4">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Time Left</div>
                <div className={`text-2xl font-bold tabular-nums ${totalTimeLeftMs < 15000 ? "text-red-600" : "text-foreground"}`}>
                  {formatTime(totalTimeLeftMs)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Savings</div>
                <div className="text-2xl font-bold text-green-600">{formatDollars(state.savings)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Round</div>
                <div className="text-2xl font-bold text-blue-600">{state.round}/10</div>
              </div>
            </div>

            {/* Income announcement */}
            {isIncome && (
              <div className="text-center border-b pb-4 mb-4">
                <div className="text-xs text-muted-foreground mb-1">This round you earned</div>
                <div className="text-4xl font-extrabold text-green-600">
                  +${scenario.incomeAmount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  from {scenario.incomeSource} {scenario.incomeEmoji}
                </div>
              </div>
            )}

            {/* Spending event */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
                {isIncome ? "Spending Event" : "Savings Challenge"}
              </div>
              <div className="font-semibold text-foreground mb-1">
                {scenario.eventDescription} {scenario.eventEmoji}
              </div>
              <div className="text-sm text-muted-foreground">
                Costs ${scenario.eventCost}.{" "}
                {isIncome
                  ? `Save all $${scenario.incomeAmount} or spend $${scenario.eventCost}?`
                  : "Protect your savings or spend from them?"}
              </div>
            </div>

            {/* Round countdown bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Decide in...</span>
                <span>{Math.ceil(roundTimeLeft / 1000)}s</span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isUrgent ? "bg-red-500" : "bg-amber-400"}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>

            {/* Result flash overlay */}
            {state.roundPhase === "resolved" && state.lastOutcome && (
              <div className="text-center py-6 animate-in fade-in-0">
                {state.lastOutcome.protected ? (
                  <>
                    <div className="text-4xl mb-2">💪</div>
                    <div className="text-xl font-bold text-green-600">
                      {isIncome
                        ? `You saved $${(state.lastOutcome.amountSaved / 100).toFixed(0)}!`
                        : "You protected your savings!"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">{scenario.eventEmoji}</div>
                    <div className="text-xl font-bold text-amber-600">
                      {isIncome
                        ? `Spent $${(state.lastOutcome.amountSpent / 100).toFixed(0)}, saved $${(state.lastOutcome.amountSaved / 100).toFixed(0)}`
                        : `Spent $${(state.lastOutcome.amountSpent / 100).toFixed(0)} from savings`}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Decision buttons */}
            {state.roundPhase === "deciding" && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white py-8 flex flex-col h-auto"
                  onClick={() => handleDecision("save")}
                >
                  <span className="text-xl mb-1">{isIncome ? "💰" : "🛡️"}</span>
                  <span className="font-bold">{isIncome ? "Save it" : "Skip it"}</span>
                  <span className="text-xs font-normal opacity-90">
                    {isIncome
                      ? `Keep $${scenario.incomeAmount}`
                      : "Protect savings"}
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-400 text-amber-700 hover:bg-amber-50 py-8 flex flex-col h-auto"
                  onClick={() => handleDecision("spend")}
                >
                  <span className="text-xl mb-1">{scenario.eventEmoji}</span>
                  <span className="font-bold">Spend it</span>
                  <span className="text-xs font-normal opacity-90">
                    {isIncome
                      ? `Save $${scenario.incomeAmount - scenario.eventCost}`
                      : `Spend $${scenario.eventCost}`}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  // phase === "result"
  const savedRounds = state.roundOutcomes.filter((o) => o.protected).length
  const spentRounds = state.roundOutcomes.filter((o) => !o.protected).length
  const currentUserRank = leaderboard.find((e) => e.isCurrentUser)?.rank

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              {state.savings >= maxPossibleCents * 0.8 ? "🏆" : state.savings >= maxPossibleCents * 0.5 ? "🐷" : "💸"}
            </div>
            <h1 className="text-3xl font-bold mb-1">Game Over!</h1>
            <div className="text-5xl font-extrabold text-green-600 my-3">
              {formatDollars(state.savings)}
            </div>
            <p className="text-muted-foreground">
              You saved {formatDollars(state.savings)} out of a possible{" "}
              {formatDollars(maxPossibleCents)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 text-center">
                <Shield className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{savedRounds}</div>
                <div className="text-xs text-muted-foreground">rounds saved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Zap className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                <div className="text-2xl font-bold">{spentRounds}</div>
                <div className="text-xs text-muted-foreground">rounds spent</div>
              </CardContent>
            </Card>
          </div>

          {currentUserRank !== undefined && (
            <Card className="mb-6 border-primary">
              <CardContent className="pt-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-lg font-bold">You ranked #{currentUserRank} globally!</div>
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
                      className={`flex items-center justify-between text-sm ${entry.isCurrentUser ? "font-semibold text-primary" : ""}`}
                    >
                      <span>#{entry.rank} {entry.displayName}{entry.isCurrentUser ? " (you)" : ""}</span>
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
            <Button size="lg" variant="outline" className="w-full" onClick={() => setState(INITIAL_STATE)}>
              Back to Intro
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors. If there are errors, fix them before proceeding.

- [ ] **Step 3: Start dev server and test the golden path manually**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npm run dev
```

Navigate to `http://localhost:3000/games/savings-race`. Verify:
- Intro screen shows with "Start Game" button
- Game starts and shows round 1 with income announcement + spending event
- Countdown bar drains left to right over 6 seconds
- Clicking "Save it" / "Skip it" shows result flash then advances to next round
- Clicking "Spend it" shows result flash with correct amounts
- Round timer expiry auto-spends
- After round 10, result screen shows final savings, round breakdown
- "Play Again" restarts the game

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/games/savings-race/SavingsRaceClient.tsx
git commit -m "feat: add savings race client component with game loop and timer"
```

---

## Task 5: Wire Up Games Index Page

**Files:**
- Modify: `src/app/(protected)/games/page.tsx`

- [ ] **Step 1: Add Link to Savings Race "Play" button**

In `src/app/(protected)/games/page.tsx`, replace the static `Button` with a `Link`-wrapped button for the `savings-race` game only. Update the `games` array to include a route, and render a `Link` for games that have one:

```typescript
// src/app/(protected)/games/page.tsx
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Coins, ShoppingCart, PiggyBank } from "lucide-react"
import Link from "next/link"

const games = [
  {
    id: "coin-counter",
    title: "Coin Counter",
    description: "Practice counting coins and making change",
    icon: <Coins className="h-8 w-8 text-primary" />,
    difficulty: "Easy",
    route: null,
  },
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Manage a weekly budget and make smart choices",
    icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
    difficulty: "Medium",
    route: null,
  },
  {
    id: "savings-race",
    title: "Savings Race",
    description: "Race to reach your savings goal first",
    icon: <PiggyBank className="h-8 w-8 text-accent" />,
    difficulty: "Easy",
    route: "/games/savings-race",
  },
]

export default function GamesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-primary" />
              Games
            </h1>
            <p className="text-muted-foreground">
              Learn financial skills through fun interactive games
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card key={game.id} className={`transition-shadow ${game.route ? "hover:shadow-md" : "opacity-60"}`}>
                <CardHeader>
                  <div className="mb-2">{game.icon}</div>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {game.difficulty}
                    </span>
                    {game.route ? (
                      <Button size="sm" asChild>
                        <Link href={game.route}>Play</Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>Coming Soon</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/games`. Verify:
- Savings Race card has a "Play" button that links to `/games/savings-race`
- Coin Counter and Budget Challenge cards show "Coming Soon" (disabled)
- Clicking "Play" navigates to the game

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/games/page.tsx
git commit -m "feat: wire savings race play button to /games/savings-race"
```

---

## Final Verification

- [ ] **Run full type check**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Run full build**

```bash
cd /Users/jmann/Projects/Mine/CashCritters-V2 && npm run build
```

Expected: build succeeds with no errors.

- [ ] **End-to-end manual test**

1. Navigate to `/games` — see Play button on Savings Race
2. Click Play — see intro screen with rules
3. Click "Start Game" — see round 1 with income + spending event
4. Play through all 10 rounds, mixing save/spend decisions
5. Let one round expire (no action) — verify auto-spend fires
6. After round 10 — see result screen with final savings
7. Verify "Play Again" resets state and samples new scenarios
8. Play again — verify score saves and leaderboard updates (may need to reload `/games/savings-race` to see updated leaderboard)

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| 10 rounds, ~60 seconds total | Task 4 — timer state |
| Income + no-income rounds (~7+3) | Task 1 — `sampleScenarios` |
| 6-second per-round countdown | Task 4 — Effect 1 |
| Auto-spend on timer expiry | Task 4 — Effect 2 |
| Result flash between rounds | Task 4 — Effect 3 + `roundPhase` |
| Save it / Skip it / Spend it buttons | Task 4 — decision buttons |
| Score = savings balance in cents | Task 4 — `state.savings` |
| `saveGameScore` server action | Task 2 |
| Leaderboard (top 10 + personal best) | Task 2 — `getLeaderboard` |
| `getLeaderboard` tie-break: earliest `createdAt` | Task 2 — `orderBy: [score desc, createdAt asc]` |
| 50+ income scenarios | Task 1 — 52 scenarios |
| 15+ no-income scenarios | Task 1 — 16 scenarios |
| Income $5–$25, cost always < income | Task 1 — all scenarios |
| No-income event cost $3–$15 | Task 1 — all no-income scenarios |
| `/games/savings-race` server page | Task 3 |
| `SavingsRaceClient` — intro/playing/result phases | Task 4 |
| Pre-fetch leaderboard on page load | Task 3 |
| `router.refresh()` after score save | Task 4 — `finishGame` |
| "You saved $X out of possible $Y" on result | Task 4 — result screen |
| Wire "Play" button on games index | Task 5 |
