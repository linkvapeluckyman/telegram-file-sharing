"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Search } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  getCategories,
  getTags,
  createTag,
  updateFileMetadata,
  createCategory,
  type FileCategory,
  type FileTag,
  type File,
} from "@/lib/actions/file-operations"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileMetadataEditorProps {
  file: File
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FileMetadataEditor({ file, open, onOpenChange, onSuccess }: FileMetadataEditorProps) {
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [tags, setTags] = useState<FileTag[]>([])
  const [availableTags, setAvailableTags] = useState<FileTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tagSearch, setTagSearch] = useState("")

  const [selectedCategory, setSelectedCategory] = useState<string>(file.categoryId || "")
  const [selectedTags, setSelectedTags] = useState<FileTag[]>(file.tags || [])
  const [newTagInput, setNewTagInput] = useState("")

  // New category dialog state
  const [newCategoryDialog, setNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  useEffect(() => {
    if (open) {
      loadCategoriesAndTags()
      // Reset state when dialog opens
      setSelectedCategory(file.categoryId || "")
      setSelectedTags(file.tags || [])
      setTagSearch("")
    }
  }, [open, file])

  // Update available tags whenever tags or selectedTags change
  useEffect(() => {
    // Filter out already selected tags
    const selectedTagIds = selectedTags.map((tag) => tag.id)
    let filtered = tags.filter((tag) => !selectedTagIds.includes(tag.id))

    // Apply search filter if there's a search term
    if (tagSearch) {
      const searchLower = tagSearch.toLowerCase()
      filtered = filtered.filter((tag) => tag.name.toLowerCase().includes(searchLower))
    }

    setAvailableTags(filtered)
  }, [tags, selectedTags, tagSearch])

  const loadCategoriesAndTags = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
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

  const handleAddExistingTag = (tag: FileTag) => {
    setSelectedTags([...selectedTags, tag])
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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updateData: any = {}

      // Handle category
      if (selectedCategory === "none") {
        // Remove category
        updateData.categoryId = ""
        updateData.categoryName = ""
      } else if (selectedCategory) {
        // Update category
        const category = categories.find((c) => c.id === selectedCategory)
        updateData.categoryId = selectedCategory
        updateData.categoryName = category?.name || ""
        console.log("Updating category:", { id: selectedCategory, name: category?.name })
      }

      // Handle tags
      updateData.tags = selectedTags

      console.log("Saving file metadata:", updateData)

      const result = await updateFileMetadata(file.id, updateData)

      if (result.success) {
        toast.success("File metadata updated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update file metadata")
      }
    } catch (error) {
      console.error("Error updating file metadata:", error)
      toast.error("An error occurred while updating file metadata")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit File Metadata</DialogTitle>
          <DialogDescription>Update the category and tags for "{file.name}"</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">Loading...</div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
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
              <Label htmlFor="tags">Tags</Label>
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

              {/* Available tags section */}
              <div className="mt-4">
                <Label htmlFor="available-tags">Available Tags</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tag-search"
                    placeholder="Search available tags..."
                    className="pl-8"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-32 mt-2 border rounded-md">
                  {availableTags.length > 0 ? (
                    <div className="p-2 flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => handleAddExistingTag(tag)}
                        >
                          {tag.name}
                          <Plus className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {tagSearch ? "No matching tags found" : "No available tags"}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* New Category Dialog */}
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
    </Dialog>
  )
}

