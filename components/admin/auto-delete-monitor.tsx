"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Clock, AlertTriangle, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AutoDeleteMonitor() {
  const [pendingDeletions, setPendingDeletions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<{
    total: number
    pendingCount: number
    overdueCount: number
    nextScheduled: string | null
  }>({
    total: 0,
    pendingCount: 0,
    overdueCount: 0,
    nextScheduled: null,
  })
  const [cronSecret, setCronSecret] = useState("")

  useEffect(() => {
    loadPendingDeletions()
    // Try to get the CRON_SECRET from environment
    if (typeof window !== "undefined") {
      const appUrl = window.location.origin
      fetch(`${appUrl}/api/admin/get-cron-secret`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.cronSecret) {
            setCronSecret(data.cronSecret)
          }
        })
        .catch((err) => console.error("Failed to get cron secret:", err))
    }
  }, [])

  const loadPendingDeletions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auto-delete/status")
      const data = await response.json()

      if (data.success) {
        setPendingDeletions(data.pendingDeletions || [])
        setStats({
          total: data.total || 0,
          pendingCount: data.pendingCount || 0,
          overdueCount: data.overdueCount || 0,
          nextScheduled: data.nextScheduled,
        })
      } else {
        toast.error(data.error || "Failed to load auto-delete status")
      }
    } catch (error) {
      console.error("Error loading auto-delete status:", error)
      toast.error("An error occurred while loading auto-delete status")
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualCleanup = async () => {
    try {
      const response = await fetch(`/api/cron/auto-delete?secret=${cronSecret}&batchSize=5`, {
        method: "GET",
      })
      const data = await response.json()

      if (data.success) {
        toast.success(`Auto-delete job completed. Processed: ${data.processed}, Remaining: ${data.remaining}`)
        loadPendingDeletions() // Refresh the data
      } else {
        toast.error(data.error || "Failed to trigger auto-delete job")
      }
    } catch (error) {
      console.error("Error triggering auto-delete job:", error)
      toast.error("An error occurred while triggering auto-delete job")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "PPP p")
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return "Unknown"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const getExternalCronUrl = () => {
    if (typeof window !== "undefined") {
      const appUrl = window.location.origin
      return `${appUrl}/api/cron/auto-delete?secret=${cronSecret}&batchSize=5`
    }
    return ""
  }

  if (isLoading && pendingDeletions.length === 0) {
    return <div className="text-center py-8">Loading auto-delete status...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Auto-Delete Monitor</h2>
        <Button variant="outline" size="sm" onClick={loadPendingDeletions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Deletions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Deletions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {stats.overdueCount > 0 && <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />}
              <div className="text-2xl font-bold">{stats.overdueCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {stats.nextScheduled ? formatRelativeTime(stats.nextScheduled) : "None"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Deletions</TabsTrigger>
          <TabsTrigger value="setup">External Cron Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Auto-Deletions</CardTitle>
              <CardDescription>Files scheduled for automatic deletion</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDeletions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending auto-deletions</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File ID</TableHead>
                        <TableHead>Chat ID</TableHead>
                        <TableHead>Message ID</TableHead>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDeletions.map((deletion) => {
                        const isOverdue = new Date(deletion.deleteAt) < new Date()
                        return (
                          <TableRow key={deletion._id}>
                            <TableCell className="font-medium">{deletion.fileId}</TableCell>
                            <TableCell>{deletion.chatId}</TableCell>
                            <TableCell>{deletion.messageId}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatDate(deletion.deleteAt)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(deletion.deleteAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isOverdue ? (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Overdue
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button onClick={triggerManualCleanup}>Run Auto-Delete Job Now</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>External Cron Job Setup</CardTitle>
              <CardDescription>
                Configure an external cron service like cron-job.org to run auto-delete more frequently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Why use an external cron service?</h3>
                <p className="text-muted-foreground">
                  Vercel's Hobby plan only allows cron jobs to run once per day. For more frequent auto-deletion
                  processing, you can use an external service like cron-job.org to trigger the auto-delete endpoint more
                  frequently.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Cron Job URL</h3>
                <div className="flex gap-2">
                  <Input value={getExternalCronUrl()} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(getExternalCronUrl())}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this URL in your external cron service. It includes your secret key for authentication.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Setup Instructions</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Sign up for a free account at{" "}
                    <a
                      href="https://cron-job.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      cron-job.org <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>Create a new cron job</li>
                  <li>Set the URL to the one provided above</li>
                  <li>Set the execution schedule (recommended: every 10-15 minutes)</li>
                  <li>Set the request method to GET</li>
                  <li>Enable notifications for failed executions</li>
                  <li>Save the cron job</li>
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                <h3 className="text-amber-800 dark:text-amber-300 font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Important Security Note
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  The URL contains your secret key. Do not share it publicly. If you suspect your key has been
                  compromised, generate a new one in your environment variables.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

