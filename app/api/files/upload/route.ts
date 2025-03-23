import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { forwardToChannel } from "@/lib/telegram"
import { encode } from "@/lib/helpers"
import { getSettings } from "@/lib/models/settings"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const autoDeleteTime = formData.get("autoDeleteTime") as string
    const categoryId = formData.get("categoryId") as string
    const categoryName = formData.get("categoryName") as string
    const tagsJson = formData.get("tags") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Parse tags if provided
    let tags = []
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson)
      } catch (error) {
        console.error("Error parsing tags:", error)
      }
    }

    // Forward the file to the Telegram channel
    const result = await forwardToChannel(file)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to forward file to channel" }, { status: 500 })
    }

    // Store file metadata in MongoDB
    const { db } = await connectToDatabase()

    // Get the admin ID from the session or use a default
    // In a real implementation, you would get this from the authenticated user
    const adminId = "admin" // This should be the actual admin ID

    // Prepare file document
    const fileDoc: any = {
      messageId: result.messageId,
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: new Date(),
      uploadedBy: adminId,
      uploadMethod: "admin_panel",
    }

    // Add category if provided
    if (categoryId && categoryName && categoryId !== "none") {
      fileDoc.categoryId = categoryId
      fileDoc.categoryName = categoryName
    }

    // Add tags if provided
    if (tags.length > 0) {
      fileDoc.tags = tags
    }

    // Insert file document
    await db.collection("files").insertOne(fileDoc)

    // Generate the sharing link using the same method as in Telegram
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const convertedId = result.messageId * Math.abs(channelId)
    const string = `get-${convertedId}`
    const base64String = await encode(string)
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const link = `https://t.me/${botUsername}?start=${base64String}`

    // If auto-delete is enabled, schedule deletion for the link
    const settingsResult = await getSettings()
    if (settingsResult.success && settingsResult.settings.autoDeleteTime > 0) {
      const { scheduleFileDeletion } = await import("@/lib/models/scheduled-deletion")

      // Calculate deletion time
      const deleteAt = new Date()
      deleteAt.setSeconds(deleteAt.getSeconds() + settingsResult.settings.autoDeleteTime)

      // We don't have a message ID here since we're not sending a Telegram message
      // But we can record this for tracking purposes
      await scheduleFileDeletion({
        fileId: result.messageId.toString(),
        chatId: "admin-panel",
        messageId: 0, // Not applicable for admin panel uploads
        deleteAt: deleteAt,
      })

      console.log(`Auto-delete scheduled for file ${result.messageId} at ${deleteAt.toISOString()}`)
    }

    return NextResponse.json({
      success: true,
      fileId: result.messageId,
      link: link,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "An error occurred during upload" }, { status: 500 })
  }
}

