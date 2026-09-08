// src/app/(protected)/savings/SavingsClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PiggyBank, Plus, Trash2 } from "lucide-react"
import {
  createSavingsGoal,
  addContribution,
  deleteSavingsGoal,
  type SavingsGoalWithContributions,
} from "@/actions/savings"
import { EMOJI_OPTIONS } from "@/lib/savingsValidation"

function formatDollars(amount: number): string {
  return `$${amount.toFixed(2)}`
}

interface GoalCardProps {
  goal: SavingsGoalWithContributions
  onAddMoney: () => void
  onDelete: () => void
}

function GoalCard({ goal, onAddMoney, onDelete }: GoalCardProps) {
  const isComplete = goal.currentAmount >= goal.targetAmount
  const percent = Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{goal.emoji ?? "🎯"}</span>
            {goal.name}
          </CardTitle>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${goal.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isComplete ? (
          <div className="text-center py-2">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-green-600">Goal reached!</div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {formatDollars(goal.currentAmount)} of{" "}
            {formatDollars(goal.targetAmount)} saved ({percent}%)
          </div>
        )}
        <Progress value={percent} />

        {goal.recentContributions.length > 0 && (
          <div className="space-y-1">
            {goal.recentContributions.map((c) => (
              <div
                key={c.id}
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span>{c.note || "Contribution"}</span>
                <span>+{formatDollars(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full" onClick={onAddMoney}>
          <Plus className="mr-1 h-3 w-3" />
          Add Money
        </Button>
      </CardContent>
    </Card>
  )
}

interface Props {
  goals: SavingsGoalWithContributions[]
}

export function SavingsClient({ goals }: Props) {
  const router = useRouter()

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [newGoalTarget, setNewGoalTarget] = useState("")
  const [newGoalEmoji, setNewGoalEmoji] = useState<string>(EMOJI_OPTIONS[0])
  const [newGoalError, setNewGoalError] = useState<string | null>(null)

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState("")
  const [contributeNote, setContributeNote] = useState("")
  const [contributeError, setContributeError] = useState<string | null>(null)

  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [isPending, setIsPending] = useState(false)

  const nameValid = newGoalName.trim().length > 0
  const targetValid = parseFloat(newGoalTarget) > 0
  const canCreateGoal = nameValid && targetValid && !isPending

  async function handleCreateGoal() {
    setNewGoalError(null)
    setIsPending(true)
    try {
      await createSavingsGoal(newGoalName, parseFloat(newGoalTarget), newGoalEmoji)
      setIsNewGoalOpen(false)
      setNewGoalName("")
      setNewGoalTarget("")
      setNewGoalEmoji(EMOJI_OPTIONS[0])
      router.refresh()
    } catch (err) {
      setNewGoalError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  const contributeAmountValid = parseFloat(contributeAmount) > 0
  const canContribute = contributeAmountValid && !isPending

  async function handleAddMoney() {
    if (!contributeGoalId) return
    setContributeError(null)
    setIsPending(true)
    try {
      await addContribution(
        contributeGoalId,
        parseFloat(contributeAmount),
        contributeNote.trim() || undefined
      )
      setContributeGoalId(null)
      setContributeAmount("")
      setContributeNote("")
      router.refresh()
    } catch (err) {
      setContributeError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!deleteGoalId) return
    setDeleteError(null)
    setIsPending(true)
    try {
      await deleteSavingsGoal(deleteGoalId)
      setDeleteGoalId(null)
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsPending(false)
    }
  }

  const goalBeingDeleted = goals.find((g) => g.id === deleteGoalId)

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
            <Button onClick={() => setIsNewGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>

          {goals.length === 0 ? (
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
                <Button variant="outline" onClick={() => setIsNewGoalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAddMoney={() => setContributeGoalId(goal.id)}
                  onDelete={() => setDeleteGoalId(goal.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="New bike"
                maxLength={50}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-target">Target amount ($)</Label>
              <Input
                id="goal-target"
                type="number"
                min="0.01"
                max="10000"
                step="0.01"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1">
              <Label>Pick an emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewGoalEmoji(emoji)}
                    className={`text-2xl p-2 rounded-lg border-2 ${
                      newGoalEmoji === emoji
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {newGoalError && (
              <p role="alert" className="text-sm text-destructive">
                {newGoalError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateGoal} disabled={!canCreateGoal}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contributeGoalId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setContributeGoalId(null)
            setContributeAmount("")
            setContributeNote("")
            setContributeError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="contribute-amount">Amount ($)</Label>
              <Input
                id="contribute-amount"
                type="number"
                min="0.01"
                max="1000"
                step="0.01"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contribute-note">Note (optional)</Label>
              <Input
                id="contribute-note"
                value={contributeNote}
                onChange={(e) => setContributeNote(e.target.value)}
                placeholder="Birthday money"
                maxLength={100}
              />
            </div>
            {contributeError && (
              <p role="alert" className="text-sm text-destructive">
                {contributeError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAddMoney} disabled={!canContribute}>
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteGoalId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteGoalId(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{goalBeingDeleted?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will also delete its {goalBeingDeleted?.contributionCount ?? 0}{" "}
              contribution
              {goalBeingDeleted?.contributionCount === 1 ? "" : "s"}. This can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
