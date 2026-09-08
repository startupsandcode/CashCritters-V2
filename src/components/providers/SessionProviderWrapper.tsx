"use client"

import { SessionProvider, getSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

function RefreshSessionOnNavigation() {
  const pathname = usePathname()
  useEffect(() => {
    // Server-action login/logout changes cookies without notifying SessionProvider.
    // getSession broadcasts the change, including a null session after logout.
    void getSession()
  }, [pathname])

  return null
}

export function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <RefreshSessionOnNavigation />
      {children}
    </SessionProvider>
  )
}
