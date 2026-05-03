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
