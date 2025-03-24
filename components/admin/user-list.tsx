"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Ban,
  CheckCircle,
  Eye,
  UserIcon,
  Users,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { getUserDetails, getUserStats, type User } from "@/lib/actions/users"
import { formatDistanceToNow, format } from "date-fns"
import { UserAdAnalytics } from "./user-ad-analytics"
import { toast } from "sonner"

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUserForAds, setSelectedUserForAds] = useState<string | null>(null)
  const [isAdAnalyticsOpen, setIsAdAnalyticsOpen] = useState(false)
  const [accessHistoryPage, setAccessHistoryPage] = useState(1)
  const [activeTab, setActiveTab] = useState("info")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load users when page changes or search query changes
  useEffect(() => {
    loadUsers(currentPage, debouncedSearchQuery)
  }, [currentPage, debouncedSearchQuery])

  useEffect(() => {
    loadStats()
  }, [])

  const loadUsers = async (page = 1, search = "") => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=10${search ? `&search=${search}` : ""}`)
      if (!response.ok) {
        throw new Error("Failed to load users")
      }

      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotalUsers(data.totalUsers)
        setCurrentPage(data.currentPage)
      } else {
        toast.error(data.error || "Failed to load users")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
      setIsSearching(false)
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

  const handleViewUser = async (userId: string, page = 1, preserveTab = false) => {
    setIsLoadingDetails(true)
    setIsDialogOpen(true)
    setAccessHistoryPage(page)

    if (!preserveTab) {
      setActiveTab("info")
    }

    try {
      const result = await getUserDetails(userId, page)
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

  const handleAccessHistoryPageChange = (newPage: number) => {
    if (selectedUser) {
      handleViewUser(selectedUser.userId, newPage, true)
    }
  }

  const handleBanUser = async (userId: string) => {
    if (confirm("Are you sure you want to ban this user?")) {
      try {
        const response = await fetch("/api/admin/users/ban", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          throw new Error("Failed to ban user")
        }

        const result = await response.json()

        if (result.success) {
          // Update the user in the list
          setUsers(users.map((user) => (user.userId === userId ? { ...user, isBanned: true } : user)))

          // Update the selected user if viewing details
          if (selectedUser && selectedUser.userId === userId) {
            setSelectedUser({ ...selectedUser, isBanned: true })
          }

          // Refresh stats
          loadStats()
          toast.success("User banned successfully")
        } else {
          toast.error(result.error || "Failed to ban user")
        }
      } catch (error) {
        console.error("Error banning user:", error)
        toast.error("Failed to ban user")
      }
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users/unban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to unban user")
      }

      const result = await response.json()

      if (result.success) {
        // Update the user in the list
        setUsers(users.map((user) => (user.userId === userId ? { ...user, isBanned: false } : user)))

        // Update the selected user if viewing details
        if (selectedUser && selectedUser.userId === userId) {
          setSelectedUser({ ...selectedUser, isBanned: false })
        }

        // Refresh stats
        loadStats()
        toast.success("User unbanned successfully")
      } else {
        toast.error(result.error || "Failed to unban user")
      }
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast.error("Failed to unban user")
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleRefresh = () => {
    setSearchQuery("")
    setDebouncedSearchQuery("")
    setCurrentPage(1)
    loadUsers(1, "")
    loadStats()
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Unknown"
    }
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

      <div className="flex justify-between items-center mb-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by user ID or username..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          {debouncedSearchQuery ? "No users found matching your search" : "No users found"}
        </div>
      ) : (
        <>
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
                {isSearching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      <span className="mt-2 block">Searching...</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {users.length} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
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
                  disabled={currentPage === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next Page</span>
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the user</DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="text-center py-8">Loading user details...</div>
          ) : selectedUser ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">User Information</TabsTrigger>
                <TabsTrigger value="history">Access History</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 overflow-auto p-1">
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

              <TabsContent value="history" className="overflow-auto flex-1 flex flex-col">
                {selectedUser.accessHistory && selectedUser.accessHistory.length > 0 ? (
                  <>
                    <div className="overflow-auto flex-1">
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
                    </div>

                    {selectedUser.pagination && selectedUser.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t pt-4 mt-auto">
                        <div className="text-sm text-muted-foreground">
                          Showing page {selectedUser.pagination.currentPage} of {selectedUser.pagination.totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccessHistoryPageChange(selectedUser.pagination.currentPage - 1)}
                            disabled={selectedUser.pagination.currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous Page</span>
                          </Button>
                          <div className="text-sm">
                            Page {selectedUser.pagination.currentPage} of {selectedUser.pagination.totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAccessHistoryPageChange(selectedUser.pagination.currentPage + 1)}
                            disabled={selectedUser.pagination.currentPage === selectedUser.pagination.totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next Page</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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

      {selectedUserForAds && (
        <UserAdAnalytics userId={selectedUserForAds} open={isAdAnalyticsOpen} onOpenChange={setIsAdAnalyticsOpen} />
      )}
    </div>
  )
}

