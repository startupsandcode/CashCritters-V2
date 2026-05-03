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
import { Trophy, Shield, Zap } from "lucide-react"

type GamePhase = "intro" | "playing" | "result"

interface GameState {
  phase: GamePhase
  round: number               // 1–10
  savings: number             // cents accumulated so far
  scenarios: GameScenario[]   // 10 randomly sampled for this run
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
const URGENT_THRESHOLD_MS = 2000

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

  // Compute total time left for the top bar display
  const totalTimeLeftMs =
    (10 - state.round) * ROUND_DURATION_MS + roundTimeLeft

  // Maximum possible score = sum of income from all income-round scenarios
  const maxPossibleCents = state.scenarios
    .filter(isIncomeRound)
    .reduce((sum, s) => sum + (s.incomeAmount ?? 0) * 100, 0)

  // --- Decision handler (useRef lock prevents double-firing) ---
  const handleDecision = useCallback((choice: "save" | "spend") => {
    if (hasDecidedRef.current) return
    hasDecidedRef.current = true

    setState((prev) => {
      const scenario = prev.scenarios[prev.round - 1]
      if (!scenario) return prev
      const isIncome = isIncomeRound(scenario)

      let amountSavedCents: number
      let amountSpentCents: number
      let isProtected: boolean

      if (isIncome) {
        const income = (scenario.incomeAmount ?? 0) * 100
        const cost = scenario.eventCost * 100
        if (choice === "save") {
          amountSavedCents = income
          amountSpentCents = 0
          isProtected = true
        } else {
          amountSavedCents = income - cost
          amountSpentCents = cost
          isProtected = false
        }
      } else {
        const cost = scenario.eventCost * 100
        if (choice === "save") {
          amountSavedCents = 0
          amountSpentCents = 0
          isProtected = true
        } else {
          amountSavedCents = -cost
          amountSpentCents = cost
          isProtected = false
        }
      }

      const outcome: RoundOutcome = {
        scenarioId: scenario.id,
        isIncomeRound: isIncome,
        protected: isProtected,
        amountSavedCents,
        amountSpentCents,
      }

      return {
        ...prev,
        savings: prev.savings + amountSavedCents,
        roundOutcomes: [...prev.roundOutcomes, outcome],
        roundPhase: "resolved" as const,
        lastOutcome: outcome,
      }
    })
  }, []) // stable — no external deps needed

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

  // --- Finish game — save score, refresh leaderboard, show result ---
  const finishGame = useCallback(
    (finalSavings: number) => {
      setState((prev) => ({ ...prev, phase: "result" }))
      saveGameScore("savings-race", finalSavings)
        .then(() => router.refresh())
        .catch(console.error)
    },
    [router]
  )

  // --- Reset to intro screen ---
  const resetToIntro = useCallback(() => {
    hasDecidedRef.current = false
    setRoundTimeLeft(ROUND_DURATION_MS)
    setState(INITIAL_STATE)
  }, [])

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

  // Effect 1: Per-round countdown tick (100ms intervals)
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

  // ===== RENDER: INTRO =====

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
                <p>
                  💰 <strong>Income rounds:</strong> You earned money. Decide
                  to save it all or spend some on an event.
                </p>
                <p>
                  🛡️ <strong>No-income rounds:</strong> No earnings today.
                  Decide to protect your savings or spend from them.
                </p>
                <p>
                  ⏱️ <strong>You have 6 seconds</strong> to decide each round.
                  Run out of time → auto-spend!
                </p>
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
                        className={`flex items-center justify-between text-sm ${
                          entry.isCurrentUser
                            ? "font-semibold text-primary"
                            : ""
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

            <Button
              size="lg"
              className="w-full text-lg py-6"
              onClick={startGame}
            >
              Start Game
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // ===== RENDER: PLAYING =====

  if (state.phase === "playing") {
    const scenario = state.scenarios[state.round - 1]
    if (!scenario) return null
    const isIncome = isIncomeRound(scenario)
    const timerPct = (roundTimeLeft / ROUND_DURATION_MS) * 100
    const isUrgent = roundTimeLeft <= URGENT_THRESHOLD_MS

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-4">
          <div className="container max-w-md">
            {/* Top bar: time, savings, round */}
            <div className="flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-5 py-3 mb-4">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Time Left
                </div>
                <div
                  className={`text-2xl font-bold tabular-nums ${
                    totalTimeLeftMs < 15000 ? "text-red-600" : "text-foreground"
                  }`}
                >
                  {formatTime(totalTimeLeftMs)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Savings
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatDollars(state.savings)}
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

            {/* Income announcement (income rounds only) */}
            {isIncome && (
              <div className="text-center border-b pb-4 mb-4">
                <div className="text-xs text-muted-foreground mb-1">
                  This round you earned
                </div>
                <div className="text-4xl font-extrabold text-green-600">
                  +${scenario.incomeAmount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  from {scenario.incomeSource} {scenario.incomeEmoji}
                </div>
              </div>
            )}

            {/* Spending event card */}
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
            {state.roundPhase === "resolved" && state.lastOutcome && (
              <div className="text-center py-6">
                {state.lastOutcome.protected ? (
                  <>
                    <div className="text-4xl mb-2">💪</div>
                    <div className="text-xl font-bold text-green-600">
                      {isIncome
                        ? `You saved ${formatDollars(state.lastOutcome.amountSavedCents)}!`
                        : "You protected your savings!"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">{scenario.eventEmoji}</div>
                    <div className="text-xl font-bold text-amber-600">
                      {isIncome
                        ? `Spent ${formatDollars(state.lastOutcome.amountSpentCents)}, saved ${formatDollars(state.lastOutcome.amountSavedCents)}`
                        : `Spent ${formatDollars(state.lastOutcome.amountSpentCents)} from savings`}
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
                  <span className="font-bold">
                    {isIncome ? "Save it" : "Skip it"}
                  </span>
                  <span className="text-xs font-normal opacity-90">
                    {isIncome
                      ? `Keep $${scenario.incomeAmount}`
                      : "Protect savings"}
                  </span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 py-8 flex flex-col h-auto"
                  onClick={() => handleDecision("spend")}
                >
                  <span className="text-xl mb-1">{scenario.eventEmoji}</span>
                  <span className="font-bold">Spend it</span>
                  <span className="text-xs font-normal opacity-90">
                    {isIncome
                      ? `Save $${(scenario.incomeAmount ?? 0) - scenario.eventCost}`
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

  // ===== RENDER: RESULT =====

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
              {state.savings >= maxPossibleCents * 0.8
                ? "🏆"
                : state.savings >= maxPossibleCents * 0.5
                ? "🐷"
                : "💸"}
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
