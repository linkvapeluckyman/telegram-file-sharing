import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { isAuthenticated } from "@/lib/jwt"

export async function GET(request: Request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get current time
    const now = new Date()

    // Get total count
    const total = await db.collection("scheduled_deletions").countDocuments()

    // Get pending count (scheduled for future)
    const pendingCount = await db.collection("scheduled_deletions").countDocuments({
      deleteAt: { $gt: now },
    })

    // Get overdue count (scheduled for past but not yet processed)
    const overdueCount = await db.collection("scheduled_deletions").countDocuments({
      deleteAt: { $lte: now },
    })

    // Get next scheduled deletion
    const nextScheduled = await db
      .collection("scheduled_deletions")
      .find({ deleteAt: { $gt: now } })
      .sort({ deleteAt: 1 })
      .limit(1)
      .toArray()

    // Get a sample of pending deletions (both overdue and upcoming)
    const pendingDeletions = await db.collection("scheduled_deletions").find().sort({ deleteAt: 1 }).limit(10).toArray()

    return NextResponse.json({
      success: true,
      total,
      pendingCount,
      overdueCount,
      nextScheduled: nextScheduled.length > 0 ? nextScheduled[0].deleteAt : null,
      pendingDeletions,
    })
  } catch (error) {
    console.error("Error getting auto-delete status:", error)
    return NextResponse.json({ error: "Failed to get auto-delete status" }, { status: 500 })
  }
}

