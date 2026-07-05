"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isValidScore } from "@/lib/gameScoring"

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  score: number        // in cents
  isCurrentUser: boolean
}

export async function saveGameScore(gameId: string, score: number): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  if (!isValidScore(gameId, score)) throw new Error("Invalid gameId or score")

  await prisma.gameScore.create({
    data: {
      userId: session.user.id,
      gameId,
      score,
    },
  })
}

export async function getLeaderboard(
  gameId: string,
  limit = 10
): Promise<{ topScores: LeaderboardEntry[]; personalBest: number | null }> {
  const session = await auth()

  // We fetch all scores and deduplicate in JS rather than GROUP BY because Prisma
  // doesn't support DISTINCT ON. Fine at current scale; revisit with prisma.$queryRaw
  // if GameScore rows grow significantly.
  const allScores = await prisma.gameScore.findMany({
    where: { gameId },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  // Deduplicate: first occurrence of each userId = their personal best
  const seen = new Set<string>()
  const personalBests: typeof allScores = []
  for (const row of allScores) {
    if (!seen.has(row.userId)) {
      seen.add(row.userId)
      personalBests.push(row)
    }
  }

  const topScores: LeaderboardEntry[] = personalBests
    .slice(0, limit)
    .map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      displayName: row.user.name ?? row.user.email ?? "Anonymous",
      score: row.score,
      isCurrentUser: row.userId === session?.user?.id,
    }))

  const currentUserId = session?.user?.id ?? null
  const userRecord = currentUserId
    ? personalBests.find((r) => r.userId === currentUserId)
    : undefined
  const personalBest = userRecord?.score ?? null

  return { topScores, personalBest }
}
