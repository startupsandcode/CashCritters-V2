# CashCritters V2 — Learning Lessons Feature Design

**Date:** 2026-05-03
**Status:** Approved
**Scope:** Interactive lesson system for the Learn section — content, quiz, progress tracking, lesson gating

---

## 1. Goals

- Make the "Start" buttons on `/learn` navigate to real lesson content
- Deliver 15 lessons across 3 tracks with tween-appropriate content (age 10–13) that increases in difficulty within each track
- Quiz after each lesson: 5 multiple-choice questions with immediate feedback
- Save lesson completion and score to the database
- Gate lessons — a kid cannot advance to the next lesson until they pass the current quiz (≥ 80%)

---

## 2. Routes

| Route | Purpose |
|---|---|
| `/learn` | Track list — existing page, updated with per-track progress badges |
| `/learn/[trackId]` | Track overview — ordered lesson list with per-lesson lock/completion state |
| `/learn/[trackId]/[lessonId]` | Lesson page — content block + quiz + Complete button |

The `trackId` and `lessonId` values are slugs defined in the static content files (e.g., `"money-basics"`, `"what-is-money"`).

---

## 3. Database Schema Change

Add `lessonId` to the existing `LearningProgress` model and update the unique constraint to lesson-level granularity.

**Current:**
```prisma
model LearningProgress {
  id          String    @id @default(cuid())
  userId      String
  trackId    String
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, trackId])
}
```

**Updated:**
```prisma
model LearningProgress {
  id          String    @id @default(cuid())
  userId      String
  trackId    String
  lessonId    String
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, trackId, lessonId])
}
```

No data migration needed — table is empty in production.

---

## 4. Content Structure

All lesson content is static TypeScript — no database, no CMS. Fast reads, zero latency.

```
src/content/lessons/
├── index.ts              # MODULES array — track metadata + lesson list per track
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

export interface Track {
  id: string              // slug — e.g. "money-basics"
  title: string
  description: string
  lessons: Lesson[]
}

export const MODULES: Track[]
```

### Tracks and Lesson Titles

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

Content for each lesson: 3–5 paragraphs written at a grade 5–7 reading level. Difficulty increases within each track — early lessons introduce concepts simply, later lessons add nuance, math examples, and real-world scenarios.

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
  trackId: string,
  lessonId: string,
  score: number
): Promise<void>

// Fetch all completed lessons for the current user across all tracks
// Returns a Set of "trackId:lessonId" strings for O(1) lookup
export async function getLessonProgress(): Promise<Set<string>>
```

Both actions call `auth()` to get the session and use the user's id. `completeLesson` uses `prisma.learningProgress.upsert` on `[userId, trackId, lessonId]`.

---

## 7. Page Architecture

### `/learn` (updated Server Component)
- Calls `getLessonProgress()` to get completed lessons
- For each track, computes `completedCount` and `totalCount`
- Passes progress to the track card: shows badge `3/5` or `✓ 5/5`
- "Start" button label: "Start" (0 done), "Continue" (some done), "Review" (all done)
- All button states navigate to `/learn/[trackId]`

### `/learn/[trackId]` (Server Component)
- Looks up track from `MODULES` by `params.trackId` — 404 if not found
- Calls `getLessonProgress()` to get completed lessons for this user
- Renders ordered lesson list:
  - Completed lesson: checkmark, clickable link
  - Next lesson (first incomplete): "Start" button, unlocked
  - Locked lessons (not yet reachable): grayed out, no link
- Track progress bar: `X of Y lessons complete`
- Back link to `/learn`

### `/learn/[trackId]/[lessonId]` (Server Component shell + Client Component quiz)
- Server Component: looks up track + lesson from static content, fetches completion state, passes all as props to Client Component
- If lesson is locked (previous not passed): redirect to track overview
- Client Component (`LessonClient`): manages quiz state
  - Shows content paragraphs
  - Shows quiz questions below content
  - Tracks selected answers and revealed feedback per question
  - Computes score when all questions answered
  - Shows "Complete Lesson" or "Try Again" based on pass/fail
  - On complete: calls `completeLesson` Server Action, then `router.push` to next lesson URL (or track overview if last lesson)
- Breadcrumb: `Learning → [Track Title] → [Lesson Title]`
- Prev/Next footer nav — Next is only shown if lesson is already completed (so they can review)

---

## 8. Lesson Gating Logic

A lesson is **unlocked** if:
- It is the first lesson in the track, OR
- The lesson immediately before it in the track's ordered list is in the user's completed set

All other lessons are locked. Locked lessons on the track overview show the lesson title grayed out with a lock icon — no link. Navigating directly to a locked lesson URL redirects to the track overview.

---

## 9. Files Created / Modified

**Created:**
```
src/content/lessons/index.ts
src/content/lessons/money-basics.ts
src/content/lessons/saving-habits.ts
src/content/lessons/smart-spending.ts
src/actions/learn.ts
src/app/(protected)/learn/[trackId]/page.tsx
src/app/(protected)/learn/[trackId]/[lessonId]/page.tsx
src/app/(protected)/learn/[trackId]/[lessonId]/LessonClient.tsx
```

**Modified:**
```
prisma/schema.prisma               add lessonId field + updated unique constraint
src/app/(protected)/learn/page.tsx add progress badges, update button labels
```

---

## 10. Extensibility

Adding a new track (e.g., Investing, Credit Cards, Loans) requires only:
1. A new content file: `src/content/lessons/[track-slug].ts`
2. Adding the track entry to the `MODULES` array in `src/content/lessons/index.ts`

No route changes, schema changes, or server action changes needed. The dynamic routes and DB schema are track-agnostic by design.

---

## 11. Out of Scope (Planned Future Work)

- **Streak tracking** — daily login/lesson streaks with visual indicators
- **Badges / achievements** — unlocks for completing tracks, perfect scores, streaks
- **Dashboard progress bar** — wire to real lesson completion data after lessons ship
- **Additional tracks** — Investing, Credit Cards, Loans, Options (see Section 10)
- **Lesson content editing UI / CMS** — for non-developer content updates
- **Games feature** — separate spec
