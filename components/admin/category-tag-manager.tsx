"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  getCategories,
  getTags,
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  type FileCategory,
  type FileTag,
} from "@/lib/actions/file-operations"

export function CategoryTagManager() {
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [tags, setTags] = useState<FileTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("categories")

  const [newCategoryDialog, setNewCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")

  const [newTagDialog, setNewTagDialog] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  useEffect(() => {
    loadCategoriesAndTags()
  }, [])

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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const result = await createCategory(newCategoryName, newCategoryDescription)

      if (result.success && result.category) {
        setCategories([...categories, result.category])
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required")
      return
    }

    try {
      const result = await createTag(newTagName)

      if (result.success && result.tag) {
        setTags([...tags, result.tag])
        setNewTagDialog(false)
        setNewTagName("")
        toast.success(`Created new tag: ${newTagName}`)
      } else {
        toast.error(result.error || "Failed to create tag")
      }
    } catch (error) {
      console.error("Error creating tag:", error)
      toast.error("An error occurred while creating the tag")
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      confirm(`Are you sure you want to delete the category "${name}"? This will remove the category from all files.`)
    ) {
      try {
        const result = await deleteCategory(id)

        if (result.success) {
          setCategories(categories.filter((category) => category.id !== id))
          toast.success(`Deleted category: ${name}`)
        } else {
          toast.error(result.error || "Failed to delete category")
        }
      } catch (error) {
        console.error("Error deleting category:", error)
        toast.error("An error occurred while deleting the category")
      }
    }
  }

  const handleDeleteTag = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the tag "${name}"? This will remove the tag from all files.`)) {
      try {
        const result = await deleteTag(id)

        if (result.success) {
          setTags(tags.filter((tag) => tag.id !== id))
          toast.success(`Deleted tag: ${name}`)
        } else {
          toast.error(result.error || "Failed to delete tag")
        }
      } catch (error) {
        console.error("Error deleting tag:", error)
        toast.error("An error occurred while deleting the tag")
      }
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          {activeTab === "categories" ? (
            <Button onClick={() => setNewCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          ) : (
            <Button onClick={() => setNewTagDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          )}
        </div>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>File Categories</CardTitle>
              <CardDescription>Manage categories to organize your files</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No categories found. Create a category to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>File Tags</CardTitle>
              <CardDescription>Manage tags to label and filter your files</CardDescription>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tags found. Create a tag to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => handleDeleteTag(tag.id, tag.name)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* New Tag Dialog */}
      <Dialog open={newTagDialog} onOpenChange={setNewTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>Add a new tag to label your files.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-name">Tag Name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag}>Create Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

