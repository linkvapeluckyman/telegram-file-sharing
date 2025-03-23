import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-min-32-chars-long-here")

export async function signJwtToken(payload: any) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // Token expires in 7 days
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    console.error("Error signing JWT token:", error)
    throw new Error("Failed to sign JWT token")
  }
}

export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error("Error verifying JWT token:", error)
    return null
  }
}

export async function getJwtTokenFromCookies() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth_token")?.value
  return token
}

export async function setJwtTokenCookie(token: string) {
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function removeJwtTokenCookie() {
  cookies().delete("auth_token")
}

export async function isAuthenticated() {
  const token = await getJwtTokenFromCookies()

  if (!token) {
    return false
  }

  const payload = await verifyJwtToken(token)
  return !!payload
}

export function withAuth(handler: any) {
  return async (req: NextRequest) => {
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJwtToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return handler(req, payload)
  }
}

