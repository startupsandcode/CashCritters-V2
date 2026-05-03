# CashCritters V2 — Learning Lessons Feature Design

**Date:** 2026-05-03
**Status:** Approved
**Scope:** Interactive lesson system for the Learn section — content, quiz, progress tracking, lesson gating

---

## 1. Goals

- Make the "Start" buttons on `/learn` navigate to real lesson content
- Deliver 15 lessons across 3 modules with tween-appropriate content (age 10–13) that increases in difficulty within each module
- Quiz after each lesson: 5 multiple-choice questions with immediate feedback
- Save lesson completion and score to the database
- Gate lessons — a kid cannot advance to the next lesson until they pass the current quiz (≥ 80%)

---

## 2. Routes

| Route | Purpose |
|---|---|
| `/learn` | Module list — existing page, updated with per-module progress badges |
| `/learn/[moduleId]` | Module overview — ordered lesson list with per-lesson lock/completion state |
| `/learn/[moduleId]/[lessonId]` | Lesson page — content block + quiz + Complete button |

The `moduleId` and `lessonId` values are slugs defined in the static content files (e.g., `"money-basics"`, `"what-is-money"`).

---

## 3. Database Schema Change

Add `lessonId` to the existing `LearningProgress` model and update the unique constraint to lesson-level granularity.

**Current:**
```prisma
model LearningProgress {
  id          String    @id @default(cuid())
  userId      String
  moduleId    String
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, moduleId])
}
```

**Updated:**
```prisma
model LearningProgress {
  id          String    @id @default(cuid())
  userId      String
  moduleId    String
  lessonId    String
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, moduleId, lessonId])
}
```

No data migration needed — table is empty in production.

---

## 4. Content Structure

All lesson content is static TypeScript — no database, no CMS. Fast reads, zero latency.

```
src/content/lessons/
├── index.ts              # MODULES array — module metadata + lesson list per module
├── money-basics.ts       # 5 lessons
├── saving-habits.ts      # 4 lessons
└── smart-spending.ts     # 6 lessons
```

### Types

```typescript
// src/content/lessons/index.ts

export interface QuizQuestion {
  question: string
  options: string[]       // exactly 4 choices
  correctIndex: number    // 0-based index into options
  explanation: string     // shown after answering ("Correct! Because..." or "Not quite...")
}

export interface Lesson {
  id: string              // slug used in URL and DB — e.g. "what-is-money"
  title: string
  content: string[]       // 3-5 paragraphs at tween reading level
  quiz: QuizQuestion[]    // exactly 5 questions
}

export interface Module {
  id: string              // slug — e.g. "money-basics"
  title: string
  description: string
  lessons: Lesson[]
}

export const MODULES: Module[]
```

### Modules and Lesson Titles

**Money Basics** (`money-basics`) — 5 lessons, progressing from foundational to applied:
1. `what-is-money` — What Is Money?
2. `history-of-money` — The History of Money
3. `earning-money` — How People Earn Money
4. `currency-and-exchange` — Currency and Exchange Rates
5. `money-and-value` — Money, Value, and Prices

**Saving Habits** (`saving-habits`) — 4 lessons:
1. `why-save` — Why Save Money?
2. `setting-goals` — Setting Savings Goals
3. `budgeting-basics` — Budgeting Basics
4. `compound-interest` — The Power of Compound Interest

**Smart Spending** (`smart-spending`) — 6 lessons:
1. `needs-vs-wants` — Needs vs. Wants
2. `making-a-budget` — Making a Budget
3. `comparison-shopping` — Comparison Shopping
4. `understanding-ads` — Understanding Advertisements
5. `credit-and-debt` — Credit and Debt
6. `smart-choices` — Making Smart Financial Choices

Content for each lesson: 3–5 paragraphs written at a grade 5–7 reading level. Difficulty increases within each module — early lessons introduce concepts simply, later lessons add nuance, math examples, and real-world scenarios.

---

## 5. Quiz Rules

- **5 questions** per lesson, each with exactly 4 options
- Kid selects one option → immediate feedback displayed (green + explanation if correct, red + explanation if wrong)
- Answer cannot be changed after selection
- All questions must be answered before the Complete button appears
- **Passing threshold: 80%** — need 4 out of 5 correct (1 mistake allowed)
- If score ≥ 4: "Complete Lesson" button appears → saves to DB → navigates to next lesson
- If score < 4: "Try Again" button appears → resets all answers, content remains visible

---

## 6. Server Actions

```typescript
// src/actions/learn.ts

// Save a passed lesson — only call when score >= passing threshold
export async function completeLesson(
  moduleId: string,
  lessonId: string,
  score: number
): Promise<void>

// Fetch all completed lessons for the current user across all modules
// Returns a Set of "moduleId:lessonId" strings for O(1) lookup
export async function getLessonProgress(): Promise<Set<string>>
```

Both actions call `auth()` to get the session and use the user's id. `completeLesson` uses `prisma.learningProgress.upsert` on `[userId, moduleId, lessonId]`.

---

## 7. Page Architecture

### `/learn` (updated Server Component)
- Calls `getLessonProgress()` to get completed lessons
- For each module, computes `completedCount` and `totalCount`
- Passes progress to the module card: shows badge `3/5` or `✓ 5/5`
- "Start" button label: "Start" (0 done), "Continue" (some done), "Review" (all done)
- All button states navigate to `/learn/[moduleId]`

### `/learn/[moduleId]` (Server Component)
- Looks up module from `MODULES` by `params.moduleId` — 404 if not found
- Calls `getLessonProgress()` to get completed lessons for this user
- Renders ordered lesson list:
  - Completed lesson: checkmark, clickable link
  - Next lesson (first incomplete): "Start" button, unlocked
  - Locked lessons (not yet reachable): grayed out, no link
- Module progress bar: `X of Y lessons complete`
- Back link to `/learn`

### `/learn/[moduleId]/[lessonId]` (Server Component shell + Client Component quiz)
- Server Component: looks up module + lesson from static content, fetches completion state, passes all as props to Client Component
- If lesson is locked (previous not passed): redirect to module overview
- Client Component (`LessonClient`): manages quiz state
  - Shows content paragraphs
  - Shows quiz questions below content
  - Tracks selected answers and revealed feedback per question
  - Computes score when all questions answered
  - Shows "Complete Lesson" or "Try Again" based on pass/fail
  - On complete: calls `completeLesson` Server Action, then `router.push` to next lesson URL (or module overview if last lesson)
- Breadcrumb: `Learning → [Module Title] → [Lesson Title]`
- Prev/Next footer nav — Next is only shown if lesson is already completed (so they can review)

---

## 8. Lesson Gating Logic

A lesson is **unlocked** if:
- It is the first lesson in the module, OR
- The lesson immediately before it in the module's ordered list is in the user's completed set

All other lessons are locked. Locked lessons on the module overview show the lesson title grayed out with a lock icon — no link. Navigating directly to a locked lesson URL redirects to the module overview.

---

## 9. Files Created / Modified

**Created:**
```
src/content/lessons/index.ts
src/content/lessons/money-basics.ts
src/content/lessons/saving-habits.ts
src/content/lessons/smart-spending.ts
src/actions/learn.ts
src/app/(protected)/learn/[moduleId]/page.tsx
src/app/(protected)/learn/[moduleId]/[lessonId]/page.tsx
src/app/(protected)/learn/[moduleId]/[lessonId]/LessonClient.tsx
```

**Modified:**
```
prisma/schema.prisma               add lessonId field + updated unique constraint
src/app/(protected)/learn/page.tsx add progress badges, update button labels
```

---

## 10. Extensibility

Adding a new module (e.g., Investing, Credit Cards, Loans) requires only:
1. A new content file: `src/content/lessons/[module-slug].ts`
2. Adding the module entry to the `MODULES` array in `src/content/lessons/index.ts`

No route changes, schema changes, or server action changes needed. The dynamic routes and DB schema are module-agnostic by design.

---

## 11. Out of Scope (Planned Future Work)

- **Streak tracking** — daily login/lesson streaks with visual indicators
- **Badges / achievements** — unlocks for completing modules, perfect scores, streaks
- **Dashboard progress bar** — wire to real lesson completion data after lessons ship
- **Additional modules** — Investing, Credit Cards, Loans, Options (see Section 10)
- **Lesson content editing UI / CMS** — for non-developer content updates
- **Games feature** — separate spec
