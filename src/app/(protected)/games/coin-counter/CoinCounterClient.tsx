// src/app/(protected)/games/coin-counter/CoinCounterClient.tsx
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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

// Fisher-Yates shuffle of a copy — used to randomize the on-screen coin
// order, since generatePile() front-loads distinct denominations before
// duplicates and isn't itself in visually-scattered order.
function shuffleCoins(coins: CoinDenomination[]): CoinDenomination[] {
  const copy = [...coins]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
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

  // Shuffle the current pile's coins once per round (recomputed only when
  // the currentPile reference changes, not on every render/tick) so the
  // visual arrangement doesn't reveal generatePile()'s internal ordering.
  const shuffledCoins = useMemo(() => {
    if (!state.currentPile) return []
    return shuffleCoins(state.currentPile.coins)
  }, [state.currentPile])

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
              <CoinPileDisplay coins={shuffledCoins} />
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
