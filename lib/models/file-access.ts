import { connectToDatabase } from "@/lib/mongodb"

export type FileAccess = {
  userId: string
  fileId: string
  fileName?: string
  accessedAt: Date
}

// Optimize the recordFileAccess function to not block the main flow
export async function recordFileAccess(access: Omit<FileAccess, "accessedAt">) {
  try {
    const { db } = await connectToDatabase()

    // Use a non-awaited promise to avoid blocking the main flow
    // This is a background task that doesn't need to complete before responding to the user
    db.collection("file_access")
      .insertOne({
        ...access,
        accessedAt: new Date(),
      })
      .catch((err) => console.error("Error inserting file access:", err))

    // Update the user's access count
    db.collection("users")
      .updateOne(
        { userId: access.userId },
        { $inc: { accessCount: 1 }, $set: { lastActive: new Date() } },
        { upsert: true },
      )
      .catch((err) => console.error("Error updating user access count:", err))

    return { success: true }
  } catch (error) {
    console.error("Error recording file access:", error)
    return { success: false, error: "An error occurred while recording file access" }
  }
}

export async function getFileAccessHistory(userId: string) {
  try {
    const { db } = await connectToDatabase()

    const history = await db.collection("file_access").find({ userId }).sort({ accessedAt: -1 }).toArray()

    return {
      success: true,
      history: history.map((item) => ({
        fileId: item.fileId,
        fileName: item.fileName,
        accessedAt: item.accessedAt.toISOString(),
      })),
    }
  } catch (error) {
    console.error("Error getting file access history:", error)
    return { success: false, error: "An error occurred while fetching file access history" }
  }
}

