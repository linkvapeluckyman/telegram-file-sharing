import { NextResponse } from "next/server"
import { getSettings } from "@/lib/models/settings"

export async function GET(request: Request) {
  try {
    // Get the URL object to extract query parameters
    const url = new URL(request.url)
    const secretParam = url.searchParams.get("secret")

    // Check if the secret parameter matches
    const adminSecret = process.env.ADMIN_SECRET_KEY
    if (adminSecret && secretParam !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current settings
    const settingsResult = await getSettings()

    if (!settingsResult.success) {
      return NextResponse.json({ error: settingsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settingsResult.settings,
        // Include environment variables for comparison
        env: {
          FORCE_SUB_CHANNEL: process.env.FORCE_SUB_CHANNEL,
          PROTECT_CONTENT: process.env.PROTECT_CONTENT,
          AUTO_DELETE_TIME: process.env.AUTO_DELETE_TIME,
        },
      },
    })
  } catch (error) {
    console.error("Error in debug settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

