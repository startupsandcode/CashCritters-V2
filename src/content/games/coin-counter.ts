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

  // Ensure at least one coin of each selected denomination
  for (const denom of denominations) {
    coins.push(denom)
  }

  // Fill the rest with random denominations
  for (let i = coins.length; i < coinCount; i++) {
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
