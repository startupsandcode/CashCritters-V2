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
        explanation: "'Save $150 for sneakers by end of next month' is specific ($150, sneakers), measurable, achievable, relevant to the person, and time-bound. The others are vague wishes.",
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
