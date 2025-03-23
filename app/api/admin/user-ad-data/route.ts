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

    // Get the user's ad click data
    const adClick = await db.collection("ad_clicks").findOne({ userId })

    if (!adClick) {
      return NextResponse.json({
        success: true,
        adData: {
          totalViews: 0,
          verifiedClicks: 0,
          status: "none",
          adHistory: [],
        },
      })
    }

    // Get detailed analytics from ad_click_details
    const adDetails = await db.collection("ad_click_details").find({ userId }).sort({ timestamp: -1 }).toArray()

    // Calculate device analytics
    let deviceAnalytics = null
    if (adDetails && adDetails.length > 0) {
      const platforms = adDetails.filter((d) => d.platform).map((d) => d.platform)

      const devices = adDetails.filter((d) => d.device).map((d) => d.device)

      const conversionTimes = adDetails.filter((d) => d.verificationDelay).map((d) => d.verificationDelay)

      // Get most common platform
      const platformCounts = platforms.reduce((acc, platform) => {
        acc[platform] = (acc[platform] || 0) + 1
        return acc
      }, {})

      // Get most common device
      const deviceCounts = devices.reduce((acc, device) => {
        acc[device] = (acc[device] || 0) + 1
        return acc
      }, {})

      // Calculate average conversion time
      const avgConversionTime =
        conversionTimes.length > 0
          ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length / 1000 // Convert to seconds
          : null

      deviceAnalytics = {
        topPlatform: Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        topDevice: Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        avgConversionTime,
      }
    }

    // Count verified clicks
    const verifiedClicks = adDetails.filter((d) => d.status === "verified").length

    // Prepare the response data
    const adData = {
      userId: adClick.userId,
      totalViews: adClick.totalViews || 0,
      verifiedClicks,
      lastViewTime: adClick.lastViewTime,
      lastClickTime: adClick.lastClickTime,
      lastFileAccess: adClick.lastFileAccess,
      status: adClick.status || "none",
      adHistory: adClick.adHistory || [],
      deviceAnalytics,
    }

    return NextResponse.json({ success: true, adData })
  } catch (error) {
    console.error("Error getting user ad data:", error)
    return NextResponse.json({ error: "Failed to get user ad data" }, { status: 500 })
  }
}

