import { getLeaderboard } from "@/actions/games"
import { CheckoutChallengeClient } from "./CheckoutChallengeClient"
export default async function CheckoutChallengePage() {
  const [timed, practice] = await Promise.all([
    getLeaderboard("checkout-challenge"), getLeaderboard("checkout-challenge-practice"),
  ])
  return <CheckoutChallengeClient timed={timed} practice={practice} />
}
