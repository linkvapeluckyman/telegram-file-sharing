"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Copy, AlertTriangle } from "lucide-react"

export function BatchLinkGenerator() {
  const [startId, setStartId] = useState("")
  const [endId, setEndId] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [error, setError] = useState("")

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError("")
    setGeneratedLink("")

    try {
      // Validate inputs
      if (!startId || !endId) {
        setError("Both start and end IDs are required")
        return
      }

      const start = Number.parseInt(startId)
      const end = Number.parseInt(endId)

      if (isNaN(start) || isNaN(end)) {
        setError("IDs must be valid numbers")
        return
      }

      // Call the API to generate batch link
      const response = await fetch("/api/links/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startId: start,
          endId: end,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedLink(result.link)
        toast.success(`Batch link generated successfully for messages ${result.startId} to ${result.endId}`)
      } else {
        setError(result.error || "Failed to generate batch link")
      }
    } catch (error) {
      console.error("Error generating batch link:", error)
      setError("An error occurred while generating the batch link")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copied to clipboard")
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerateLink} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startId">Start Message ID</Label>
            <Input
              id="startId"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              placeholder="Enter the first message ID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endId">End Message ID</Label>
            <Input
              id="endId"
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              placeholder="Enter the last message ID"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Batch Link"
          )}
        </Button>
      </form>

      {generatedLink && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Generated Batch Link</CardTitle>
            <CardDescription>
              This link will provide access to all files between the specified message IDs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="truncate mr-2">{generatedLink}</div>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedLink)}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

