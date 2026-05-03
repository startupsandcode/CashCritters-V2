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
