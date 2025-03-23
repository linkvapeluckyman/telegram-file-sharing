"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Trash2,
  LinkIcon,
  Eye,
  Copy,
  Upload,
  MessageSquare,
  Badge,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Download,
} from "lucide-react"
import {
  getFiles,
  deleteFile,
  generateFileLink,
  getCategories,
  getTags,
  type File,
  type FileCategory,
  type FileTag,
} from "@/lib/actions/file-operations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge as UIBadge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { FileMetadataEditor } from "./file-metadata-editor"
import { batchUpdateCategory, batchAddTags, batchRemoveTags, exportFileDetails } from "@/lib/actions/batch-operations"
import { BatchOperationsPanel } from "./batch-operations-panel"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function FileList() {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; link: string; fileId: string }>({
    open: false,
    link: "",
    fileId: "",
  })
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [tags, setTags] = useState<FileTag[]>([])
  const [editingFile, setEditingFile] = useState<File | null>(null)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const ITEMS_PER_PAGE = 10

  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [showBatchPanel, setShowBatchPanel] = useState(false)

  useEffect(() => {
    loadCategoriesAndTags()
    loadFiles()
  }, [currentPage, searchQuery, selectedCategory, selectedTags])

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesResult, tagsResult] = await Promise.all([getCategories(), getTags()])

      if (categoriesResult.success) {
        setCategories(categoriesResult.categories)
      }

      if (tagsResult.success) {
        setTags(tagsResult.tags)
      }
    } catch (error) {
      console.error("Error loading categories and tags:", error)
    }
  }

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      // Build search params
      const searchParams = new URLSearchParams()
      searchParams.append("page", currentPage.toString())
      searchParams.append("limit", ITEMS_PER_PAGE.toString())

      if (searchQuery) {
        searchParams.append("search", searchQuery)
      }

      if (selectedCategory) {
        searchParams.append("category", selectedCategory)
      }

      if (selectedTags.length > 0) {
        selectedTags.forEach((tag) => searchParams.append("tags", tag))
      }

      const result = await getFiles(searchParams.toString())

      if (result.success) {
        setFiles(result.files)
        setTotalPages(result.totalPages)
        setTotalFiles(result.totalFiles)
      } else {
        console.error("Error loading files:", result.error)
      }
    } catch (error) {
      console.error("Error loading files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFile = async (messageId: number, fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      setIsDeleting(fileId)
      try {
        const result = await deleteFile(messageId)
        if (result.success) {
          setFiles(files.filter((file) => file.id !== fileId))
          toast.success("File deleted successfully")

          // If we deleted the last file on this page and there are more pages, go back one page
          if (files.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
          } else {
            // Otherwise just refresh the current page
            loadFiles()
          }
        } else {
          toast.error(result.error || "Failed to delete file")
        }
      } catch (error) {
        console.error("Error deleting file:", error)
        toast.error("An error occurred while deleting the file")
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleGenerateLink = async (messageId: number, fileId: string) => {
    try {
      const result = await generateFileLink(messageId)
      if (result.success) {
        setLinkDialog({
          open: true,
          link: result.link,
          fileId,
        })
      } else {
        toast.error(result.error || "Failed to generate link")
      }
    } catch (error) {
      console.error("Error generating link:", error)
      toast.error("An error occurred while generating the link")
    }
  }

  const handleEditMetadata = (file: File) => {
    setEditingFile(file)
  }

  const handleMetadataUpdated = () => {
    console.log("Metadata updated, refreshing file list")
    // Force a refresh of the file list
    loadFiles()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copied to clipboard")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB"
    else return (bytes / 1073741824).toFixed(2) + " GB"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  const getUploadMethodIcon = (method?: string) => {
    switch (method) {
      case "admin_panel":
        return <Upload className="h-4 w-4 mr-1" />
      case "telegram_bot":
        return <MessageSquare className="h-4 w-4 mr-1" />
      default:
        return <Badge className="h-4 w-4 mr-1" />
    }
  }

  const getUploadMethodLabel = (method?: string) => {
    switch (method) {
      case "admin_panel":
        return "Admin Panel"
      case "telegram_bot":
        return "Telegram Bot"
      default:
        return "Unknown"
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
    loadFiles()
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedTags([])
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map((file) => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleBatchCategoryUpdate = async (categoryId: string, categoryName: string) => {
    if (selectedFiles.length === 0) return

    try {
      const result = await batchUpdateCategory(selectedFiles, categoryId, categoryName)

      if (result.success) {
        toast.success(`Updated category for ${result.updatedCount} files`)
        loadFiles()
      } else {
        toast.error(result.error || "Failed to update categories")
      }
    } catch (error) {
      console.error("Error in batch category update:", error)
      toast.error("An error occurred during batch update")
    }
  }

  const handleBatchAddTags = async (tags: Array<{ id: string; name: string }>) => {
    if (selectedFiles.length === 0 || tags.length === 0) return

    try {
      const result = await batchAddTags(selectedFiles, tags)

      if (result.success) {
        toast.success(`Added tags to ${result.updatedCount} files`)
        loadFiles()
      } else {
        toast.error(result.error || "Failed to add tags")
      }
    } catch (error) {
      console.error("Error in batch tag addition:", error)
      toast.error("An error occurred during batch update")
    }
  }

  const handleBatchRemoveTags = async (tagIds: string[]) => {
    if (selectedFiles.length === 0 || tagIds.length === 0) return

    try {
      const result = await batchRemoveTags(selectedFiles, tagIds)

      if (result.success) {
        toast.success(`Removed tags from ${result.updatedCount} files`)
        loadFiles()
      } else {
        toast.error(result.error || "Failed to remove tags")
      }
    } catch (error) {
      console.error("Error in batch tag removal:", error)
      toast.error("An error occurred during batch update")
    }
  }

  const handleExportFiles = async (format: "csv" | "json") => {
    if (selectedFiles.length === 0) return

    try {
      const result = await exportFileDetails(selectedFiles)

      if (result.success && result.data) {
        // Convert data to the requested format
        let content: string
        let fileName: string
        let mimeType: string

        if (format === "csv") {
          // Create CSV content
          const headers = Object.keys(result.data[0]).join(",")
          const rows = result.data.map((item) =>
            Object.values(item)
              .map((value) => (typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value))
              .join(","),
          )
          content = [headers, ...rows].join("\n")
          fileName = `file-export-${new Date().toISOString().slice(0, 10)}.csv`
          mimeType = "text/csv"
        } else {
          // JSON format
          content = JSON.stringify(result.data, null, 2)
          fileName = `file-export-${new Date().toISOString().slice(0, 10)}.json`
          mimeType = "application/json"
        }

        // Create and download the file
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success(`Exported ${result.data.length} files`)
      } else {
        toast.error(result.error || "Failed to export files")
      }
    } catch (error) {
      console.error("Error exporting files:", error)
      toast.error("An error occurred during export")
    }
  }

  if (isLoading && files.length === 0) {
    return <div className="text-center py-8">Loading files...</div>
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search files..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Advanced Filters</h4>
                    <p className="text-sm text-muted-foreground">Filter files by category and tags</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category-filter">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tags</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                    <Button size="sm" onClick={() => setShowAdvancedSearch(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button type="submit">Search</Button>
          </form>

          {/* Active filters display */}
          {(selectedCategory || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory && (
                <UIBadge variant="outline" className="flex items-center gap-1">
                  Category: {categories.find((c) => c.id === selectedCategory)?.name}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className="rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </UIBadge>
              )}
              {selectedTags.map((tagId) => {
                const tagName = tags.find((t) => t.id === tagId)?.name
                return (
                  <UIBadge key={tagId} variant="outline" className="flex items-center gap-1">
                    Tag: {tagName}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tagId)}
                      className="rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </UIBadge>
                )
              })}
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Batch operations panel */}
        {selectedFiles.length > 0 && (
          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedFiles.length} files selected</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBatchPanel(!showBatchPanel)}>
                  {showBatchPanel ? "Hide Batch Operations" : "Show Batch Operations"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportFiles("csv")}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportFiles("json")}>Export as JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {showBatchPanel && (
              <BatchOperationsPanel
                categories={categories}
                tags={tags}
                onCategoryUpdate={handleBatchCategoryUpdate}
                onAddTags={handleBatchAddTags}
                onRemoveTags={handleBatchRemoveTags}
              />
            )}
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-8">No files found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all files"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={(checked) => handleSelectFile(file.id, !!checked)}
                        aria-label={`Select ${file.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>
                      {file.categoryName ? (
                        <UIBadge variant="outline">{file.categoryName}</UIBadge>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {file.tags && file.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {file.tags.map((tag) => (
                            <UIBadge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </UIBadge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UIBadge variant="outline" className="flex items-center">
                          {getUploadMethodIcon(file.uploadMethod)}
                          {getUploadMethodLabel(file.uploadMethod)}
                        </UIBadge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditMetadata(file)}
                          title="Edit Metadata"
                        >
                          <Tag className="h-4 w-4" />
                          <span className="sr-only">Edit Metadata</span>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <a href={`/files/${file.messageId}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleGenerateLink(file.messageId, file.id)}
                        >
                          <LinkIcon className="h-4 w-4" />
                          <span className="sr-only">Generate Link</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteFile(file.messageId, file.id)}
                          disabled={isDeleting === file.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {files.length} of {totalFiles} files
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog({ ...linkDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Sharing Link</DialogTitle>
            <DialogDescription>Share this link with others to give them access to the file.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" value={linkDialog.link} readOnly className="w-full" />
            </div>
            <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(linkDialog.link)}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setLinkDialog({ ...linkDialog, open: false })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingFile && (
        <FileMetadataEditor
          file={editingFile}
          open={!!editingFile}
          onOpenChange={(open) => {
            if (!open) setEditingFile(null)
          }}
          onSuccess={handleMetadataUpdated}
        />
      )}
    </>
  )
}

