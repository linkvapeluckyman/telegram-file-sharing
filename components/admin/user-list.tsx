"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ban, CheckCircle, Eye, UserIcon, Users, BarChart } from "lucide-react"
import { getUsers, banUser, unbanUser, getUserDetails, getUserStats, type User } from "@/lib/actions/users"
import { formatDistanceToNow, format } from "date-fns"
// Add import for UserAdAnalytics
import { UserAdAnalytics } from "./user-ad-analytics"

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Add state for ad analytics dialog
  const [selectedUserForAds, setSelectedUserForAds] = useState<string | null>(null)
  const [isAdAnalyticsOpen, setIsAdAnalyticsOpen] = useState(false)

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const result = await getUsers()
      if (result.success) {
        setUsers(result.users)
      } else {
        console.error("Error loading users:", result.error)
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const result = await getUserStats()
      if (result.success) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleViewUser = async (userId: string) => {
    setIsLoadingDetails(true)
    setIsDialogOpen(true)

    try {
      const result = await getUserDetails(userId)
      if (result.success) {
        setSelectedUser(result.user)
      } else {
        console.error("Error loading user details:", result.error)
      }
    } catch (error) {
      console.error("Error loading user details:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleBanUser = async (userId: string) => {
    if (confirm("Are you sure you want to ban this user?")) {
      try {
        const result = await banUser(userId)
        if (result.success) {
          // Update the user in the list
          setUsers(users.map((user) => (user.userId === userId ? { ...user, isBanned: true } : user)))

          // Update the selected user if viewing details
          if (selectedUser && selectedUser.userId === userId) {
            setSelectedUser({ ...selectedUser, isBanned: true })
          }

          // Refresh stats
          loadStats()
        } else {
          console.error("Error banning user:", result.error)
        }
      } catch (error) {
        console.error("Error banning user:", error)
      }
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const result = await unbanUser(userId)
      if (result.success) {
        // Update the user in the list
        setUsers(users.map((user) => (user.userId === userId ? { ...user, isBanned: false } : user)))

        // Update the selected user if viewing details
        if (selectedUser && selectedUser.userId === userId) {
          setSelectedUser({ ...selectedUser, isBanned: false })
        }

        // Refresh stats
        loadStats()
      } else {
        console.error("Error unbanning user:", result.error)
      }
    } catch (error) {
      console.error("Error unbanning user:", error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Unknown"
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Ban className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{stats.bannedUsers}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total File Accesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-muted-foreground mr-2" />
                <div className="text-2xl font-bold">{stats.totalAccesses}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-8">No users found</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Access Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.userId}</TableCell>
                  <TableCell>{user.username || "N/A"}</TableCell>
                  <TableCell>{user.firstName ? `${user.firstName} ${user.lastName || ""}` : "N/A"}</TableCell>
                  <TableCell>{formatDate(user.lastActive)}</TableCell>
                  <TableCell>{user.accessCount}</TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleViewUser(user.userId)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>

                      {user.isBanned ? (
                        <Button variant="outline" size="icon" onClick={() => handleUnbanUser(user.userId)}>
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Unban</span>
                        </Button>
                      ) : (
                        <Button variant="outline" size="icon" onClick={() => handleBanUser(user.userId)}>
                          <Ban className="h-4 w-4" />
                          <span className="sr-only">Ban</span>
                        </Button>
                      )}
                      {/* Add button to view ad analytics in the actions column */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedUserForAds(user.userId)
                          setIsAdAnalyticsOpen(true)
                        }}
                        title="View Ad Analytics"
                      >
                        <BarChart className="h-4 w-4" />
                        <span className="sr-only">Ad Analytics</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the user</DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="text-center py-8">Loading user details...</div>
          ) : selectedUser ? (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">User Information</TabsTrigger>
                <TabsTrigger value="history">Access History</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                    <p>{selectedUser.userId}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p>{selectedUser.username || "N/A"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">First Name</h3>
                    <p>{selectedUser.firstName || "N/A"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Name</h3>
                    <p>{selectedUser.lastName || "N/A"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                    <p>{format(new Date(selectedUser.createdAt), "PPP")}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Active</h3>
                    <p>{format(new Date(selectedUser.lastActive), "PPP p")}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Access Count</h3>
                    <p>{selectedUser.accessCount}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p>
                      {selectedUser.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </p>
                  </div>

                  {selectedUser.isBanned && (
                    <div className="col-span-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Banned At</h3>
                      <p>{format(new Date(selectedUser.bannedAt), "PPP p")}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  {selectedUser.isBanned ? (
                    <Button variant="outline" onClick={() => handleUnbanUser(selectedUser.userId)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unban User
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={() => handleBanUser(selectedUser.userId)}>
                      <Ban className="h-4 w-4 mr-2" />
                      Ban User
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history">
                {selectedUser.accessHistory && selectedUser.accessHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File ID</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Accessed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUser.accessHistory.map((history: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{history.fileId}</TableCell>
                          <TableCell>{history.fileName || "N/A"}</TableCell>
                          <TableCell>{format(new Date(history.accessedAt), "PPP p")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">No access history found</div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">User not found</div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add the UserAdAnalytics component at the end of the component, before the closing tag */}
      {selectedUserForAds && (
        <UserAdAnalytics userId={selectedUserForAds} open={isAdAnalyticsOpen} onOpenChange={setIsAdAnalyticsOpen} />
      )}
    </div>
  )
}

