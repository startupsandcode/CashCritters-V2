# CashCritters V2 — Savings Goals Design

**Date:** 2026-07-05
**Status:** Approved
**Scope:** Build out the Savings Goals feature (currently a static, unwired placeholder page)

---

## 1. Background

`src/app/(protected)/savings/page.tsx` is currently a fully static placeholder: hardcoded "No savings goals yet" card, and both the "New Goal" and "Create your first goal" buttons have no `onClick` handlers — they do nothing. There is no `src/actions/savings.ts`, no client component, and nothing in the app reads or writes the `SavingsGoal` / `SavingsContribution` Prisma models, even though both already exist in `prisma/schema.prisma`:

```prisma
model SavingsGoal {
  id            String   @id @default(cuid())
  userId        String
  name          String
  targetAmount  Decimal  @db.Decimal(10, 2)
  currentAmount Decimal  @default(0) @db.Decimal(10, 2)
  emoji         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  contributions SavingsContribution[]
}

model SavingsContribution {
  id        String      @id @default(cuid())
  goalId    String
  amount    Decimal     @db.Decimal(10, 2)
  note      String?
  createdAt DateTime    @default(now())

  goal SavingsGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
}
```

This was confirmed via `superpowers:systematic-debugging` — it's not a bug, it's an unbuilt feature. This spec covers building it out: create a goal, list goals, add a contribution, and see progress.

---

## 2. Goals

- Users can create multiple concurrent savings goals
- Each goal shows progress toward its target, with recent contribution history
- Users can log a contribution ("Add Money") against any goal
- Users can delete a goal they no longer want
- Reaching a goal's target shows a celebration state, without archiving it

---

## 3. Data Flow — the Decimal Gotcha

`SavingsGoal.targetAmount` / `currentAmount` and `SavingsContribution.amount` are Prisma `Decimal` fields (`@db.Decimal(10, 2)`). Nothing in this codebase has touched a Prisma `Decimal` yet — it's a class instance (`Prisma.Decimal`), not a plain JS number, and does not safely cross the Next.js server-action → client-component boundary as-is (it can serialize incorrectly or throw, since it's not a plain object).

**Rule for this feature:** every server action that *reads* goal/contribution data converts `Decimal` fields to plain `number` (dollars, e.g. `49.99`) via `.toNumber()` before returning. Server actions that *write* accept plain `number` inputs and let Prisma's client coerce them into `Decimal` on insert — no manual `Decimal` construction needed on the write side.

---

## 4. Server Actions (`src/actions/savings.ts`, new file)

```typescript
export interface SavingsGoalWithContributions {
  id: string
  name: string
  targetAmount: number   // dollars
  currentAmount: number  // dollars
  emoji: string | null
  createdAt: Date
  recentContributions: {
    id: string
    amount: number       // dollars
    note: string | null
    createdAt: Date
  }[]
}

// Fetches all goals for the current session user, each with its 3 most
// recent contributions (ordered newest first). Throws if unauthenticated.
export async function getSavingsGoals(): Promise<SavingsGoalWithContributions[]>

// Creates a new goal for the current session user.
// - name: trimmed, must be non-empty, max 50 chars
// - targetAmount: must be a positive number, max 10000
// - emoji: must be one of the fixed EMOJI_OPTIONS (see Section 6), defaults to "🎯" if omitted
// Throws on invalid input or unauthenticated.
export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  emoji: string | null
): Promise<void>

// Adds a contribution to a goal. Verifies the goal belongs to the current
// session user (throws "Not found" otherwise — same 404-shaped error
// whether the goal doesn't exist or belongs to someone else, so this
// action can't be used to probe for other users' goal IDs).
// - amountDollars: must be a positive number, max 1000
// - note: optional, max 100 chars
// In a single prisma.$transaction: creates the SavingsContribution row
// AND increments the goal's currentAmount by the same amount — these
// two writes must never happen independently (per the schema's own
// comment on SavingsGoal.currentAmount).
export async function addContribution(
  goalId: string,
  amountDollars: number,
  note?: string
): Promise<void>

// Deletes a goal (and, via onDelete: Cascade, its contributions).
// Verifies the goal belongs to the current session user first (same
// not-found-shaped error as addContribution for ownership violations).
export async function deleteSavingsGoal(goalId: string): Promise<void>
```

All four actions call `auth()` for the session, following the exact pattern already used in `src/actions/games.ts`.

---

## 5. Page Architecture

### `/savings` — Server Component shell (rewrite of the current placeholder)

- Calls `getSavingsGoals()` to pre-fetch the user's goals
- Passes the goals array to `SavingsClient`

### `SavingsClient` — Client Component (new)

Owns:
- Whether the "New Goal" dialog is open, and its form state (name, target amount, emoji selection)
- Whether an "Add Money" dialog is open for a specific goal, and its form state (amount, note)
- Whether a delete-confirmation dialog is open for a specific goal
- Calls `router.refresh()` after any successful create/contribute/delete to reload the server-fetched goal list

Uses the existing shadcn `Dialog` and `AlertDialog` components (already in `src/components/ui/`) for the three interactions — no new routes, no page navigation, everything happens in-place on `/savings`.

### `GoalCard` (sub-component within `SavingsClient.tsx`, not a separate file — small enough to co-locate)

For each goal, renders:
- Emoji + name as the header
- If `currentAmount >= targetAmount`: a celebration state — "Goal reached! 🎉", full progress bar, still shows "Add Money" (further contributions are allowed, just don't change the celebration state)
- Otherwise: a `Progress` bar (existing shadcn component, value capped at 100 for display even if currentAmount somehow exceeds targetAmount before the celebration threshold check runs) + "$X of $Y saved (Z%)"
- The 3 most recent contributions from `recentContributions` (date, amount, note if present)
- "Add Money" button → opens the contribute dialog for this goal
- A delete icon button → opens the delete-confirmation dialog for this goal

---

## 6. Create-Goal Form

- **Name:** required text input, trimmed, 1-50 chars
- **Target amount:** required number input, dollars, must be > 0 and <= 10000
- **Emoji:** a row of selectable emoji buttons (not a full picker/keyboard) — fixed set:

```typescript
const EMOJI_OPTIONS = ["🎯", "🎮", "🚲", "📚", "👟", "🎨", "🎸", "⚽", "🐶", "🎁"]
```

Defaults to `"🎯"` if the user doesn't pick one. "Create Goal" is disabled until name and target amount are both valid.

---

## 7. Add-Money Form

- **Amount:** required number input, dollars, must be > 0 and <= 1000
- **Note:** optional text input, max 100 chars (e.g. "birthday money")

"Add Money" is disabled until amount is valid. On submit, calls `addContribution(goalId, amount, note)`, closes the dialog, and refreshes.

---

## 8. Delete Confirmation

Standard `AlertDialog` — "Delete '<goal name>'? This will also delete its N contributions. This can't be undone." with Cancel / Delete (destructive-styled) actions, matching shadcn's standard `AlertDialog` usage.

---

## 9. Out of Scope

- **Editing** a goal's name or target amount after creation — delete and recreate covers this for now
- **Withdrawals** / negative adjustments to a goal's progress — contributions are add-only, matching the schema's "must be positive" comment
- **Archiving completed goals** — reaching the target shows a celebration state but the goal stays in the normal list
- **Full contribution history view** (beyond the 3 most recent shown on the card) — could be a future "view all" detail page, not needed for this pass
