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
import { getLessonProgress } from "@/actions/learn"
import { getSavingsGoals } from "@/actions/savings"
import { getLearningSummary } from "@/lib/learningProgress"

export default async function DashboardPage() {
  const session = await auth()
  const [completed, goals] = await Promise.all([getLessonProgress(), getSavingsGoals()])
  const learning = getLearningSummary(completed)
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)

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
              <Progress value={learning.percent} aria-label="Lessons completed" className="h-2 mb-2" />
              <p className="text-sm mb-3">{learning.completedCount} of {learning.totalCount} lessons complete ({learning.percent}%)</p>
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
                <p className="mb-4">{learning.nextLesson ? `Your next lesson: ${learning.nextLesson.lesson.title}` : "You completed every lesson! Revisit a favorite to keep practicing."}</p>
                <Link href={learning.nextLesson ? `/learn/${learning.nextLesson.trackId}/${learning.nextLesson.lesson.id}` : "/learn"}>
                  <Button>{learning.nextLesson ? "Continue Learning" : "Review Lessons"}</Button>
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
                <p className="mb-4">{goals.length ? `$${totalSaved.toFixed(2)} saved across ${goals.length} goal${goals.length === 1 ? "" : "s"}` : "Create your first savings goal and start making progress."}</p>
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
                    unlocked: learning.completedTrackIds.includes("money-basics"),
                  },
                  {
                    name: "Saving Star",
                    icon: <PiggyBank className="h-8 w-8 text-green-500" />,
                    unlocked: goals.some(goal => goal.currentAmount >= goal.targetAmount),
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
