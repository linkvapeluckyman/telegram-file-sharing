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
    const userId = url.searchParams.get("userId")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get the user's ad click record
    const adClick = await db.collection("ad_clicks").findOne({ userId })

    if (!adClick || !adClick.adHistory || adClick.adHistory.length === 0) {
      return NextResponse.json({
        success: true,
        history: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
      })
    }

    // Sort the adHistory array by viewTime in descending order
    const sortedHistory = [...adClick.adHistory].sort((a, b) => {
      return new Date(b.viewTime).getTime() - new Date(a.viewTime).getTime()
    })

    // Calculate pagination
    const totalItems = sortedHistory.length
    const totalPages = Math.ceil(totalItems / limit)
    const skip = (page - 1) * limit
    const paginatedHistory = sortedHistory.slice(skip, skip + limit)

    return NextResponse.json({
      success: true,
      history: paginatedHistory,
      totalItems,
      totalPages,
      currentPage: page,
    })
  } catch (error) {
    console.error("Error getting user ad history:", error)
    return NextResponse.json({ error: "Failed to get user ad history" }, { status: 500 })
  }
}

