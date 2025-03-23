"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/mongodb"
import { encode, decode } from "@/lib/helpers"
import { forwardToChannel } from "@/lib/telegram"

// Admin authentication
export async function adminLogin(formData: FormData) {
  const userId = formData.get("userId") as string
  const password = formData.get("password") as string

  try {
    // Check if user ID is in ADMINS list
    const admins = process.env.ADMINS?.split(" ") || []
    const ownerId = process.env.OWNER_ID

    if (!admins.includes(userId) && userId !== ownerId) {
      return { success: false, error: "User is not an admin" }
    }

    // In a real app, you would verify the password here
    // For demo purposes, we're just checking if it's not empty
    if (!password) {
      return { success: false, error: "Password is required" }
    }

    // Set a cookie to maintain the session
    cookies().set("admin_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login" }
  }
}

// File operations
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const autoDeleteTime = formData.get("autoDeleteTime") as string

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Forward the file to the Telegram channel
    const result = await forwardToChannel(file)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Store file metadata in MongoDB
    const { db } = await connectToDatabase()

    await db.collection("files").insertOne({
      messageId: result.messageId,
      name: file.name,
      size: file.size,
      type: file.type,
      autoDeleteTime: autoDeleteTime ? Number.parseInt(autoDeleteTime) : 0,
      createdAt: new Date(),
    })

    revalidatePath("/admin")

    return { success: true, fileId: result.messageId }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "An error occurred during upload" }
  }
}

export async function getFiles() {
  try {
    const { db } = await connectToDatabase()

    const files = await db.collection("files").find({}).sort({ createdAt: -1 }).toArray()

    return {
      success: true,
      files: files.map((file) => ({
        id: file.messageId.toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: file.createdAt.toISOString(),
        autoDeleteTime: file.autoDeleteTime,
      })),
    }
  } catch (error) {
    console.error("Error getting files:", error)
    return { success: false, error: "An error occurred while fetching files" }
  }
}

export async function deleteFile(id: string) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("files").deleteOne({ messageId: Number.parseInt(id) })

    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { success: false, error: "An error occurred while deleting the file" }
  }
}

// Link generation
export async function generateLink(formData: FormData) {
  try {
    const fileId = formData.get("fileId") as string

    if (!fileId) {
      return { success: false, error: "No file ID provided" }
    }

    // Extract message ID from the file ID or link
    const messageId = await extractMessageId(fileId)

    if (!messageId) {
      return { success: false, error: "Invalid file ID or link" }
    }

    // Generate the encoded link
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const convertedId = messageId * Math.abs(channelId)
    const string = `get-${convertedId}`
    const base64String = await encode(string)
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const link = `https://t.me/${botUsername}?start=${base64String}`

    return { success: true, link }
  } catch (error) {
    console.error("Error generating link:", error)
    return { success: false, error: "An error occurred while generating the link" }
  }
}

export async function generateBatchLinks(formData: FormData) {
  try {
    const startId = formData.get("startId") as string
    const endId = formData.get("endId") as string

    if (!startId || !endId) {
      return { success: false, error: "Start and end IDs are required" }
    }

    // Extract message IDs
    const startMessageId = await extractMessageId(startId)
    const endMessageId = await extractMessageId(endId)

    if (!startMessageId || !endMessageId) {
      return { success: false, error: "Invalid file IDs or links" }
    }

    // Generate links for the range
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const links = []

    const start = Math.min(startMessageId, endMessageId)
    const end = Math.max(startMessageId, endMessageId)

    for (let i = start; i <= end; i++) {
      const convertedId = i * Math.abs(channelId)
      const string = `get-${convertedId}`
      const base64String = await encode(string)
      const link = `https://t.me/${botUsername}?start=${base64String}`
      links.push(link)
    }

    return { success: true, links }
  } catch (error) {
    console.error("Error generating batch links:", error)
    return { success: false, error: "An error occurred while generating batch links" }
  }
}

// File access
export async function decodeFileId(fileLink: string) {
  try {
    // Extract the base64 string from the link
    const match = fileLink.match(/start=([^&]+)/)

    if (!match) {
      return { success: false, error: "Invalid file link format" }
    }

    const base64String = match[1]
    const decoded = await decode(base64String)

    // Extract the file ID from the decoded string
    const idMatch = decoded.match(/get-(\d+)/)

    if (!idMatch) {
      return { success: false, error: "Invalid file ID format" }
    }

    const convertedId = Number.parseInt(idMatch[1])
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const messageId = Math.floor(convertedId / Math.abs(channelId))

    return { success: true, fileId: messageId.toString() }
  } catch (error) {
    console.error("Error decoding file ID:", error)
    return { success: false, error: "An error occurred while decoding the file ID" }
  }
}

// User management
export async function getUsers() {
  try {
    const { db } = await connectToDatabase()

    const users = await db.collection("users").find({}).sort({ lastActive: -1 }).toArray()

    return {
      success: true,
      users: users.map((user) => ({
        id: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        lastActive: user.lastActive.toISOString(),
        accessCount: user.accessCount || 0,
      })),
    }
  } catch (error) {
    console.error("Error getting users:", error)
    return { success: false, error: "An error occurred while fetching users" }
  }
}

export async function banUser(id: string) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("banned_users").insertOne({
      userId: id,
      bannedAt: new Date(),
    })

    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error banning user:", error)
    return { success: false, error: "An error occurred while banning the user" }
  }
}

// Settings
export async function getSettings() {
  try {
    const settings = {
      forceSubscription: process.env.FORCE_SUB_CHANNEL !== "0",
      forceSubscriptionChannel: process.env.FORCE_SUB_CHANNEL || "",
      protectContent: process.env.PROTECT_CONTENT === "True",
      autoDeleteTime: Number.parseInt(process.env.AUTO_DELETE_TIME || "0"),
      autoDeleteMessage: process.env.AUTO_DELETE_MSG || "",
      startMessage: process.env.START_MESSAGE || "",
      customCaption: process.env.CUSTOM_CAPTION || "",
    }

    return { success: true, settings }
  } catch (error) {
    console.error("Error getting settings:", error)
    return { success: false, error: "An error occurred while fetching settings" }
  }
}

export async function updateSettings(settings: any) {
  try {
    // In a real app, you would update environment variables or database settings
    // For demo purposes, we'll just return success

    return { success: true }
  } catch (error) {
    console.error("Error updating settings:", error)
    return { success: false, error: "An error occurred while updating settings" }
  }
}

// Helper functions
async function extractMessageId(input: string) {
  // Check if input is a numeric ID
  if (/^\d+$/.test(input)) {
    return Number.parseInt(input)
  }

  // Check if input is a Telegram message link
  const linkMatch = input.match(/https:\/\/t\.me\/(?:c\/)?([^/]+)\/(\d+)/)

  if (linkMatch) {
    return Number.parseInt(linkMatch[2])
  }

  return null
}

