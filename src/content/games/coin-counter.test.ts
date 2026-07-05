import assert from "node:assert"
import {
  tierForRound,
  generatePile,
  generateDistractors,
  buildChoices,
  generateRound,
  type CoinDenomination,
} from "./coin-counter"

const ALL_DENOMINATIONS: CoinDenomination[] = [1, 5, 10, 25]
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

test("tierForRound returns easy for rounds 1-3", () => {
  assert.strictEqual(tierForRound(1), "easy")
  assert.strictEqual(tierForRound(2), "easy")
  assert.strictEqual(tierForRound(3), "easy")
})

test("tierForRound returns medium for rounds 4-7", () => {
  assert.strictEqual(tierForRound(4), "medium")
  assert.strictEqual(tierForRound(5), "medium")
  assert.strictEqual(tierForRound(6), "medium")
  assert.strictEqual(tierForRound(7), "medium")
})

test("tierForRound returns hard for rounds 8-10", () => {
  assert.strictEqual(tierForRound(8), "hard")
  assert.strictEqual(tierForRound(9), "hard")
  assert.strictEqual(tierForRound(10), "hard")
})

test("generatePile respects coin-count and denomination-count bounds for each tier", () => {
  const bounds = {
    easy: { minCoins: 2, maxCoins: 3, minDenoms: 1, maxDenoms: 2 },
    medium: { minCoins: 4, maxCoins: 5, minDenoms: 2, maxDenoms: 3 },
    hard: { minCoins: 6, maxCoins: 7, minDenoms: 3, maxDenoms: 4 },
  } as const

  for (const tier of ["easy", "medium", "hard"] as const) {
    const { minCoins, maxCoins, minDenoms, maxDenoms } = bounds[tier]
    for (let i = 0; i < 200; i++) {
      const pile = generatePile(tier)
      assert.ok(
        pile.coins.length >= minCoins && pile.coins.length <= maxCoins,
        `${tier} coin count out of range: ${pile.coins.length}`
      )
      const distinctDenoms = new Set(pile.coins).size
      assert.ok(
        distinctDenoms >= minDenoms && distinctDenoms <= maxDenoms,
        `${tier} denomination count out of range: ${distinctDenoms}`
      )
      for (const coin of pile.coins) {
        assert.ok(
          (ALL_DENOMINATIONS as number[]).includes(coin),
          `unexpected denomination: ${coin}`
        )
      }
      const expectedTotal = pile.coins.reduce((sum, c) => sum + c, 0)
      assert.strictEqual(pile.totalCents, expectedTotal)
    }
  }
})

test("generateDistractors returns two distinct non-negative values different from the total", () => {
  for (const total of [0, 1, 2, 5, 10, 25, 47, 100, 175]) {
    for (let i = 0; i < 50; i++) {
      const [d1, d2] = generateDistractors(total)
      assert.notStrictEqual(d1, total)
      assert.notStrictEqual(d2, total)
      assert.notStrictEqual(d1, d2)
      assert.ok(d1 >= 0, `d1 negative: ${d1}`)
      assert.ok(d2 >= 0, `d2 negative: ${d2}`)
    }
  }
})

test("buildChoices returns 3 unique values including the correct total", () => {
  for (const total of [2, 47, 175]) {
    for (let i = 0; i < 100; i++) {
      const choices = buildChoices(total)
      assert.strictEqual(choices.length, 3)
      assert.ok(choices.includes(total))
      assert.strictEqual(new Set(choices).size, 3)
    }
  }
})

test("generateRound produces a pile matching the round's tier and 3 valid choices", () => {
  for (const round of [1, 5, 9]) {
    const { pile, choices } = generateRound(round)
    assert.strictEqual(choices.length, 3)
    assert.ok(choices.includes(pile.totalCents))
    assert.strictEqual(new Set(choices).size, 3)
  }
})

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
} else {
  console.log("\nAll tests passed")
}
