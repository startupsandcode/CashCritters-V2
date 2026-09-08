// Run against a local production build and an explicitly confirmed test database.
// CASH_CRITTERS_TEST_DATABASE=1 node scripts/integration-test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const crypto = require('node:crypto')
require('@next/env').loadEnvConfig(process.cwd(), true)
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' })
require('ts-node/register')
const { TRACKS } = require('../src/content/lessons')
const { PrismaClient } = require('@prisma/client')

if (process.env.CASH_CRITTERS_TEST_DATABASE !== '1') {
  throw new Error('Confirm a test database by setting CASH_CRITTERS_TEST_DATABASE=1')
}
const base = 'http://localhost:3000'
const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8')).node
const prisma = new PrismaClient()
const runId = crypto.randomUUID()
const emails = [0, 1].map(i => `cashcritters-test-${runId}-${i}@example.invalid`)
const password = crypto.randomBytes(24).toString('hex')
let passed = 0

function client() {
  const cookies = new Map()
  async function request(path, options = {}) {
    const res = await fetch(base + path, {
      ...options, redirect: 'manual',
      headers: { Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...options.headers },
    })
    for (const cookie of res.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]
      cookies.set(pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1))
    }
    return res
  }
  async function action(name, args, path = '/dashboard') {
    const id = Object.entries(manifest).find(([, value]) => value.exportedName === name)?.[0]
    assert.ok(id, `Action ${name} exists in the build`)
    let body
    const headers = { 'Next-Action': id, Origin: base, Accept: 'text/x-component' }
    if (args instanceof FormData) {
      body = new FormData()
      for (const [key, value] of args) body.set(`_1_${key}`, value)
      body.set('0', '["$K1"]')
    } else {
      body = JSON.stringify(args)
      headers['Content-Type'] = 'text/plain;charset=UTF-8'
    }
    const res = await request(path, { method: 'POST', body, headers })
    const text = await res.text()
    return { res, text }
  }
  return { request, action }
}

function form(values) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

async function check(name, fn) {
  await fn()
  passed++
  console.log(`PASS: ${name}`)
}

async function main() {
  const a = client(), b = client(), guest = client()
  await check('protected pages redirect signed-out users', async () => {
    for (const path of ['/dashboard', '/savings', '/learn', '/games']) {
      const r = await guest.request(path)
      assert.equal(r.status, 307)
      assert.equal(r.headers.get('location'), '/signin')
    }
  })
  let userA, userB
  await check('registration creates accounts and signed-in sessions', async () => {
    for (const [i, c] of [a,b].entries()) {
      const {res, text} = await c.action('registerUser', form({name:`QA Critter ${i}`,email:emails[i],password}), '/signup')
      assert.ok(res.headers.get('x-action-redirect')?.includes('/dashboard'), `Registration redirect for user ${i}; HTTP ${res.status}; invalid input: ${text.includes('Invalid registration data')}; sign-in redirect: ${res.headers.get('x-action-redirect')?.includes('/signin') || false}`)
      const session = await (await c.request('/api/auth/session')).json()
      assert.equal(session.user?.email, emails[i])
    }
    userA = await prisma.user.findUniqueOrThrow({where:{email:emails[0]}})
    userB = await prisma.user.findUniqueOrThrow({where:{email:emails[1]}})
    assert.notEqual(userA.password, password)
  })
  await check('duplicate registration produces a friendly error', async () => {
    const {text} = await guest.action('registerUser', form({name:'QA Duplicate',email:emails[0],password}), '/signup')
    assert.match(text, /already exists/)
  })
  await check('dashboard starts with real zero progress', async () => {
    const html = await (await a.request('/dashboard')).text()
    assert.match(html, /QA Critter/)
    assert.ok(html.includes(`/learn/${TRACKS[0].id}/${TRACKS[0].lessons[0].id}`))
  })
  let goal
  await check('create savings goal persists correct values', async () => {
    const {res} = await a.action('createSavingsGoal', ['QA disposable goal', 10, '🎯'], '/savings')
    assert.equal(res.status, 200)
    goal = await prisma.savingsGoal.findFirstOrThrow({where:{userId:userA.id}})
    assert.equal(goal.targetAmount.toNumber(), 10)
  })
  await check('another account cannot read or change the goal', async () => {
    const html = await (await b.request('/savings')).text()
    assert.ok(!html.includes('QA disposable goal'))
    await b.action('addContribution', [goal.id, 5, 'forbidden'], '/savings')
    await b.action('deleteSavingsGoal', [goal.id], '/savings')
    const unchanged = await prisma.savingsGoal.findUniqueOrThrow({where:{id:goal.id}})
    assert.equal(unchanged.currentAmount.toNumber(), 0)
    assert.equal(await prisma.savingsContribution.count({where:{goalId:goal.id}}), 0)
  })
  await check('invalid contributions are rejected without writes', async () => {
    for (const amount of [-1, 0.001, 1001]) await a.action('addContribution', [goal.id, amount], '/savings')
    assert.equal(await prisma.savingsContribution.count({where:{goalId:goal.id}}), 0)
  })
  await check('contributions update goal balance and dashboard total', async () => {
    for (const amount of [4.25,5.75]) {
      const {res} = await a.action('addContribution', [goal.id, amount, 'QA test'], '/savings')
      assert.equal(res.status, 200)
    }
    const updated = await prisma.savingsGoal.findUniqueOrThrow({where:{id:goal.id}})
    assert.equal(updated.currentAmount.toNumber(), 10)
    assert.equal(await prisma.savingsContribution.count({where:{goalId:goal.id}}), 2)
    assert.match(await (await a.request('/dashboard')).text(), /\$10\.00 saved/)
  })
  await check('locked tracks and fabricated completions cannot be saved', async () => {
    const track = TRACKS[1], lesson = track.lessons[0]
    const r = await a.request(`/learn/${track.id}/${lesson.id}`)
    assert.equal(r.status, 307)
    await a.action('completeLesson', [track.id,lesson.id,lesson.quiz.map(q=>q.correctIndex)], '/learn')
    await a.action('completeLesson', ['fake','fake',[0,0,0,0,0]], '/learn')
    assert.equal(await prisma.learningProgress.count({where:{userId:userA.id}}), 0)
  })
  await check('complete a track, unlock the next track, and persist scores', async () => {
    const track = TRACKS[0]
    for (const lesson of track.lessons) {
      const {res} = await a.action('completeLesson', [track.id,lesson.id,lesson.quiz.map(q=>q.correctIndex)], '/learn')
      assert.equal(res.status, 200)
    }
    const records = await prisma.learningProgress.findMany({where:{userId:userA.id}})
    assert.equal(records.length, track.lessons.length)
    assert.ok(records.every(r=>r.completed&&r.score===5))
    assert.equal((await a.request(`/learn/${TRACKS[1].id}/${TRACKS[1].lessons[0].id}`)).status,200)
    const html = await (await a.request('/dashboard')).text()
    assert.ok(html.includes(`/learn/${TRACKS[1].id}/${TRACKS[1].lessons[0].id}`))
    assert.equal(await prisma.learningProgress.count({where:{userId:userB.id}}),0)
  })
  await check('all four game scores persist and invalid scores do not', async () => {
    for (const [id,score] of [['coin-counter',7],['savings-race',1000],['budget-challenge',500],['checkout-challenge',8]]) {
      assert.equal((await a.action('saveGameScore',[id,score],`/games/${id}`)).res.status,200)
      await a.action('saveGameScore',[id,999999],`/games/${id}`)
      assert.equal(await prisma.gameScore.count({where:{userId:userA.id,gameId:id}}),1)
      assert.equal((await a.request(`/games/${id}`)).status,200)
    }
  })
  await check('practice scores are separate and retries cannot duplicate or overwrite a result', async () => {
    const run = crypto.randomUUID()
    const game = 'checkout-challenge-practice'
    for (let i = 0; i < 2; i++) assert.equal((await a.action('saveGameScore',[game,6,run],'/games/checkout-challenge')).res.status,200)
    assert.equal(await prisma.gameScore.count({where:{id:run}}),1)
    await a.action('saveGameScore',[game,10,run],'/games/checkout-challenge')
    await b.action('saveGameScore',[game,6,run],'/games/checkout-challenge')
    const saved = await prisma.gameScore.findUnique({where:{id:run}})
    assert.equal(saved.score,6)
    assert.equal(saved.userId,userA.id)
    assert.equal(await prisma.gameScore.count({where:{userId:userA.id,gameId:'checkout-challenge',score:8}}),1)
    await a.action('saveGameScore',[game,6,'invalid'], '/games/checkout-challenge')
    assert.equal(await prisma.gameScore.count({where:{userId:userA.id,gameId:game}}),1)
    for (const id of ['coin-counter-practice','savings-race-practice']) {
      assert.equal((await a.action('saveGameScore',[id,5,crypto.randomUUID()],'/games')).res.status,200)
      assert.equal(await prisma.gameScore.count({where:{userId:userA.id,gameId:id}}),1)
    }
  })
  await check('deleting own goal also removes its contributions', async () => {
    assert.equal((await a.action('deleteSavingsGoal',[goal.id],'/savings')).res.status,200)
    assert.equal(await prisma.savingsGoal.count({where:{id:goal.id}}),0)
    assert.equal(await prisma.savingsContribution.count({where:{goalId:goal.id}}),0)
  })
  await check('logout clears the session and credentials login restores it', async () => {
    await a.action('logoutUser',[], '/')
    assert.equal((await (await a.request('/api/auth/session')).json())?.user,undefined)
    const bad = await a.action('loginUser',form({email:emails[0],password:'wrong-password'}),'/signin')
    assert.match(bad.text,/Invalid email or password/)
    await a.action('loginUser',form({email:emails[0].toUpperCase(),password}),'/signin')
    assert.equal((await (await a.request('/api/auth/session')).json()).user?.email,emails[0])
  })
  console.log(`${passed} integration checks passed`)
}

main().catch(e=>{console.error('FAIL:',e.name, e.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[database URL]'));process.exitCode=1})
  .finally(async()=>{
    // Only accounts uniquely created by this invocation; related records cascade.
    const result = await prisma.user.deleteMany({where:{email:{in:emails}}})
    console.log(`Cleaned up ${result.count} test accounts and their related records`)
    await prisma.$disconnect()
  })
