"use client"
import { Button } from "@/components/ui/button"
export type GameMode = "timed" | "practice"
export function GameModePicker({ mode, onChange }: { mode: GameMode; onChange: (mode: GameMode) => void }) {
  return <fieldset className="mb-6 space-y-3">
    <legend className="font-semibold mb-2">Choose your pace</legend>
    <div className="grid grid-cols-2 gap-3">
      <Button variant={mode === "timed" ? "default" : "outline"} aria-pressed={mode === "timed"} onClick={() => onChange("timed")}>Timed challenge</Button>
      <Button variant={mode === "practice" ? "default" : "outline"} aria-pressed={mode === "practice"} onClick={() => onChange("practice")}>Practice</Button>
    </div>
    <p className="text-sm text-muted-foreground">{mode === "practice" ? "No timer. Take your time and move on when you're ready." : "Race the clock and test your skills."} Timed and practice scores stay separate.</p>
  </fieldset>
}
