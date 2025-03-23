import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export type ScheduledDeletion = {
  _id: string
  fileId: string
  chatId: string
  messageId: number
  deleteAt: Date
  notificationMessageId?: number
}

export async function scheduleFileDeletion(deletion: Omit<ScheduledDeletion, "_id">) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("scheduled_deletions").insertOne({
      ...deletion,
      createdAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error scheduling file deletion:", error)
    return { success: false, error: "Failed to schedule file deletion" }
  }
}

export async function getFilesToDelete() {
  try {
    const { db } = await connectToDatabase()

    // Find all files that should be deleted by now
    const now = new Date()
    const filesToDelete = await db
      .collection("scheduled_deletions")
      .find({ deleteAt: { $lte: now } })
      .toArray()

    return { success: true, files: filesToDelete }
  } catch (error) {
    console.error("Error getting files to delete:", error)
    return { success: false, error: "Failed to get files to delete" }
  }
}

export async function getFilesToDeleteBatched(batchSize = 10) {
  try {
    const { db } = await connectToDatabase()

    // Find files that should be deleted by now, limited to batch size
    const now = new Date()
    const filesToDelete = await db
      .collection("scheduled_deletions")
      .find({ deleteAt: { $lte: now } })
      .limit(batchSize)
      .toArray()

    // Get count of remaining files for future batches
    const totalRemaining =
      (await db.collection("scheduled_deletions").countDocuments({ deleteAt: { $lte: now } })) - filesToDelete.length

    return {
      success: true,
      files: filesToDelete,
      totalRemaining,
    }
  } catch (error) {
    console.error("Error getting files to delete:", error)
    return { success: false, error: "Failed to get files to delete" }
  }
}

export async function removeScheduledDeletion(id: string) {
  try {
    const { db } = await connectToDatabase()

    // Convert string ID to ObjectId if needed
    let objectId
    try {
      objectId = new ObjectId(id)
    } catch (e) {
      // If conversion fails, try using the string ID directly
      objectId = id
    }

    await db.collection("scheduled_deletions").deleteOne({
      $or: [{ _id: objectId }, { _id: id }],
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing scheduled deletion:", error)
    return { success: false, error: "Failed to remove scheduled deletion" }
  }
}

