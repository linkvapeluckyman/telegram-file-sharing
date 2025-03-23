import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    // Get the webhook payload
    const payload = await request.json()
    const { userId, timestamp, secret, userAgent, ipAddress, referrer, conversionTime } = payload

    // Validate the secret to ensure the request is legitimate
    const webhookSecret = process.env.AD_WEBHOOK_SECRET
    if (webhookSecret && secret !== webhookSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 })
    }

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Record the verified click in the database
    const { db } = await connectToDatabase()

    // Update the main ad_clicks record
    await db.collection("ad_clicks").updateOne(
      { userId },
      {
        $set: {
          lastClickTime: new Date(timestamp || Date.now()),
          status: "verified",
        },
        // Update the most recent history entry with verified time
        $set: {
          "adHistory.$[elem].verifiedTime": new Date(timestamp || Date.now()),
        },
      },
      {
        arrayFilters: [{ "elem.clickTime": { $exists: true }, "elem.verifiedTime": { $exists: false } }],
      },
    )

    // Record detailed metrics
    await db.collection("ad_click_details").insertOne({
      userId,
      timestamp: new Date(timestamp || Date.now()),
      status: "verified",
      userAgent,
      ipAddress,
      referrer,
      conversionTime,
      // Additional metrics
      verificationDelay: conversionTime ? Number.parseInt(conversionTime) : null,
      platform: getPlatformFromUserAgent(userAgent),
      device: getDeviceFromUserAgent(userAgent),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in ad click webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions to extract platform and device information
function getPlatformFromUserAgent(userAgent = ""): string {
  if (!userAgent) return "unknown"

  if (userAgent.includes("Windows")) return "Windows"
  if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS")) return "MacOS"
  if (userAgent.includes("Linux") && !userAgent.includes("Android")) return "Linux"
  if (userAgent.includes("Android")) return "Android"
  if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iPod")) return "iOS"

  return "other"
}

function getDeviceFromUserAgent(userAgent = ""): string {
  if (!userAgent) return "unknown"

  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("iPhone") ||
    (userAgent.includes("Android") && !userAgent.includes("Tablet"))
  )
    return "mobile"
  if (userAgent.includes("iPad") || userAgent.includes("Tablet")) return "tablet"
  if (userAgent.includes("TV") || userAgent.includes("SmartTV")) return "tv"

  return "desktop"
}

