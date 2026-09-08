"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isLessonUnlocked } from "@/content/lessons"
import { scoreLessonAnswers } from "@/lib/learningProgress"
import { revalidatePath } from "next/cache"

export async function completeLesson(
  trackId: string,
  lessonId: string,
  answers: number[]
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")
  const score = scoreLessonAnswers(trackId, lessonId, answers)
  const completed = await getLessonProgress()
  if (!isLessonUnlocked(trackId, lessonId, completed)) throw new Error("Complete the previous lessons first")

  await prisma.learningProgress.upsert({
    where: {
      userId_trackId_lessonId: {
        userId: session.user.id,
        trackId,
        lessonId,
      },
    },
    update: {
      score,
      completed: true,
      completedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      trackId,
      lessonId,
      score,
      completed: true,
      completedAt: new Date(),
    },
  })
  revalidatePath("/learn", "layout")
  revalidatePath("/dashboard")
}

export async function getLessonProgress(): Promise<Set<string>> {
  const session = await auth()
  if (!session?.user?.id) return new Set()

  const records = await prisma.learningProgress.findMany({
    where: { userId: session.user.id, completed: true },
    select: { trackId: true, lessonId: true },
  })

  return new Set(records.map((r) => `${r.trackId}:${r.lessonId}`))
}
