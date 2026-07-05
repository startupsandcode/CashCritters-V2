import assert from "node:assert"
import { isValidScore } from "./gameScoring"

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

test("savings-race accepts scores within -50000..20000", () => {
  assert.strictEqual(isValidScore("savings-race", 0), true)
  assert.strictEqual(isValidScore("savings-race", -50000), true)
  assert.strictEqual(isValidScore("savings-race", 20000), true)
})

test("savings-race rejects scores outside -50000..20000", () => {
  assert.strictEqual(isValidScore("savings-race", -50001), false)
  assert.strictEqual(isValidScore("savings-race", 20001), false)
})

test("coin-counter accepts integer scores 0..10", () => {
  assert.strictEqual(isValidScore("coin-counter", 0), true)
  assert.strictEqual(isValidScore("coin-counter", 10), true)
  assert.strictEqual(isValidScore("coin-counter", 7), true)
})

test("coin-counter rejects scores outside 0..10", () => {
  assert.strictEqual(isValidScore("coin-counter", -1), false)
  assert.strictEqual(isValidScore("coin-counter", 11), false)
})

test("budget-challenge accepts integer scores -10000..5000", () => {
  assert.strictEqual(isValidScore("budget-challenge", -10000), true)
  assert.strictEqual(isValidScore("budget-challenge", 5000), true)
  assert.strictEqual(isValidScore("budget-challenge", -1200), true)
  assert.strictEqual(isValidScore("budget-challenge", 0), true)
})

test("budget-challenge rejects scores outside -10000..5000", () => {
  assert.strictEqual(isValidScore("budget-challenge", -10001), false)
  assert.strictEqual(isValidScore("budget-challenge", 5001), false)
})

test("rejects non-integer scores", () => {
  assert.strictEqual(isValidScore("coin-counter", 5.5), false)
  assert.strictEqual(isValidScore("savings-race", 100.1), false)
  assert.strictEqual(isValidScore("budget-challenge", -50.5), false)
})

test("rejects unknown gameId", () => {
  assert.strictEqual(isValidScore("not-a-real-game", 5), false)
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
