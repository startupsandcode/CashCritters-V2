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
