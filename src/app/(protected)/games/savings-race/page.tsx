import { getLeaderboard } from "@/actions/games"
import { SavingsRaceClient } from "./SavingsRaceClient"

export default async function SavingsRacePage() {
  const { topScores, personalBest } = await getLeaderboard("savings-race")

  return <SavingsRaceClient leaderboard={topScores} personalBest={personalBest} />
}
