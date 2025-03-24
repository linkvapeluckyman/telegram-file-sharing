import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { isAuthenticated } from "@/lib/jwt"

export async function POST(request: Request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Remove the ban
    await db.collection("banned_users").deleteOne({ userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unbanning user:", error)
    return NextResponse.json({ error: "An error occurred while unbanning the user" }, { status: 500 })
  }
}

