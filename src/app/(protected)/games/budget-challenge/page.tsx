import { getLeaderboard } from "@/actions/games"
import { BudgetChallengeClient } from "./BudgetChallengeClient"

export default async function BudgetChallengePage() {
  const { topScores, personalBest } = await getLeaderboard("budget-challenge")

  return (
    <BudgetChallengeClient leaderboard={topScores} personalBest={personalBest} />
  )
}
