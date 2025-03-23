"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Copy, Plus, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getCategories,
  getTags,
  createCategory,
  createTag,
  type FileCategory,
  type FileTag,
} from "@/lib/actions/file-operations"

export function FileUpload({ onFileUploaded }: { onFileUploaded: () => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; link: string }>({
    open: false,
    link: "",
  })
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [tags, setTags] = useState<FileTag[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<FileTag[]>([])
  const [newTagInput, setNewTagInput] = useState("")
  const [newCategoryDialog, setNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  useEffect(() => {
    loadCategoriesAndTags()
  }, [])

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
      toast.error("Failed to load categories and tags")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Add category and tags to form data
      if (selectedCategory) {
        formData.append("categoryId", selectedCategory)
        formData.append("categoryName", categories.find((c) => c.id === selectedCategory)?.name || "")
      }

      if (selectedTags.length > 0) {
        formData.append("tags", JSON.stringify(selectedTags))
      }

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success("File uploaded successfully")

        // Show the generated link
        if (result.link) {
          setLinkDialog({
            open: true,
            link: result.link,
          })
        }

        // Reset form
        const fileInput = document.getElementById("file") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }

        // Reset category and tags
        setSelectedCategory("")
        setSelectedTags([])

        // Refresh file list
        onFileUploaded()
      } else {
        toast.error(result.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("An error occurred while uploading the file")
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copied to clipboard")
  }

  const handleAddTag = async () => {
    if (!newTagInput.trim()) return

    // Check if tag already exists in the selected tags
    if (selectedTags.some((tag) => tag.name.toLowerCase() === newTagInput.toLowerCase())) {
      toast.error("Tag already added")
      return
    }

    // Check if tag exists in the available tags
    const existingTag = tags.find((tag) => tag.name.toLowerCase() === newTagInput.toLowerCase())

    if (existingTag) {
      setSelectedTags([...selectedTags, existingTag])
    } else {
      // Create new tag
      const result = await createTag(newTagInput)
      if (result.success && result.tag) {
        setSelectedTags([...selectedTags, result.tag])
        setTags([...tags, result.tag])
        toast.success(`Created new tag: ${newTagInput}`)
      } else {
        toast.error(result.error || "Failed to create tag")
      }
    }

    setNewTagInput("")
  }

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== tagId))
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const result = await createCategory(newCategoryName, newCategoryDescription)

      if (result.success && result.category) {
        setCategories([...categories, result.category])
        setSelectedCategory(result.category.id)
        setNewCategoryDialog(false)
        setNewCategoryName("")
        setNewCategoryDescription("")
        toast.success(`Created new category: ${newCategoryName}`)
      } else {
        toast.error(result.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("An error occurred while creating the category")
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="file">Select File</Label>
          <Input id="file" name="file" type="file" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category (Optional)</Label>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={() => setNewCategoryDialog(true)}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Category</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tags">Tags (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="new-tag"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Add a tag"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id)}
                    className="rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {tag.name}</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={isUploading}>
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      </form>

      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog({ ...linkDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>File Sharing Link</DialogTitle>
            <DialogDescription>
              Your file has been uploaded successfully. Share this link with others to give them access to the file.
            </DialogDescription>
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

      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a new category to organize your files.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Input
                id="category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Enter category description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

