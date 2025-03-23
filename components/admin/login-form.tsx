"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { loginAdmin } from "@/lib/actions/auth"

export default function AdminLoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Get the redirect path from the form data
      const redirectPath = (formData.get("redirectPath") as string) || "/admin/dashboard"

      const result = await loginAdmin(formData)

      if (result.success) {
        router.push(redirectPath)
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md">{error}</div>}

      <form action={handleLogin} className="space-y-4">
        <input type="hidden" name="redirectPath" value="/admin/dashboard" />

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Enter your email" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Enter your password" required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/admin/signup" className="text-primary hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  )
}

