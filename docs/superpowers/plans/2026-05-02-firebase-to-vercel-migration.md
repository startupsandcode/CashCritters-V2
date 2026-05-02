# Firebase to Vercel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully migrate CashCritters V2 from Firebase to Vercel-native stack (Auth.js v5 + Vercel Postgres + Prisma), from Pages Router to App Router, and from Tailwind v3 to v4.

**Architecture:** Auth.js v5 handles email/password and Google OAuth via a single `src/auth.ts` config file; Prisma ORM manages all database access against a Vercel Postgres (Neon) instance; the App Router replaces all Pages Router files with route groups `(auth)` for public auth pages and `(protected)` for authenticated pages gated by a shared layout.

**Tech Stack:** Next.js 14, Auth.js v5 (`next-auth@5`), `@auth/prisma-adapter`, Prisma + `@prisma/client`, Vercel Postgres (Neon), `bcryptjs`, Tailwind CSS v4, `@tailwindcss/postcss`, shadcn/ui (unchanged), Radix UI (unchanged).

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Delete | `src/lib/firebase.ts` | Firebase client SDK init |
| Delete | `src/lib/firebase-admin.ts` | Firebase admin SDK init |
| Delete | `src/contexts/AuthContext.tsx` | Firebase auth context |
| Delete | `src/services/authService.ts` | Firebase auth service |
| Delete | `src/pages/` | Entire Pages Router directory |
| Delete | `firebase.json`, `.firebaserc` | Firebase project config |
| Delete | `firestore.rules`, `firestore.indexes.json` | Firestore rules |
| Delete | `database.rules.json`, `storage.rules` | Firebase DB/Storage rules |
| Delete | `tailwind.config.ts` | Replaced by CSS config in v4 |
| Create | `prisma/schema.prisma` | Full database schema |
| Create | `src/lib/prisma.ts` | Prisma client singleton |
| Create | `src/auth.ts` | Auth.js v5 config (single source of truth) |
| Create | `src/types/next-auth.d.ts` | Session type augmentation |
| Create | `src/app/api/auth/[...nextauth]/route.ts` | Auth.js catch-all handler |
| Create | `middleware.ts` | Route protection (project root) |
| Create | `src/actions/auth.ts` | Server Actions: loginUser, registerUser, logoutUser |
| Create | `src/components/providers/SessionProviderWrapper.tsx` | Client wrapper for SessionProvider |
| Create | `src/components/auth/SignOutButton.tsx` | Sign-out form button |
| Create | `src/app/layout.tsx` | Root layout with SessionProvider |
| Create | `src/app/page.tsx` | Public home page |
| Create | `src/app/(auth)/signin/page.tsx` | Sign-in page |
| Create | `src/app/(auth)/signup/page.tsx` | Sign-up page |
| Create | `src/app/(protected)/layout.tsx` | Auth gate — redirects if no session |
| Create | `src/app/(protected)/dashboard/page.tsx` | Dashboard |
| Create | `src/app/(protected)/savings/page.tsx` | Savings tracker |
| Create | `src/app/(protected)/learn/page.tsx` | Learning modules |
| Create | `src/app/(protected)/games/page.tsx` | Games |
| Modify | `package.json` | Swap Firebase → Auth.js/Prisma, Tailwind v3 → v4 |
| Modify | `postcss.config.mjs` | Use `@tailwindcss/postcss` |
| Modify | `src/styles/globals.css` | Tailwind v4 import + @theme block |
| Modify | `src/components/layout/Header.tsx` | App Router + useSession + SignOutButton |

**Task ordering note:** `Header.tsx` imports from the deleted `AuthContext.tsx`, so the Header must be rewritten (Task 8) before any page imports it (Task 11+). Auth Server Actions (Task 7) must exist before the Header uses them (Task 8). This ordering ensures every TypeScript check passes cleanly.

---

## Task 1: Remove Firebase files and swap packages

**Files:**
- Delete: `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `src/contexts/AuthContext.tsx`, `src/services/authService.ts`
- Delete: `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `database.rules.json`, `storage.rules`
- Modify: `package.json`

- [ ] **Step 1: Delete Firebase source files**

```bash
rm src/lib/firebase.ts src/lib/firebase-admin.ts src/contexts/AuthContext.tsx src/services/authService.ts
```

- [ ] **Step 2: Delete Firebase project config files**

```bash
rm firebase.json .firebaserc firestore.rules firestore.indexes.json database.rules.json storage.rules
```

- [ ] **Step 3: Update package.json**

Replace the entire `package.json`. Changes: remove `firebase`, `firebase-admin`, `react-firebase-hooks`; add `next-auth@5`, `@auth/prisma-adapter`, `@prisma/client`, `bcryptjs`; upgrade `tailwindcss` to v4 and add `@tailwindcss/postcss`:

```json
{
  "name": "softgen-firebase-starter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.0.0",
    "@faker-js/faker": "^9.4.0",
    "@hookform/resolvers": "^3.10.0",
    "@prisma/client": "^6.0.0",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.5",
    "@radix-ui/react-aspect-ratio": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-collapsible": "^1.1.2",
    "@radix-ui/react-context-menu": "^2.2.5",
    "@radix-ui/react-dialog": "^1.1.5",
    "@radix-ui/react-dropdown-menu": "^2.1.5",
    "@radix-ui/react-hover-card": "^1.1.5",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-menubar": "^1.1.5",
    "@radix-ui/react-navigation-menu": "^1.2.4",
    "@radix-ui/react-popover": "^1.1.5",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.5",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.5",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.7",
    "@stripe/react-stripe-js": "^3.1.1",
    "@stripe/stripe-js": "^5.5.0",
    "@t3-oss/env-nextjs": "^0.12.0",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.5.2",
    "framer-motion": "^12.0.6",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.474.0",
    "micro": "^10.0.1",
    "next": "^14.2.13",
    "next-auth": "^5.0.0",
    "next-themes": "^0.4.4",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-error-boundary": "^5.0.0",
    "react-hook-form": "^7.54.2",
    "react-intersection-observer": "^9.15.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.1",
    "sonner": "^1.7.2",
    "stripe": "^17.6.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "ts-node": "^10.9.2",
    "vaul": "^1.1.2",
    "vercel": "^39.3.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.13",
    "eslint-config-prettier": "^9.1.0",
    "postcss": "^8",
    "prisma": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5"
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: clean install with no peer dependency errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Firebase, add Auth.js v5 + Prisma + Tailwind v4 packages"
```

---

## Task 2: Set up Vercel Postgres

**Files:**
- Create/Modify: `.env.local`, `.env.example`

- [ ] **Step 1: Add Postgres to your Vercel project**

In your browser:
1. Go to vercel.com → your CashCritters project → **Storage** tab
2. Click **Create Database** → select **Postgres** (Neon)
3. Name it `cashcritters-db`, keep default region
4. Click **Create**

- [ ] **Step 2: Pull environment variables locally**

```bash
npx vercel env pull .env.local
```

Expected: `.env.local` is created/updated with `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, and related vars.

- [ ] **Step 3: Add Auth.js environment variables to .env.local**

Open `.env.local` and append these lines (keep the Postgres vars Vercel added):

```bash
# Auth.js
NEXTAUTH_SECRET=                  # replace with: openssl rand -base64 32
AUTH_GOOGLE_ID=                   # from Google Cloud Console (same app as before)
AUTH_GOOGLE_SECRET=               # from Google Cloud Console

# Prisma aliases
DATABASE_URL="${POSTGRES_PRISMA_URL}"
DATABASE_URL_UNPOOLED="${POSTGRES_URL_NON_POOLING}"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Copy the output as the value for `NEXTAUTH_SECRET` in `.env.local`.

- [ ] **Step 4: Create .env.example**

```bash
cat > .env.example << 'EOF'
# Auth.js
NEXTAUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Vercel Postgres (auto-populated by: npx vercel env pull .env.local)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
EOF
```

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example for required environment variables"
```

---

## Task 3: Create Prisma schema and push to database

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
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

model GameScore {
  id        String   @id @default(cuid())
  userId    String
  gameId    String
  score     Int
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` with no errors.

- [ ] **Step 3: Push schema to database**

```bash
npx prisma db push
```

Expected: `✔ Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Verify tables exist**

```bash
npx prisma studio
```

Open the browser tab. Confirm all 8 tables are present: User, Account, Session, VerificationToken, SavingsGoal, SavingsContribution, LearningProgress, GameScore. Close Prisma Studio (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema with auth and app data models"
```

---

## Task 4: Create Prisma client singleton

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Create src/lib/prisma.ts**

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: errors only on files that still reference deleted Firebase modules (`src/pages/` files and `src/components/layout/Header.tsx`). Errors on `src/lib/prisma.ts` itself: none.

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma client singleton"
```

---

## Task 5: Configure Auth.js v5

**Files:**
- Create: `src/auth.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create src/auth.ts**

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
      authorize: async (credentials) => {
        const { email, password } = credentials as {
          email: string
          password: string
        }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.password) return null
        const valid = await bcrypt.compare(password, user.password)
        return valid ? user : null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      return session
    },
  },
})
```

- [ ] **Step 2: Create src/types/next-auth.d.ts**

```typescript
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

- [ ] **Step 3: Create src/app/api/auth/[...nextauth]/route.ts**

```bash
mkdir -p "src/app/api/auth/[...nextauth]"
```

```typescript
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 4: TypeScript check on new files only**

```bash
npx tsc --noEmit 2>&1 | grep -E "^src/(auth|types|app/api)"
```

Expected: no errors on `src/auth.ts`, `src/types/next-auth.d.ts`, or `src/app/api/auth/`.

- [ ] **Step 5: Commit**

```bash
git add src/auth.ts src/types/next-auth.d.ts "src/app/api/auth/[...nextauth]/route.ts"
git commit -m "feat: configure Auth.js v5 with Google OAuth and credentials providers"
```

---

## Task 6: Add route protection middleware

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create middleware.ts at project root (same level as package.json)**

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/savings/:path*",
    "/learn/:path*",
    "/games/:path*",
  ],
}
```

- [ ] **Step 2: TypeScript check on new file**

```bash
npx tsc --noEmit 2>&1 | grep "middleware.ts"
```

Expected: no output (no errors on middleware.ts).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for protected route redirection"
```

---

## Task 7: Create auth Server Actions

**Files:**
- Create: `src/actions/auth.ts`

This task must happen before Task 8 (Header rewrite) because the Header's SignOutButton imports `logoutUser` from this file.

- [ ] **Step 1: Create src/actions/auth.ts**

```typescript
"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" }
    }
    throw error
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" })
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/signin")
    }
    throw error
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" })
}
```

- [ ] **Step 2: TypeScript check on new file**

```bash
npx tsc --noEmit 2>&1 | grep "src/actions"
```

Expected: no output (no errors on `src/actions/auth.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat: add auth Server Actions (login, register, logout, Google)"
```

---

## Task 8: Create SignOutButton and rewrite Header

**Files:**
- Create: `src/components/auth/SignOutButton.tsx`
- Modify: `src/components/layout/Header.tsx`

This task must happen before any App Router page imports `Header` (Task 11+), because `Header.tsx` currently imports from the deleted `AuthContext.tsx`.

- [ ] **Step 1: Create src/components/auth/SignOutButton.tsx**

```typescript
"use client"

import { logoutUser } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <form action={logoutUser}>
      {mobile ? (
        <Button type="submit" variant="outline" className="w-full mt-4">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      ) : (
        <Button type="submit" variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Replace src/components/layout/Header.tsx**

Replace the entire file. Replaces `useRouter` (Pages Router) with `usePathname` (App Router) and `useAuth` with `useSession`:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { useState } from "react"

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Learn", href: "/learn" },
  { name: "Games", href: "/games" },
  { name: "Savings", href: "/savings" },
]

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">Cash Critters</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {session &&
            navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <div className="hidden md:flex">
                <SignOutButton />
              </div>

              {/* Mobile Menu */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-base font-medium transition-colors hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <SignOutButton mobile />
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Link href="/signin" className="hidden md:block">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>

              {/* Mobile Menu */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link
                      href="/signin"
                      className="text-base font-medium transition-colors hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="text-base font-medium transition-colors hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: TypeScript check on new and modified files**

```bash
npx tsc --noEmit 2>&1 | grep -E "src/components/(auth|layout)"
```

Expected: no output (no errors on SignOutButton or Header).

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/SignOutButton.tsx src/components/layout/Header.tsx
git commit -m "feat: add SignOutButton and rewrite Header for App Router"
```

---

## Task 9: Migrate Tailwind CSS to v4

**Files:**
- Modify: `postcss.config.mjs`
- Delete: `tailwind.config.ts`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Update postcss.config.mjs**

Replace the entire file:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
```

- [ ] **Step 2: Delete tailwind.config.ts**

```bash
rm tailwind.config.ts
```

- [ ] **Step 3: Replace src/styles/globals.css**

Replace the entire file. This ports all CSS variable values and theme tokens from the deleted `tailwind.config.ts` into Tailwind v4's CSS-based config:

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@layer base {
  :root {
    --background: 47 95% 97%;
    --foreground: 220 40% 30%;
    --card: 0 0% 100%;
    --card-foreground: 220 40% 30%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 40% 30%;
    --primary: 142 70% 45%;
    --primary-foreground: 0 0% 100%;
    --secondary: 35 100% 65%;
    --secondary-foreground: 220 40% 30%;
    --muted: 47 70% 94%;
    --muted-foreground: 220 10% 50%;
    --accent: 358 85% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 47 70% 90%;
    --input: 47 70% 90%;
    --ring: 142 70% 45%;
    --chart-1: 358 85% 60%;
    --chart-2: 35 100% 65%;
    --chart-3: 142 70% 45%;
    --chart-4: 220 70% 60%;
    --chart-5: 190 90% 60%;
    --radius: 1rem;
    --sidebar-background: 47 95% 97%;
    --sidebar-foreground: 220 40% 30%;
    --sidebar-primary: 142 70% 45%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 358 85% 60%;
    --sidebar-accent-foreground: 0 0% 100%;
    --sidebar-border: 47 70% 90%;
    --sidebar-ring: 142 70% 45%;
  }

  .dark {
    --background: 220 40% 10%;
    --foreground: 0 0% 95%;
    --card: 220 40% 12%;
    --card-foreground: 0 0% 95%;
    --popover: 220 40% 12%;
    --popover-foreground: 0 0% 95%;
    --primary: 142 70% 45%;
    --primary-foreground: 0 0% 100%;
    --secondary: 35 100% 65%;
    --secondary-foreground: 220 40% 30%;
    --muted: 220 30% 20%;
    --muted-foreground: 0 0% 75%;
    --accent: 358 85% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 95%;
    --border: 220 30% 20%;
    --input: 220 30% 20%;
    --ring: 142 70% 45%;
    --chart-1: 358 85% 60%;
    --chart-2: 35 100% 65%;
    --chart-3: 142 70% 45%;
    --chart-4: 220 70% 60%;
    --chart-5: 190 90% 60%;
    --sidebar-background: 220 40% 10%;
    --sidebar-foreground: 0 0% 95%;
    --sidebar-primary: 142 70% 45%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 358 85% 60%;
    --sidebar-accent-foreground: 0 0% 100%;
    --sidebar-border: 220 30% 20%;
    --sidebar-ring: 142 70% 45%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: Arial, Helvetica, sans-serif;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .container {
    @apply mx-auto px-4 md:px-6 lg:px-8 max-w-7xl w-full;
  }
}
```

- [ ] **Step 4: Verify build compiles with Tailwind v4**

```bash
npm run build
```

Expected: build succeeds. If you see an error about `tailwindcss-animate` plugin compatibility, remove the `@plugin "tailwindcss-animate"` line from `globals.css` — the `@keyframes` and `--animate-*` entries already in the file handle accordion animations without it.

- [ ] **Step 5: Commit**

```bash
git add postcss.config.mjs src/styles/globals.css
git commit -m "feat: migrate Tailwind CSS v3 to v4 with CSS-based config"
```

---

## Task 10: Create App Router root layout and SessionProvider wrapper

**Files:**
- Create: `src/components/providers/SessionProviderWrapper.tsx`
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Create src/components/providers/SessionProviderWrapper.tsx**

`SessionProvider` from `next-auth/react` must be a Client Component. This wrapper lets the Server Component root layout use it:

```typescript
"use client"

import { SessionProvider } from "next-auth/react"

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 2: Create src/app/layout.tsx**

```typescript
import type { Metadata } from "next"
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Cash Critters - Fun Financial Education for Kids",
  description:
    "Learn about money, saving, and financial concepts in a fun, interactive way designed for kids.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: TypeScript check on new files**

```bash
npx tsc --noEmit 2>&1 | grep -E "src/(components/providers|app/layout)"
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/providers/SessionProviderWrapper.tsx src/app/layout.tsx
git commit -m "feat: add App Router root layout with SessionProvider"
```

---

## Task 11: Create public home page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create src/app/page.tsx**

Ports the existing home page to App Router (removes `Head`, removes `useRouter`, updates auth link paths from `/auth/signin` → `/signin` and `/auth/signup` → `/signup`):

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Coins, Wallet, TrendingUp, BookOpen, PiggyBank } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-accent/20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Make Learning About Money{" "}
                  <span className="text-primary">Fun!</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Cash Critters helps children understand financial concepts
                  through interactive games, challenges, and rewards.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/signin">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-square bg-primary/10 rounded-full flex items-center justify-center">
                  <PiggyBank className="w-32 h-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Kids Will Learn
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our platform makes financial education engaging and accessible
                for children of all ages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Coins className="h-10 w-10 text-primary" />,
                  title: "Money Basics",
                  description:
                    "Learn what money is, how it works, and its different forms in today's world.",
                },
                {
                  icon: <Wallet className="h-10 w-10 text-secondary" />,
                  title: "Saving Habits",
                  description:
                    "Develop healthy saving habits through fun challenges and virtual piggy banks.",
                },
                {
                  icon: <TrendingUp className="h-10 w-10 text-accent" />,
                  title: "Smart Spending",
                  description:
                    "Make good spending decisions by understanding needs vs. wants.",
                },
                {
                  icon: <BookOpen className="h-10 w-10 text-primary" />,
                  title: "Financial Goals",
                  description:
                    "Set and achieve financial goals with our interactive goal tracker.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-card rounded-lg p-6 shadow-sm border"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/10">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start the Financial Journey?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of families teaching their kids essential money
              skills in a fun way.
            </p>
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Create Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/40">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-primary">Cash Critters</h2>
              <p className="text-muted-foreground">
                Financial education made fun for kids
              </p>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="text-muted-foreground hover:text-foreground">About</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Cash Critters. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check on new file**

```bash
npx tsc --noEmit 2>&1 | grep "src/app/page"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add App Router home page"
```

---

## Task 12: Create sign-in page

**Files:**
- Create: `src/app/(auth)/signin/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(auth)/signin"
```

- [ ] **Step 2: Create src/app/(auth)/signin/page.tsx**

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { loginUser, loginWithGoogle } from "@/actions/auth"
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
import { PiggyBank } from "lucide-react"

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await loginUser(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PiggyBank className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome back!</CardTitle>
          <CardDescription>Sign in to your Cash Critters account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form action={loginWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check on new file**

```bash
npx tsc --noEmit 2>&1 | grep "src/app/(auth)/signin"
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/signin/page.tsx"
git commit -m "feat: add sign-in page with credentials and Google OAuth"
```

---

## Task 13: Create sign-up page

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "src/app/(auth)/signup"
```

- [ ] **Step 2: Create src/app/(auth)/signup/page.tsx**

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { registerUser, loginWithGoogle } from "@/actions/auth"
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
import { PiggyBank } from "lucide-react"

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await registerUser(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PiggyBank className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start your financial learning journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <form action={loginWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check on new file**

```bash
npx tsc --noEmit 2>&1 | grep "src/app/(auth)/signup"
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/signup/page.tsx"
git commit -m "feat: add sign-up page with registration Server Action"
```

---

## Task 14: Create protected layout and pages

**Files:**
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/(protected)/savings/page.tsx`
- Create: `src/app/(protected)/learn/page.tsx`
- Create: `src/app/(protected)/games/page.tsx`

- [ ] **Step 1: Create directories**

```bash
mkdir -p "src/app/(protected)/dashboard" "src/app/(protected)/savings" "src/app/(protected)/learn" "src/app/(protected)/games"
```

- [ ] **Step 2: Create src/app/(protected)/layout.tsx**

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/signin")
  return <>{children}</>
}
```

- [ ] **Step 3: Create src/app/(protected)/dashboard/page.tsx**

```typescript
import { auth } from "@/auth"
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Gamepad2, Award, Star, Coins, PiggyBank } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session?.user?.name ?? "Critter"}!
          </h1>
          <p className="text-muted-foreground mb-8">
            Track your progress and continue your financial journey
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Learning Journey</CardTitle>
              <CardDescription>
                Complete lessons to level up your money skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={0} className="h-2 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Continue Learning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Your next lesson: &quot;What is Money?&quot;</p>
                <Link href="/learn">
                  <Button>Start Lesson</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-secondary" />
                  <span>Fun Games</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Play games to reinforce financial concepts</p>
                <Link href="/games">
                  <Button variant="secondary">Play Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-accent" />
                  <span>Savings Tracker</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Track your savings goals and progress</p>
                <Link href="/savings">
                  <Button variant="outline">View Savings</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Your Achievements</span>
              </CardTitle>
              <CardDescription>
                Badges and rewards you&apos;ve earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {[
                  {
                    name: "First Login",
                    icon: <Star className="h-8 w-8 text-yellow-500" />,
                    unlocked: true,
                  },
                  {
                    name: "Money Basics",
                    icon: <Coins className="h-8 w-8 text-blue-500" />,
                    unlocked: false,
                  },
                  {
                    name: "Saving Star",
                    icon: <PiggyBank className="h-8 w-8 text-green-500" />,
                    unlocked: false,
                  },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center p-4 rounded-lg border ${
                      achievement.unlocked ? "bg-accent/10" : "bg-muted opacity-50"
                    }`}
                  >
                    {achievement.icon}
                    <span className="mt-2 text-sm font-medium">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create src/app/(protected)/savings/page.tsx**

```typescript
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PiggyBank, Plus } from "lucide-react"

export default function SavingsPage() {
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>

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
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create your first goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Create src/app/(protected)/learn/page.tsx**

```typescript
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Coins, Wallet, TrendingUp } from "lucide-react"

const modules = [
  {
    id: "money-basics",
    title: "Money Basics",
    description: "Learn what money is and how it works",
    icon: <Coins className="h-8 w-8 text-primary" />,
    lessons: 5,
  },
  {
    id: "saving-habits",
    title: "Saving Habits",
    description: "Develop healthy saving routines",
    icon: <Wallet className="h-8 w-8 text-secondary" />,
    lessons: 4,
  },
  {
    id: "smart-spending",
    title: "Smart Spending",
    description: "Needs vs. wants and making good choices",
    icon: <TrendingUp className="h-8 w-8 text-accent" />,
    lessons: 6,
  },
]

export default function LearnPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Modules</h1>
            <p className="text-muted-foreground">Choose a module to start learning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-2">{module.icon}</div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{module.lessons} lessons</span>
                    </div>
                    <Button size="sm">Start</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Create src/app/(protected)/games/page.tsx**

```typescript
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, Coins, ShoppingCart, PiggyBank } from "lucide-react"

const games = [
  {
    id: "coin-counter",
    title: "Coin Counter",
    description: "Practice counting coins and making change",
    icon: <Coins className="h-8 w-8 text-primary" />,
    difficulty: "Easy",
  },
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Manage a weekly budget and make smart choices",
    icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
    difficulty: "Medium",
  },
  {
    id: "savings-race",
    title: "Savings Race",
    description: "Race to reach your savings goal first",
    icon: <PiggyBank className="h-8 w-8 text-accent" />,
    difficulty: "Easy",
  },
]

export default function GamesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-primary" />
              Games
            </h1>
            <p className="text-muted-foreground">
              Learn financial skills through fun interactive games
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card key={game.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-2">{game.icon}</div>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {game.difficulty}
                    </span>
                    <Button size="sm">Play</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 7: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: errors only reference files inside `src/pages/` (not yet deleted). Zero errors outside `src/pages/`.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(protected)/"
git commit -m "feat: add protected pages (dashboard, savings, learn, games)"
```

---

## Task 15: Delete Pages Router and final verification

**Files:**
- Delete: `src/pages/`

- [ ] **Step 1: Delete the Pages Router directory**

```bash
rm -rf src/pages
```

- [ ] **Step 2: Full TypeScript check — expect zero errors**

```bash
npx tsc --noEmit
```

Expected: no output (no errors anywhere).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: build succeeds with no errors. Note any build warnings but do not treat them as failures unless they prevent compilation.

- [ ] **Step 4: Start dev server**

```bash
npm run dev
```

- [ ] **Step 5: Smoke test — verify all flows**

Open http://localhost:3000 and test each item:

- [ ] Home page loads with hero section, feature cards, and footer
- [ ] "Get Started" links to `/signup`, "Sign In" links to `/signin`
- [ ] Sign-up with email/password creates account and redirects to `/dashboard`
  - Verify user exists: `npx prisma studio` → User table
- [ ] Dashboard shows `Welcome back, [name]!` with the registered name
- [ ] Sign-out button returns to `/` and clears session
- [ ] Navigating directly to `/dashboard` while signed out redirects to `/signin`
- [ ] `/learn` page loads with 3 module cards
- [ ] `/games` page loads with 3 game cards
- [ ] `/savings` page loads with empty state and New Goal button
- [ ] Sign-in with same email/password works
- [ ] Google OAuth sign-in completes (requires valid `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env.local`)
- [ ] Header shows nav links (Dashboard, Learn, Games, Savings) only when signed in
- [ ] Mobile menu opens and closes correctly

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete Firebase to Vercel migration — App Router, Auth.js v5, Tailwind v4"
```
