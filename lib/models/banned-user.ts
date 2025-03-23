import { connectToDatabase } from "@/lib/mongodb"

export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase()

    // Check if user is in the banned_users collection
    const bannedUser = await db.collection("banned_users").findOne({ userId })

    return !!bannedUser
  } catch (error) {
    console.error("Error checking if user is banned:", error)
    return false // Default to not banned in case of error
  }
}

