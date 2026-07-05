import assert from "node:assert"
import { validateGoalInput, validateContributionInput } from "./savingsValidation"

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

function assertThrows(fn: () => void, messageContains: string) {
  try {
    fn()
    assert.fail("expected function to throw")
  } catch (err) {
    if (!(err instanceof Error)) throw err
    assert.ok(
      err.message.includes(messageContains),
      `expected error message to include "${messageContains}", got "${err.message}"`
    )
  }
}

test("validateGoalInput trims the name and preserves target/emoji", () => {
  const result = validateGoalInput("  New Bike  ", 100, "🚲")
  assert.strictEqual(result.name, "New Bike")
  assert.strictEqual(result.targetAmount, 100)
  assert.strictEqual(result.emoji, "🚲")
})

test("validateGoalInput rejects an empty (or whitespace-only) name", () => {
  assertThrows(() => validateGoalInput("", 100, null), "name")
  assertThrows(() => validateGoalInput("   ", 100, null), "name")
})

test("validateGoalInput rejects a name over 50 characters", () => {
  const longName = "x".repeat(51)
  assertThrows(() => validateGoalInput(longName, 100, null), "50")
})

test("validateGoalInput accepts a name of exactly 50 characters", () => {
  const maxName = "x".repeat(50)
  const result = validateGoalInput(maxName, 100, null)
  assert.strictEqual(result.name, maxName)
})

test("validateGoalInput rejects non-positive target amounts", () => {
  assertThrows(() => validateGoalInput("Bike", 0, null), "positive")
  assertThrows(() => validateGoalInput("Bike", -5, null), "positive")
})

test("validateGoalInput rejects a non-finite target amount", () => {
  assertThrows(() => validateGoalInput("Bike", NaN, null), "positive")
})

test("validateGoalInput rejects a target amount over 10000", () => {
  assertThrows(() => validateGoalInput("Bike", 10001, null), "10,000")
})

test("validateGoalInput accepts a target amount of exactly 10000", () => {
  const result = validateGoalInput("Bike", 10000, null)
  assert.strictEqual(result.targetAmount, 10000)
})

test("validateGoalInput defaults emoji to 🎯 when null", () => {
  const result = validateGoalInput("Bike", 100, null)
  assert.strictEqual(result.emoji, "🎯")
})

test("validateGoalInput defaults emoji to 🎯 when not in the fixed set", () => {
  const result = validateGoalInput("Bike", 100, "🚀")
  assert.strictEqual(result.emoji, "🎯")
})

test("validateContributionInput trims the note", () => {
  const result = validateContributionInput(10, "  birthday money  ")
  assert.strictEqual(result.amount, 10)
  assert.strictEqual(result.note, "birthday money")
})

test("validateContributionInput rejects non-positive amounts", () => {
  assertThrows(() => validateContributionInput(0, undefined), "positive")
  assertThrows(() => validateContributionInput(-1, undefined), "positive")
})

test("validateContributionInput rejects a non-finite amount", () => {
  assertThrows(() => validateContributionInput(NaN, undefined), "positive")
})

test("validateContributionInput rejects an amount over 1000", () => {
  assertThrows(() => validateContributionInput(1001, undefined), "1,000")
})

test("validateContributionInput accepts an amount of exactly 1000", () => {
  const result = validateContributionInput(1000, undefined)
  assert.strictEqual(result.amount, 1000)
})

test("validateContributionInput treats a missing or whitespace-only note as null", () => {
  assert.strictEqual(validateContributionInput(10, undefined).note, null)
  assert.strictEqual(validateContributionInput(10, "   ").note, null)
})

test("validateContributionInput rejects a note over 100 characters", () => {
  const longNote = "x".repeat(101)
  assertThrows(() => validateContributionInput(10, longNote), "100")
})

test("validateContributionInput accepts a note of exactly 100 characters", () => {
  const maxNote = "x".repeat(100)
  const result = validateContributionInput(10, maxNote)
  assert.strictEqual(result.note, maxNote)
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
