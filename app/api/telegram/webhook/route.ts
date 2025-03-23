import { type NextRequest, NextResponse } from "next/server"
import { processUpdate } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Process the Telegram update
    await processUpdate(update)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

// Disable body parsing, we need the raw body
export const config = {
  api: {
    bodyParser: false,
  },
}

