# Learning Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional lesson system with 15 lessons across 3 modules — content, quizzes, progress tracking, and lesson gating.

**Architecture:** Static TypeScript content files define all lesson data; dynamic App Router routes (`/learn/[moduleId]` and `/learn/[moduleId]/[lessonId]`) render modules and lessons; a Server Action saves lesson completions to Postgres via Prisma; lessons are gated so kids must pass (≥4/5) before unlocking the next.

**Tech Stack:** Next.js 14 App Router, Auth.js v5 (session.user.id already wired), Prisma + Vercel Postgres, Tailwind v4, shadcn/ui

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `lessonId` field to `LearningProgress` |
| `src/content/lessons/index.ts` | Create | Types (`Lesson`, `Module`, `QuizQuestion`), `MODULES` array, helper functions |
| `src/content/lessons/money-basics.ts` | Create | 5 lessons with content + 5 quiz questions each |
| `src/content/lessons/saving-habits.ts` | Create | 4 lessons with content + 5 quiz questions each |
| `src/content/lessons/smart-spending.ts` | Create | 6 lessons with content + 5 quiz questions each |
| `src/actions/learn.ts` | Create | `completeLesson()` and `getLessonProgress()` server actions |
| `src/app/(protected)/learn/[moduleId]/page.tsx` | Create | Module overview — lesson list with lock/complete state |
| `src/app/(protected)/learn/[moduleId]/[lessonId]/LessonClient.tsx` | Create | Client Component — quiz state, answer selection, pass/fail, completion |
| `src/app/(protected)/learn/[moduleId]/[lessonId]/page.tsx` | Create | Server Component — content lookup, lock check, passes props to LessonClient |
| `src/app/(protected)/learn/page.tsx` | Modify | Add progress badges, update button labels, link to module overview |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the LearningProgress model**

Open `prisma/schema.prisma`. Replace the `LearningProgress` model with:

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

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-lesson-id-to-learning-progress
```

Expected output: `✔ Generated Prisma Client`

- [ ] **Step 3: Verify**

```bash
npx prisma studio
```

Open the browser, navigate to `LearningProgress` table, confirm the `lessonId` column exists. Close Prisma Studio (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add lessonId to LearningProgress for per-lesson tracking"
```

---

## Task 2: Content Types and Module Index

**Files:**
- Create: `src/content/lessons/index.ts`

- [ ] **Step 1: Create the file**

```bash
mkdir -p src/content/lessons
```

- [ ] **Step 2: Write the types, helpers, and MODULES array**

Create `src/content/lessons/index.ts`:

```typescript
import { moneyBasicsLessons } from "./money-basics"
import { savingHabitsLessons } from "./saving-habits"
import { smartSpendingLessons } from "./smart-spending"

export interface QuizQuestion {
  question: string
  options: string[]     // exactly 4 choices
  correctIndex: number  // 0-based index into options
  explanation: string   // shown after answering
}

export interface Lesson {
  id: string            // URL slug, e.g. "what-is-money"
  title: string
  content: string[]     // paragraphs
  quiz: QuizQuestion[]  // exactly 5 questions
}

export interface Module {
  id: string            // URL slug, e.g. "money-basics"
  title: string
  description: string
  lessons: Lesson[]
}

export const MODULES: Module[] = [
  {
    id: "money-basics",
    title: "Money Basics",
    description: "Learn what money is and how it works",
    lessons: moneyBasicsLessons,
  },
  {
    id: "saving-habits",
    title: "Saving Habits",
    description: "Develop healthy saving routines",
    lessons: savingHabitsLessons,
  },
  {
    id: "smart-spending",
    title: "Smart Spending",
    description: "Needs vs. wants and making good choices",
    lessons: smartSpendingLessons,
  },
]

export function getModule(moduleId: string): Module | undefined {
  return MODULES.find((m) => m.id === moduleId)
}

export function getLesson(moduleId: string, lessonId: string): Lesson | undefined {
  return getModule(moduleId)?.lessons.find((l) => l.id === lessonId)
}

export function getNextLesson(moduleId: string, lessonId: string): Lesson | undefined {
  const module = getModule(moduleId)
  if (!module) return undefined
  const index = module.lessons.findIndex((l) => l.id === lessonId)
  return module.lessons[index + 1]
}

// A lesson is unlocked if it's first in the module, or if the previous lesson is completed.
export function isLessonUnlocked(
  moduleId: string,
  lessonId: string,
  completed: Set<string>
): boolean {
  const module = getModule(moduleId)
  if (!module) return false
  const index = module.lessons.findIndex((l) => l.id === lessonId)
  if (index === 0) return true
  const prev = module.lessons[index - 1]
  return completed.has(`${moduleId}:${prev.id}`)
}
```

- [ ] **Step 3: Verify TypeScript compiles (imports will fail until content files are created — that's expected)**

```bash
npx tsc --noEmit 2>&1 | grep "index.ts"
```

Expected: errors about missing `./money-basics`, `./saving-habits`, `./smart-spending` — this is correct since those files don't exist yet.

- [ ] **Step 4: Commit**

```bash
git add src/content/lessons/index.ts
git commit -m "feat: add lesson content types and module index"
```

---

## Task 3: Money Basics Lesson Content

**Files:**
- Create: `src/content/lessons/money-basics.ts`

- [ ] **Step 1: Create the file with all 5 lessons**

Create `src/content/lessons/money-basics.ts`:

```typescript
import type { Lesson } from "./index"

export const moneyBasicsLessons: Lesson[] = [
  {
    id: "what-is-money",
    title: "What Is Money?",
    content: [
      "Money is something people use to pay for goods and services. Before money existed, people traded items directly — a farmer might swap eggs for shoes. This system worked in small communities, but it had a critical flaw: you needed to find someone who had exactly what you wanted AND wanted exactly what you had.",
      "Money solved this problem by becoming a universal medium of exchange. When everyone agrees that a certain item — a gold coin, a paper bill, or a digital number — has value, trade becomes much simpler. You can sell your eggs for money, then use that money to buy shoes from someone who might not even want eggs.",
      "For money to work, it needs three key qualities. First, it must be a medium of exchange — something you can use to buy things. Second, it must be a store of value — it keeps its worth over time so you can save it. Third, it must be a unit of account — a standard way to measure how much things cost.",
      "Today, money comes in different forms. Physical money includes coins and paper bills. Digital money includes the balance in your bank account, which you can access with a debit card or payment app. Even though you can't hold digital money in your hand, it represents real value you can use.",
      "Money itself doesn't have value because it looks special. It has value because everyone in society agrees it does. A $20 bill is just a piece of paper — but because the government issues it and everyone accepts it, it's worth $20. This shared trust is what makes money work.",
    ],
    quiz: [
      {
        question: "What is the main problem with barter (trading without money)?",
        options: [
          "It's too complicated to carry goods around",
          "You need someone who has what you want AND wants what you have",
          "People don't trust each other enough to trade",
          "It takes too long to count and weigh items",
        ],
        correctIndex: 1,
        explanation: "Barter requires a 'double coincidence of wants' — both people must have exactly what the other needs, which is hard to arrange and breaks down in large economies.",
      },
      {
        question: "Which of the following is NOT one of the three qualities money needs?",
        options: [
          "Medium of exchange",
          "Store of value",
          "Made of precious metal",
          "Unit of account",
        ],
        correctIndex: 2,
        explanation: "Money doesn't have to be made of precious metal. Paper bills and digital money work fine. What matters is that it can be exchanged, holds value over time, and measures worth.",
      },
      {
        question: "Why does a $20 bill have value?",
        options: [
          "Because it is printed with expensive, specialized ink",
          "Because it weighs exactly the right amount",
          "Because everyone in society agrees to accept it as valuable",
          "Because the government backs every bill with gold",
        ],
        correctIndex: 2,
        explanation: "Money's value comes from social trust and agreement. If everyone stopped accepting $20 bills, they'd be worthless pieces of paper. Value is a collective belief.",
      },
      {
        question: "Which of these is an example of digital money?",
        options: [
          "A gold coin from ancient Rome",
          "A $5 paper bill",
          "The balance in a bank account",
          "A diamond ring worth $500",
        ],
        correctIndex: 2,
        explanation: "Digital money exists as numbers in computer systems, like your bank account balance. You can't hold it, but it represents real purchasing power you can use with a card or app.",
      },
      {
        question: "What does 'store of value' mean?",
        options: [
          "A shop that sells valuable goods",
          "Something that keeps its worth so you can save it and use it later",
          "A way to measure how much things cost",
          "The vault where banks keep physical cash",
        ],
        correctIndex: 1,
        explanation: "A store of value means money doesn't immediately spoil or lose worth, so you can save it today and use it weeks or months later — unlike, say, a loaf of bread.",
      },
    ],
  },
  {
    id: "history-of-money",
    title: "The History of Money",
    content: [
      "Long before coins or bills existed, people used barter — directly trading goods and services. A potter might trade bowls for grain, and a hunter might trade meat for tools. This worked in small communities, but it collapsed as trade grew more complex and people moved further apart.",
      "Around 5,000 years ago, people began using commodity money — objects with inherent value like cattle, shells, salt, and grain. Salt was so valuable in ancient Rome that soldiers were sometimes paid in it — which is where the word 'salary' comes from.",
      "Metal coins appeared around 600 BCE in the kingdom of Lydia (modern-day Turkey). Made of electrum — a natural mix of gold and silver — and stamped to guarantee weight and purity, coins spread quickly because they were durable, portable, and divisible. You could make change.",
      "Paper money was invented in Tang Dynasty China around 700 CE. Merchants deposited heavy coins with bankers and carried paper notes representing those coins. Governments eventually issued official paper currency. By the 20th century, most countries used 'fiat currency' — paper money valuable because the government says so, not because it's backed by gold.",
      "Today we're in the age of digital money. Most money never physically exists — it's numbers in computer systems transferring between accounts. Newer forms like cryptocurrencies attempt digital money without government backing, using complex code instead. Money's history is really a history of trust in increasingly abstract systems.",
    ],
    quiz: [
      {
        question: "Where does the word 'salary' come from?",
        options: [
          "The Latin word for coins",
          "The name of the first bank in Rome",
          "The practice of paying Roman soldiers in salt",
          "The weight of silver coins used in trade",
        ],
        correctIndex: 2,
        explanation: "Salt was critically important for preserving food before refrigeration, making it genuinely valuable. Roman soldiers were sometimes paid in salt — giving us the word 'salary.'",
      },
      {
        question: "Where were paper banknotes first invented?",
        options: [
          "Ancient Rome",
          "The kingdom of Lydia",
          "Ancient Greece",
          "Tang Dynasty China",
        ],
        correctIndex: 3,
        explanation: "China's Tang Dynasty introduced early paper money around 700 CE. Merchants carried paper receipts representing coins they'd deposited, making large transactions much easier.",
      },
      {
        question: "What three properties made metal coins better than commodity money like cattle or grain?",
        options: [
          "Shiny, rare, and government-issued",
          "Durable, portable, and divisible",
          "Easy to find, lightweight, and colorful",
          "Edible, waterproof, and long-lasting",
        ],
        correctIndex: 1,
        explanation: "Coins work well because they last a long time (durable), are easy to carry (portable), and can represent different values (divisible) — none of which cattle or grain can do.",
      },
      {
        question: "What does 'fiat currency' mean?",
        options: [
          "Money made from precious metals",
          "Money issued by private banks, not governments",
          "Money directly backed by gold reserves",
          "Money that has value because the government declares it does",
        ],
        correctIndex: 3,
        explanation: "'Fiat' is Latin for 'let it be done.' Fiat currency has value by government decree and public trust — not because you can exchange it for a physical commodity like gold.",
      },
      {
        question: "What is the most accurate way to describe the history of money?",
        options: [
          "A history of gold and silver mining operations",
          "A history of government control over citizens",
          "A history of trust in increasingly abstract systems",
          "A history of technological invention and engineering",
        ],
        correctIndex: 2,
        explanation: "Each step in money's evolution — from barter to coins to paper to digital — required people to place more trust in more abstract systems, rather than relying on physical goods with inherent value.",
      },
    ],
  },
  {
    id: "earning-money",
    title: "How People Earn Money",
    content: [
      "Most people earn money by exchanging their time, skills, or ideas for payment. The most common way is employment — working for a business or organization that pays you a wage or salary. A wage is typically paid by the hour, while a salary is a fixed amount paid weekly, biweekly, or monthly regardless of exact hours worked.",
      "Some people earn money through self-employment, running their own business. Instead of one employer, they serve many customers. A freelance graphic designer, a food truck owner, or an independent plumber are all self-employed. Self-employment offers freedom but also risk — if customers don't come, there's no guaranteed paycheck.",
      "Passive income is money earned with minimal ongoing work. Rental income (renting out property), dividends from stocks, and royalties from creative work are examples. Building passive income usually requires significant upfront investment of money or time, but it can eventually generate earnings without daily effort.",
      "Some income comes from transfers rather than work. Allowances, scholarships, and government assistance programs move money from one person or institution to another without a direct exchange of goods or services. These aren't earned through labor, but they're still real money people can use.",
      "The amount people earn varies enormously based on education, skills, experience, location, and the rarity of their work. Doctors and software engineers typically earn much more than retail workers — not necessarily because their work is more important, but because their skills are rarer and harder to replace. Understanding how earnings are determined can help you make smarter decisions about education and career paths.",
    ],
    quiz: [
      {
        question: "What is the difference between a wage and a salary?",
        options: [
          "Wages are for government workers; salaries are for private workers",
          "A wage is paid by the hour; a salary is a fixed amount per pay period",
          "Wages are always higher than salaries",
          "Salaries are only paid to managers and executives",
        ],
        correctIndex: 1,
        explanation: "Hourly workers (wages) are paid for each hour worked. Salaried employees get a fixed amount each pay period regardless of exact hours — which can mean more or less pay per hour depending on the week.",
      },
      {
        question: "Which of the following is the best example of passive income?",
        options: [
          "Working overtime shifts at a restaurant",
          "Receiving tips from customers for good service",
          "Collecting monthly rent from a property you own",
          "Getting a promotion with a higher salary",
        ],
        correctIndex: 2,
        explanation: "Passive income requires little ongoing effort. Once you've purchased and rented out a property, rent arrives each month without you having to actively work for it each day.",
      },
      {
        question: "What is a major disadvantage of self-employment compared to working for a company?",
        options: [
          "You have to follow someone else's schedule and rules",
          "You can only work certain hours set by regulations",
          "There is no guaranteed income when business is slow",
          "You cannot choose which customers you work with",
        ],
        correctIndex: 2,
        explanation: "Employed workers get paid as long as they show up. Self-employed people only earn when customers buy from them — a slow week or slow season means significantly reduced income.",
      },
      {
        question: "Why do software engineers typically earn more than retail cashiers?",
        options: [
          "Software engineers always work significantly longer hours",
          "Retail work contributes less value to society",
          "Software engineering skills are rarer and harder to replace",
          "Cashiers choose lower-paying jobs voluntarily",
        ],
        correctIndex: 2,
        explanation: "Earnings reflect supply and demand for skills. Many people can operate a cash register; far fewer can write complex software. Employers pay more to attract those rare, harder-to-replace skills.",
      },
      {
        question: "Which of the following is NOT a way to earn income?",
        options: [
          "Renting out a room in your home to a tenant",
          "Running your own lawn care business",
          "Withdrawing money from a savings account",
          "Working for an employer who pays you weekly",
        ],
        correctIndex: 2,
        explanation: "Withdrawing from savings is using money you already earned — it's not generating new income. Income is money flowing in from work, investments, or transfers. Spending savings is money flowing out.",
      },
    ],
  },
  {
    id: "currency-and-exchange",
    title: "Currency and Exchange Rates",
    content: [
      "A currency is the specific type of money used in a country or region. The United States uses the US Dollar (USD), Europe uses the Euro (EUR), Japan uses the Yen (JPY), and the UK uses the Pound Sterling (GBP). There are nearly 180 different currencies worldwide, though most international trade is conducted in a handful of major ones.",
      "When you travel abroad or buy from an overseas company, you need to convert your currency into theirs. The exchange rate is the price at which one currency trades for another. If the USD/EUR rate is 1.10, it costs $1.10 to buy €1. Exchange rates change constantly based on economic conditions, trade flows, and government policies.",
      "Exchange rates are set by supply and demand in the global forex (foreign exchange) market. If many people want a country's currency — perhaps because its economy is strong or its goods are in demand — that currency strengthens. If people want to sell it, it weakens. No single person controls exchange rates; they emerge from millions of transactions.",
      "A strong currency means your money buys more abroad. A weak currency makes your country's exports cheaper for foreigners, which can boost manufacturing. Neither is automatically better — it depends on whether a country prioritizes export competitiveness or controlling import costs. Governments sometimes deliberately adjust monetary policy to influence exchange rates.",
      "When exchanging currency, watch for fees. Banks, airports, and exchange kiosks all charge commissions to convert money. Airport exchange counters typically offer the worst rates — they know travelers are in a hurry with few alternatives. Use a bank or international ATM for more competitive rates. Always check the current exchange rate before converting so you know if you're getting a fair deal.",
    ],
    quiz: [
      {
        question: "What is an exchange rate?",
        options: [
          "The fee a bank charges for keeping your money safe",
          "The price at which one currency trades for another",
          "The amount of money a country prints each year",
          "The import tax applied to foreign goods",
        ],
        correctIndex: 1,
        explanation: "An exchange rate tells you how much of one currency you'll get when you trade it for another — for example, how many euros you receive when you convert dollars.",
      },
      {
        question: "If the USD/EUR exchange rate is 1.10, how much does it cost in dollars to buy €50?",
        options: [
          "$45.45",
          "$50.00",
          "$55.00",
          "$110.00",
        ],
        correctIndex: 2,
        explanation: "At a rate of $1.10 per euro, buying €50 costs 50 × $1.10 = $55.00. You're paying dollars to get euros, so you multiply the euro amount by the rate.",
      },
      {
        question: "What causes a currency to become more valuable relative to others?",
        options: [
          "The country printing more money",
          "High demand for that currency from other countries",
          "The country raising taxes on citizens",
          "The central bank setting lower interest rates",
        ],
        correctIndex: 1,
        explanation: "Currency value follows supply and demand. When other countries want your currency — to buy your goods, invest there, or travel — demand rises and the currency strengthens.",
      },
      {
        question: "Why might a country actually WANT a weaker currency?",
        options: [
          "To make imports cheaper and more affordable for citizens",
          "To attract wealthy tourists who want luxury experiences",
          "To make its exports cheaper and more competitive for foreign buyers",
          "To reduce the amount of government debt it owes",
        ],
        correctIndex: 2,
        explanation: "A weaker currency makes your country's products cheaper for foreign buyers — which can boost exports and manufacturing. This is important for countries that rely heavily on selling goods internationally.",
      },
      {
        question: "Where should you AVOID exchanging currency if you want a fair rate?",
        options: [
          "An ATM operated by a local bank in the destination country",
          "Your home bank before you travel",
          "A credit union with international exchange services",
          "An airport currency exchange kiosk",
        ],
        correctIndex: 3,
        explanation: "Airport currency exchanges charge higher fees and worse rates because they know travelers often have no other options and are in a hurry. Banks and ATMs offer more competitive rates.",
      },
    ],
  },
  {
    id: "money-and-value",
    title: "Money, Value, and Prices",
    content: [
      "The price of anything is determined by supply and demand. Supply is how much of a product is available; demand is how much people want it. When demand is high and supply is low — like concert tickets for a sold-out show — prices rise. When supply exceeds demand — like last season's fashion — prices fall. This push and pull shapes every price you see.",
      "Value and price are related but not the same. Price is what you pay; value is what something is worth to you personally. A $5 sandwich might be worth $20 to someone starving and nothing to someone who just ate. Smart buyers try to purchase when the price is less than the value they receive — and avoid buying when price exceeds personal value.",
      "Inflation is the gradual rise in prices across the economy over time. When a country's money supply grows faster than its economy, each dollar buys slightly less than before. The US Federal Reserve aims for about 2% inflation per year. At that rate, something costing $100 today will cost about $122 in ten years — which is why keeping money in a non-interest-bearing account slowly erodes its purchasing power.",
      "Not all price increases are inflation. Sometimes prices rise because a specific product becomes scarce — like gasoline during a supply shortage. Other times, a product becomes more popular — like a new gaming console at launch. True inflation means the overall price level across the whole economy is rising, not just prices in one area.",
      "Understanding prices helps you spend smarter. Comparing prices between stores, waiting for sales, buying off-season items, and choosing generic brands are all strategies for getting more value per dollar. Even a consistent 10-15% price difference on regular purchases adds up to hundreds of dollars saved over a year.",
    ],
    quiz: [
      {
        question: "What happens to price when demand rises but supply stays the same?",
        options: [
          "Price falls because sellers want to move more inventory",
          "Price stays the same because supply hasn't changed",
          "Price rises because more people compete for the same goods",
          "The product disappears from stores immediately",
        ],
        correctIndex: 2,
        explanation: "When more people want something than is available, sellers can charge more — buyers will pay higher prices rather than go without the item.",
      },
      {
        question: "What is the key difference between price and value?",
        options: [
          "There is no real difference — they are the same concept",
          "Price is set by the government; value is set by stores",
          "Price is what you pay; value is what it is personally worth to you",
          "Value is always higher than the price a seller charges",
        ],
        correctIndex: 2,
        explanation: "A smart purchase happens when the value you receive exceeds the price you pay. The same item can be worth very different amounts to different people based on their needs and circumstances.",
      },
      {
        question: "What is inflation?",
        options: [
          "When one specific product suddenly becomes more expensive",
          "When a country's government runs out of money to spend",
          "The gradual rise in overall prices across the economy over time",
          "When too many products flood the market at once",
        ],
        correctIndex: 2,
        explanation: "Inflation means your money buys a little less each year. At 2% inflation, prices roughly double every 35 years — which is why investing and earning interest on savings matters.",
      },
      {
        question: "If something costs $100 today and inflation averages 2% per year, about what will it cost in 10 years?",
        options: [
          "$102",
          "$110",
          "$122",
          "$200",
        ],
        correctIndex: 2,
        explanation: "At 2% annual inflation compounded over 10 years, prices rise by about 22% (not 20%, due to compounding). So $100 becomes roughly $122 after a decade.",
      },
      {
        question: "Which is the BEST example of smart spending based on price vs. value?",
        options: [
          "Buying a brand-name item simply because it is more popular",
          "Waiting to buy a winter coat in January when it is on clearance",
          "Always choosing the cheapest option regardless of quality",
          "Shopping only at expensive stores because they must be better",
        ],
        correctIndex: 1,
        explanation: "Buying off-season items on clearance is a classic price-vs-value win. The coat provides the same warmth; you're just paying less because seasonal demand dropped after winter.",
      },
    ],
  },
]
```

- [ ] **Step 2: Verify the file has no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "money-basics"
```

Expected: no errors about `money-basics.ts` (errors about the other two missing files are fine).

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/money-basics.ts
git commit -m "feat: add Money Basics lesson content (5 lessons)"
```

---

## Task 4: Saving Habits Lesson Content

**Files:**
- Create: `src/content/lessons/saving-habits.ts`

- [ ] **Step 1: Create the file with all 4 lessons**

Create `src/content/lessons/saving-habits.ts`:

```typescript
import type { Lesson } from "./index"

export const savingHabitsLessons: Lesson[] = [
  {
    id: "why-save",
    title: "Why Save Money?",
    content: [
      "Saving money means setting aside some of what you earn or receive instead of spending all of it immediately. It might seem less fun than spending, but saving gives you something spending can't: security and options. When unexpected expenses arise — a broken phone, a medical bill — having savings means you can handle them without panic or debt.",
      "One of the most important reasons to save is building an emergency fund. Financial experts recommend keeping 3–6 months of living expenses in savings you can access quickly. This cushion protects you when life surprises you. Without an emergency fund, unexpected expenses often become debt — borrowed money at high interest that you're still paying off years later.",
      "Saving also makes big purchases possible without debt. If you want a $500 gaming console, you have two options: save up for it, or put it on a credit card and pay interest. Saving takes longer, but you pay exactly $500. Making minimum credit card payments might cost you 30–50% more in interest charges by the time the debt is cleared.",
      "Long-term saving and investing builds financial freedom. People who consistently save a portion of their income over decades can generate enough wealth to stop needing to work — called financial independence. Even small amounts saved at a young age grow dramatically over time because of compound interest (more on that in Lesson 4).",
      "Saving also gives you choices. When you have money saved, you can take opportunities others can't — a trip with friends, a course that builds skills, or starting a business. Money in savings represents future options that people with no savings simply don't have. That's why even small, consistent saving makes a real difference in your life.",
    ],
    quiz: [
      {
        question: "What is an emergency fund?",
        options: [
          "Money saved to buy something you have always wanted",
          "Money set aside to handle unexpected expenses without going into debt",
          "A government program that distributes money during disasters",
          "A savings account that earns especially high interest rates",
        ],
        correctIndex: 1,
        explanation: "An emergency fund is a financial cushion — 3-6 months of expenses saved so that when something unexpected happens, you handle it with your own savings instead of borrowing money.",
      },
      {
        question: "How much do financial experts recommend keeping in an emergency fund?",
        options: [
          "Exactly $1,000 regardless of your expenses",
          "One month of your total living expenses",
          "3–6 months of your living expenses",
          "Ten percent of your total annual income",
        ],
        correctIndex: 2,
        explanation: "3-6 months of expenses covers most financial emergencies — job loss, medical bills, major repairs — giving you time to recover without accumulating high-interest debt.",
      },
      {
        question: "Why is saving for a purchase better than buying it on credit and making minimum payments?",
        options: [
          "Credit cards are more complicated to use than cash",
          "Saving up is always faster than using credit",
          "Saving means you pay exactly the listed price, while minimum payments cost extra in interest",
          "Credit cards cannot be used at all stores and retailers",
        ],
        correctIndex: 2,
        explanation: "Interest charges on unpaid credit card balances can add 30-50% to the real cost of a purchase when you only make minimum payments. Saving first means paying exactly the sticker price — nothing extra.",
      },
      {
        question: "What does 'financial independence' mean?",
        options: [
          "Not needing to ask your parents for spending money",
          "Having a high-paying job you enjoy",
          "Having enough savings and investments that you no longer need to work for income",
          "Owing no money in taxes to the government",
        ],
        correctIndex: 2,
        explanation: "Financial independence means your savings and investments generate enough income to cover living expenses — so working becomes a choice rather than a necessity.",
      },
      {
        question: "Why does saving give you more choices in life?",
        options: [
          "Saved money automatically earns interest every month",
          "Banks give special rewards to customers who maintain large balances",
          "Having money available lets you act on opportunities that people without savings cannot",
          "Saving makes you more financially responsible than your peers",
        ],
        correctIndex: 2,
        explanation: "Savings equal options. Whether it's a trip, a new skill, or a business idea, having money ready means you can act on opportunities as they arise instead of watching them pass you by.",
      },
    ],
  },
  {
    id: "setting-goals",
    title: "Setting Savings Goals",
    content: [
      "Random saving — putting aside money without any specific purpose — is better than nothing, but goal-based saving is far more effective. When you have a clear target in mind, you stay motivated. 'I'm saving for a new bike' is far more motivating than 'I'm saving money.' Specificity turns an abstract habit into a compelling mission.",
      "Effective savings goals are SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. 'I want to save $300 for new headphones by August 15th' hits all five criteria — it names what you want, how much it costs, that it's realistic, why it matters to you, and when you'll have it. Vague goals like 'I want to save more money' rarely work because there's nothing concrete to aim for.",
      "Breaking goals into smaller milestones makes them manageable. If you need $300 in 10 weeks, that's $30 per week. Track your progress visually — a simple chart where you color in each week's savings makes the goal feel real and builds momentum. Each milestone you hit is a small win that motivates the next one.",
      "Prioritizing multiple goals requires deciding what matters most right now. Emergency fund, short-term goals (things you want within a year), and long-term goals (college, a car) all need saving, but you can't always fund them simultaneously. Financial planners generally suggest fully funding your emergency fund first, then splitting saving between short and long-term goals.",
      "Automating saving removes the temptation to skip it. If you receive a regular allowance or paycheck, decide in advance what percentage moves directly to savings before you have a chance to spend it. This 'pay yourself first' approach means saving happens automatically. What remains after saving is what you have to spend — which prevents the common trap of spending everything and saving only what's left (which is usually nothing).",
    ],
    quiz: [
      {
        question: "What does SMART stand for in SMART savings goals?",
        options: [
          "Simple, Meaningful, Attainable, Rewarding, Timed",
          "Specific, Measurable, Achievable, Relevant, Time-bound",
          "Savings, Money, Accounts, Returns, Targets",
          "Short-term, Medium-term, And Real-world, Tracked",
        ],
        correctIndex: 1,
        explanation: "SMART goals give you a clear framework: you know exactly what you want, can measure progress, believe it's realistic, care about the outcome, and have a deadline to work toward.",
      },
      {
        question: "Which is the best example of a SMART savings goal?",
        options: [
          "'I want to save more money this year than last year'",
          "'I am going to be much better with my money going forward'",
          "'I will save $150 for new sneakers by the end of next month'",
          "'I want to have a lot of money saved up someday'",
        ],
        correctIndex: 2,
        explanation: "'Save $150 for sneakers by end of next month' is specific ($150, sneakers), measurable (you can track it), achievable, relevant to the person, and time-bound. The others are vague wishes.",
      },
      {
        question: "If you need to save $240 in 12 weeks, how much do you need to save per week?",
        options: [
          "$12 per week",
          "$20 per week",
          "$24 per week",
          "$30 per week",
        ],
        correctIndex: 1,
        explanation: "$240 ÷ 12 weeks = $20 per week. Breaking the total into weekly targets makes the goal manageable and gives you clear checkpoints to verify you are on track.",
      },
      {
        question: "What does 'pay yourself first' mean?",
        options: [
          "Buying yourself something enjoyable before paying your bills",
          "Earning money before you are allowed to spend any of it",
          "Moving a set amount into savings immediately when you get paid, before spending anything",
          "Always paying cash rather than using a credit card or debit card",
        ],
        correctIndex: 2,
        explanation: "'Pay yourself first' treats savings like a required expense. You move money to savings immediately, then live on what remains — preventing the habit of saving only what's left over (often nothing).",
      },
      {
        question: "When you have multiple savings goals, which is generally recommended to fund first?",
        options: [
          "The most expensive goal, since it takes the longest",
          "The longest-term goal, since it needs the most time to grow",
          "Whatever you want most right now in this moment",
          "Your emergency fund, because it protects all other goals",
        ],
        correctIndex: 3,
        explanation: "An emergency fund comes first because it protects everything else. Without it, one unexpected expense wipes out progress on all your other goals and may force you into debt.",
      },
    ],
  },
  {
    id: "budgeting-basics",
    title: "Budgeting Basics",
    content: [
      "A budget is a plan for how you'll use your money during a set period — usually a month. It lists expected income (money coming in) and planned expenses (money going out). Budgets aren't about restricting yourself from everything fun — they're about making sure your spending aligns with what actually matters to you, and that saving happens by design rather than by accident.",
      "Step one is knowing your income — every source of money you regularly receive. For a teenager, this might include an allowance, income from a part-time job, or birthday money averaged over the year. Your total income is your starting number, and everything else must fit within it.",
      "Step two is listing your expenses by category. Fixed expenses stay the same every month — subscriptions, regular savings contributions. Variable expenses change — food, entertainment, clothing. Tracking your actual spending for a month often reveals surprising patterns. Most people significantly underestimate what they spend on small, frequent purchases like coffee, snacks, and in-app purchases.",
      "Step three is balancing — making sure expenses plus savings don't exceed income. If they do, you need to earn more, spend less, or both. A popular framework is the 50/30/20 rule: 50% on needs, 30% on wants, and 20% on savings. For teenagers with fewer fixed obligations, a higher savings rate of 30–40% is often achievable and builds excellent long-term habits.",
      "Once you have a budget, the challenge is following it. Budgets fail when people don't track spending or abandon the plan after one overspent week. Review your budget weekly — not to feel guilty, but to catch problems early. A budget is a living document you adjust as life changes. The goal is direction, not perfection.",
    ],
    quiz: [
      {
        question: "What is a budget?",
        options: [
          "A detailed record of money you have already spent this month",
          "A plan made in advance for how you will use your income during a period",
          "A document issued by banks that limits how much you can withdraw",
          "A loan arrangement between you and a financial institution",
        ],
        correctIndex: 1,
        explanation: "A budget is forward-looking — a plan you make before the month begins for how you'll allocate your income. It's distinct from expense tracking, which looks backward at what you already spent.",
      },
      {
        question: "What is the difference between fixed and variable expenses?",
        options: [
          "Fixed expenses are larger amounts; variable expenses are smaller purchases",
          "Fixed expenses cover needs; variable expenses are always optional wants",
          "Fixed expenses stay the same each month; variable expenses change",
          "Fixed expenses must be paid on time; variable ones can be delayed",
        ],
        correctIndex: 2,
        explanation: "Fixed expenses (subscriptions, savings contributions) are predictable and consistent. Variable expenses (food, entertainment, clothing) fluctuate month to month — and this is where most budget surprises happen.",
      },
      {
        question: "In the 50/30/20 budgeting rule, what does the 20% represent?",
        options: [
          "Taxes owed to the government",
          "Food, housing, and transportation costs",
          "Entertainment, dining out, and shopping",
          "Savings and debt repayment",
        ],
        correctIndex: 3,
        explanation: "The 50/30/20 rule allocates income as: 50% to needs (housing, food, transportation), 30% to wants (entertainment, hobbies), and 20% to savings and paying down debt.",
      },
      {
        question: "Why do most people underestimate how much they spend on small, frequent purchases?",
        options: [
          "Small purchases often do not appear on bank statements",
          "People intentionally hide small expenses from their budget",
          "Individual amounts feel trivial, but they add up to significant totals over a month",
          "Stores do not charge proper prices for low-cost items",
        ],
        correctIndex: 2,
        explanation: "A $4 coffee three times a week is $48/month and $576/year. Because each purchase seems minor, people don't realize the cumulative cost until they actually track it.",
      },
      {
        question: "What should you do if your budget shows you plan to spend more than you earn?",
        options: [
          "Ignore the budget and continue your current spending habits",
          "Remove the savings category to balance the numbers",
          "Borrow money to cover the monthly shortfall",
          "Find ways to increase income, reduce expenses, or both",
        ],
        correctIndex: 3,
        explanation: "A budget that doesn't balance tells you your current plan isn't sustainable. The solution is to adjust: earn more, cut spending, or a combination — not to eliminate savings.",
      },
    ],
  },
  {
    id: "compound-interest",
    title: "The Power of Compound Interest",
    content: [
      "Interest is money you earn (or owe) based on an amount over time. When you put money in a savings account, the bank pays you interest for letting them use it. When you borrow money, you pay the lender interest. The rate is usually expressed as an Annual Percentage Rate (APR) or Annual Percentage Yield (APY) — a percentage of the balance charged or earned each year.",
      "Simple interest is calculated only on the original deposit (the principal). At 5% simple interest, $1,000 earns $50/year — so after 10 years you'd have $1,500. Compound interest is different and dramatically more powerful: you earn interest on your previous interest. That same $1,000 at 5% compound interest grows to $1,629 in 10 years — $129 more just from compounding.",
      "Compounding frequency matters. Interest can compound annually, monthly, or even daily. The more frequently it compounds, the more you earn — because each interest payment is added to your balance sooner, making the next calculation on a slightly larger amount. Most savings accounts compound daily or monthly.",
      "Time is the most powerful factor in compound interest. Someone who saves $2,000/year from age 15 to 25 (10 years) can end up with more money at 65 than someone who saves $2,000/year from age 25 to 65 (40 years), assuming the same 7% return. The 10-year head start earns exponentially more because it has 40+ extra years to compound. Starting early matters enormously.",
      "Compound interest works powerfully against you when you borrow. Credit card debt at 20% APR compounds against you — a $1,000 balance with no payments becomes $1,200 after one year, then $1,440, then $1,728. The same mathematical force that builds wealth through savings actively destroys it through debt. Understanding this is one of the most important financial concepts you will ever learn.",
    ],
    quiz: [
      {
        question: "What is compound interest?",
        options: [
          "Interest charged only on borrowed money, not savings",
          "Interest calculated solely on the original deposit amount",
          "Interest calculated on both the principal and previously earned interest",
          "A special type of interest rate set by the Federal Reserve",
        ],
        correctIndex: 2,
        explanation: "Compound interest means you earn interest on your accumulated interest — so your savings grow faster and faster over time as the interest itself begins generating interest.",
      },
      {
        question: "You deposit $500 at 10% simple interest. How much total interest do you earn after 3 years?",
        options: [
          "$50",
          "$100",
          "$150",
          "$165",
        ],
        correctIndex: 2,
        explanation: "Simple interest = principal × rate × time = $500 × 0.10 × 3 = $150. With simple interest, you earn exactly $50/year and the base never changes.",
      },
      {
        question: "Why does starting to save earlier produce dramatically better results?",
        options: [
          "Banks offer better interest rates to younger account holders",
          "You have more time for compound interest to multiply your money exponentially",
          "Government regulations give tax advantages to early savers",
          "Inflation affects older savers more severely",
        ],
        correctIndex: 1,
        explanation: "Compound growth is exponential, not linear. Each year's growth is based on a larger total. More years means dramatically more growth — which is why starting at 15 beats starting at 25 even with fewer years of contributions.",
      },
      {
        question: "How does compound interest work against borrowers with credit card debt?",
        options: [
          "Banks always charge borrowers a higher rate than savers receive",
          "Borrowers must pay additional taxes on all interest charges",
          "Unpaid interest is added to the balance, and future interest is charged on the larger total",
          "Compound interest only applies to savings accounts, not debt",
        ],
        correctIndex: 2,
        explanation: "On debt, compound interest means you owe interest on your interest. If you don't pay down a balance, it grows exponentially — just like savings do, but working against you.",
      },
      {
        question: "Between two accounts with the same annual rate, which earns more: monthly or daily compounding?",
        options: [
          "Monthly compounding earns more",
          "They earn exactly the same amount",
          "Daily compounding earns more",
          "It depends entirely on the specific bank",
        ],
        correctIndex: 2,
        explanation: "More frequent compounding means interest is added to your balance sooner, so future calculations use a slightly larger base. Daily compounding earns marginally more than monthly at the same stated annual rate.",
      },
    ],
  },
]
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "saving-habits"
```

Expected: no errors about `saving-habits.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/saving-habits.ts
git commit -m "feat: add Saving Habits lesson content (4 lessons)"
```

---

## Task 5: Smart Spending Lesson Content

**Files:**
- Create: `src/content/lessons/smart-spending.ts`

- [ ] **Step 1: Create the file with all 6 lessons**

Create `src/content/lessons/smart-spending.ts`:

```typescript
import type { Lesson } from "./index"

export const smartSpendingLessons: Lesson[] = [
  {
    id: "needs-vs-wants",
    title: "Needs vs. Wants",
    content: [
      "A need is something essential for survival and basic functioning — food, water, shelter, clothing, healthcare, and transportation to school or work. A want is something that improves your life or makes it more enjoyable, but you could survive without — a streaming subscription, a new video game, designer sneakers, or dining at a restaurant. The distinction sounds simple, but it gets complicated quickly.",
      "The lines blur constantly. A phone could be a need (communication, safety, school) or a want (the newest model when your current one works fine). The base version of something is often a need; the premium upgrade is usually a want. A meal is a need; a $15 restaurant meal when you could eat at home for $3 is partly a want. Learning to recognize which part of a purchase is a need and which is a want is a crucial financial skill.",
      "Wants aren't bad. Life would be miserable if you only ever spent on strict necessities. The problem arises when wants crowd out needs — spending on entertainment while struggling to pay rent, or buying new clothes while having no emergency savings. The goal isn't to eliminate wants but to make sure needs and savings come first.",
      "Social pressure makes the needs/wants line harder to see. When everyone around you has the latest phone or a specific brand, not having it can feel like genuine deprivation — even though it objectively isn't. This is sometimes called 'lifestyle creep' — your definition of 'normal' expands with your peers' spending. Being aware of this pressure doesn't eliminate it, but it helps you make more deliberate choices.",
      "A useful exercise is the 48-hour rule: wait two days before buying anything that isn't an immediate need. If you still want it after 48 hours, it might be worth buying. If you've forgotten about it, you've saved money that can go toward something that actually matters to you. Most impulse purchases fail this test — the excitement is temporary, but the money spent is permanent.",
    ],
    quiz: [
      {
        question: "Which of the following is the clearest example of a NEED?",
        options: [
          "A new video game console released this month",
          "A streaming music subscription service",
          "Food for lunch to get through the school day",
          "Brand-name athletic shoes instead of a store brand",
        ],
        correctIndex: 2,
        explanation: "Food is a biological necessity — you need it to survive and function. The others improve life quality or entertainment but are not required for basic survival or daily functioning.",
      },
      {
        question: "How should you think about smartphone ownership — is it a need or a want?",
        options: [
          "Always a need — everyone must have a phone to function in modern society",
          "Always a want — phones are a luxury, not a necessity",
          "Basic communication and safety functions may be a need, but premium features are wants",
          "It depends entirely on how much money you have available",
        ],
        correctIndex: 2,
        explanation: "A working phone for communication and safety might be a need, but the latest flagship model with top-tier features when your current phone works fine is a want. Needs and wants often coexist in the same item.",
      },
      {
        question: "What is 'lifestyle creep'?",
        options: [
          "Gradually increasing your income by developing better skills",
          "Slowly upgrading your belongings to higher-quality versions",
          "The tendency for spending expectations to expand as income or peer group changes",
          "Spending money on unnecessary items because of peer pressure at school",
        ],
        correctIndex: 2,
        explanation: "Lifestyle creep happens when your definition of 'normal' expands — what used to be a luxury becomes expected. Many people never build wealth because every income increase gets absorbed into higher spending.",
      },
      {
        question: "Why are wants not inherently bad or harmful?",
        options: [
          "They motivate people to work harder and earn more money",
          "Life quality matters, and enjoying wants is fine as long as needs and savings come first",
          "Wants are sometimes disguised needs that you actually require",
          "Spending on wants stimulates the economy and helps everyone",
        ],
        correctIndex: 1,
        explanation: "The goal isn't deprivation — enjoying life matters. The problem arises only when wants crowd out needs or savings. Wants are perfectly fine in their proper place within a healthy budget.",
      },
      {
        question: "What is the purpose of the '48-hour rule' when considering a purchase?",
        options: [
          "To give the store time to verify you can afford the item",
          "To allow the impulse excitement to fade so you can make a more rational decision",
          "To check whether the price drops on the item within 48 hours",
          "To give yourself time to save up the money before buying it",
        ],
        correctIndex: 1,
        explanation: "Impulse purchases feel urgent but usually aren't. Waiting 48 hours lets the emotional excitement fade. If you still genuinely want it after two days, it's more likely a thoughtful choice you won't regret.",
      },
    ],
  },
  {
    id: "making-a-budget",
    title: "Making a Budget",
    content: [
      "Creating a personal budget starts with knowing your income. For teenagers, this might include a regular allowance, earnings from a part-time job, and occasional gifts averaged over the year. Add these up to find your monthly income — your total starting point. If income varies, average the last three months to use as your baseline.",
      "Next, list every spending category. Common ones include food and drinks, entertainment (streaming, games, movies), clothing and personal care, transportation, subscriptions, and savings. The goal is to account for every dollar — untracked spending ends up in a 'miscellaneous' category that grows larger than expected and kills budgets quietly.",
      "For each category, estimate a realistic monthly limit. Review the past month of actual spending using bank statements or app purchase history if available. Most people discover that a few categories dominate in surprising ways. Food outside home (delivery, cafes, fast food) and entertainment are the two categories people most consistently underestimate.",
      "Once categories are set, verify that planned spending fits income. Total income minus total planned spending should be zero or positive — the positive remainder goes to savings. If spending exceeds income, go back through categories and find cuts. Don't balance by cutting savings; savings should be treated as a non-negotiable line item.",
      "Track actual spending against your budget throughout the month. Apps like YNAB (You Need A Budget) automatically categorize bank transactions. Or keep it simple: a notes app or paper notebook for each purchase. The point is catching overspending in a category while there's still time to adjust — not discovering it after the month is already over.",
    ],
    quiz: [
      {
        question: "If your income varies each month, what is the best way to set your budget baseline?",
        options: [
          "Use your highest-earning month as the expected income",
          "Use your lowest-earning month to be conservative",
          "Use the average of the last three months",
          "Use zero and only plan spending as money arrives",
        ],
        correctIndex: 2,
        explanation: "Averaging the last three months smooths out fluctuations. Using your highest month risks overspending during slower months; using your lowest month may be unnecessarily restrictive.",
      },
      {
        question: "Why is it important to track every spending category, even small ones?",
        options: [
          "Banks legally require documentation of all spending for tax purposes",
          "Small categories add up significantly and untracked spending becomes a growing mystery",
          "The government needs accurate spending records from all citizens",
          "Small purchases have an outsized negative effect on your credit score",
        ],
        correctIndex: 1,
        explanation: "Untracked spending tends to grow. Small, frequent purchases in vague categories often add up to significant amounts that surprise people when they finally calculate the total.",
      },
      {
        question: "You earn $400/month and plan to spend $350. What should you do with the remaining $50?",
        options: [
          "Keep it available for unexpected fun spending opportunities",
          "Add it to your savings account",
          "Apply it to your largest spending category next month",
          "Carry it forward as extra spending money for next month",
        ],
        correctIndex: 1,
        explanation: "A budget surplus — income exceeding planned spending — should go to savings. This is the fundamental goal of budgeting: ensuring something is consistently left over to build financial security.",
      },
      {
        question: "Which two categories do people most commonly underestimate in their budget?",
        options: [
          "Housing costs and transportation expenses",
          "Clothing purchases and healthcare costs",
          "Food outside the home and entertainment",
          "Utility bills and monthly subscriptions",
        ],
        correctIndex: 2,
        explanation: "Food purchases (delivery, cafes, fast food) and entertainment (streaming, games, events, movies) happen frequently in small amounts that feel insignificant individually but add up dramatically over a month.",
      },
      {
        question: "What is the main benefit of using a budgeting app that connects to your bank account?",
        options: [
          "It automatically moves money between your accounts for you",
          "It negotiates lower prices on your subscriptions",
          "It tracks spending automatically so you can monitor actual vs. planned in real time",
          "It earns a higher interest rate on the money in your savings account",
        ],
        correctIndex: 2,
        explanation: "Automated tracking removes the friction of logging every purchase manually, making it much more likely you'll actually monitor your budget throughout the month rather than only checking at the end.",
      },
    ],
  },
  {
    id: "comparison-shopping",
    title: "Comparison Shopping",
    content: [
      "Comparison shopping means researching prices and quality across multiple options before buying — rather than purchasing the first thing you find. It sounds obvious, but most people don't comparison shop for most purchases, either because they're in a hurry or assume prices are fixed. In reality, prices for identical items often vary 20–40% between different retailers.",
      "Online comparison is easier than ever. Google Shopping shows prices across retailers simultaneously. Browser extensions like Honey automatically find coupon codes and alert you to better prices. Checking Amazon, Target, Walmart, and the manufacturer's own website for the same item takes under three minutes and can save $10–50 on a mid-sized purchase.",
      "Brand vs. generic is one of the most powerful comparison decisions you'll make repeatedly. Store-brand products in groceries, medications, and basic clothing often provide identical quality to name brands at 20–50% less cost. The name-brand premium typically pays for advertising and packaging, not the product itself. This is especially true for medications — the FDA requires generic drugs to be chemically equivalent to brand-name versions.",
      "Quality matters in comparison shopping — cheapest isn't always best value. A $15 pair of headphones that breaks in two months costs more per use than $40 headphones that last three years. Cost per use is a more useful metric than purchase price. For items you'll use constantly (backpack, shoes, bike), quality investment often saves money over time. For rarely-used items, budget options make more sense.",
      "Don't overlook total cost of ownership. A $50 printer requiring $80/year in ink costs more over three years than a $150 printer requiring $30/year — $290 vs. $240 total. The same principle applies to cars (fuel and repair costs), appliances (energy consumption), and clothing (durability and care requirements). Always think beyond the sticker price to the full lifetime cost.",
    ],
    quiz: [
      {
        question: "By how much can prices for the same item typically vary between different retailers?",
        options: [
          "2–5% — barely worth the effort of looking",
          "5–10% — a modest but minor difference",
          "20–40% — a significant difference worth checking",
          "50–100% — always dramatically different",
        ],
        correctIndex: 2,
        explanation: "Research shows that for many products, prices vary 20-40% between retailers. Even checking 2-3 stores before buying can generate meaningful savings on regular purchases.",
      },
      {
        question: "Why do generic medications cost less than brand-name ones, despite being equivalent?",
        options: [
          "Generic drugs are manufactured with lower-quality ingredients",
          "Generic drugs undergo less safety testing than brand-name drugs",
          "Brand-name drug prices include advertising and branding costs, not drug quality",
          "Generic drugs are only available at specific types of pharmacies",
        ],
        correctIndex: 2,
        explanation: "FDA regulations require generic drugs to be chemically equivalent to brand-name versions — same active ingredient, dosage, and effectiveness. Price differences reflect marketing budgets, not product quality.",
      },
      {
        question: "What is 'cost per use' and why is it useful when comparing products?",
        options: [
          "The tax rate applied to a consumer purchase",
          "The purchase price divided by expected times you'll use the product",
          "A bulk discount offered when buying multiple units",
          "The annual maintenance cost of owning an item",
        ],
        correctIndex: 1,
        explanation: "Cost per use helps compare items with different prices and lifespans. A $40 item used 200 times costs $0.20/use; a $15 item used 30 times costs $0.50/use — the 'cheaper' item is actually more expensive per use.",
      },
      {
        question: "A $50 printer uses $80/year in ink. A $150 printer uses $30/year in ink. After 3 years, which costs less total?",
        options: [
          "The $50 printer, which totals $290 over three years",
          "They cost exactly the same amount over three years",
          "The $150 printer, which totals $240 over three years",
          "It depends entirely on how much printing you do",
        ],
        correctIndex: 2,
        explanation: "$50 + ($80 × 3) = $290 for the cheap printer. $150 + ($30 × 3) = $240 for the expensive one. Total cost of ownership matters more than the sticker price for items with significant ongoing costs.",
      },
      {
        question: "For which type of purchase does the budget option make the MOST sense?",
        options: [
          "Shoes that you will wear every single day for several years",
          "A backpack you will use throughout all of high school",
          "A specialized tool you will use only once or twice ever",
          "A smartphone that you plan to use for the next three years",
        ],
        correctIndex: 2,
        explanation: "For rarely used items, the quality difference between budget and premium barely matters since there's minimal wear and tear. Save money on things you'll barely use; invest in quality for things you'll use constantly.",
      },
    ],
  },
  {
    id: "understanding-ads",
    title: "Understanding Advertisements",
    content: [
      "The average person sees 4,000–10,000 advertisements per day — on social media, streaming services, YouTube, billboards, packaging, and more. Advertising exists for one purpose: to persuade you to buy something. Understanding the techniques advertisers use doesn't make all advertising manipulative or bad, but it helps you make deliberate decisions rather than responding to psychological triggers unconsciously.",
      "One of the most common techniques is emotional appeal. Ads rarely focus on product specs — they show happy families, exciting adventures, or social success associated with the product. A car ad sells freedom and open roads, not MPG ratings. A sneaker ad shows elite athletes, not factory materials. The goal is to make you feel something about the product — because feelings drive purchasing decisions more powerfully than facts.",
      "Social proof is the technique of implying that 'everyone' uses a product. Celebrity endorsements, influencer posts, and 'bestseller' labels exploit the psychological tendency to want what others have. If your favorite athlete wears a certain brand, your brain associates it with success — even when you consciously know the athlete is being paid to wear it.",
      "Artificial scarcity and urgency are common online. 'Only 3 left in stock,' 'Sale ends in 2 hours,' and countdown timers create pressure to buy immediately before you have time to think. In many cases the scarcity isn't real — timers reset, sales extend, and 'limited' stock replenishes. These tactics trigger fear of missing out (FOMO) to bypass your rational decision-making.",
      "The best defense is to decide what you want before you encounter ads — not after. If you've already decided 'I need running shoes under $80,' you evaluate every ad against a concrete standard. If you browse without a goal, ads create desires you didn't have before. Shopping with intent — a specific purpose and budget in mind — dramatically reduces impulse spending triggered by advertising.",
    ],
    quiz: [
      {
        question: "What is the primary goal of advertising?",
        options: [
          "To inform consumers about the factual details of products",
          "To persuade you to buy something",
          "To educate people about new technologies and innovations",
          "To comply with government transparency requirements for businesses",
        ],
        correctIndex: 1,
        explanation: "Advertising is paid persuasion. Even informational ads are ultimately designed to move you toward a purchase. Recognizing this motive helps you evaluate ads more critically.",
      },
      {
        question: "Why do car ads show open roads and freedom rather than MPG ratings and specifications?",
        options: [
          "Because MPG ratings are too complicated to display visually in a short ad",
          "Because emotional associations drive purchasing decisions more powerfully than facts",
          "Because government regulations restrict technical claims in automotive advertising",
          "Because most consumers genuinely do not care about fuel efficiency",
        ],
        correctIndex: 1,
        explanation: "Advertisers know emotions drive decisions. You're more likely to buy a car that makes you feel free and excited than one with better specs on paper — so ads sell feelings, not features.",
      },
      {
        question: "What is 'social proof' in advertising?",
        options: [
          "Evidence that a product has been tested and certified for safety",
          "Research data from scientific studies proving product effectiveness",
          "Using celebrity, influencer, or 'bestseller' status to make a product seem desirable",
          "Showing that a product is affordable and accessible to all income levels",
        ],
        correctIndex: 2,
        explanation: "Social proof exploits the human tendency to want what others have. If your favorite celebrity uses something or it's labeled 'bestseller,' your brain assigns it more value — even though those signals say nothing about whether you need it.",
      },
      {
        question: "What is the purpose of countdown timers and 'only 3 left' messages in online shopping?",
        options: [
          "To accurately communicate real-time inventory levels to shoppers",
          "To reward customers who make fast decisions with exclusive pricing",
          "To create urgency and prevent you from taking time to think carefully",
          "To help the website manage its shipping schedule more efficiently",
        ],
        correctIndex: 2,
        explanation: "Artificial scarcity and urgency bypass rational thinking by triggering fear of missing out. The goal is to prompt a purchase before your thoughtful decision-making kicks in and overrides the impulse.",
      },
      {
        question: "What is the most effective strategy for resisting advertising-driven impulse spending?",
        options: [
          "Installing ad blockers on every device to avoid all advertising completely",
          "Shopping exclusively in physical stores instead of online",
          "Deciding what you want and your budget before shopping, then evaluating ads against that standard",
          "Always waiting for a major sale event before making any purchase",
        ],
        correctIndex: 2,
        explanation: "Shopping with intent — knowing specifically what you're looking for and your budget limit before you encounter ads — gives you a concrete standard to evaluate purchases against. Ads create desires; a pre-set goal limits their power.",
      },
    ],
  },
  {
    id: "credit-and-debt",
    title: "Credit and Debt",
    content: [
      "Credit is borrowed money you promise to repay, usually with interest. When a bank gives you a credit card, they're extending a line of credit — an amount you can borrow up to a limit. Every purchase charges to that credit line. At month's end, you can pay the full balance (what you owe) or a minimum payment. Paying in full means zero interest. Carrying a balance means interest charges accumulate on whatever remains.",
      "Credit scores are numerical ratings (typically 300–850 in the US) representing how reliably you repay borrowed money. They're calculated based on: payment history (most important factor), credit utilization (how much of your available credit you're using), length of credit history, types of credit, and new credit applications. Lenders, landlords, and some employers check credit scores. A high score (720+) unlocks lower interest rates on loans and mortgages.",
      "Credit card interest typically ranges 15–30% APR. A $1,000 balance at 20% APR with $25 minimum payments takes over 5 years to pay off, costing nearly $700 in interest — you'd pay $1,700 total for something that originally cost $1,000. High interest rates turn manageable balances into burdensome long-term debt surprisingly quickly.",
      "Not all debt is harmful. Mortgages let people buy homes they couldn't pay for upfront, and many homeowners build significant wealth through real estate. Student loans can fund education that increases lifetime earnings. Business loans can fund growth that generates profits. The key distinction is debt used to acquire things that grow in value or generate income (often worthwhile) versus debt for things that lose value or get consumed (usually a trap).",
      "Building credit responsibly starts with thoughtful use. Getting a starter credit card with a low limit, using it for small regular purchases (gas, groceries), and paying the full balance every month is the safest approach. You build credit history without paying a dollar of interest. Setting up automatic full payment removes the risk of accidentally forgetting and incurring charges. Use credit as a tool for convenience and building history — not as extra spending money.",
    ],
    quiz: [
      {
        question: "What happens if you pay only the minimum payment on a credit card balance each month?",
        options: [
          "Nothing changes — minimum payments clear the balance over time without extra cost",
          "The remaining balance is automatically forgiven after a set number of payments",
          "Interest accrues on the remaining balance, growing the total amount you owe",
          "The bank cancels your credit card for not paying the full amount",
        ],
        correctIndex: 2,
        explanation: "Minimum payments keep you in good standing but barely reduce the principal. Interest compounds on the unpaid balance, dramatically increasing the total you pay over time — often doubling or more the original amount.",
      },
      {
        question: "What factor has the MOST impact on your credit score?",
        options: [
          "The total number of credit cards you currently have open",
          "Your payment history — whether you consistently pay on time",
          "How high your total credit limits are across all accounts",
          "How frequently you apply for new credit accounts",
        ],
        correctIndex: 1,
        explanation: "Payment history is the single largest factor in credit scores. Consistently paying on time builds your score steadily; late or missed payments damage it significantly and can take years to recover from.",
      },
      {
        question: "You borrow $1,000 on a credit card at 20% APR and make $25 minimum payments. Approximately how much do you pay in total?",
        options: [
          "$1,000 — exactly what you borrowed originally",
          "$1,200 — 20% more than the original amount",
          "$1,700 — including about $700 in interest charges",
          "$2,500 — more than double the original amount",
        ],
        correctIndex: 2,
        explanation: "At 20% APR with $25 minimum payments, you make over 60 payments across 5+ years, paying roughly $700 in interest on top of the $1,000 principal — about $1,700 total.",
      },
      {
        question: "Which type of debt is generally considered worthwhile and potentially beneficial?",
        options: [
          "Credit card debt used to purchase a new television",
          "A personal loan taken out to fund an expensive vacation",
          "A mortgage used to buy a home that may appreciate in value over time",
          "A payday loan used to cover entertainment expenses this week",
        ],
        correctIndex: 2,
        explanation: "Debt used to acquire assets that appreciate or generate income — homes, education that increases earnings, business investments — can make long-term financial sense. Debt for consumption that loses value typically doesn't.",
      },
      {
        question: "What is the safest strategy for building a credit history as a young person?",
        options: [
          "Take out a personal loan and repay it as quickly as possible",
          "Use a credit card for all purchases and maintain a small ongoing balance",
          "Avoid using any credit at all until you are much older",
          "Use a starter credit card for regular purchases and pay the full balance every month",
        ],
        correctIndex: 3,
        explanation: "A starter card used for purchases you'd make anyway (gas, groceries) and paid in full monthly builds credit history without any interest cost. Automatic full payment prevents accidentally carrying a balance.",
      },
    ],
  },
  {
    id: "smart-choices",
    title: "Making Smart Financial Choices",
    content: [
      "Financial decision-making is a skill that improves with practice. One foundational principle is opportunity cost: every dollar spent on one thing is a dollar unavailable for something else. Buying a $60 video game also means choosing not to save $60, invest it, or buy something else. Making this trade-off visible helps you decide whether a purchase aligns with your actual priorities.",
      "A practical decision framework for spending: First, is this a need or a want? Second, does it fit my budget? Third, have I comparison shopped? Fourth, for significant purchases, have I waited 48 hours? Fifth, is this the best use of this money given my current goals? Running through this checklist takes under a minute and dramatically improves purchase decisions — shifting spending from reactive (see it, want it, buy it) to deliberate.",
      "Avoiding common mistakes matters as much as making good choices. The most financially damaging mistakes for young people are: carrying credit card debt (interest compounds against you), having no emergency fund (any setback becomes a crisis), lifestyle inflation (spending more as you earn more instead of saving more), and comparing your spending to others instead of to your own goals. Knowing these pitfalls in advance lets you recognize and avoid them.",
      "Financial decisions compound over time. Every smart choice now makes future choices easier. Build an emergency fund in your teens and you rarely need to borrow in your 20s. Avoid credit card debt in your 20s and you keep more income for your own goals. Start investing small amounts early and they grow dramatically by retirement. Small, consistent decisions — not one big financial event — determine financial outcomes over a lifetime.",
      "Financial literacy is ultimately about freedom. Understanding money doesn't just help you avoid mistakes — it creates possibilities. Good money management means you can take risks (start a business, change careers) because you have a financial cushion. It means you can take opportunities (travel, education) because you've saved. It means less stress because you're not constantly worried about making ends meet. The goal isn't to maximize wealth — it's to have money work for you instead of against you.",
    ],
    quiz: [
      {
        question: "What is 'opportunity cost'?",
        options: [
          "The interest charged when you borrow money from a bank",
          "The late fee charged when you miss a payment deadline",
          "What you give up by choosing one option instead of all available alternatives",
          "The cost of recovering from an unexpected financial emergency",
        ],
        correctIndex: 2,
        explanation: "Every financial choice is also a rejection of alternatives. Spending $60 on a game means not saving, investing, or spending that $60 elsewhere. Seeing trade-offs clearly leads to better decisions.",
      },
      {
        question: "In the 5-step spending decision framework, which check comes LAST?",
        options: [
          "Is this a need or a want?",
          "Does it fit within my current budget?",
          "Have I waited 48 hours for significant purchases?",
          "Is this the best use of this money given my current goals?",
        ],
        correctIndex: 3,
        explanation: "The final check ties the purchase back to your broader financial priorities. An item might pass every other check but still not be the best use of money given what you're currently working toward.",
      },
      {
        question: "Which is described as one of the most financially damaging mistakes for young people?",
        options: [
          "Saving too aggressively and missing out on important experiences",
          "Investing in stocks before fully understanding how they work",
          "Carrying credit card debt that compounds against you at high interest rates",
          "Having too many separate savings goals running simultaneously",
        ],
        correctIndex: 2,
        explanation: "Credit card interest (15-30% APR) compounds against you, consuming an increasing share of your income. It makes everything you purchased with that debt significantly more expensive in the long run.",
      },
      {
        question: "What is 'lifestyle inflation'?",
        options: [
          "The rising cost of basic necessities like food and housing over time",
          "The tendency to increase spending as income grows instead of increasing savings",
          "Buying luxury goods you cannot actually afford using credit",
          "Spending more than your budget allows on entertainment and dining",
        ],
        correctIndex: 1,
        explanation: "Lifestyle inflation means every income increase gets absorbed into higher spending — nicer apartment, newer car, more dining out — with no improvement in savings rate. It keeps people financially stagnant even as they earn more.",
      },
      {
        question: "According to the lesson, what is the ultimate goal of financial literacy?",
        options: [
          "To accumulate the maximum possible wealth over your lifetime",
          "To spend as little money as possible and minimize consumption",
          "To have money work for you rather than against you, creating freedom and reducing stress",
          "To understand investment markets well enough to consistently earn high returns",
        ],
        correctIndex: 2,
        explanation: "The lesson frames financial literacy as freedom — the ability to take risks, seize opportunities, and reduce money-related anxiety because you understand and manage your finances well.",
      },
    ],
  },
]
```

- [ ] **Step 2: Verify all content files compile together**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (all three content files now exist).

- [ ] **Step 3: Commit**

```bash
git add src/content/lessons/smart-spending.ts
git commit -m "feat: add Smart Spending lesson content (6 lessons)"
```

---

## Task 6: Server Actions for Lesson Progress

**Files:**
- Create: `src/actions/learn.ts`

- [ ] **Step 1: Create the server actions file**

Create `src/actions/learn.ts`:

```typescript
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function completeLesson(
  moduleId: string,
  lessonId: string,
  score: number
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.learningProgress.upsert({
    where: {
      userId_moduleId_lessonId: {
        userId: session.user.id,
        moduleId,
        lessonId,
      },
    },
    update: {
      score,
      completed: true,
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      moduleId,
      lessonId,
      score,
      completed: true,
      completedAt: new Date(),
    },
  })
}

export async function getLessonProgress(): Promise<Set<string>> {
  const session = await auth()
  if (!session?.user?.id) return new Set()

  const records = await prisma.learningProgress.findMany({
    where: { userId: session.user.id, completed: true },
    select: { moduleId: true, lessonId: true },
  })

  return new Set(records.map((r) => `${r.moduleId}:${r.lessonId}`))
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "learn.ts"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/learn.ts
git commit -m "feat: add completeLesson and getLessonProgress server actions"
```

---

## Task 7: Module Overview Page

**Files:**
- Create: `src/app/(protected)/learn/[moduleId]/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "src/app/(protected)/learn/[moduleId]"
```

- [ ] **Step 2: Write the module overview page**

Create `src/app/(protected)/learn/[moduleId]/page.tsx`:

```typescript
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Lock, Circle, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { getModule, isLessonUnlocked } from "@/content/lessons"
import { getLessonProgress } from "@/actions/learn"

export default async function ModuleOverviewPage({
  params,
}: {
  params: { moduleId: string }
}) {
  const module = getModule(params.moduleId)
  if (!module) notFound()

  const completed = await getLessonProgress()
  const completedCount = module.lessons.filter((l) =>
    completed.has(`${module.id}:${l.id}`)
  ).length
  const progressPercent = Math.round(
    (completedCount / module.lessons.length) * 100
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Modules
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">{module.title}</h1>
            <p className="text-muted-foreground mb-4">{module.description}</p>
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {completedCount} of {module.lessons.length} complete
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {module.lessons.map((lesson, index) => {
              const isCompleted = completed.has(`${module.id}:${lesson.id}`)
              const unlocked = isLessonUnlocked(module.id, lesson.id, completed)

              return (
                <Card key={lesson.id} className={!unlocked ? "opacity-50" : ""}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex-shrink-0 w-6">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : unlocked ? (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Lesson {index + 1}
                      </p>
                      <p className="font-medium">{lesson.title}</p>
                    </div>
                    {unlocked && (
                      <Link href={`/learn/${module.id}/${lesson.id}`}>
                        <Button size="sm" variant={isCompleted ? "outline" : "default"}>
                          {isCompleted ? "Review" : "Start"}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "moduleId"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/learn/[moduleId]/page.tsx"
git commit -m "feat: add module overview page with lesson list and progress"
```

---

## Task 8: Lesson Client Component

**Files:**
- Create: `src/app/(protected)/learn/[moduleId]/[lessonId]/LessonClient.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/(protected)/learn/[moduleId]/[lessonId]"
```

- [ ] **Step 2: Write the client component**

Create `src/app/(protected)/learn/[moduleId]/[lessonId]/LessonClient.tsx`:

```typescript
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { completeLesson } from "@/actions/learn"
import type { Lesson } from "@/content/lessons"

const PASSING_SCORE = 4

interface LessonClientProps {
  lesson: Lesson
  moduleId: string
  nextLessonId: string | null
  isAlreadyCompleted: boolean
}

export function LessonClient({
  lesson,
  moduleId,
  nextLessonId,
  isAlreadyCompleted,
}: LessonClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<(number | null)[]>(
    lesson.quiz.map(() => null)
  )
  const [revealed, setRevealed] = useState<boolean[]>(
    lesson.quiz.map(() => false)
  )
  const [resetKey, setResetKey] = useState(0)

  const allAnswered = answers.every((a) => a !== null)
  const score = answers.filter(
    (a, i) => a === lesson.quiz[i].correctIndex
  ).length
  const passed = allAnswered && score >= PASSING_SCORE

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (answers[questionIndex] !== null) return
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
    setRevealed((prev) => {
      const next = [...prev]
      next[questionIndex] = true
      return next
    })
  }

  function handleTryAgain() {
    setAnswers(lesson.quiz.map(() => null))
    setRevealed(lesson.quiz.map(() => false))
    setResetKey((k) => k + 1)
  }

  function handleComplete() {
    startTransition(async () => {
      await completeLesson(moduleId, lesson.id, score)
      if (nextLessonId) {
        router.push(`/learn/${moduleId}/${nextLessonId}`)
      } else {
        router.push(`/learn/${moduleId}`)
      }
    })
  }

  return (
    <div>
      {/* Lesson content */}
      <div className="mb-10 space-y-4">
        {lesson.content.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Quiz */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold mb-6">Quiz</h2>
        <div className="flex flex-col gap-8" key={resetKey}>
          {lesson.quiz.map((question, qi) => (
            <div key={qi}>
              <p className="font-medium mb-3">
                {qi + 1}. {question.question}
              </p>
              <div className="flex flex-col gap-2">
                {question.options.map((option, oi) => {
                  const isSelected = answers[qi] === oi
                  const isCorrect = oi === question.correctIndex
                  const showFeedback = revealed[qi]

                  let cls =
                    "border rounded-lg px-4 py-3 text-left transition-colors w-full text-sm "
                  if (!showFeedback) {
                    cls += "hover:bg-muted cursor-pointer"
                  } else if (isCorrect) {
                    cls += "border-green-500 bg-green-50 text-green-800"
                  } else if (isSelected) {
                    cls += "border-red-500 bg-red-50 text-red-800"
                  } else {
                    cls += "opacity-40"
                  }

                  return (
                    <button
                      key={oi}
                      className={cls}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={showFeedback}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {revealed[qi] && (
                <div
                  className={`mt-3 flex items-start gap-2 text-sm ${
                    answers[qi] === question.correctIndex
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {answers[qi] === question.correctIndex ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{question.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Result bar */}
        {allAnswered && (
          <div className="mt-8 rounded-lg border bg-muted/50 p-4">
            <p className="font-semibold mb-3">
              Score: {score} / {lesson.quiz.length}
              {passed ? " — Great work! 🎉" : ` — Need ${PASSING_SCORE} to pass`}
            </p>
            {passed ? (
              <Button onClick={handleComplete} disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : nextLessonId
                  ? "Next Lesson →"
                  : "Complete Module →"}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleTryAgain}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Already-completed navigation (review mode) */}
        {isAlreadyCompleted && !allAnswered && (
          <div className="mt-6 flex gap-3">
            {nextLessonId && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/learn/${moduleId}/${nextLessonId}`)
                }
              >
                Next Lesson →
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push(`/learn/${moduleId}`)}
            >
              Back to Module
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "LessonClient"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/learn/[moduleId]/[lessonId]/LessonClient.tsx"
git commit -m "feat: add LessonClient component with quiz state and pass/fail logic"
```

---

## Task 9: Lesson Server Page

**Files:**
- Create: `src/app/(protected)/learn/[moduleId]/[lessonId]/page.tsx`

- [ ] **Step 1: Write the server component**

Create `src/app/(protected)/learn/[moduleId]/[lessonId]/page.tsx`:

```typescript
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { getModule, getLesson, getNextLesson, isLessonUnlocked } from "@/content/lessons"
import { getLessonProgress } from "@/actions/learn"
import { LessonClient } from "./LessonClient"

export default async function LessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string }
}) {
  const module = getModule(params.moduleId)
  if (!module) notFound()

  const lesson = getLesson(params.moduleId, params.lessonId)
  if (!lesson) notFound()

  const completed = await getLessonProgress()

  if (!isLessonUnlocked(params.moduleId, params.lessonId, completed)) {
    redirect(`/learn/${params.moduleId}`)
  }

  const isAlreadyCompleted = completed.has(
    `${params.moduleId}:${params.lessonId}`
  )
  const nextLesson = getNextLesson(params.moduleId, params.lessonId)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/learn" className="hover:text-foreground">
              Learning
            </Link>
            <span>→</span>
            <Link
              href={`/learn/${module.id}`}
              className="hover:text-foreground"
            >
              {module.title}
            </Link>
            <span>→</span>
            <span className="text-foreground">{lesson.title}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {isAlreadyCompleted && (
              <div className="flex items-center gap-1 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            )}
          </div>

          <LessonClient
            lesson={lesson}
            moduleId={params.moduleId}
            nextLessonId={nextLesson?.id ?? null}
            isAlreadyCompleted={isAlreadyCompleted}
          />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "lessonId"
```

Expected: no errors.

- [ ] **Step 3: Test the build**

```bash
npm run build
```

Expected: successful build with routes listed including `ƒ /learn/[moduleId]` and `ƒ /learn/[moduleId]/[lessonId]`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/learn/[moduleId]/[lessonId]/page.tsx"
git commit -m "feat: add lesson page with gating redirect and LessonClient integration"
```

---

## Task 10: Update /learn Module List Page

**Files:**
- Modify: `src/app/(protected)/learn/page.tsx`

- [ ] **Step 1: Read the current file**

Read `src/app/(protected)/learn/page.tsx` before editing. The current file defines a `modules` array at the top with hardcoded icon JSX, and renders three `Card` components with a plain `<Button size="sm">Start</Button>` that does nothing.

- [ ] **Step 2: Replace the file contents**

Replace `src/app/(protected)/learn/page.tsx` with:

```typescript
import Link from "next/link"
import { BookOpen, Coins, Wallet, TrendingUp, CheckCircle2 } from "lucide-react"
import { Header } from "@/components/layout/Header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MODULES } from "@/content/lessons"
import { getLessonProgress } from "@/actions/learn"

const MODULE_ICONS: Record<string, React.ReactNode> = {
  "money-basics": <Coins className="h-8 w-8 text-primary" />,
  "saving-habits": <Wallet className="h-8 w-8 text-secondary" />,
  "smart-spending": <TrendingUp className="h-8 w-8 text-accent" />,
}

export default async function LearnPage() {
  const completed = await getLessonProgress()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Modules</h1>
            <p className="text-muted-foreground">
              Choose a module to start learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULES.map((module) => {
              const completedCount = module.lessons.filter((l) =>
                completed.has(`${module.id}:${l.id}`)
              ).length
              const total = module.lessons.length
              const allDone = completedCount === total
              const started = completedCount > 0

              const buttonLabel = allDone
                ? "Review"
                : started
                ? "Continue"
                : "Start"
              const buttonVariant = allDone ? "outline" : "default"

              return (
                <Card
                  key={module.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="mb-2">{MODULE_ICONS[module.id]}</div>
                    <CardTitle className="flex items-center justify-between">
                      {module.title}
                      {allDone && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {completedCount}/{total} lessons
                        </span>
                      </div>
                      <Link href={`/learn/${module.id}`}>
                        <Button size="sm" variant={buttonVariant}>
                          {buttonLabel}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/learn`. Verify:
- Three module cards display with `0/5 lessons`, `0/4 lessons`, `0/6 lessons`
- "Start" buttons link to `/learn/money-basics`, `/learn/saving-habits`, `/learn/smart-spending`
- Click "Start" on Money Basics → arrives at module overview with 5 lessons listed
- Lesson 1 ("What Is Money?") has a "Start" button; lessons 2–5 show a lock icon
- Click Lesson 1 → arrives at the lesson page with content and quiz
- Answer all 5 questions → see pass/fail result
- If passed (4+ correct) → click "Next Lesson →" → advances to Lesson 2 which is now unlocked
- If failed → click "Try Again" → quiz resets, content remains
- After completing all lessons in a module → redirect to module overview showing all checkmarks
- Return to `/learn` → module card shows `5/5 lessons` and a checkmark

- [ ] **Step 5: Final build check**

```bash
npm run build
```

Expected: successful build, no type errors, all 9 routes listed.

- [ ] **Step 6: Commit**

```bash
git add src/app/(protected)/learn/page.tsx
git commit -m "feat: update learn page with real progress data and working navigation"
```
