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
