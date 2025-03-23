"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { decodeFileId } from "@/lib/actions"

export default function FileAccessForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAccessFile = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const fileLink = formData.get("fileLink") as string

      if (!fileLink) {
        setError("Please enter a file link")
        return
      }

      const result = await decodeFileId(fileLink)

      if (result.success) {
        router.push(`/files/${result.fileId}`)
      } else {
        setError(result.error || "Invalid file link")
      }
    } catch (error) {
      console.error("Error accessing file:", error)
      setError("An error occurred while accessing the file")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {error && <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md mb-4">{error}</div>}

      <form action={handleAccessFile} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fileLink">File Link or ID</Label>
          <Input id="fileLink" name="fileLink" placeholder="Enter the file link or ID" required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Access File"}
        </Button>
      </form>
    </div>
  )
}

