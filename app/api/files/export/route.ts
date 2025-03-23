import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { isAuthenticated } from "@/lib/jwt"

export async function POST(request: Request) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileIds, format = "json" } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No file IDs provided" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Convert string IDs to ObjectIds
    const objectIds = fileIds
      .map((id) => {
        try {
          return new ObjectId(id)
        } catch (e) {
          console.warn(`Invalid ObjectId: ${id}`)
          return null
        }
      })
      .filter(Boolean)

    if (objectIds.length === 0) {
      return NextResponse.json({ error: "No valid file IDs provided" }, { status: 400 })
    }

    // Get all file details
    const files = await db
      .collection("files")
      .find({ _id: { $in: objectIds } })
      .toArray()

    // Transform the data for export
    const exportData = files.map((file) => {
      // Calculate the file link
      const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
      const convertedId = file.messageId * Math.abs(channelId)
      const string = `get-${convertedId}`
      const base64String = Buffer.from(string).toString("base64")
      const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
      const link = `https://t.me/${botUsername}?start=${base64String}`

      return {
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
        link: link,
      }
    })

    // Return the data in the requested format
    if (format === "csv") {
      // Create CSV content
      const headers = Object.keys(exportData[0]).join(",")
      const rows = exportData.map((item) =>
        Object.values(item)
          .map((value) => (typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value))
          .join(","),
      )
      const csvContent = [headers, ...rows].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="file-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    } else {
      // JSON format
      return NextResponse.json(exportData)
    }
  } catch (error) {
    console.error("Error exporting file details:", error)
    return NextResponse.json({ error: "Failed to export file details" }, { status: 500 })
  }
}

