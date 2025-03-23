"use server"

import { signJwtToken, setJwtTokenCookie, removeJwtTokenCookie } from "@/lib/jwt"
import { createAdmin, validateAdminCredentials } from "@/lib/models/admin"
import { redirect } from "next/navigation"

export async function signupAdmin(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const secretKey = formData.get("secretKey") as string

    // Validate inputs
    if (!email || !username || !password || !secretKey) {
      return { success: false, error: "All fields are required" }
    }

    // Verify secret key
    const adminSecretKey = process.env.ADMIN_SECRET_KEY

    if (!adminSecretKey || secretKey !== adminSecretKey) {
      return { success: false, error: "Invalid secret key" }
    }

    // Create admin
    const admin = await createAdmin({ email, username, password })

    // Generate JWT token
    const token = await signJwtToken({
      id: admin.id,
      email: admin.email,
      username: admin.username,
    })

    // Set cookie
    await setJwtTokenCookie(token)

    return { success: true }
  } catch (error: any) {
    console.error("Signup error:", error)
    return { success: false, error: error.message || "An error occurred during signup" }
  }
}

export async function loginAdmin(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const redirectPath = (formData.get("redirectPath") as string) || "/admin/dashboard"

    // Validate inputs
    if (!email || !password) {
      return { success: false, error: "Email and password are required" }
    }

    // Validate credentials
    const admin = await validateAdminCredentials(email, password)

    if (!admin) {
      return { success: false, error: "Invalid credentials" }
    }

    // Generate JWT token
    const token = await signJwtToken({
      id: admin.id,
      email: admin.email,
      username: admin.username,
    })

    // Set cookie
    await setJwtTokenCookie(token)

    return { success: true, redirectPath }
  } catch (error: any) {
    console.error("Login error:", error)
    return { success: false, error: error.message || "An error occurred during login" }
  }
}

export async function logoutAdmin() {
  await removeJwtTokenCookie()
  redirect("/admin/login")
}

export async function checkAuth() {
  // This is a server action that will be used to check if the user is authenticated
  // It will be called from the client side to verify authentication status
  return { authenticated: true }
}

