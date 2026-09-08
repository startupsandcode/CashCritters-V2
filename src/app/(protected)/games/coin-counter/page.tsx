import { getLeaderboard } from "@/actions/games"
import { CoinCounterClient } from "./CoinCounterClient"

export default async function CoinCounterPage() {
  const [timed, practice] = await Promise.all([getLeaderboard("coin-counter"), getLeaderboard("coin-counter-practice")])

  return <CoinCounterClient leaderboard={timed.topScores} personalBest={timed.personalBest} practice={practice} />
}
