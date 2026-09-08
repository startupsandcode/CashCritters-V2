import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { getTrack, getLesson, getNextLesson, isLessonUnlocked } from "@/content/lessons"
import { getLessonProgress } from "@/actions/learn"
import { LessonClient } from "./LessonClient"

export default async function LessonPage(
  props: {
    params: Promise<{ trackId: string; lessonId: string }>
  }
) {
  const params = await props.params;
  const track = getTrack(params.trackId)
  if (!track) notFound()

  const lesson = getLesson(params.trackId, params.lessonId)
  if (!lesson) notFound()

  const completed = await getLessonProgress()

  if (!isLessonUnlocked(params.trackId, params.lessonId, completed)) {
    redirect(`/learn/${params.trackId}`)
  }

  const isAlreadyCompleted = completed.has(
    `${params.trackId}:${params.lessonId}`
  )
  const nextLesson = getNextLesson(params.trackId, params.lessonId)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/learn" className="hover:text-foreground">
              Learning
            </Link>
            <span>→</span>
            <Link
              href={`/learn/${track.id}`}
              className="hover:text-foreground"
            >
              {track.title}
            </Link>
            <span>→</span>
            <span className="text-foreground">{lesson.title}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {isAlreadyCompleted && (
              <div className="flex items-center gap-1 text-sm text-primary font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
            )}
          </div>

          <LessonClient
            lesson={lesson}
            trackId={params.trackId}
            nextLessonId={nextLesson?.id ?? null}
            isAlreadyCompleted={isAlreadyCompleted}
          />
        </div>
      </main>
    </div>
  )
}
