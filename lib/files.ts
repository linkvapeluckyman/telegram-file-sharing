import { connectToDatabase } from "@/lib/mongodb"

export async function getFileById(id: string) {
  try {
    const { db } = await connectToDatabase()

    const file = await db.collection("files").findOne({ messageId: Number.parseInt(id) })

    if (!file) {
      return null
    }

    // Generate file URL
    const botToken = process.env.TG_BOT_TOKEN
    const channelId = process.env.CHANNEL_ID
    const url = `https://api.telegram.org/file/bot${botToken}/${file.filePath}`

    return {
      id: file.messageId.toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      autoDeleteTime: file.autoDeleteTime,
      userId: file.userId,
    }
  } catch (error) {
    console.error("Error getting file:", error)
    return null
  }
}

