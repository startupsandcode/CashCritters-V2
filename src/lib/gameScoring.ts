// src/lib/gameScoring.ts

interface ScoreRange {
  min: number
  max: number
}

const SCORE_RANGES: Record<string, ScoreRange> = {
  "savings-race": { min: -50000, max: 20000 },
  "checkout-challenge": { min: 0, max: 10 },
  "checkout-challenge-practice": { min: 0, max: 10 },
  "coin-counter-practice": { min: 0, max: 10 },
  "savings-race-practice": { min: -50000, max: 20000 },
  "coin-counter": { min: 0, max: 10 },
  "budget-challenge": { min: -10000, max: 5000 },
}

export function isValidScore(gameId: string, score: number): boolean {
  const range = Object.hasOwn(SCORE_RANGES, gameId) ? SCORE_RANGES[gameId] : undefined
  if (!range) return false
  return Number.isInteger(score) && score >= range.min && score <= range.max
}
