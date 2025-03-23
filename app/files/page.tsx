import type { Metadata } from "next"
import FileAccessForm from "@/components/files/file-access-form"

export const metadata: Metadata = {
  title: "Access Files | Telegram File Sharing",
  description: "Access shared files through Telegram",
}

export default function FilesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Access Shared Files</h1>
        <p className="text-sm text-muted-foreground max-w-[600px]">
          Enter the file link or ID to access your shared files
        </p>
        <FileAccessForm />
      </div>
    </div>
  )
}

