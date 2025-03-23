"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signupAdmin } from "@/lib/actions/auth"

export default function AdminSignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await signupAdmin(formData)

      if (result.success) {
        router.push("/admin/dashboard")
      } else {
        setError(result.error || "An error occurred during signup")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "An error occurred during signup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md">{error}</div>}

      <form action={handleSignup} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Enter your email" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="Enter your username" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Enter your password" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="secretKey">Admin Secret Key</Label>
          <Input id="secretKey" name="secretKey" type="password" placeholder="Enter the admin secret key" required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/admin/login" className="text-primary hover:underline">
          Login
        </Link>
      </div>
    </div>
  )
}

