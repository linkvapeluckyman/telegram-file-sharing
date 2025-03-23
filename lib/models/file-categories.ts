"use server"

import { connectToDatabase } from "@/lib/mongodb"

export type FileCategory = {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export type FileTag = {
  id: string
  name: string
  createdAt: Date
}

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
        createdAt: category.createdAt,
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
        createdAt: tag.createdAt,
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
        createdAt: new Date(),
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
        createdAt: new Date(),
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

