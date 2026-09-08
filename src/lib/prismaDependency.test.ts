import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { loadConfigFromFile } from "@prisma/config"

// Resolve the helper used by Prisma, including a nested npm override.
const prismaRequire = createRequire(require.resolve("@prisma/config"))
const { deepmerge, deepmergeInto } = prismaRequire("deepmerge-ts")

test("Prisma's merge dependency handles recursive input without exhausting the stack", () => {
  const left: { self?: unknown; first: number } = { first: 1 }
  const right: { self?: unknown; second: number } = { second: 2 }
  left.self = left
  right.self = right
  assert.doesNotThrow(() => deepmerge(left, right))
  assert.doesNotThrow(() => deepmergeInto(left, right))
})

test("Prisma still loads configuration with the patched merge dependency", async () => {
  const root = mkdtempSync(join(tmpdir(), "cashcritters-prisma-config-"))
  try {
    writeFileSync(join(root, "prisma.config.js"), 'module.exports = { schema: "schema.prisma", migrations: { path: "migrations" } }\n')
    const result = await loadConfigFromFile({ configRoot: root })
    assert.equal(result.error, undefined)
    assert.equal(result.config?.schema, join(root, "schema.prisma"))
    assert.equal(result.config?.migrations?.path, join(root, "migrations"))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
