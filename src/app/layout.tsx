import type { Metadata } from "next"
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Cash Critters - Fun Financial Education for Kids",
  description:
    "Learn about money, saving, and financial concepts in a fun, interactive way designed for kids.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  )
}
