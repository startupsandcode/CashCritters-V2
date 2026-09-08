"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { GameModePicker, type GameMode } from "@/components/games/GameModePicker"
import { ScoreSaveStatus } from "@/components/games/ScoreSaveStatus"
import type { LeaderboardEntry } from "@/actions/games"
import { CHANGE_DENOMINATIONS, countUpChange, generateCheckout, money, parseMoney, type CheckoutOrder } from "@/content/games/checkout-challenge"

type Board = { topScores: LeaderboardEntry[]; personalBest: number | null }
type Result = { order: CheckoutOrder; correct: boolean; timedOut: boolean }
export function CheckoutChallengeClient({ timed, practice }: { timed: Board; practice: Board }) {
  const [mode, setMode] = useState<GameMode>("practice")
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro")
  const [order, setOrder] = useState<CheckoutOrder | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [answer, setAnswer] = useState("")
  const [tray, setTray] = useState<number[]>([])
  const [feedback, setFeedback] = useState<Result | null>(null)
  const [seconds, setSeconds] = useState(45)
  const [runId, setRunId] = useState("")
  const answered = useRef(false)
  const deadline = useRef(0)
  const board = mode === "practice" ? practice : timed
  const change = tray.reduce((sum, value) => sum + value, 0)
  const score = results.filter(result => result.correct).length

  const nextCustomer = (round: number) => {
    answered.current = false
    setOrder(generateCheckout(round))
    setAnswer("")
    setTray([])
    setFeedback(null)
    setSeconds(45)
    deadline.current = Date.now() + 45000
  }
  const start = () => {
    setRunId(crypto.randomUUID())
    setResults([])
    nextCustomer(1)
    setPhase("playing")
  }
  const check = useCallback((timedOut = false) => {
    if (!order || answered.current) return
    answered.current = true
    const result = { order, timedOut, correct: !timedOut && parseMoney(answer) === order.total && change === order.paid - order.total }
    setFeedback(result)
    setResults(previous => [...previous, result])
  }, [order, answer, change])
  useEffect(() => {
    if (phase !== "playing" || mode !== "timed" || feedback) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0) check(true)
    }
    const timer = setInterval(tick, 200)
    return () => clearInterval(timer)
  }, [phase, mode, feedback, check])

  return <div className="min-h-screen flex flex-col">
    <Header />
    <main className="container max-w-3xl flex-1 py-8">
      <Link href="/games" className="text-sm text-primary underline underline-offset-4">Back to games</Link>
      <div className="my-6 flex items-center gap-4">
        <span className="text-5xl" aria-hidden="true">🦊</span>
        <div><h1 className="text-3xl font-bold">Checkout Challenge</h1><p className="text-muted-foreground">Welcome to Critter Corner. You’re the cashier!</p></div>
      </div>
      {phase === "intro" && <>
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Ten customers. One helpful cashier.</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Add the prices on each customer’s receipt.</li>
            <li>Enter the total, then tap coins and bills to give change.</li>
            <li>Check your work and learn how to count up to the amount paid.</li>
          </ol>
          <p className="mt-4 text-sm">Start with whole dollars, then try coins and bigger baskets. Earn one point for each correct total and change. Timed mode gives you 45 seconds per customer.</p>
        </div>
        <GameModePicker mode={mode} onChange={setMode} />
        <Button size="lg" className="w-full" onClick={start}>Open the shop</Button>
      </>}
      {phase === "playing" && order && <>
        <div className="flex flex-wrap justify-between gap-2 mb-5 font-semibold">
          <span>Customer {Math.min(results.length + (feedback ? 0 : 1), 10)} of 10</span>
          <span>{score} correct</span>
          <span className={mode === "timed" && seconds <= 10 ? "text-red-700" : "text-muted-foreground"}>{mode === "practice" ? "Practice · No timer" : `${seconds}s left`}</span>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-t-xl border-x border-t border-b-4 border-dashed border-amber-300 bg-amber-50 p-6 self-start" aria-label="Customer receipt">
            <h2 className="text-xl font-bold text-center mb-1">Critter Corner</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">A little shop for big money skills</p>
            <ul className="space-y-4">{order.items.map((item, i) => <li key={i} className="flex justify-between gap-3"><span>{item.emoji} {item.name}</span><strong>{money(item.price)}</strong></li>)}</ul>
            <div className="border-t border-dashed border-amber-400 mt-6 pt-4 flex justify-between gap-3"><span>Customer paid</span><strong>{money(order.paid)}</strong></div>
          </section>
          <section aria-label="Cash register" className="space-y-4">
            <label className="block font-semibold" htmlFor="checkout-total">What’s the total?</label>
            <div className="flex items-center gap-2"><span aria-hidden="true">$</span><input id="checkout-total" className="w-full rounded-md border bg-background px-3 py-3 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" inputMode="decimal" autoComplete="off" placeholder="0.00" value={answer} disabled={!!feedback} onChange={event => setAnswer(event.target.value)} /></div>
            <h2 className="font-semibold">Give the customer change</h2>
            <div className="grid grid-cols-4 gap-2">{CHANGE_DENOMINATIONS.map(value => <Button key={value} variant="outline" className="h-12 px-1" disabled={!!feedback || change + value > 5000} aria-label={`Add ${money(value)} change`} onClick={() => setTray(previous => [...previous, value])}>{value >= 100 ? money(value).replace(".00", "") : `${value}¢`}</Button>)}</div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4"><p className="flex justify-between font-semibold"><span>Change tray</span><span>{money(change)}</span></p><p className="text-sm text-muted-foreground mt-1">{tray.length ? `${tray.length} coins and bills added` : "No change needed? Leave the tray empty."}</p></div>
            <div className="flex gap-2"><Button variant="outline" disabled={!!feedback || !tray.length} onClick={() => setTray(previous => previous.slice(0, -1))}>Undo</Button><Button variant="outline" disabled={!!feedback || !tray.length} onClick={() => setTray([])}>Clear tray</Button></div>
            {!feedback && <Button size="lg" className="w-full" disabled={parseMoney(answer) === null} onClick={() => check()}>Check my work</Button>}
          </section>
        </div>
        {feedback && <section className="mt-6 rounded-xl border bg-muted/30 p-5" aria-live="polite">
          <h2 className="text-xl font-bold mb-2">{feedback.correct ? "Perfect checkout! 🎉" : feedback.timedOut ? "Time’s up. Let’s count together." : "Let’s count it together."}</h2>
          <p>{order.items.map(item => money(item.price)).join(" + ")} = <strong>{money(order.total)}</strong>. Change due: <strong>
            {money(order.paid - order.total)}</strong>.</p>
          <p className="font-semibold mt-3">Start at {money(order.total)} and count up:</p>
          {order.total === order.paid ? <p>The customer paid exactly. No change needed!</p> : <ol className="list-decimal pl-5 mt-2 space-y-1">{countUpChange(order.total, order.paid).map((step, i) => <li key={i}>Add {money(step.amount)} to reach {money(step.to)}.</li>)}</ol>}
          <Button className="mt-4 w-full" onClick={() => results.length === 10 ? setPhase("result") : nextCustomer(results.length + 1)}>{results.length === 10 ? "See results" : "Next customer"}</Button>
        </section>}
      </>}
      {phase === "result" && <>
        <section className="text-center rounded-xl bg-green-50 border border-green-200 p-6">
          <div className="text-4xl mb-2" aria-hidden="true">{score >= 8 ? "🏆" : "🛍️"}</div>
          <h2 className="text-2xl font-bold">Shop closed. Nice work!</h2>
          <p className="text-5xl font-bold text-green-700 my-4">{score}/10</p>
          <p>Customers with the right total and change</p>
          <p className="text-sm mt-2">{mode === "practice" ? "Practice" : "Timed"} result</p>
        </section>
        <ScoreSaveStatus gameId={`checkout-challenge${mode === "practice" ? "-practice" : ""}`} score={score} runId={runId} />
        <details className="my-5 rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Review your receipts</summary><ol className="mt-3 space-y-3">{results.map((result, i) => <li key={i}>Customer {i + 1}: {result.correct ? "Correct" : "Keep practicing"}. Total {money(result.order.total)}, paid {money(result.order.paid)}, change {money(result.order.paid - result.order.total)}.</li>)}</ol></details>
        <div className="flex gap-3"><Button className="flex-1" onClick={start}>Play again</Button><Button className="flex-1" variant="outline" onClick={() => setPhase("intro")}>Change pace</Button></div>
      </>}
      {phase !== "playing" && <section className="mt-8 border-t pt-5">
        <h2 className="text-lg font-bold mb-3">{mode === "practice" ? "Practice" : "Timed"} leaderboard</h2>
        {board.personalBest !== null && <p className="mb-3 text-primary font-semibold">Your best: {board.personalBest}/10</p>}
        {!board.topScores.length ? <p className="text-muted-foreground text-sm">Finish a game to put the first score on the board.</p> : <ol className="space-y-2">{board.topScores.map(entry => <li key={entry.userId} className="flex justify-between gap-3"><span>#{entry.rank} {entry.displayName}{entry.isCurrentUser ? " (you)" : ""}</span><strong>{entry.score}/10</strong></li>)}</ol>}
      </section>}
    </main>
  </div>
}
