import type { Metadata } from "next"
import AdminSignupForm from "@/components/admin/signup-form"

export const metadata: Metadata = {
  title: "Admin Signup | Telegram File Sharing",
  description: "Create an admin account for the Telegram file sharing bot",
}

export default function AdminSignupPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Signup</h1>
          <p className="text-sm text-muted-foreground">Create an admin account to manage the file sharing bot</p>
        </div>
        <AdminSignupForm />
      </div>
    </div>
  )
}

