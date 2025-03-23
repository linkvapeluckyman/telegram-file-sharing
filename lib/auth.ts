import { cookies } from "next/headers"

export async function checkAdminAuth() {
  const adminId = cookies().get("admin_id")?.value

  if (!adminId) {
    return false
  }

  // Check if user ID is in ADMINS list
  const admins = process.env.ADMINS?.split(" ") || []
  const ownerId = process.env.OWNER_ID

  return admins.includes(adminId) || adminId === ownerId
}

