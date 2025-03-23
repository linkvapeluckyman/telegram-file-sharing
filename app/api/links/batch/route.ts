import { NextResponse } from "next/server"
import { encode } from "@/lib/helpers"

export async function POST(request: Request) {
  try {
    const { startId, endId } = await request.json()

    if (!startId || !endId) {
      return NextResponse.json({ error: "Start and end IDs are required" }, { status: 400 })
    }

    // Validate inputs
    const start = Number.parseInt(startId.toString())
    const end = Number.parseInt(endId.toString())

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json({ error: "IDs must be valid numbers" }, { status: 400 })
    }

    // Generate a single batch link that includes both message IDs
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME

    // Create the batch string in the format: get-{first_id * abs(channel_id)}-{second_id * abs(channel_id)}
    const firstConverted = start * Math.abs(channelId)
    const secondConverted = end * Math.abs(channelId)
    const string = `get-${firstConverted}-${secondConverted}`

    const base64String = await encode(string)
    const link = `https://t.me/${botUsername}?start=${base64String}`

    return NextResponse.json({
      success: true,
      link,
      startId: start,
      endId: end,
    })
  } catch (error) {
    console.error("Error generating batch link:", error)
    return NextResponse.json({ error: "An error occurred while generating batch link" }, { status: 500 })
  }
}

