import { connectToDatabase } from "@/lib/mongodb"

export type AdClickDetail = {
  userId: string
  timestamp: Date
  status: "pending" | "clicked" | "verified"
  fileParam?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
  conversionTime?: number // Time in ms between click and verification
}

export async function recordAdClickDetail(detail: Omit<AdClickDetail, "timestamp">) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("ad_click_details").insertOne({
      ...detail,
      timestamp: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error recording ad click detail:", error)
    return { success: false, error: "An error occurred while recording ad click detail" }
  }
}

export async function getAdClickDetails(userId: string) {
  try {
    const { db } = await connectToDatabase()

    const details = await db.collection("ad_click_details").find({ userId }).sort({ timestamp: -1 }).limit(50).toArray()

    return { success: true, details }
  } catch (error) {
    console.error("Error getting ad click details:", error)
    return { success: false, error: "An error occurred while fetching ad click details" }
  }
}

