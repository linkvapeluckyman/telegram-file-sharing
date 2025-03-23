import type { Metadata } from "next"
import { Suspense } from "react"
import AdminLoginForm from "@/components/admin/login-form"
import { RedirectPathHandler } from "@/components/admin/redirect-path-handler"

export const metadata: Metadata = {
  title: "Admin Login | Telegram File Sharing",
  description: "Login to manage your Telegram file sharing bot",
}

export default function AdminLoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <RedirectPathHandler />
        </Suspense>

        <AdminLoginForm />
      </div>
    </div>
  )
}

