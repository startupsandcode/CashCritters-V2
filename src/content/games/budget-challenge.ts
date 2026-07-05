// src/content/games/budget-challenge.ts

export type BudgetCategory = "food" | "fun"

export interface BudgetEvent {
  id: string
  category: BudgetCategory
  description: string
  cost: number // dollars
  emoji: string
}

export interface CategoryBalances {
  food: number    // cents
  fun: number     // cents
  savings: number // cents, can go negative
}

export interface DayResult {
  event: BudgetEvent
  paidFromCategory: number // cents
  paidFromSavings: number  // cents, 0 if the category covered it fully
}

// 16 food scenarios — everyday costs, $3-$12
const FOOD_EVENTS: BudgetEvent[] = [
  { id: "f01", category: "food", description: "School lunch pizza day", cost: 5, emoji: "🍕" },
  { id: "f02", category: "food", description: "Vending machine snack", cost: 3, emoji: "🍫" },
  { id: "f03", category: "food", description: "Ice cream after school", cost: 4, emoji: "🍦" },
  { id: "f04", category: "food", description: "Bagel and juice before school", cost: 4, emoji: "🥯" },
  { id: "f05", category: "food", description: "Fast food with friends", cost: 8, emoji: "🍔" },
  { id: "f06", category: "food", description: "Smoothie from the corner shop", cost: 6, emoji: "🥤" },
  { id: "f07", category: "food", description: "Bakery treat on the way home", cost: 4, emoji: "🥐" },
  { id: "f08", category: "food", description: "School cafeteria taco day", cost: 6, emoji: "🌮" },
  { id: "f09", category: "food", description: "Hot chocolate on a cold day", cost: 4, emoji: "☕" },
  { id: "f10", category: "food", description: "Fruit cup from the cafeteria", cost: 3, emoji: "🍎" },
  { id: "f11", category: "food", description: "Pizza slice at the mall", cost: 5, emoji: "🍕" },
  { id: "f12", category: "food", description: "Sandwich shop lunch", cost: 7, emoji: "🥪" },
  { id: "f13", category: "food", description: "Popcorn at the movies", cost: 5, emoji: "🍿" },
  { id: "f14", category: "food", description: "Breakfast sandwich", cost: 5, emoji: "🥚" },
  { id: "f15", category: "food", description: "Cafeteria pasta day", cost: 6, emoji: "🍝" },
  { id: "f16", category: "food", description: "Snack bar chips and soda", cost: 4, emoji: "🥤" },
]

// 16 fun scenarios — discretionary wants, $4-$15
const FUN_EVENTS: BudgetEvent[] = [
  { id: "u01", category: "fun", description: "Movie with friends", cost: 10, emoji: "🎬" },
  { id: "u02", category: "fun", description: "New mobile game", cost: 6, emoji: "📱" },
  { id: "u03", category: "fun", description: "Trading card pack", cost: 7, emoji: "🃏" },
  { id: "u04", category: "fun", description: "Mini golf with friends", cost: 9, emoji: "⛳" },
  { id: "u05", category: "fun", description: "Bowling night", cost: 12, emoji: "🎳" },
  { id: "u06", category: "fun", description: "Arcade tokens", cost: 8, emoji: "🕹️" },
  { id: "u07", category: "fun", description: "New sticker pack", cost: 4, emoji: "✨" },
  { id: "u08", category: "fun", description: "Skating rink admission", cost: 10, emoji: "⛸️" },
  { id: "u09", category: "fun", description: "Comic book", cost: 6, emoji: "📚" },
  { id: "u10", category: "fun", description: "Roller coaster ride at the fair", cost: 8, emoji: "🎢" },
  { id: "u11", category: "fun", description: "Photo booth with friends", cost: 5, emoji: "📸" },
  { id: "u12", category: "fun", description: "New app purchase", cost: 5, emoji: "📲" },
  { id: "u13", category: "fun", description: "Laser tag session", cost: 12, emoji: "🔫" },
  { id: "u14", category: "fun", description: "Trampoline park", cost: 15, emoji: "🤸" },
  { id: "u15", category: "fun", description: "Board game with friends", cost: 9, emoji: "🎲" },
  { id: "u16", category: "fun", description: "Music download", cost: 4, emoji: "🎵" },
]

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// Returns 7 events for one game: 4 food + 3 fun, sampled without
// replacement, shuffled into day order
export function sampleWeek(): BudgetEvent[] {
  const food = shuffleAndTake(FOOD_EVENTS, 4)
  const fun = shuffleAndTake(FUN_EVENTS, 3)
  return shuffleAndTake([...food, ...fun], 7)
}

// Applies one event's cost against the current balances: deducts from
// the event's category first (never below 0), then pulls any shortfall
// from savings (savings can go negative).
export function resolveDayEvent(
  balances: CategoryBalances,
  event: BudgetEvent
): { balances: CategoryBalances; result: DayResult } {
  const costCents = event.cost * 100
  const categoryBalance = balances[event.category]
  const paidFromCategory = Math.min(categoryBalance, costCents)
  const paidFromSavings = costCents - paidFromCategory

  const newBalances: CategoryBalances = {
    ...balances,
    [event.category]: categoryBalance - paidFromCategory,
    savings: balances.savings - paidFromSavings,
  }

  return {
    balances: newBalances,
    result: { event, paidFromCategory, paidFromSavings },
  }
}
