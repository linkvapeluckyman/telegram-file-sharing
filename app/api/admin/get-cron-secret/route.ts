import { NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/jwt"

export async function GET() {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only return a masked version of the secret for security
    const cronSecret = process.env.CRON_SECRET || ""
    const maskedSecret =
      cronSecret.length > 4
        ? cronSecret.substring(0, 2) + "..." + cronSecret.substring(cronSecret.length - 2)
        : cronSecret

    // Return the full secret (only in development) or masked in production
    const isDev = process.env.NODE_ENV === "development"

    return NextResponse.json({
      success: true,
      cronSecret: isDev ? cronSecret : maskedSecret,
      // If in production, instruct the user to set it manually
      message: isDev
        ? "Full secret available in development mode"
        : "For security reasons, the secret is masked in production. Please set it manually from your environment variables.",
    })
  } catch (error) {
    console.error("Error getting cron secret:", error)
    return NextResponse.json({ error: "Failed to get cron secret" }, { status: 500 })
  }
}

