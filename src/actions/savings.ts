"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { validateGoalInput, validateContributionInput } from "@/lib/savingsValidation"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface SavingsGoalWithContributions {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  emoji: string | null
  createdAt: Date
  contributionCount: number
  recentContributions: {
    id: string
    amount: number
    note: string | null
    createdAt: Date
  }[]
}

export async function getSavingsGoals(): Promise<SavingsGoalWithContributions[]> {
  const session = await auth()
  if (!session?.user?.id) redirect("/signin")

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: {
        select: { contributions: true },
      },
    },
  })

  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount.toNumber(),
    currentAmount: goal.currentAmount.toNumber(),
    emoji: goal.emoji,
    createdAt: goal.createdAt,
    contributionCount: goal._count.contributions,
    recentContributions: goal.contributions.map((c) => ({
      id: c.id,
      amount: c.amount.toNumber(),
      note: c.note,
      createdAt: c.createdAt,
    })),
  }))
}

export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  emoji: string | null
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const validated = validateGoalInput(name, targetAmount, emoji)

  await prisma.savingsGoal.create({
    data: {
      userId: session.user.id,
      name: validated.name,
      targetAmount: validated.targetAmount,
      emoji: validated.emoji,
    },
  })
  revalidatePath("/savings")
  revalidatePath("/dashboard")
}

export async function addContribution(
  goalId: string,
  amountDollars: number,
  note?: string
): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const validated = validateContributionInput(amountDollars, note)

  const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found")

  await prisma.$transaction([
    prisma.savingsContribution.create({
      data: {
        goalId,
        amount: validated.amount,
        note: validated.note,
      },
    }),
    prisma.savingsGoal.update({
      where: { id: goalId },
      data: { currentAmount: { increment: validated.amount } },
    }),
  ])
  revalidatePath("/savings")
  revalidatePath("/dashboard")
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthenticated")

  const goal = await prisma.savingsGoal.findUnique({ where: { id: goalId } })
  if (!goal || goal.userId !== session.user.id) throw new Error("Not found")

  await prisma.savingsGoal.delete({ where: { id: goalId } })
  revalidatePath("/savings")
  revalidatePath("/dashboard")
}
