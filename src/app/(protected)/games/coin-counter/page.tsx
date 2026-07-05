import { getLeaderboard } from "@/actions/games"
import { CoinCounterClient } from "./CoinCounterClient"

export default async function CoinCounterPage() {
  const { topScores, personalBest } = await getLeaderboard("coin-counter")

  return <CoinCounterClient leaderboard={topScores} personalBest={personalBest} />
}
