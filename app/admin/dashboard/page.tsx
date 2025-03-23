import type { Metadata } from "next"
import AdminDashboard from "@/components/admin/dashboard"
import { isAuthenticated } from "@/lib/jwt"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin Dashboard | Telegram File Sharing",
  description: "Manage your Telegram file sharing bot",
}

export default async function DashboardPage() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect("/admin/login")
  }

  return <AdminDashboard />
}

