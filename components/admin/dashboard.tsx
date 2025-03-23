"use client"

import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "./file-upload"
import { FileList } from "./file-list"
import { UserList } from "./user-list"
import { Settings } from "./settings"
import { BatchLinkGenerator } from "./batch-link-generator"
import { logoutAdmin } from "@/lib/actions/auth"
import { RefreshCw } from "lucide-react"
import { AdPerformance } from "./ad-performance"
import { CategoryTagManager } from "./category-tag-manager"
import { AutoDeleteMonitor } from "./auto-delete-monitor"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("files")
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshData = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <form action={logoutAdmin}>
          <Button variant="outline" type="submit">
            Logout
          </Button>
        </form>
      </div>

      <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-8">
          <div className="overflow-x-auto pb-2 -mb-2">
            <TabsList className="inline-flex w-auto min-w-full md:w-full">
              <TabsTrigger value="files" className="whitespace-nowrap">
                Files
              </TabsTrigger>
              <TabsTrigger value="links" className="whitespace-nowrap">
                <span className="hidden sm:inline">Generate </span>Links
              </TabsTrigger>
              <TabsTrigger value="users" className="whitespace-nowrap">
                Users
              </TabsTrigger>
              <TabsTrigger value="ads" className="whitespace-nowrap">
                <span className="hidden sm:inline">Ad </span>Performance
              </TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap">
                <span className="hidden sm:inline">Categories & </span>Tags
              </TabsTrigger>
              <TabsTrigger value="auto-delete" className="whitespace-nowrap">
                <span className="hidden sm:inline">Auto-</span>Delete
              </TabsTrigger>
              <TabsTrigger value="settings" className="whitespace-nowrap">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {(activeTab === "users" || activeTab === "files") && (
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Manage Files</CardTitle>
              <CardDescription>Upload new files or manage existing ones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload onFileUploaded={refreshData} />
              <FileList key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Batch Links</CardTitle>
                <CardDescription>Generate sharing links for multiple files at once</CardDescription>
              </CardHeader>
              <CardContent>
                <BatchLinkGenerator />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>View and manage users who have accessed your files</CardDescription>
            </CardHeader>
            <CardContent>
              <UserList key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle>Ad Performance</CardTitle>
              <CardDescription>Monitor ad clicks and user engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <AdPerformance />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Manage Categories & Tags</CardTitle>
              <CardDescription>Organize your files with categories and tags</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryTagManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-delete">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Delete Monitor</CardTitle>
              <CardDescription>Monitor and manage scheduled file deletions</CardDescription>
            </CardHeader>
            <CardContent>
              <AutoDeleteMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Bot Settings</CardTitle>
              <CardDescription>Configure your Telegram file sharing bot</CardDescription>
            </CardHeader>
            <CardContent>
              <Settings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

