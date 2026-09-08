const { readdirSync } = require('node:fs')
const { join } = require('node:path')
const { spawnSync } = require('node:child_process')

function findTests(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? findTests(path) : path.endsWith('.test.ts') ? [path] : []
  })
}

for (const file of findTests('src')) {
  const result = spawnSync(process.execPath, ['-r', 'ts-node/register', file], {
    stdio: 'inherit',
    env: { ...process.env, TS_NODE_COMPILER_OPTIONS: JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' }) },
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
