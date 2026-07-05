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
