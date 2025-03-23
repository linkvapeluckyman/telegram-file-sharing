"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

type BatchOperationResult = {
  success: boolean
  error?: string
  updatedCount?: number
}

export async function batchUpdateCategory(
  fileIds: string[],
  categoryId: string,
  categoryName: string,
): Promise<BatchOperationResult> {
  try {
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = fileIds.map((id) => new ObjectId(id))

    // If categoryId is "none", remove the category
    if (categoryId === "none") {
      const result = await db
        .collection("files")
        .updateMany({ _id: { $in: objectIds } }, { $unset: { categoryId: "", categoryName: "" } })

      console.log(`Removed category from ${result.modifiedCount} files`)

      revalidatePath("/admin/dashboard")
      return { success: true, updatedCount: result.modifiedCount }
    }

    // Otherwise, update with the new category
    const result = await db
      .collection("files")
      .updateMany({ _id: { $in: objectIds } }, { $set: { categoryId, categoryName } })

    console.log(`Updated category for ${result.modifiedCount} files to ${categoryName}`)

    revalidatePath("/admin/dashboard")
    return { success: true, updatedCount: result.modifiedCount }
  } catch (error) {
    console.error("Error in batch category update:", error)
    return { success: false, error: "Failed to update categories" }
  }
}

export async function batchAddTags(
  fileIds: string[],
  tags: Array<{ id: string; name: string }>,
): Promise<BatchOperationResult> {
  try {
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = fileIds.map((id) => new ObjectId(id))

    // We need to add tags without duplicating them
    // This requires a more complex update with aggregation
    const bulkOps = objectIds.map((id) => {
      return {
        updateOne: {
          filter: { _id: id },
          update: [
            {
              $set: {
                tags: {
                  $cond: {
                    if: { $isArray: "$tags" },
                    then: {
                      $concatArrays: [
                        {
                          $filter: {
                            input: "$tags",
                            cond: {
                              $not: {
                                $in: ["$$this.id", tags.map((tag) => tag.id)],
                              },
                            },
                          },
                        },
                        tags,
                      ],
                    },
                    else: tags,
                  },
                },
              },
            },
          ],
        },
      }
    })

    const result = await db.collection("files").bulkWrite(bulkOps)

    console.log(`Added tags to ${result.modifiedCount} files`)

    revalidatePath("/admin/dashboard")
    return { success: true, updatedCount: result.modifiedCount }
  } catch (error) {
    console.error("Error in batch tag addition:", error)
    return { success: false, error: "Failed to add tags" }
  }
}

export async function batchRemoveTags(fileIds: string[], tagIds: string[]): Promise<BatchOperationResult> {
  try {
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = fileIds.map((id) => new ObjectId(id))

    const result = await db
      .collection("files")
      .updateMany({ _id: { $in: objectIds } }, { $pull: { tags: { id: { $in: tagIds } } } })

    console.log(`Removed tags from ${result.modifiedCount} files`)

    revalidatePath("/admin/dashboard")
    return { success: true, updatedCount: result.modifiedCount }
  } catch (error) {
    console.error("Error in batch tag removal:", error)
    return { success: false, error: "Failed to remove tags" }
  }
}

export async function exportFileDetails(fileIds: string[]) {
  try {
    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = fileIds.map((id) => new ObjectId(id))

    // Get all file details
    const files = await db
      .collection("files")
      .find({ _id: { $in: objectIds } })
      .toArray()

    // Transform the data for export
    const exportData = files.map((file) => ({
      id: file._id.toString(),
      messageId: file.messageId,
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: file.createdAt.toISOString(),
      uploadedBy: file.uploadedBy || "Unknown",
      uploadMethod: file.uploadMethod || "Unknown",
      categoryId: file.categoryId || "",
      categoryName: file.categoryName || "",
      tags: (file.tags || []).map((tag) => tag.name).join(", "),
      link: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}?start=${Buffer.from(`get-${file.messageId * Math.abs(Number.parseInt(process.env.CHANNEL_ID || "0"))}`).toString("base64")}`,
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("Error exporting file details:", error)
    return { success: false, error: "Failed to export file details" }
  }
}

