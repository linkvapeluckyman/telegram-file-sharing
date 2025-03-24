"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface UserAdAnalyticsProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserAdAnalytics({ userId, open, onOpenChange }: UserAdAnalyticsProps) {
  const [adData, setAdData] = useState<any>(null)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>("verified")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [activeTab, setActiveTab] = useState("chart")

  useEffect(() => {
    if (open) {
      fetchAdData()
    }
  }, [open, userId])

  // Fetch history data when page changes or when tab switches to history
  useEffect(() => {
    if (open && activeTab === "history") {
      fetchHistoryData(currentPage)
    }
  }, [currentPage, activeTab, open, userId])

  async function fetchAdData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/user-ad-analytics?userId=${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch ad analytics")
      }
      const data = await response.json()
      setAdData(data)

      // Set total pages based on the total history items
      if (data.adHistoryCount) {
        setTotalItems(data.adHistoryCount)
        setTotalPages(Math.ceil(data.adHistoryCount / 10))
      }

      // If we're on the history tab, fetch the first page of history
      if (activeTab === "history") {
        fetchHistoryData(1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistoryData(page: number) {
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/admin/user-ad-history?userId=${userId}&page=${page}&limit=10`)
      if (!response.ok) {
        throw new Error("Failed to fetch ad history")
      }
      const data = await response.json()
      setHistoryData(data.history || [])
      setTotalPages(data.totalPages || 1)
      setTotalItems(data.totalItems || 0)
    } catch (err) {
      toast.error("Failed to load history data")
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch("/api/admin/fix-ad-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`User's ad status has been updated to ${newStatus}`)
        fetchAdData() // Refresh the data
      } else {
        throw new Error(result.error || "Failed to update status")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "history" && (!historyData.length || currentPage !== 1)) {
      setCurrentPage(1)
      fetchHistoryData(1)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Ad Analytics for User {userId}</DialogTitle>
            <DialogDescription>Loading ad analytics data...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Ad Analytics for User {userId}</DialogTitle>
            <DialogDescription>Error loading ad analytics</DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/15 text-destructive p-4 rounded-md">
            <p>Error: {error}</p>
            <Button onClick={fetchAdData} className="mt-2">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Prepare chart data
  const chartData =
    adData?.adHistory?.map((entry: any) => {
      const date = new Date(entry.viewTime)
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        viewed: 1,
        clicked: entry.clickTime ? 1 : 0,
        verified: entry.verifiedTime ? 1 : 0,
      }
    }) || []

  // Group by date for the chart
  const groupedChartData = chartData.reduce((acc: any[], curr: any) => {
    const existingEntry = acc.find((item) => item.date === curr.date)
    if (existingEntry) {
      existingEntry.viewed += curr.viewed
      existingEntry.clicked += curr.clicked
      existingEntry.verified += curr.verified
    } else {
      acc.push({ ...curr })
    }
    return acc
  }, [])

  // Calculate completion rates
  const totalViews = adData?.totalViews || 0
  const totalClicks = adData?.adHistory?.filter((entry: any) => entry.clickTime).length || 0
  const totalVerified = adData?.adHistory?.filter((entry: any) => entry.verifiedTime).length || 0

  const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
  const verificationRate = totalClicks > 0 ? (totalVerified / totalClicks) * 100 : 0
  const overallCompletionRate = totalViews > 0 ? (totalVerified / totalViews) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Analytics for User {userId}</DialogTitle>
          <DialogDescription>View detailed ad interaction data for this user</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Total Ad Views</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{adData?.totalViews || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last view:{" "}
                  {adData?.lastViewTime
                    ? formatDistanceToNow(new Date(adData.lastViewTime), { addSuffix: true })
                    : "Never"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold capitalize">
                  <Badge
                    variant={
                      adData?.status === "verified" ? "default" : adData?.status === "clicked" ? "secondary" : "outline"
                    }
                  >
                    {adData?.status || "None"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last click:{" "}
                  {adData?.lastClickTime
                    ? formatDistanceToNow(new Date(adData.lastClickTime), { addSuffix: true })
                    : "Never"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{clickRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {totalClicks} clicks out of {totalViews} views
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{overallCompletionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {totalVerified} verified out of {totalViews} views
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="admin">Admin Tools</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle>Ad Interaction Trends</CardTitle>
                  <CardDescription>View trends of ad views, clicks, and verifications over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {groupedChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={groupedChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Legend />
                          <Bar dataKey="viewed" fill="#8884d8" name="Views" />
                          <Bar dataKey="clicked" fill="#82ca9d" name="Clicks" />
                          <Bar dataKey="verified" fill="#ffc658" name="Verified" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No chart data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle>Ad Interaction History</CardTitle>
                  <CardDescription>Detailed history of all ad interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : historyData.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>View Time</TableHead>
                              <TableHead>Click Time</TableHead>
                              <TableHead>Verified Time</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyData.map((entry: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(entry.viewTime).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(entry.viewTime).toLocaleTimeString()}</TableCell>
                                <TableCell>
                                  {entry.clickTime ? new Date(entry.clickTime).toLocaleTimeString() : "Not clicked"}
                                </TableCell>
                                <TableCell>
                                  {entry.verifiedTime
                                    ? new Date(entry.verifiedTime).toLocaleTimeString()
                                    : "Not verified"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={entry.verifiedTime ? "default" : entry.clickTime ? "secondary" : "outline"}
                                  >
                                    {entry.verifiedTime ? "Verified" : entry.clickTime ? "Clicked" : "Viewed"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-4 mt-4">
                          <div className="text-sm text-muted-foreground">
                            Showing page {currentPage} of {totalPages} ({totalItems} total entries)
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || loadingHistory}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="sr-only">Previous Page</span>
                            </Button>
                            <div className="text-sm">
                              Page {currentPage} of {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || loadingHistory}
                            >
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Next Page</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">No ad interaction history available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Tools</CardTitle>
                  <CardDescription>Manage ad status for this user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Update Ad Status</Label>
                      <div className="flex gap-2">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="clicked">Clicked</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleUpdateStatus}>Update Status</Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use this to manually fix a user's ad status if they're having issues.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Current Status Information</Label>
                      <div className="rounded-md bg-muted p-4">
                        <p>
                          <strong>Status:</strong> <span className="capitalize">{adData?.status || "None"}</span>
                        </p>
                        <p>
                          <strong>Last Click Attempt:</strong>{" "}
                          {adData?.clickAttempt ? new Date(adData.clickAttempt).toLocaleString() : "Never"}
                        </p>
                        <p>
                          <strong>Last Click Time:</strong>{" "}
                          {adData?.lastClickTime ? new Date(adData.lastClickTime).toLocaleString() : "Never"}
                        </p>
                        <p>
                          <strong>Last View Time:</strong>{" "}
                          {adData?.lastViewTime ? new Date(adData.lastViewTime).toLocaleString() : "Never"}
                        </p>
                        <p>
                          <strong>Last File Access:</strong>{" "}
                          {adData?.lastFileAccess ? new Date(adData.lastFileAccess).toLocaleString() : "Never"}
                        </p>
                        <p>
                          <strong>File Parameter:</strong> {adData?.fileParam || "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

