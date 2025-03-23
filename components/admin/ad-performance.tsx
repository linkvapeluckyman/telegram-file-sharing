"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getAdMetrics, type AdMetrics } from "@/lib/actions/ad-metrics"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Loader2, TrendingUp, MousePointerClick, Users, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function AdPerformance() {
  const [metrics, setMetrics] = useState<AdMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("daily")

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getAdMetrics()

      if (result.success && result.metrics) {
        setMetrics(result.metrics)
      } else {
        setError(result.error || "Failed to load ad metrics")
      }
    } catch (error) {
      console.error("Error loading ad metrics:", error)
      setError("An error occurred while loading ad metrics")
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading ad metrics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/15 text-destructive p-4 rounded-md">
        <p>Error: {error}</p>
        <button onClick={loadMetrics} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
          Try Again
        </button>
      </div>
    )
  }

  if (!metrics) {
    return <div className="text-center py-8">No ad metrics available</div>
  }

  // Prepare data for the retention pie chart
  const retentionData = [
    { name: "Single View", value: metrics.userRetention.singleView },
    { name: "Multiple Views (No Click)", value: metrics.userRetention.multiplePending },
    { name: "Multiple Views (Clicked)", value: metrics.userRetention.multipleVerified },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ad Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{metrics.totalViews}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MousePointerClick className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{metrics.verifiedClicks}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{metrics.clickThroughRate.toFixed(2)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Views/User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{metrics.averageViewsPerUser.toFixed(1)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Click Trends</TabsTrigger>
          <TabsTrigger value="retention">User Retention</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Ad Click Trends</CardTitle>
              <CardDescription>View ad click trends over time</CardDescription>
              <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      activeTab === "daily"
                        ? metrics.dailyClicks
                        : activeTab === "weekly"
                          ? metrics.weeklyClicks
                          : metrics.monthlyClicks
                    }
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>User Retention</CardTitle>
              <CardDescription>How users interact with ads over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={retentionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {retentionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} users`, "Count"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">User Engagement</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Single View Users</TableCell>
                        <TableCell className="text-right">{metrics.userRetention.singleView}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Multiple Views (No Click)</TableCell>
                        <TableCell className="text-right">{metrics.userRetention.multiplePending}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Multiple Views (Clicked)</TableCell>
                        <TableCell className="text-right">{metrics.userRetention.multipleVerified}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Conversion Rate</TableCell>
                        <TableCell className="text-right font-medium">
                          {metrics.userRetention.multiplePending + metrics.userRetention.multipleVerified > 0
                            ? (
                                (metrics.userRetention.multipleVerified /
                                  (metrics.userRetention.multiplePending + metrics.userRetention.multipleVerified)) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
              <CardDescription>Users with the most ad clicks</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.topUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Total Views</TableHead>
                      <TableHead className="text-right">Verified Clicks</TableHead>
                      <TableHead className="text-right">Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.topUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.userId}</TableCell>
                        <TableCell>{user.views}</TableCell>
                        <TableCell className="text-right">{user.clicks}</TableCell>
                        <TableCell className="text-right">
                          {user.views > 0 ? ((user.clicks / user.views) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">No user data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Distribution</CardTitle>
              <CardDescription>Ad clicks by hour of day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.hourlyDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} clicks`, "Clicks"]}
                      labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                    />
                    <Line type="monotone" dataKey="clicks" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

