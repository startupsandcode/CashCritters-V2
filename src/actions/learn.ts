"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function completeLesson(
  trackId: string,
  lessonId: string,
  score: number
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

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
