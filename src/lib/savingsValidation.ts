// src/lib/savingsValidation.ts

export const EMOJI_OPTIONS = [
  "🎯", "🎮", "🚲", "📚", "👟", "🎨", "🎸", "⚽", "🐶", "🎁",
] as const

export interface ValidatedGoalInput {
  name: string
  targetAmount: number
  emoji: string
}

// Validates and normalizes create-goal input. Returns the normalized
// values on success. Throws an Error with a user-facing message on
// invalid input.
export function validateGoalInput(
  name: string,
  targetAmount: number,
  emoji: string | null
): ValidatedGoalInput {
  const trimmedName = name.trim()
  if (trimmedName.length === 0) {
    throw new Error("Goal name is required")
  }
  if (trimmedName.length > 50) {
    throw new Error("Goal name must be 50 characters or less")
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new Error("Target amount must be a positive number")
  }
  if (targetAmount > 10000) {
    throw new Error("Target amount must be $10,000 or less")
  }

  const resolvedEmoji =
    emoji && (EMOJI_OPTIONS as readonly string[]).includes(emoji)
      ? emoji
      : "🎯"

  return { name: trimmedName, targetAmount, emoji: resolvedEmoji }
}

export interface ValidatedContributionInput {
  amount: number
  note: string | null
}

// Validates and normalizes add-contribution input. Throws an Error with
// a user-facing message on invalid input.
export function validateContributionInput(
  amount: number,
  note: string | undefined
): ValidatedContributionInput {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number")
  }
  if (amount > 1000) {
    throw new Error("Amount must be $1,000 or less")
  }

  const trimmedNote = note?.trim() || null
  if (trimmedNote && trimmedNote.length > 100) {
    throw new Error("Note must be 100 characters or less")
  }

  return { amount, note: trimmedNote }
}
