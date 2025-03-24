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

    // Get the URL object to extract query parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the user's ad click record
    const adClick = await db.collection("ad_clicks").findOne({ userId })

    if (!adClick) {
      return NextResponse.json({
        success: true,
        totalViews: 0,
        status: "none",
        adHistory: [],
        adHistoryCount: 0,
      })
    }

    // Get a sample of the history for the chart (most recent 20 entries)
    let sampleHistory = adClick.adHistory || []
    if (sampleHistory.length > 20) {
      sampleHistory = sampleHistory
        .sort((a: any, b: any) => new Date(b.viewTime).getTime() - new Date(a.viewTime).getTime())
        .slice(0, 20)
    }

    // Prepare the response data
    const responseData = {
      userId: adClick.userId,
      totalViews: adClick.totalViews || 0,
      lastViewTime: adClick.lastViewTime,
      lastClickTime: adClick.lastClickTime,
      lastFileAccess: adClick.lastFileAccess,
      clickAttempt: adClick.clickAttempt,
      status: adClick.status || "none",
      fileParam: adClick.fileParam,
      adHistory: sampleHistory,
      adHistoryCount: adClick.adHistory ? adClick.adHistory.length : 0,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error getting user ad analytics:", error)
    return NextResponse.json({ error: "Failed to get user ad analytics" }, { status: 500 })
  }
}

