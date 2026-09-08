import assert from "node:assert/strict"
import { generateCheckout, countUpChange, parseMoney } from "./checkout-challenge"
for (let round = 1; round <= 10; round++) {
  for (let i = 0; i < 100; i++) {
    const order = generateCheckout(round)
    assert.equal(order.total, order.items.reduce((sum, item) => sum + item.price, 0))
    assert.ok(order.paid >= order.total)
    assert.ok(Number.isInteger(order.total))
    assert.equal(countUpChange(order.total, order.paid).reduce((sum, step) => sum + step.amount, 0), order.paid - order.total)
    if (round <= 3) assert.equal(order.total % 100, 0)
    if (round >= 7) assert.ok(order.items.length >= 2)
  }
}
assert.deepEqual(countUpChange(375, 500), [{ amount: 25, to: 400 }, { amount: 100, to: 500 }])
assert.deepEqual(countUpChange(500, 500), [])
assert.equal(parseMoney("3.05"), 305)
for (const value of ["", "-1", "Infinity", "1.001", "1e2", "1abc"]) assert.equal(parseMoney(value), null)
console.log("PASS: checkout progression, exact change, counting up, and money input (1,000 orders)")
