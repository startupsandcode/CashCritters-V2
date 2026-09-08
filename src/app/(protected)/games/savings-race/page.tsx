import { getLeaderboard } from "@/actions/games"
import { SavingsRaceClient } from "./SavingsRaceClient"

export default async function SavingsRacePage() {
  const [timed, practice] = await Promise.all([getLeaderboard("savings-race"), getLeaderboard("savings-race-practice")])

  return <SavingsRaceClient leaderboard={timed.topScores} personalBest={timed.personalBest} practice={practice} />
}
