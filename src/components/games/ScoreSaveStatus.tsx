"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { saveGameScore } from "@/actions/games"
import { Button } from "@/components/ui/button"

export function ScoreSaveStatus({ gameId, score, runId }: { gameId: string; score: number; runId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<"saving" | "saved" | "error">("saving")
  const busy = useRef(false)
  const save = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setStatus("saving")
    try {
      await saveGameScore(gameId, score, runId)
      setStatus("saved")
      router.refresh()
    } catch {
      setStatus("error")
    } finally {
      busy.current = false
    }
  }, [gameId, score, runId, router])
  useEffect(() => { void save() }, [save])
  return <div className="my-4 rounded-lg border p-3 text-center text-sm" role="status" aria-live="polite">
    {status === "saving" && "Saving your score…"}
    {status === "saved" && `✓ Score saved${gameId.endsWith("-practice") ? " to practice" : ""}!`}
    {status === "error" && <><p>Your score couldn’t be saved. Keep this page open and try again.</p><Button className="mt-2" variant="outline" onClick={() => void save()}>Retry saving score</Button></>}
  </div>
}
