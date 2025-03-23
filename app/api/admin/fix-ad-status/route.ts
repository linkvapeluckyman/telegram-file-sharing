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

    // Get request body
    const body = await request.json()
    const { userId, newStatus } = body

    // Validate input
    if (!userId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate status value
    if (!["pending", "clicked", "verified"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Update the user's ad status
    const updateResult = await db.collection("ad_clicks").updateOne(
      { userId },
      {
        $set: {
          status: newStatus,
          // If setting to verified, also update these fields
          ...(newStatus === "verified" && {
            lastClickTime: new Date(),
            lastViewTime: new Date(),
          }),
        },
      },
      { upsert: true },
    )

    console.log(`Admin manually updated ad status for user ${userId} to ${newStatus}`)

    return NextResponse.json({
      success: true,
      message: `Ad status for user ${userId} updated to ${newStatus}`,
      updated: updateResult.modifiedCount > 0,
      created: updateResult.upsertedCount > 0,
    })
  } catch (error) {
    console.error("Error fixing ad status:", error)
    return NextResponse.json({ error: "An error occurred while updating ad status" }, { status: 500 })
  }
}

