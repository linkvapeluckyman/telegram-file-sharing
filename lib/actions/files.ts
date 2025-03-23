"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { revalidatePath } from "next/cache"
import { encode } from "@/lib/helpers"

export type File = {
  id: string
  messageId: number
  name: string
  size: number
  type: string
  createdAt: string
  uploadedBy?: string
  uploadMethod?: string
  categoryId?: string
  categoryName?: string
  tags?: Array<{ id: string; name: string }>
}

export async function getFiles(searchParams?: string) {
  try {
    const { db } = await connectToDatabase()

    // Parse search params
    const params = new URLSearchParams(searchParams || "")
    const page = Number.parseInt(params.get("page") || "1")
    const limit = Number.parseInt(params.get("limit") || "10")
    const search = params.get("search") || ""
    const category = params.get("category") || ""
    const tags = params.getAll("tags")

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    // Add search
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Add category filter
    if (category) {
      query.categoryId = category
    }

    // Add tags filter
    if (tags.length > 0) {
      query["tags.id"] = { $in: tags }
    }

    // Get total count for pagination
    const totalFiles = await db.collection("files").countDocuments(query)
    const totalPages = Math.ceil(totalFiles / limit)

    // Get files with pagination
    const files = await db.collection("files").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    return {
      success: true,
      files: files.map((file) => ({
        id: file._id.toString(),
        messageId: file.messageId,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: file.createdAt.toISOString(),
        uploadedBy: file.uploadedBy,
        uploadMethod: file.uploadMethod || "unknown",
        categoryId: file.categoryId,
        categoryName: file.categoryName,
        tags: file.tags || [],
      })),
      totalFiles,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error getting files:", error)
    return { success: false, error: "An error occurred while fetching files" }
  }
}

export async function deleteFile(messageId: number) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("files").deleteOne({ messageId })

    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { success: false, error: "An error occurred while deleting the file" }
  }
}

export async function generateFileLink(messageId: number) {
  try {
    // Generate the encoded link
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const convertedId = messageId * Math.abs(channelId)
    const string = `get-${convertedId}`
    const base64String = await encode(string)
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const link = `https://t.me/${botUsername}?start=${base64String}`

    return { success: true, link }
  } catch (error) {
    console.error("Error generating file link:", error)
    return { success: false, error: "An error occurred while generating the link" }
  }
}

