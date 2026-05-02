# CashCritters V2 — Firebase to Vercel Migration Design

**Date:** 2026-05-02  
**Status:** Approved  
**Scope:** Full migration from Firebase to Vercel-native stack, Pages Router to App Router, Tailwind v3 to v4

---

## 1. Goals

- Remove all Firebase dependencies (Auth, Firestore, Admin SDK, client SDK)
- Migrate from Next.js Pages Router to App Router
- Replace Firebase Auth with Auth.js v5 (Google OAuth + email/password)
- Replace Firestore with Vercel Postgres (Neon) via Prisma ORM
- Upgrade Tailwind CSS v3 → v4
- Preserve all existing shadcn/ui component designs and styling
- Start fresh — no existing user data to migrate

---

## 2. Architecture

### Stack

| Layer | Current | New |
|---|---|---|
| Auth | Firebase Auth | Auth.js v5 (next-auth@5) |
| Database | Firestore (unused) | Vercel Postgres (Neon) + Prisma |
| File Storage | Firebase Storage (unused) | Vercel Blob (deferred — add when needed) |
| Routing | Pages Router | App Router |
| Styling | Tailwind v3 + Radix + shadcn | Tailwind v4 + Radix + shadcn |
| Hosting | Vercel | Vercel (no change) |

### Auth.js v5 Notes

- Auth.js v5 is designed for App Router — `auth()` is callable directly in Server Components and Server Actions
- Route protection via a single `middleware.ts` at project root
- Supports Google OAuth now, Apple ID can be added later with no architectural changes (just add the provider)
- Credentials provider (email/password) uses bcrypt for password hashing
- Session strategy: JWT (required when mixing Credentials + OAuth providers)
- Sign-up is handled by a custom Server Action (Auth.js does not include registration)

### App Router Route Groups

```
src/app/
├── layout.tsx                           Root layout (SessionProvider, fonts)
├── page.tsx                             Public home page
├── (auth)/
│   ├── signin/page.tsx                  Sign in (Server Action calls signIn())
│   └── signup/page.tsx                  Sign up (Server Action: hash pw → create user → signIn())
├── (protected)/
│   ├── layout.tsx                       Auth gate — calls auth(), redirects to /signin if no session
│   ├── dashboard/page.tsx
│   ├── savings/page.tsx
│   ├── learn/page.tsx
│   └── games/page.tsx
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts                 Auth.js handler (GET + POST)
```

---

## 3. Database Schema

### Auth.js Required Models

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // null for Google OAuth users; bcrypt hash for email/password users
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  savingsGoals     SavingsGoal[]
  learningProgress LearningProgress[]
  gameScores       GameScore[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### Application Models

```prisma
model SavingsGoal {
  id            String   @id @default(cuid())
  userId        String
  name          String
  targetAmount  Decimal  @db.Decimal(10,2)
  currentAmount Decimal  @default(0) @db.Decimal(10,2)
  emoji         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  contributions SavingsContribution[]
}

model SavingsContribution {
  id        String      @id @default(cuid())
  goalId    String
  amount    Decimal     @db.Decimal(10,2)
  note      String?
  createdAt DateTime    @default(now())

  goal      SavingsGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
}

model LearningProgress {
  id          String    @id @default(cuid())
  userId      String
  moduleId    String
  completed   Boolean   @default(false)
  score       Int?
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, moduleId])
}

model GameScore {
  id        String   @id @default(cuid())
  userId    String
  gameId    String
  score     Int
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Schema Decisions

- `SavingsContribution` logs every deposit for history display; `currentAmount` on `SavingsGoal` is a running total for fast reads
- `LearningProgress` uses `@@unique([userId, moduleId])` — upsert on progress updates, no duplicates
- `GameScore` keeps all scores (not just best) — best score computed at query time, history available
- `password` is nullable — Google OAuth users never have one; Credentials users always do

---

## 4. Auth Setup

### Core Config (`src/auth.ts`)

```typescript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      authorize: async ({ email, password }) => {
        const user = await prisma.user.findUnique({ where: { email: email as string } })
        if (!user?.password) return null  // Google-only account
        const valid = await bcrypt.compare(password as string, user.password)
        return valid ? user : null
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",   // use our custom page, not Auth.js default /api/auth/signin
  },
})
```

### Route Protection (`middleware.ts`)

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/savings/:path*", "/learn/:path*", "/games/:path*"]
}
```

### Sign-Out

Handled via Server Action in a `SignOutButton` Client Component:

```typescript
// src/components/auth/SignOutButton.tsx
import { signOut } from "@/auth"

export function SignOutButton() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
      <button type="submit">Sign out</button>
    </form>
  )
}
```

Auth.js also exposes `/api/auth/signout` automatically via the catch-all route handler.

### Adding Apple ID Later

Add to providers array in `src/auth.ts`:
```typescript
import Apple from "next-auth/providers/apple"
// ... add Apple to providers array
```
No architectural changes needed.

---

## 5. Tailwind v4 Migration

### Key Changes from v3

- `tailwind.config.ts` is removed — configuration moves into CSS
- `postcss.config.js` uses `@tailwindcss/postcss` instead of `tailwindcss`
- `globals.css` uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- CSS variables for theme tokens defined in `@theme` block in CSS

### shadcn/ui

- All `src/components/ui/` components kept — updated to Tailwind v4 class syntax where needed
- Visual design preserved; only syntax updates applied

---

## 6. Environment Variables

### Remove

All `NEXT_PUBLIC_FIREBASE_*` variables and `FIREBASE_SERVICE_ACCOUNT_KEY`.

### Add

```bash
# Auth.js
NEXTAUTH_SECRET=                  # openssl rand -base64 32
AUTH_GOOGLE_ID=                   # Google Cloud Console (same app as before)
AUTH_GOOGLE_SECRET=               # Google Cloud Console

# Vercel Postgres (auto-populated by Vercel dashboard integration)
DATABASE_URL=                     # pooled Neon connection string
DATABASE_URL_UNPOOLED=            # direct Neon connection string (for Prisma migrations)
```

---

## 7. Files Removed

```
src/lib/firebase.ts
src/lib/firebase-admin.ts
src/contexts/AuthContext.tsx
src/services/authService.ts
src/pages/                        (entire directory)
firebase.json
.firebaserc
firestore.rules
firestore.indexes.json
database.rules.json
storage.rules
```

## 8. Files Added

```
src/auth.ts
src/lib/prisma.ts
middleware.ts
prisma/schema.prisma
src/app/layout.tsx
src/app/page.tsx
src/app/(auth)/signin/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(protected)/layout.tsx
src/app/(protected)/dashboard/page.tsx
src/app/(protected)/savings/page.tsx
src/app/(protected)/learn/page.tsx
src/app/(protected)/games/page.tsx
src/app/api/auth/[...nextauth]/route.ts
src/components/auth/SignOutButton.tsx
```

## 9. Files Updated

```
package.json                      dependency swap
src/components/ui/                shadcn components updated to Tailwind v4
src/components/layout/Header.tsx  use SignOutButton, useSession instead of useAuth
src/styles/globals.css            @import "tailwindcss", @theme block
postcss.config.js                 @tailwindcss/postcss
```

---

## 10. Out of Scope

- Apple ID auth (deferred — add after initial launch)
- Vercel Blob / file uploads (deferred — no active usage)
- Email verification flow (can be added to Auth.js config later)
- Any new feature development (migration only)
