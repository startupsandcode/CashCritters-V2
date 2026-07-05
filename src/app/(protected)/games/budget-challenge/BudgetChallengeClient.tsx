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
                watch your week play out. You&apos;ll get one chance to
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
                  the week&apos;s gone, then days 4-7 play out the same way.
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
                Re-plan the rest of your week with what&apos;s left:{" "}
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
              That&apos;s your final savings for the week.
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
