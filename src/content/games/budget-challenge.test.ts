import assert from "node:assert"
import {
  sampleWeek,
  resolveDayEvent,
  type BudgetEvent,
  type CategoryBalances,
} from "./budget-challenge"

let failures = 0
function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    failures++
    console.error(`FAIL: ${name}`)
    console.error(err)
  }
}

test("sampleWeek returns exactly 7 events", () => {
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(sampleWeek().length, 7)
  }
})

test("sampleWeek always returns exactly 4 food and 3 fun events", () => {
  for (let i = 0; i < 50; i++) {
    const week = sampleWeek()
    const foodCount = week.filter((e) => e.category === "food").length
    const funCount = week.filter((e) => e.category === "fun").length
    assert.strictEqual(foodCount, 4, `expected 4 food events, got ${foodCount}`)
    assert.strictEqual(funCount, 3, `expected 3 fun events, got ${funCount}`)
  }
})

test("sampleWeek never repeats the same event id within one week", () => {
  for (let i = 0; i < 50; i++) {
    const week = sampleWeek()
    const ids = week.map((e) => e.id)
    assert.strictEqual(new Set(ids).size, ids.length, "duplicate event id in one sampled week")
  }
})

const foodEvent: BudgetEvent = {
  id: "test-food",
  category: "food",
  description: "Test lunch",
  cost: 6,
  emoji: "🍕",
}

test("resolveDayEvent deducts fully from category when it has enough", () => {
  const balances: CategoryBalances = { food: 1000, fun: 500, savings: 2000 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 600)
  assert.strictEqual(result.paidFromSavings, 0)
  assert.strictEqual(next.food, 400)
  assert.strictEqual(next.fun, 500)
  assert.strictEqual(next.savings, 2000)
})

test("resolveDayEvent pulls the shortfall from savings when category is short", () => {
  const balances: CategoryBalances = { food: 200, fun: 500, savings: 2000 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 200)
  assert.strictEqual(result.paidFromSavings, 400)
  assert.strictEqual(next.food, 0)
  assert.strictEqual(next.savings, 1600)
})

test("resolveDayEvent lets savings go negative when it can't fully cover the shortfall", () => {
  const balances: CategoryBalances = { food: 0, fun: 500, savings: 100 }
  const { balances: next, result } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(result.paidFromCategory, 0)
  assert.strictEqual(result.paidFromSavings, 600)
  assert.strictEqual(next.food, 0)
  assert.strictEqual(next.savings, -500)
})

test("resolveDayEvent never touches the category not referenced by the event", () => {
  const balances: CategoryBalances = { food: 1000, fun: 500, savings: 2000 }
  const { balances: next } = resolveDayEvent(balances, foodEvent)
  assert.strictEqual(next.fun, 500)
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
