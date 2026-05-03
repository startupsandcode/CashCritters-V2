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
  params: { modId: string }
}) {
  const mod = getModule(params.modId)
  if (!mod) notFound()

  const completed = await getLessonProgress()
  const completedCount = mod.lessons.filter((l) =>
    completed.has(`${mod.id}:${l.id}`)
  ).length
  const progressPercent = Math.round(
    (completedCount / mod.lessons.length) * 100
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
            <h1 className="text-3xl font-bold mb-1">{mod.title}</h1>
            <p className="text-muted-foreground mb-4">{mod.description}</p>
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {completedCount} of {mod.lessons.length} complete
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {mod.lessons.map((lesson, index) => {
              const isCompleted = completed.has(`${mod.id}:${lesson.id}`)
              const unlocked = isLessonUnlocked(mod.id, lesson.id, completed)

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
                      <Link href={`/learn/${mod.id}/${lesson.id}`}>
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
