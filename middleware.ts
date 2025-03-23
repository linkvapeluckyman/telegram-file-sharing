import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJwtToken } from "./lib/jwt"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname

  // Check if the pathname starts with /admin
  if (pathname.startsWith("/admin")) {
    // Skip authentication for login and signup pages
    if (pathname === "/admin/login" || pathname === "/admin/signup") {
      return NextResponse.next()
    }

    // Get the token from the cookies
    const token = request.cookies.get("auth_token")?.value

    // If there is no token, redirect to the login page
    if (!token) {
      const url = new URL("/admin/login", request.url)
      // Only add the redirect param if it's not already the login page
      if (pathname !== "/admin/login") {
        url.searchParams.set("redirect", pathname)
      }
      return NextResponse.redirect(url)
    }

    try {
      // Verify the token
      const payload = await verifyJwtToken(token)

      // If the token is invalid, redirect to the login page
      if (!payload) {
        const url = new URL("/admin/login", request.url)
        // Only add the redirect param if it's not already the login page
        if (pathname !== "/admin/login") {
          url.searchParams.set("redirect", pathname)
        }
        return NextResponse.redirect(url)
      }

      // If the token is valid, continue
      return NextResponse.next()
    } catch (error) {
      // If there is an error, redirect to the login page
      const url = new URL("/admin/login", request.url)
      // Only add the redirect param if it's not already the login page
      if (pathname !== "/admin/login") {
        url.searchParams.set("redirect", pathname)
      }
      return NextResponse.redirect(url)
    }
  }

  // Continue for non-admin routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

