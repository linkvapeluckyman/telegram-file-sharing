import { NextResponse } from "next/server"
import { getFileById } from "@/lib/files"
import { isUserBanned } from "@/lib/models/banned-user"
import { recordFileAccess } from "@/lib/models/file-access"

export async function POST(request: Request) {
  try {
    const { fileId, userId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Check if user is banned
    if (userId) {
      const isBanned = await isUserBanned(userId)

      if (isBanned) {
        return NextResponse.json({ error: "You have been banned from accessing files" }, { status: 403 })
      }
    }

    // Get file details
    const file = await getFileById(fileId)

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Record file access if user ID is provided
    if (userId) {
      await recordFileAccess({
        userId,
        fileId,
        fileName: file.name,
      })
    }

    return NextResponse.json({ success: true, file })
  } catch (error) {
    console.error("Error accessing file:", error)
    return NextResponse.json({ error: "An error occurred while accessing the file" }, { status: 500 })
  }
}

