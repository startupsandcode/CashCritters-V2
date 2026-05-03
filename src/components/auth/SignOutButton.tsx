"use client"

import { logoutUser } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <form action={logoutUser}>
      {mobile ? (
        <Button type="submit" variant="outline" className="w-full mt-4">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      ) : (
        <Button type="submit" variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      )}
    </form>
  )
}
