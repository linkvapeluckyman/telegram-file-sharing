import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Login | Telegram File Sharing",
  description: "Login to manage your Telegram file sharing bot",
}

export default function AdminPage() {
  redirect("/admin/dashboard")
}

