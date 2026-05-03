// src/content/games/savings-race.ts

export interface GameScenario {
  id: string
  incomeSource: string | null   // null = no-income round
  incomeAmount: number | null   // dollars, null for no-income rounds
  incomeEmoji: string | null
  eventDescription: string
  eventCost: number             // dollars
  eventEmoji: string
}

export interface RoundOutcome {
  scenarioId: string
  isIncomeRound: boolean
  protected: boolean      // true = chose Save it / Skip it
  amountSaved: number     // cents; negative if dipped into savings
  amountSpent: number     // cents
}

export function isIncomeRound(scenario: GameScenario): boolean {
  return scenario.incomeAmount !== null
}

// 52 income scenarios — income $5–$25, event cost always less than income
const INCOME_SCENARIOS: GameScenario[] = [
  { id: "i01", incomeSource: "walked the neighbor's dog", incomeAmount: 15, incomeEmoji: "🐕", eventDescription: "Your friends are going to the movies!", eventCost: 10, eventEmoji: "🎬" },
  { id: "i02", incomeSource: "mowed the lawn", incomeAmount: 20, incomeEmoji: "🌿", eventDescription: "There's a new video game you've been wanting.", eventCost: 15, eventEmoji: "🎮" },
  { id: "i03", incomeSource: "birthday money from grandma", incomeAmount: 25, incomeEmoji: "🎂", eventDescription: "You found the perfect pair of sneakers.", eventCost: 18, eventEmoji: "👟" },
  { id: "i04", incomeSource: "running a lemonade stand", incomeAmount: 12, incomeEmoji: "🍋", eventDescription: "Your school is having a bake sale!", eventCost: 5, eventEmoji: "🧁" },
  { id: "i05", incomeSource: "babysitting the kids next door", incomeAmount: 15, incomeEmoji: "👶", eventDescription: "The carnival is in town! Ride tickets cost $8.", eventCost: 8, eventEmoji: "🎡" },
  { id: "i06", incomeSource: "selling craft bracelets", incomeAmount: 10, incomeEmoji: "📿", eventDescription: "Your friends want to grab pizza after school.", eventCost: 7, eventEmoji: "🍕" },
  { id: "i07", incomeSource: "collecting and recycling cans", incomeAmount: 8, incomeEmoji: "♻️", eventDescription: "A shiny pack of trading cards caught your eye.", eventCost: 5, eventEmoji: "🃏" },
  { id: "i08", incomeSource: "raking leaves for a neighbor", incomeAmount: 15, incomeEmoji: "🍂", eventDescription: "There's a cool new book in the school store.", eventCost: 6, eventEmoji: "📚" },
  { id: "i09", incomeSource: "helping a neighbor move boxes", incomeAmount: 20, incomeEmoji: "📦", eventDescription: "Movie night calls for snacks from the corner store!", eventCost: 8, eventEmoji: "🍿" },
  { id: "i10", incomeSource: "watering plants for a vacationing neighbor", incomeAmount: 10, incomeEmoji: "🌱", eventDescription: "The ice cream shop just opened a new flavor!", eventCost: 4, eventEmoji: "🍦" },
  { id: "i11", incomeSource: "washing three cars on the street", incomeAmount: 25, incomeEmoji: "🚗", eventDescription: "A new game add-on just dropped.", eventCost: 18, eventEmoji: "🕹️" },
  { id: "i12", incomeSource: "shoveling snow from the driveway", incomeAmount: 20, incomeEmoji: "🌨️", eventDescription: "The cozy hot chocolate kit at the store looks perfect.", eventCost: 7, eventEmoji: "☕" },
  { id: "i13", incomeSource: "selling lemonade at the park", incomeAmount: 10, incomeEmoji: "🍋", eventDescription: "You spotted an epic sticker pack at the bookstore.", eventCost: 3, eventEmoji: "✨" },
  { id: "i14", incomeSource: "pet-sitting a cat for the weekend", incomeAmount: 15, incomeEmoji: "🐱", eventDescription: "The craft supply store has exactly what you need.", eventCost: 9, eventEmoji: "🎨" },
  { id: "i15", incomeSource: "doing extra chores around the house", incomeAmount: 12, incomeEmoji: "🧹", eventDescription: "You need some school supplies for a project.", eventCost: 6, eventEmoji: "📐" },
  { id: "i16", incomeSource: "delivering newspapers on the block", incomeAmount: 20, incomeEmoji: "📰", eventDescription: "Your old soccer ball has a slow leak — new one time!", eventCost: 14, eventEmoji: "⚽" },
  { id: "i17", incomeSource: "helping organize the garage", incomeAmount: 15, incomeEmoji: "🔧", eventDescription: "There's a beautiful art set on sale at the store.", eventCost: 10, eventEmoji: "🖌️" },
  { id: "i18", incomeSource: "selling handmade bookmarks at school", incomeAmount: 8, incomeEmoji: "🔖", eventDescription: "A smoothie shop opened near school — your favorite!", eventCost: 4, eventEmoji: "🥤" },
  { id: "i19", incomeSource: "tutoring the neighbor's kid in math", incomeAmount: 25, incomeEmoji: "📐", eventDescription: "A science experiment kit you've been eyeing is in stock.", eventCost: 15, eventEmoji: "🔬" },
  { id: "i20", incomeSource: "walking three dogs every morning", incomeAmount: 18, incomeEmoji: "🐾", eventDescription: "Your favorite store has sneakers on sale this weekend.", eventCost: 12, eventEmoji: "👟" },
  { id: "i21", incomeSource: "babysitting your siblings for an afternoon", incomeAmount: 15, incomeEmoji: "👧", eventDescription: "Friends are heading to mini golf — want to join?", eventCost: 8, eventEmoji: "⛳" },
  { id: "i22", incomeSource: "baking and selling cookies at school", incomeAmount: 12, incomeEmoji: "🍪", eventDescription: "The arcade by school has new games — tokens cost $7.", eventCost: 7, eventEmoji: "🕹️" },
  { id: "i23", incomeSource: "helping grandma with her garden", incomeAmount: 10, incomeEmoji: "🌻", eventDescription: "The school book fair has a book you really want.", eventCost: 5, eventEmoji: "📗" },
  { id: "i24", incomeSource: "cleaning the gutters for a neighbor", incomeAmount: 20, incomeEmoji: "🏠", eventDescription: "Your earbuds just broke and you found a good deal.", eventCost: 16, eventEmoji: "🎧" },
  { id: "i25", incomeSource: "selling old toys at a garage sale", incomeAmount: 15, incomeEmoji: "🪀", eventDescription: "An escape room is doing a group discount this weekend!", eventCost: 10, eventEmoji: "🔐" },
  { id: "i26", incomeSource: "washing windows around the house", incomeAmount: 12, incomeEmoji: "🪟", eventDescription: "There's a movie rental you've been waiting to see.", eventCost: 6, eventEmoji: "🎥" },
  { id: "i27", incomeSource: "helping set up decorations for a party", incomeAmount: 15, incomeEmoji: "🎉", eventDescription: "Your friend's birthday is coming — you need a gift!", eventCost: 10, eventEmoji: "🎁" },
  { id: "i28", incomeSource: "doing yardwork for the family down the street", incomeAmount: 20, incomeEmoji: "🌳", eventDescription: "Game night calls for a brand new board game!", eventCost: 14, eventEmoji: "🎲" },
  { id: "i29", incomeSource: "organizing the classroom supply closet", incomeAmount: 10, incomeEmoji: "📦", eventDescription: "You ran out of paint for your art project.", eventCost: 6, eventEmoji: "🖌️" },
  { id: "i30", incomeSource: "walking the neighbor's dog every day this week", incomeAmount: 25, incomeEmoji: "🐕", eventDescription: "Your backpack zipper broke — new backpack needed.", eventCost: 18, eventEmoji: "🎒" },
  { id: "i31", incomeSource: "helping run a school bake sale", incomeAmount: 12, incomeEmoji: "🧁", eventDescription: "The bake sale has some leftover cupcakes for sale!", eventCost: 4, eventEmoji: "🍰" },
  { id: "i32", incomeSource: "carrying groceries for an elderly neighbor", incomeAmount: 8, incomeEmoji: "🛍️", eventDescription: "The checkout lane has your favorite candy bars.", eventCost: 3, eventEmoji: "🍫" },
  { id: "i33", incomeSource: "selling painted rocks at the farmer's market", incomeAmount: 10, incomeEmoji: "🪨", eventDescription: "You found the perfect poster to put up in your room.", eventCost: 5, eventEmoji: "🖼️" },
  { id: "i34", incomeSource: "making and selling slime kits", incomeAmount: 15, incomeEmoji: "🟢", eventDescription: "You need more supplies for your slime business!", eventCost: 9, eventEmoji: "🧪" },
  { id: "i35", incomeSource: "helping coach the little league team", incomeAmount: 20, incomeEmoji: "⚾", eventDescription: "The sporting goods store has new batting gloves.", eventCost: 12, eventEmoji: "🧤" },
  { id: "i36", incomeSource: "cleaning and polishing bikes for neighbors", incomeAmount: 12, incomeEmoji: "🚲", eventDescription: "There's a cool set of reflective stickers for your bike.", eventCost: 5, eventEmoji: "⭐" },
  { id: "i37", incomeSource: "setting up a neighborhood pet-sitting service", incomeAmount: 25, incomeEmoji: "🐾", eventDescription: "The pet store has a toy your dog would absolutely love.", eventCost: 8, eventEmoji: "🦴" },
  { id: "i38", incomeSource: "helping with fall yard cleanup", incomeAmount: 18, incomeEmoji: "🍁", eventDescription: "You've been wanting a new sports headband.", eventCost: 6, eventEmoji: "🏃" },
  { id: "i39", incomeSource: "selling homemade jam at the farmer's market", incomeAmount: 15, incomeEmoji: "🍓", eventDescription: "You need cooking supplies to make your next batch.", eventCost: 10, eventEmoji: "🫙" },
  { id: "i40", incomeSource: "helping a family pack boxes for a move", incomeAmount: 20, incomeEmoji: "📦", eventDescription: "Lunch at the food court sounds really good right now.", eventCost: 8, eventEmoji: "🍔" },
  { id: "i41", incomeSource: "planting a neighbor's spring garden", incomeAmount: 15, incomeEmoji: "🌷", eventDescription: "You want to grow your own flowers — seeds are $5.", eventCost: 5, eventEmoji: "🌱" },
  { id: "i42", incomeSource: "organizing bookshelves at the local library", incomeAmount: 10, incomeEmoji: "📚", eventDescription: "The library gift shop has a beautiful leather bookmark.", eventCost: 3, eventEmoji: "🔖" },
  { id: "i43", incomeSource: "fixing bikes for kids on your street", incomeAmount: 18, incomeEmoji: "🔩", eventDescription: "You need fresh chain oil and a repair kit.", eventCost: 7, eventEmoji: "🛠️" },
  { id: "i44", incomeSource: "looking after the neighbor's rabbit", incomeAmount: 15, incomeEmoji: "🐰", eventDescription: "The craft store has a beading kit on clearance!", eventCost: 9, eventEmoji: "📿" },
  { id: "i45", incomeSource: "reading to younger kids at the library", incomeAmount: 10, incomeEmoji: "📖", eventDescription: "You spotted an amazing set of colored pens.", eventCost: 4, eventEmoji: "🖊️" },
  { id: "i46", incomeSource: "helping at a family friend's restaurant", incomeAmount: 25, incomeEmoji: "🍽️", eventDescription: "There's a beginner's cookbook you've been eyeing.", eventCost: 12, eventEmoji: "👨‍🍳" },
  { id: "i47", incomeSource: "selling your drawings online", incomeAmount: 12, incomeEmoji: "🎨", eventDescription: "You need higher-quality drawing pencils for your next work.", eventCost: 8, eventEmoji: "✏️" },
  { id: "i48", incomeSource: "collecting bottles and cans from the block", incomeAmount: 8, incomeEmoji: "🧴", eventDescription: "The corner store has gummy bears in bulk — just $3.", eventCost: 3, eventEmoji: "🐻" },
  { id: "i49", incomeSource: "helping decorate for a holiday party", incomeAmount: 15, incomeEmoji: "🎄", eventDescription: "There's a gorgeous ornament you want to keep for yourself.", eventCost: 6, eventEmoji: "🌟" },
  { id: "i50", incomeSource: "assisting a photographer at an event", incomeAmount: 20, incomeEmoji: "📸", eventDescription: "You want a nice frame for your favorite photo.", eventCost: 10, eventEmoji: "🖼️" },
  { id: "i51", incomeSource: "helping out at grandpa's farm for the weekend", incomeAmount: 25, incomeEmoji: "🚜", eventDescription: "The farm stand has incredible homemade jam — just $8.", eventCost: 8, eventEmoji: "🍯" },
  { id: "i52", incomeSource: "sorting recycling bins for your whole street", incomeAmount: 10, incomeEmoji: "♻️", eventDescription: "You've been meaning to get a nice reusable water bottle.", eventCost: 7, eventEmoji: "💧" },
]

// 16 no-income scenarios — event cost $3–$15
const NO_INCOME_SCENARIOS: GameScenario[] = [
  { id: "n01", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your friends want to go to the movies tonight!", eventCost: 10, eventEmoji: "🎬" },
  { id: "n02", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The school book fair is open — you found a great book!", eventCost: 6, eventEmoji: "📗" },
  { id: "n03", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The carnival is in town! Ride tickets are just $8.", eventCost: 8, eventEmoji: "🎡" },
  { id: "n04", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The ice cream truck is outside — your favorite flavor!", eventCost: 4, eventEmoji: "🍦" },
  { id: "n05", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "There's a new app game everyone is playing — it costs $5.", eventCost: 5, eventEmoji: "📱" },
  { id: "n06", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "A limited edition trading card pack just arrived at the store!", eventCost: 7, eventEmoji: "🃏" },
  { id: "n07", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your class is putting together a pizza party fund.", eventCost: 6, eventEmoji: "🍕" },
  { id: "n08", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The pet store has an adorable toy your pet would love.", eventCost: 8, eventEmoji: "🐾" },
  { id: "n09", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The school bake sale has fresh brownies today!", eventCost: 4, eventEmoji: "🍫" },
  { id: "n10", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Friends are going to the amusement park this weekend!", eventCost: 15, eventEmoji: "🎢" },
  { id: "n11", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Your favorite artist just dropped a new album — $9 to download.", eventCost: 9, eventEmoji: "🎵" },
  { id: "n12", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "An escape room is doing a group deal this weekend!", eventCost: 12, eventEmoji: "🔐" },
  { id: "n13", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "There's a movie everyone's talking about — $5 to rent online.", eventCost: 5, eventEmoji: "🎥" },
  { id: "n14", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "Art supplies are on sale — the set you've wanted is $11.", eventCost: 11, eventEmoji: "🎨" },
  { id: "n15", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "A food truck with your absolute favorite meal just parked outside!", eventCost: 8, eventEmoji: "🚚" },
  { id: "n16", incomeSource: null, incomeAmount: null, incomeEmoji: null, eventDescription: "The stationary store has an epic holographic sticker pack!", eventCost: 5, eventEmoji: "✨" },
]

export const SCENARIOS: GameScenario[] = [...INCOME_SCENARIOS, ...NO_INCOME_SCENARIOS]

function shuffleAndTake<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// Returns 10 scenarios: 7 income + 3 no-income, in randomized order
export function sampleScenarios(): GameScenario[] {
  const income = shuffleAndTake(INCOME_SCENARIOS, 7)
  const noIncome = shuffleAndTake(NO_INCOME_SCENARIOS, 3)
  return shuffleAndTake([...income, ...noIncome], 10)
}
