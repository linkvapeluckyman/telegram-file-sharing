"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { revalidatePath } from "next/cache"

export type User = {
  id: string
  userId: string
  username?: string
  firstName?: string
  lastName?: string
  lastActive: string
  accessCount: number
  createdAt: string
  isBanned: boolean
}

export async function getUsers() {
  try {
    const { db } = await connectToDatabase()

    // Get all users from the database
    const users = await db.collection("users").find({}).sort({ lastActive: -1 }).toArray()

    // Get banned users to check status
    const bannedUsers = await db.collection("banned_users").find({}).toArray()
    const bannedUserIds = bannedUsers.map((user) => user.userId)

    return {
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        lastActive: user.lastActive?.toISOString() || new Date().toISOString(),
        accessCount: user.accessCount || 0,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        isBanned: bannedUserIds.includes(user.userId),
      })),
    }
  } catch (error) {
    console.error("Error getting users:", error)
    return { success: false, error: "An error occurred while fetching users" }
  }
}

export async function getUserDetails(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Get user from the database
    const user = await db.collection("users").findOne({ userId })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if user is banned
    const bannedUser = await db.collection("banned_users").findOne({ userId })

    // Get user's file access history
    const accessHistory = await db
      .collection("file_access")
      .find({ userId })
      .sort({ accessedAt: -1 })
      .limit(10)
      .toArray()

    return {
      success: true,
      user: {
        id: user._id.toString(),
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        lastActive: user.lastActive?.toISOString() || new Date().toISOString(),
        accessCount: user.accessCount || 0,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        isBanned: !!bannedUser,
        bannedAt: bannedUser?.bannedAt?.toISOString(),
        accessHistory: accessHistory.map((history) => ({
          fileId: history.fileId,
          fileName: history.fileName,
          accessedAt: history.accessedAt.toISOString(),
        })),
      },
    }
  } catch (error) {
    console.error("Error getting user details:", error)
    return { success: false, error: "An error occurred while fetching user details" }
  }
}

export async function banUser(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Check if user is already banned
    const existingBan = await db.collection("banned_users").findOne({ userId })

    if (existingBan) {
      return { success: false, error: "User is already banned" }
    }

    // Ban the user
    await db.collection("banned_users").insertOne({
      userId,
      bannedAt: new Date(),
    })

    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error banning user:", error)
    return { success: false, error: "An error occurred while banning the user" }
  }
}

export async function unbanUser(userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Remove the ban
    await db.collection("banned_users").deleteOne({ userId })

    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error unbanning user:", error)
    return { success: false, error: "An error occurred while unbanning the user" }
  }
}

export async function getUserStats() {
  try {
    const { db } = await connectToDatabase()

    // Get total users count
    const totalUsers = await db.collection("users").countDocuments()

    // Get active users in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activeUsers = await db.collection("users").countDocuments({
      lastActive: { $gte: sevenDaysAgo },
    })

    // Get banned users count
    const bannedUsers = await db.collection("banned_users").countDocuments()

    // Get total file accesses
    const totalAccesses = await db.collection("file_access").countDocuments()

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalAccesses,
      },
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    return { success: false, error: "An error occurred while fetching user stats" }
  }
}

