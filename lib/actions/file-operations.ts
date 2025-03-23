"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { revalidatePath } from "next/cache"
import { encode } from "@/lib/helpers"

// Type definitions for client components to use
export type FileCategory = {
  id: string
  name: string
  description?: string
}

export type FileTag = {
  id: string
  name: string
}

export type File = {
  id: string
  messageId: number
  name: string
  size: number
  type: string
  createdAt: string
  uploadedBy?: string
  uploadMethod?: string
  categoryId?: string
  categoryName?: string
  tags?: Array<{ id: string; name: string }>
}

// Server actions for categories and tags
export async function getCategories() {
  try {
    const { db } = await connectToDatabase()
    const categories = await db.collection("file_categories").find({}).sort({ name: 1 }).toArray()

    return {
      success: true,
      categories: categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        description: category.description,
      })),
    }
  } catch (error) {
    console.error("Error getting categories:", error)
    return { success: false, error: "An error occurred while fetching categories" }
  }
}

export async function getTags() {
  try {
    const { db } = await connectToDatabase()
    const tags = await db.collection("file_tags").find({}).sort({ name: 1 }).toArray()

    return {
      success: true,
      tags: tags.map((tag) => ({
        id: tag._id.toString(),
        name: tag.name,
      })),
    }
  } catch (error) {
    console.error("Error getting tags:", error)
    return { success: false, error: "An error occurred while fetching tags" }
  }
}

export async function createCategory(name: string, description?: string) {
  try {
    const { db } = await connectToDatabase()

    // Check if category already exists
    const existingCategory = await db
      .collection("file_categories")
      .findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } })

    if (existingCategory) {
      return { success: false, error: "Category already exists" }
    }

    const result = await db.collection("file_categories").insertOne({
      name,
      description,
      createdAt: new Date(),
    })

    return {
      success: true,
      category: {
        id: result.insertedId.toString(),
        name,
        description,
      },
    }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "An error occurred while creating category" }
  }
}

export async function createTag(name: string) {
  try {
    const { db } = await connectToDatabase()

    // Check if tag already exists
    const existingTag = await db.collection("file_tags").findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } })

    if (existingTag) {
      return { success: false, error: "Tag already exists" }
    }

    const result = await db.collection("file_tags").insertOne({
      name,
      createdAt: new Date(),
    })

    return {
      success: true,
      tag: {
        id: result.insertedId.toString(),
        name,
      },
    }
  } catch (error) {
    console.error("Error creating tag:", error)
    return { success: false, error: "An error occurred while creating tag" }
  }
}

export async function deleteCategory(id: string) {
  try {
    const { db } = await connectToDatabase()
    await db.collection("file_categories").deleteOne({ _id: id })

    // Update files that use this category
    await db.collection("files").updateMany({ categoryId: id }, { $unset: { categoryId: "", categoryName: "" } })

    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: "An error occurred while deleting category" }
  }
}

export async function deleteTag(id: string) {
  try {
    const { db } = await connectToDatabase()
    await db.collection("file_tags").deleteOne({ _id: id })

    // Remove this tag from all files
    await db.collection("files").updateMany({ tags: { $elemMatch: { id } } }, { $pull: { tags: { id } } })

    return { success: true }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, error: "An error occurred while deleting tag" }
  }
}

// File operations
export async function getFiles(searchParams?: string) {
  try {
    const { db } = await connectToDatabase()

    // Parse search params
    const params = new URLSearchParams(searchParams || "")
    const page = Number.parseInt(params.get("page") || "1")
    const limit = Number.parseInt(params.get("limit") || "10")
    const search = params.get("search") || ""
    const category = params.get("category") || ""
    const tags = params.getAll("tags")

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    // Add search
    if (search) {
      query.name = { $regex: search, $options: "i" }
    }

    // Add category filter
    if (category) {
      query.categoryId = category
    }

    // Add tags filter
    if (tags.length > 0) {
      query["tags.id"] = { $in: tags }
    }

    console.log("Query for files:", query)

    // Get total count for pagination
    const totalFiles = await db.collection("files").countDocuments(query)
    const totalPages = Math.ceil(totalFiles / limit)

    // Get files with pagination
    const files = await db.collection("files").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    console.log(`Found ${files.length} files`)

    // Log a sample file to see its structure
    if (files.length > 0) {
      console.log("Sample file:", {
        id: files[0]._id.toString(),
        messageId: files[0].messageId,
        categoryId: files[0].categoryId,
        categoryName: files[0].categoryName,
        tags: files[0].tags,
      })
    }

    return {
      success: true,
      files: files.map((file) => ({
        id: file._id.toString(),
        messageId: file.messageId,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: file.createdAt.toISOString(),
        uploadedBy: file.uploadedBy,
        uploadMethod: file.uploadMethod || "unknown",
        categoryId: file.categoryId,
        categoryName: file.categoryName,
        tags: file.tags || [],
      })),
      totalFiles,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error getting files:", error)
    return { success: false, error: "An error occurred while fetching files" }
  }
}

export async function deleteFile(messageId: number) {
  try {
    const { db } = await connectToDatabase()

    await db.collection("files").deleteOne({ messageId })

    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { success: false, error: "An error occurred while deleting the file" }
  }
}

export async function generateFileLink(messageId: number) {
  try {
    // Generate the encoded link
    const channelId = Number.parseInt(process.env.CHANNEL_ID || "0")
    const convertedId = messageId * Math.abs(channelId)
    const string = `get-${convertedId}`
    const base64String = await encode(string)
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME
    const link = `https://t.me/${botUsername}?start=${base64String}`

    return { success: true, link }
  } catch (error) {
    console.error("Error generating file link:", error)
    return { success: false, error: "An error occurred while generating the link" }
  }
}

export async function updateFileMetadata(
  fileId: string,
  data: {
    categoryId?: string
    categoryName?: string
    tags?: Array<{ id: string; name: string }>
  },
) {
  try {
    const { db } = await connectToDatabase()

    // Prepare update data
    const updateData: any = {}

    // Handle category update
    if (data.categoryId === "none" || data.categoryId === "") {
      // Remove category
      updateData.$unset = { categoryId: "", categoryName: "" }
    } else if (data.categoryId && data.categoryName) {
      // Update category
      updateData.$set = {
        categoryId: data.categoryId,
        categoryName: data.categoryName,
      }
    }

    // Handle tags update
    if (data.tags !== undefined) {
      if (!updateData.$set) updateData.$set = {}
      updateData.$set.tags = data.tags
    }

    console.log("Updating file metadata:", { fileId, updateData })

    // Convert string ID to ObjectId if needed
    const { ObjectId } = await import("mongodb")
    const objectId = new ObjectId(fileId)

    // Update the file
    const result = await db.collection("files").updateOne({ _id: objectId }, updateData)

    console.log("Update result:", result)

    revalidatePath("/admin/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error updating file metadata:", error)
    return { success: false, error: "An error occurred while updating file metadata" }
  }
}

