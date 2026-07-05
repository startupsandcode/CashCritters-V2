import { getSavingsGoals } from "@/actions/savings"
import { SavingsClient } from "./SavingsClient"

export default async function SavingsPage() {
  const goals = await getSavingsGoals()

  return <SavingsClient goals={goals} />
}
