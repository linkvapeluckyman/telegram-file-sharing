import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { isAuthenticated } from "@/lib/jwt"

export async function GET(request: Request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the URL object to extract query parameters
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""

    const { db } = await connectToDatabase()

    // Build the query
    const query: any = {}

    // Add search if provided
    if (search) {
      // Search by userId or username
      query.$or = [
        { userId: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ]
    }

    // Get total count for pagination
    const totalUsers = await db.collection("users").countDocuments(query)
    const totalPages = Math.ceil(totalUsers / limit)

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Get users with pagination
    const users = await db.collection("users").find(query).sort({ lastActive: -1 }).skip(skip).limit(limit).toArray()

    // Get banned users to check status
    const bannedUsers = await db.collection("banned_users").find({}).toArray()
    const bannedUserIds = bannedUsers.map((user) => user.userId)

    return NextResponse.json({
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
      totalUsers,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error("Error getting users:", error)
    return NextResponse.json({ error: "An error occurred while fetching users" }, { status: 500 })
  }
}

