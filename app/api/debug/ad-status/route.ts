import { type NextRequest, NextResponse } from "next/server"
import { getAdClickStatus } from "@/lib/models/ad-clicks"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const adminKey = searchParams.get("adminKey")

  // Simple admin key check
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
  }

  try {
    const adClickStatus = await getAdClickStatus(userId)

    return NextResponse.json({
      userId,
      adClickStatus,
      currentTime: new Date(),
      explanation: {
        status: adClickStatus?.status || "No record found",
        lastClickTime: adClickStatus?.lastClickTime || "Never clicked",
        lastViewTime: adClickStatus?.lastViewTime || "Never viewed",
        totalViews: adClickStatus?.totalViews || 0,
        recentHistory: adClickStatus?.adHistory?.slice(-5) || [],
      },
    })
  } catch (error) {
    console.error("Error getting ad click status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

