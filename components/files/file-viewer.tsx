"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, AlertTriangle, Clock, Ban } from "lucide-react"
import Link from "next/link"
import { formatTimeFromSeconds } from "@/lib/helpers/format-time"

type FileViewerProps = {
  file: {
    id: string
    name: string
    size: number
    type: string
    url: string
    autoDeleteTime?: number
  }
  subscriptionCheck: {
    required: boolean
    subscribed: boolean
    channelUrl?: string
  }
  userCheck?: {
    isBanned: boolean
  }
}

export default function FileViewer({ file, subscriptionCheck, userCheck }: FileViewerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(file.autoDeleteTime ? file.autoDeleteTime : null)

  useEffect(() => {
    if (timeLeft === null) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    return formatTimeFromSeconds(seconds)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB"
    else return (bytes / 1073741824).toFixed(2) + " GB"
  }

  // Check if user is banned
  if (userCheck?.isBanned) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You have been banned from accessing files</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4" variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertTitle>Account Banned</AlertTitle>
              <AlertDescription>
                Your account has been banned from accessing files. Please contact the administrator if you believe this
                is a mistake.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (subscriptionCheck.required && !subscriptionCheck.subscribed) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>You need to join our channel to access this file</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription>
                Please join our channel to access this file. After joining, come back to this page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href={subscriptionCheck.channelUrl} target="_blank" rel="noopener noreferrer">
                Join Channel
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{file.name}</CardTitle>
          <CardDescription>
            {file.type} • {formatFileSize(file.size)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeLeft !== null && timeLeft > 0 && (
            <Alert className="mb-4">
              <Clock className="h-4 w-4" />
              <AlertTitle>Auto Delete Enabled</AlertTitle>
              <AlertDescription>This file will be automatically deleted in {formatTime(timeLeft)}</AlertDescription>
            </Alert>
          )}

          {timeLeft === 0 && (
            <Alert className="mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>File Deleted</AlertTitle>
              <AlertDescription>This file has been automatically deleted</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {timeLeft !== 0 && (
            <Button asChild className="w-full">
              <a href={file.url} download={file.name}>
                <Download className="mr-2 h-4 w-4" />
                Download File
              </a>
            </Button>
          )}

          {timeLeft === 0 && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/files">Back to Files</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

