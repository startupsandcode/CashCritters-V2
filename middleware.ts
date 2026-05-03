export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/savings/:path*",
    "/learn/:path*",
    "/games/:path*",
  ],
}
