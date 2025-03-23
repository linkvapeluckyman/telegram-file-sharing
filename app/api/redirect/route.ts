import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const fileParam = searchParams.get("fileParam")
  const adUrl = process.env.AD_LINK || "https://example.com"

  console.log(`Redirect request for userId=${userId}, fileParam=${fileParam}`)

  if (!userId || !fileParam) {
    return NextResponse.redirect(adUrl)
  }

  try {
    // Update the database to record that this user clicked the ad
    const { db } = await connectToDatabase()

    // Update the main record status to "clicked"
    await db.collection("ad_clicks").updateOne(
      { userId, fileParam },
      {
        $set: {
          status: "clicked",
          lastClickTime: new Date(),
        },
      },
    )

    // Also update the most recent history entry with clickTime
    await db.collection("ad_clicks").updateOne(
      {
        userId,
        "adHistory.fileParam": fileParam,
        "adHistory.clickTime": { $exists: false },
      },
      {
        $set: {
          "adHistory.$.clickTime": new Date(),
        },
      },
    )

    console.log(`Updated ad click status to "clicked" for userId=${userId}, fileParam=${fileParam}`)
  } catch (error) {
    console.error("Error updating ad click status:", error)
  }

  // Redirect to the ad URL
  return NextResponse.redirect(adUrl)
}

