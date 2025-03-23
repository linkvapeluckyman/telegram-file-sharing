import { connectToDatabase } from "@/lib/mongodb"
import { hash, compare } from "bcryptjs"

export type Admin = {
  id: string
  email: string
  username: string
  password: string
  createdAt: Date
}

export async function createAdmin(admin: Omit<Admin, "id" | "createdAt">) {
  const { db } = await connectToDatabase()

  // Check if admin with this email already exists
  const existingAdmin = await db.collection("admins").findOne({ email: admin.email })

  if (existingAdmin) {
    throw new Error("Admin with this email already exists")
  }

  // Hash the password
  const hashedPassword = await hash(admin.password, 10)

  // Insert the admin
  const result = await db.collection("admins").insertOne({
    ...admin,
    password: hashedPassword,
    createdAt: new Date(),
  })

  return {
    id: result.insertedId.toString(),
    ...admin,
    password: "[REDACTED]",
    createdAt: new Date(),
  }
}

export async function findAdminByEmail(email: string) {
  const { db } = await connectToDatabase()

  const admin = await db.collection("admins").findOne({ email })

  if (!admin) {
    return null
  }

  return {
    id: admin._id.toString(),
    email: admin.email,
    username: admin.username,
    password: admin.password,
    createdAt: admin.createdAt,
  }
}

export async function validateAdminCredentials(email: string, password: string) {
  const admin = await findAdminByEmail(email)

  if (!admin) {
    return null
  }

  const isPasswordValid = await compare(password, admin.password)

  if (!isPasswordValid) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
    username: admin.username,
  }
}

