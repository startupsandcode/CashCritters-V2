"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton({ mobile = false }: { mobile?: boolean }) {
  const handleSignOut = () => signOut({ callbackUrl: "/" })

  return mobile ? (
    <Button type="button" variant="outline" className="w-full mt-4" onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </Button>
  ) : (
    <Button type="button" variant="ghost" size="icon" onClick={handleSignOut}>
      <LogOut className="h-5 w-5" />
      <span className="sr-only">Log out</span>
    </Button>
  )
}
