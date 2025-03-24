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

    // Check if user is already banned
    const existingBan = await db.collection("banned_users").findOne({ userId })

    if (existingBan) {
      return NextResponse.json({ success: false, error: "User is already banned" })
    }

    // Ban the user
    await db.collection("banned_users").insertOne({
      userId,
      bannedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error banning user:", error)
    return NextResponse.json({ error: "An error occurred while banning the user" }, { status: 500 })
  }
}

