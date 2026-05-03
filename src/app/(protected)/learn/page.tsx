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
import { TRACKS } from "@/content/lessons"
import { getLessonProgress } from "@/actions/learn"

const TRACK_ICONS: Record<string, React.ReactNode> = {
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
            <h1 className="text-3xl font-bold mb-2">Learning Tracks</h1>
            <p className="text-muted-foreground">
              Choose a track to start learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRACKS.map((track) => {
              const completedCount = track.lessons.filter((l) =>
                completed.has(`${track.id}:${l.id}`)
              ).length
              const total = track.lessons.length
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
                  key={track.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="mb-2">{TRACK_ICONS[track.id]}</div>
                    <CardTitle className="flex items-center justify-between">
                      {track.title}
                      {allDone && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>{track.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {completedCount}/{total} lessons
                        </span>
                      </div>
                      <Link href={`/learn/${track.id}`}>
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
