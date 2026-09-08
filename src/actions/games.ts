"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isValidScore } from "@/lib/gameScoring"
import { redirect } from "next/navigation"

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  score: number        // in cents
  isCurrentUser: boolean
}

export async function saveGameScore(gameId: string, score: number, runId?: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  if (!isValidScore(gameId, score)) throw new Error("Invalid gameId or score")

  if (runId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
    throw new Error("Invalid game run")
  }
  const data = { userId: session.user.id, gameId, score }
  if (!runId) {
    await prisma.gameScore.create({ data })
    return
  }
  // A retry must acknowledge the same result, never overwrite another run.
  const saved = await prisma.gameScore.upsert({
    where: { id: runId }, create: { id: runId, ...data }, update: {},
  })
  if (saved.userId !== data.userId || saved.gameId !== gameId || saved.score !== score) {
    throw new Error("Game run already recorded")
  }
}

export async function getLeaderboard(
  gameId: string,
  limit = 10
): Promise<{ topScores: LeaderboardEntry[]; personalBest: number | null }> {
  const session = await auth()

  if (!session?.user?.id) redirect("/signin")
  if (!isValidScore(gameId, 0) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid leaderboard request")
  }
  // We fetch all scores and deduplicate in JS rather than GROUP BY because Prisma
  // doesn't support DISTINCT ON. Fine at current scale; revisit with prisma.$queryRaw
  // if GameScore rows grow significantly.
  const allScores = await prisma.gameScore.findMany({
    where: { gameId },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, name: true } },
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
      displayName: row.user.name?.trim().split(/\s+/)[0] || "Critter",
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
