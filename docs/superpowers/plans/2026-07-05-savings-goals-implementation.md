# Savings Goals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static, unwired `/savings` placeholder page with a real feature — users can create multiple savings goals, add contributions, see progress, and delete goals — per `docs/superpowers/specs/2026-07-05-savings-goals-design.md`.

**Architecture:** Pure input-validation logic lives in `src/lib/savingsValidation.ts` (mirrors the existing `src/lib/gameScoring.ts` pattern — a dependency-free module the actions layer calls into, independently unit-testable outside the Next.js runtime). `src/actions/savings.ts` is a thin server-actions layer (auth + Prisma orchestration only) following the exact shape of `src/actions/games.ts`. The page becomes a server shell that pre-fetches goals, handing them to a client component that owns all dialog/form state using the existing shadcn `Dialog`/`AlertDialog`/`Progress` components.

**Tech Stack:** Next.js 14 (App Router), React client components, Prisma (existing `SavingsGoal`/`SavingsContribution` models, no schema changes), Tailwind, `lucide-react`, shadcn `Dialog`/`AlertDialog`/`Progress`/`Input`/`Label`/`Card`/`Button`. No test framework is installed in this repo — pure-logic modules are verified with plain `node:assert` scripts run via the existing `ts-node` devDependency; the actions layer and UI are verified by manual browser drive against the dev server (matching how all three games were verified), since it requires a real authenticated session and a real database.

## Global Constraints

- No schema changes — `SavingsGoal` and `SavingsContribution` already exist in `prisma/schema.prisma` exactly as needed.
- `SavingsGoal.targetAmount`/`currentAmount` and `SavingsContribution.amount` are Prisma `Decimal` fields. Every server action that *reads* this data must convert to a plain `number` via `.toNumber()` before returning to a client component — nothing in this codebase has done this before, and passing a raw `Decimal` across the server/client boundary is unsafe. Writes accept plain `number` inputs.
- Goal name: required, trimmed, 1-50 chars. Target amount: positive number, max 10000. Emoji: one of a fixed 10-option set, defaults to `"🎯"` if omitted or unrecognized.
- Contribution amount: positive number, max 1000. Note: optional, max 100 chars.
- `addContribution` and `deleteSavingsGoal` must verify the goal belongs to the current session user, throwing the same "Not found" error whether the goal doesn't exist or belongs to someone else (never leak which case it was).
- `addContribution` must create the `SavingsContribution` row and increment `SavingsGoal.currentAmount` in a single `prisma.$transaction` — these two writes must never happen independently (per the schema's own comment on `currentAmount`).
- No editing of goals after creation, no withdrawals — contributions are add-only.
- Reaching `currentAmount >= targetAmount` shows a celebration state but the goal stays in the normal list (no archiving) and still accepts further contributions.

---

### Task 1: Savings input validation logic

**Files:**
- Create: `src/lib/savingsValidation.ts`
- Test: `src/lib/savingsValidation.test.ts`

**Interfaces:**
- Consumes: nothing (pure logic, no imports from other new files)
- Produces (used by Task 2's server actions):
  - `export const EMOJI_OPTIONS: readonly string[]`
  - `export interface ValidatedGoalInput { name: string; targetAmount: number; emoji: string }`
  - `export function validateGoalInput(name: string, targetAmount: number, emoji: string | null): ValidatedGoalInput` — throws `Error` with a user-facing message on invalid input
  - `export interface ValidatedContributionInput { amount: number; note: string | null }`
  - `export function validateContributionInput(amount: number, note: string | undefined): ValidatedContributionInput` — throws `Error` with a user-facing message on invalid input

- [ ] **Step 1: Write the failing test**

Create `src/lib/savingsValidation.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/savingsValidation.test.ts`

Expected: FAIL — `Cannot find module './savingsValidation'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/savingsValidation.ts`:

```typescript
// src/lib/savingsValidation.ts

export const EMOJI_OPTIONS = [
  "🎯", "🎮", "🚲", "📚", "👟", "🎨", "🎸", "⚽", "🐶", "🎁",
] as const

export interface ValidatedGoalInput {
  name: string
  targetAmount: number
  emoji: string
}

// Validates and normalizes create-goal input. Returns the normalized
// values on success. Throws an Error with a user-facing message on
// invalid input.
export function validateGoalInput(
  name: string,
  targetAmount: number,
  emoji: string | null
): ValidatedGoalInput {
  const trimmedName = name.trim()
  if (trimmedName.length === 0) {
    throw new Error("Goal name is required")
  }
  if (trimmedName.length > 50) {
    throw new Error("Goal name must be 50 characters or less")
  }

  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new Error("Target amount must be a positive number")
  }
  if (targetAmount > 10000) {
    throw new Error("Target amount must be $10,000 or less")
  }

  const resolvedEmoji =
    emoji && (EMOJI_OPTIONS as readonly string[]).includes(emoji)
      ? emoji
      : "🎯"

  return { name: trimmedName, targetAmount, emoji: resolvedEmoji }
}

export interface ValidatedContributionInput {
  amount: number
  note: string | null
}

// Validates and normalizes add-contribution input. Throws an Error with
// a user-facing message on invalid input.
export function validateContributionInput(
  amount: number,
  note: string | undefined
): ValidatedContributionInput {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number")
  }
  if (amount > 1000) {
    throw new Error("Amount must be $1,000 or less")
  }

  const trimmedNote = note?.trim() || null
  if (trimmedNote && trimmedNote.length > 100) {
    throw new Error("Note must be 100 characters or less")
  }

  return { amount, note: trimmedNote }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' src/lib/savingsValidation.test.ts`

Expected: `PASS:` for all 17 tests, then `All tests passed`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/savingsValidation.ts src/lib/savingsValidation.test.ts
git commit -m "feat: add savings goal input validation logic"
```

---

### Task 2: Savings server actions

**Files:**
- Create: `src/actions/savings.ts`

**Interfaces:**
- Consumes:
  - `validateGoalInput(name, targetAmount, emoji): ValidatedGoalInput` and `validateContributionInput(amount, note): ValidatedContributionInput` from `@/lib/savingsValidation` (Task 1) — both throw on invalid input
  - `auth()` from `@/auth` (existing, used identically to `src/actions/games.ts`)
  - `prisma` from `@/lib/prisma` (existing)
- Produces (used by Task 3's client component):
  - `export interface SavingsGoalWithContributions { id: string; name: string; targetAmount: number; currentAmount: number; emoji: string | null; createdAt: Date; contributionCount: number; recentContributions: { id: string; amount: number; note: string | null; createdAt: Date }[] }`
  - `export async function getSavingsGoals(): Promise<SavingsGoalWithContributions[]>`
  - `export async function createSavingsGoal(name: string, targetAmount: number, emoji: string | null): Promise<void>`
  - `export async function addContribution(goalId: string, amountDollars: number, note?: string): Promise<void>`
  - `export async function deleteSavingsGoal(goalId: string): Promise<void>`

No automated tests for this file — it requires a real authenticated session and a real database connection, matching the exact precedent of `src/actions/games.ts` (`saveGameScore`/`getLeaderboard`), which also has no tests. The pure validation logic it calls into is already tested in Task 1. Verification here is a type-check; the actions get their first real exercise in Task 4's end-to-end browser check.

**A note on `contributionCount` vs. `recentContributions`:** the delete-confirmation dialog (Task 3) needs to say "this will delete its N contributions" with the *true* total count — not just how many happen to be in the 3-item `recentContributions` preview. That's why `SavingsGoalWithContributions` has both fields: `recentContributions` (at most 3, for display) and `contributionCount` (the real total, via Prisma's `_count`).

- [ ] **Step 1: Write the file**

Create `src/actions/savings.ts`:

```typescript
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateGoalInput, validateContributionInput } from "@/lib/savingsValidation"

export interface SavingsGoalWithContributions {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  emoji: string | null
  createdAt: Date
  contributionCount: number
  recentContributions: {
    id: string
    amount: number
    note: string | null
    createdAt: Date
  }[]
}

export async function getSavingsGoals(): Promise<SavingsGoalWithContributions[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: {
        select: { contributions: true },
      },
    },
  })

  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount.toNumber(),
    currentAmount: goal.currentAmount.toNumber(),
    emoji: goal.emoji,
    createdAt: goal.createdAt,
    contributionCount: goal._count.contributions,
    recentContributions: goal.contributions.map((c) => ({
      id: c.id,
      amount: c.amount.toNumber(),
      note: c.note,
      createdAt: c.createdAt,
    })),
  }))
}

export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  emoji: string | null
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const validated = validateGoalInput(name, targetAmount, emoji)

  await prisma.savingsGoal.create({
    data: {
      userId: session.user.id,
      name: validated.name,
      targetAmount: validated.targetAmount,
      emoji: validated.emoji,
    },
  })
}

export async function addContribution(
  goalId: string,
  amountDollars: number,
  note?: string
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const validated = validateContributionInput(amountDollars, note)

  const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found")

  await prisma.$transaction([
    prisma.savingsContribution.create({
      data: {
        goalId,
        amount: validated.amount,
        note: validated.note,
      },
    }),
    prisma.savingsGoal.update({
      where: { id: goalId },
      data: { currentAmount: { increment: validated.amount } },
    }),
  ])
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found")

  await prisma.savingsGoal.delete({ where: { id: goalId } })
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/actions/savings.ts
git commit -m "feat: add savings goal server actions"
```

---

### Task 3: Page shell + client component

**Files:**
- Modify (full rewrite): `src/app/(protected)/savings/page.tsx`
- Create: `src/app/(protected)/savings/SavingsClient.tsx`

**Interfaces:**
- Consumes:
  - `getSavingsGoals(): Promise<SavingsGoalWithContributions[]>`, `createSavingsGoal(name, targetAmount, emoji): Promise<void>`, `addContribution(goalId, amountDollars, note?): Promise<void>`, `deleteSavingsGoal(goalId): Promise<void>`, and `type SavingsGoalWithContributions` from `@/actions/savings` (Task 2)
  - `EMOJI_OPTIONS: readonly string[]` from `@/lib/savingsValidation` (Task 1) — reused directly for rendering the emoji picker buttons, rather than redeclaring the same list a second time
  - `Header` from `@/components/layout/Header`; `Button`, `Card`/`CardContent`/`CardDescription`/`CardHeader`/`CardTitle`, `Input`, `Label`, `Progress`, `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter`, `AlertDialog`/`AlertDialogContent`/`AlertDialogHeader`/`AlertDialogTitle`/`AlertDialogDescription`/`AlertDialogFooter`/`AlertDialogAction`/`AlertDialogCancel` from `@/components/ui/*` (all exist already)
  - `Plus`, `Trash2`, `PiggyBank` from `lucide-react`
- Produces: nothing consumed by later tasks — this is the last file pair before end-to-end verification in Task 4

These two files are one task because neither type-checks in isolation: the page shell imports `SavingsClient`, so they must land together. No automated tests for the client component (stateful UI with dialogs; this repo has no component-testing framework, matching the precedent set by `SavingsRaceClient.tsx`/`CoinCounterClient.tsx`/`BudgetChallengeClient.tsx`, none of which have any). Verification is a type-check here, plus the manual end-to-end browser check in Task 4.

- [ ] **Step 1: Rewrite the page shell**

Replace the full contents of `src/app/(protected)/savings/page.tsx` with:

```typescript
import { getSavingsGoals } from "@/actions/savings"
import { SavingsClient } from "./SavingsClient"

export default async function SavingsPage() {
  const goals = await getSavingsGoals()

  return <SavingsClient goals={goals} />
}
```

- [ ] **Step 2: Write the client component**

Create `src/app/(protected)/savings/SavingsClient.tsx`:

```typescript
// src/app/(protected)/savings/SavingsClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PiggyBank, Plus, Trash2 } from "lucide-react"
import {
  createSavingsGoal,
  addContribution,
  deleteSavingsGoal,
  type SavingsGoalWithContributions,
} from "@/actions/savings"
import { EMOJI_OPTIONS } from "@/lib/savingsValidation"

function formatDollars(amount: number): string {
  return `$${amount.toFixed(2)}`
}

interface GoalCardProps {
  goal: SavingsGoalWithContributions
  onAddMoney: () => void
  onDelete: () => void
}

function GoalCard({ goal, onAddMoney, onDelete }: GoalCardProps) {
  const isComplete = goal.currentAmount >= goal.targetAmount
  const percent = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{goal.emoji ?? "🎯"}</span>
            {goal.name}
          </CardTitle>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isComplete ? (
          <div className="text-center py-2">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-green-600">Goal reached!</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {formatDollars(goal.currentAmount)} of{" "}
            {formatDollars(goal.targetAmount)} saved ({percent}%)
          </div>
        )}
        <Progress value={percent} />

        {goal.recentContributions.length > 0 && (
          <div className="space-y-1">
            {goal.recentContributions.map((c) => (
              <div
                key={c.id}
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span>{c.note || "Contribution"}</span>
                <span>+{formatDollars(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full" onClick={onAddMoney}>
          <Plus className="mr-1 h-3 w-3" />
          Add Money
        </Button>
      </CardContent>
    </Card>
  )
}

interface Props {
  goals: SavingsGoalWithContributions[]
}

export function SavingsClient({ goals }: Props) {
  const router = useRouter()

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalTarget, setNewGoalTarget] = useState("")
  const [newGoalEmoji, setNewGoalEmoji] = useState<string>(EMOJI_OPTIONS[0])
  const [newGoalError, setNewGoalError] = useState<string | null>(null)

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [contributeNote, setContributeNote] = useState("")
  const [contributeError, setContributeError] = useState<string | null>(null)

  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)

  const [isPending, setIsPending] = useState(false)

  const nameValid = newGoalName.trim().length > 0
  const targetValid = parseFloat(newGoalTarget) > 0
  const canCreateGoal = nameValid && targetValid && !isPending

  async function handleCreateGoal() {
    setNewGoalError(null)
    setIsPending(true)
    try {
      await createSavingsGoal(newGoalName, parseFloat(newGoalTarget), newGoalEmoji)
      setIsNewGoalOpen(false)
      setNewGoalName("")
      setNewGoalTarget("")
      setNewGoalEmoji(EMOJI_OPTIONS[0])
      router.refresh()
    } catch (err) {
      setNewGoalError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  const contributeAmountValid = parseFloat(contributeAmount) > 0
  const canContribute = contributeAmountValid && !isPending

  async function handleAddMoney() {
    if (!contributeGoalId) return
    setContributeError(null)
    setIsPending(true)
    try {
      await addContribution(
        contributeGoalId,
        parseFloat(contributeAmount),
        contributeNote.trim() || undefined
      )
      setContributeGoalId(null)
      setContributeAmount("")
      setContributeNote("")
      router.refresh()
    } catch (err) {
      setContributeError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!deleteGoalId) return
    setIsPending(true)
    try {
      await deleteSavingsGoal(deleteGoalId)
      setDeleteGoalId(null)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  const goalBeingDeleted = goals.find((g) => g.id === deleteGoalId)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Savings Goals</h1>
              <p className="text-muted-foreground">
                Track your progress toward what you&apos;re saving for
              </p>
            </div>
            <Button onClick={() => setIsNewGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-6 w-6 text-primary" />
                  No savings goals yet
                </CardTitle>
                <CardDescription>
                  Create your first savings goal to start tracking your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setIsNewGoalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAddMoney={() => setContributeGoalId(goal.id)}
                  onDelete={() => setDeleteGoalId(goal.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="New bike"
                maxLength={50}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-target">Target amount ($)</Label>
              <Input
                id="goal-target"
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1">
              <Label>Pick an emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewGoalEmoji(emoji)}
                    className={`text-2xl p-2 rounded-lg border-2 ${
                      newGoalEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {newGoalError && (
              <p role="alert" className="text-sm text-destructive">
                {newGoalError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGoal} disabled={!canCreateGoal}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contributeGoalId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setContributeGoalId(null)
            setContributeAmount("")
            setContributeNote("")
            setContributeError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="contribute-amount">Amount ($)</Label>
              <Input
                id="contribute-amount"
                type="number"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contribute-note">Note (optional)</Label>
              <Input
                id="contribute-note"
                value={contributeNote}
                onChange={(e) => setContributeNote(e.target.value)}
                placeholder="Birthday money"
                maxLength={100}
              />
            </div>
            {contributeError && (
              <p role="alert" className="text-sm text-destructive">
                {contributeError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAddMoney} disabled={!canContribute}>
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteGoalId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteGoalId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{goalBeingDeleted?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete its {goalBeingDeleted?.contributionCount ?? 0}{" "}
              contribution
              {goalBeingDeleted?.contributionCount === 1 ? "" : "s"}. This can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/savings/page.tsx" "src/app/(protected)/savings/SavingsClient.tsx"
git commit -m "feat: build out Savings Goals create/track UI"
```

---

### Task 4: End-to-end verification

**Files:** none (verification only — no code changes expected; if verification uncovers a real defect, fix it here and commit)

**Interfaces:** none

- [ ] **Step 1: Full build check**

Run: `npx tsc --noEmit && npx next lint`

Expected: no type errors, no lint errors. (If run inside a nested git worktree under the main repo checkout, `next lint` may report a `Plugin "@next/next" was conflicted` error unrelated to this change and will not surface real violations while that's happening — this was confirmed during both the Coin Counter and Budget Challenge builds. If you hit it, re-run `npx next lint` from the actual main checkout, not the worktree, before treating lint as verified. This matters here specifically: unescaped-apostrophe copy (e.g. "you're", "can't", "doesn't") is common in this feature's UI text, and that exact class of error slipped through undetected in the Budget Challenge build for this reason.)

- [ ] **Step 2: Manual end-to-end verification**

Start the dev server and confirm the full flow works for a logged-in user (same approach used for all three games and the auth check):

```bash
npm run dev &> /tmp/savings-goals-dev.log &
for i in $(seq 1 30); do curl -sf http://localhost:3000 -o /dev/null && break; sleep 1; done
```

Then, as a logged-in test user:
1. Visit `/savings` — confirm the empty state renders ("No savings goals yet", "Create your first goal" button)
2. Click "New Goal" (or "Create your first goal") — confirm the create dialog opens with name/target/emoji fields, "Create Goal" disabled until both name and target are filled
3. Create a goal (e.g. name "New Bike", target $100, pick an emoji) — confirm the dialog closes and a goal card appears showing $0.00 of $100.00 saved (0%), the chosen emoji, and an empty progress bar
4. Click "Add Money" on that card — confirm the contribute dialog opens, "Add Money" disabled until a positive amount is entered
5. Add a contribution (e.g. $25, note "birthday money") — confirm the card updates to show $25.00 of $100.00 (25%), and the contribution appears in the recent-contributions list with its note
6. Add 3 more contributions (e.g. $30, $20, $25 with different notes) so the goal reaches exactly $100 — confirm the card switches to the "Goal reached! 🎉" celebration state, and confirm the recent-contributions list shows only the 3 most recent (not all 4)
7. Click "Add Money" again on the completed goal and add $10 more — confirm it's still accepted (contributions are allowed past 100%) and the celebration state remains
8. Create a second goal — confirm both goals now show as separate cards
9. Click the delete icon on one goal — confirm the confirmation dialog shows the correct goal name and the *true* contribution count (not capped at 3) — this specifically verifies the `contributionCount` vs. `recentContributions` distinction from Task 2
10. Confirm the delete — confirm the goal disappears and the other goal is unaffected
11. Check the browser console for errors — expect none
12. As a security check, use a second throwaway user (or the Prisma introspection approach below) to confirm one user cannot see or modify another user's goals: create a goal as User A, note its ID, sign in as User B, and confirm `/savings` shows no goals for User B (list is scoped to the session user)

- [ ] **Step 3: Verify database state directly**

While the dev server is running, confirm the `currentAmount` denormalization actually matches the sum of contributions (this is the core invariant `addContribution`'s transaction exists to protect):

```bash
node -e "
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const r = dotenv.config({ path: '.env.local' });
process.env.DATABASE_URL = r.parsed.DATABASE_URL;
process.env.DATABASE_URL_UNPOOLED = r.parsed.DATABASE_URL_UNPOOLED;
const prisma = new PrismaClient();
(async () => {
  const goals = await prisma.savingsGoal.findMany({ include: { contributions: true } });
  for (const goal of goals) {
    const sum = goal.contributions.reduce((acc, c) => acc + Number(c.amount), 0);
    const current = Number(goal.currentAmount);
    console.log(goal.name, 'currentAmount:', current, 'sum of contributions:', sum, sum === current ? 'MATCH' : 'MISMATCH');
  }
  await prisma.\$disconnect();
})();
"
```

Expected: `MATCH` for every goal created during Step 2.

- [ ] **Step 4: Clean up**

Delete any throwaway test users created during verification (matching the pattern used for the three games' e2e checks — `prisma.user.deleteMany({ where: { email: { contains: "<test-prefix>" } } })`), stop the dev server (`pkill -f "next dev"`), and confirm `git status` is clean (no stray files).
