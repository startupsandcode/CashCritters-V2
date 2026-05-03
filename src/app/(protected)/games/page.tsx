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
import Link from "next/link"

const games = [
  {
    id: "coin-counter",
    title: "Coin Counter",
    description: "Practice counting coins and making change",
    icon: <Coins className="h-8 w-8 text-primary" />,
    difficulty: "Easy",
    route: null,
  },
  {
    id: "budget-challenge",
    title: "Budget Challenge",
    description: "Manage a weekly budget and make smart choices",
    icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
    difficulty: "Medium",
    route: null,
  },
  {
    id: "savings-race",
    title: "Savings Race",
    description: "Race to reach your savings goal first",
    icon: <PiggyBank className="h-8 w-8 text-accent" />,
    difficulty: "Easy",
    route: "/games/savings-race",
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
              <Card
                key={game.id}
                className={`transition-shadow ${
                  game.route ? "hover:shadow-md" : "opacity-60"
                }`}
              >
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
                    {game.route ? (
                      <Button size="sm" asChild>
                        <Link href={game.route}>Play</Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Coming Soon
                      </Button>
                    )}
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
