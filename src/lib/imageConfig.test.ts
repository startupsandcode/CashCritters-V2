import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { test } from "node:test"

test("image optimization does not allow remote hosts", () => {
  // Import the real ESM config in Node, independent of the test runner's CommonJS mode.
  const output = execFileSync(process.execPath, [
    "--input-type=module",
    "--eval",
    "import config from './next.config.mjs'; process.stdout.write(JSON.stringify(config))",
  ], { encoding: "utf8" })
  const config = JSON.parse(output)
  assert.deepEqual(config.images?.remotePatterns, [])
  assert.deepEqual(config.images?.domains ?? [], [])
})
