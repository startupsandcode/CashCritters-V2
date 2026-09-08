export interface CheckoutOrder {
  items: { name: string; emoji: string; price: number }[]
  total: number
  paid: number
}
const GOODS = [
  { name: "Apple", emoji: "🍎" }, { name: "Notebook", emoji: "📓" },
  { name: "Juice", emoji: "🧃" }, { name: "Crayons", emoji: "🖍️" },
  { name: "Pretzel", emoji: "🥨" }, { name: "Toy car", emoji: "🚗" },
]
export const CHANGE_DENOMINATIONS = [1000, 500, 100, 25, 10, 5, 1]
export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`
export function parseMoney(value: string): number | null {
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(value.trim())) return null
  const [dollars, cents = ""] = value.trim().split(".")
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"))
}
export function generateCheckout(round: number): CheckoutOrder {
  const count = round <= 6 ? 1 : round <= 8 ? 2 : 3
  const start = Math.floor(Math.random() * GOODS.length)
  const items = Array.from({ length: count }, (_, i) => ({
    ...GOODS[(start + i) % GOODS.length],
    price: (1 + Math.floor(Math.random() * 4)) * 100 +
      (round <= 3 ? 0 : round <= 8 ? Math.floor(Math.random() * 4) * 25 : Math.floor(Math.random() * 100)),
  }))
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const paid = [500, 1000, 2000].find(bill => bill >= total) ?? 2000
  return { items, total, paid }
}
// Count from the price up to the next dollar, then to the amount paid.
export function countUpChange(total: number, paid: number): { amount: number; to: number }[] {
  const steps: { amount: number; to: number }[] = []
  let current = total
  while (current < paid) {
    const target = Math.min(paid, current % 100 === 0 ? paid : Math.ceil(current / 100) * 100)
    const amount = CHANGE_DENOMINATIONS.find(value => value <= target - current)!
    current += amount
    steps.push({ amount, to: current })
  }
  return steps
}
