"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Plus, Tag, FolderOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FileCategory, FileTag } from "@/lib/actions/file-operations"

interface BatchOperationsPanelProps {
  categories: FileCategory[]
  tags: FileTag[]
  onCategoryUpdate: (categoryId: string, categoryName: string) => void
  onAddTags: (tags: Array<{ id: string; name: string }>) => void
  onRemoveTags: (tagIds: string[]) => void
}

export function BatchOperationsPanel({
  categories,
  tags,
  onCategoryUpdate,
  onAddTags,
  onRemoveTags,
}: BatchOperationsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState<FileTag[]>([])
  const [selectedTagsToRemove, setSelectedTagsToRemove] = useState<FileTag[]>([])
  const [tagSearch, setTagSearch] = useState("")

  const handleCategoryUpdate = () => {
    if (!selectedCategory) return

    if (selectedCategory === "none") {
      onCategoryUpdate("none", "")
    } else {
      const category = categories.find((c) => c.id === selectedCategory)
      if (category) {
        onCategoryUpdate(category.id, category.name)
      }
    }
  }

  const handleAddTags = () => {
    if (selectedTagsToAdd.length === 0) return
    onAddTags(selectedTagsToAdd)
    setSelectedTagsToAdd([])
  }

  const handleRemoveTags = () => {
    if (selectedTagsToRemove.length === 0) return
    onRemoveTags(selectedTagsToRemove.map((tag) => tag.id))
    setSelectedTagsToRemove([])
  }

  const handleAddTag = (tag: FileTag) => {
    if (!selectedTagsToAdd.some((t) => t.id === tag.id)) {
      setSelectedTagsToAdd([...selectedTagsToAdd, tag])
    }
  }

  const handleRemoveTagFromSelection = (tagId: string, isAddList: boolean) => {
    if (isAddList) {
      setSelectedTagsToAdd(selectedTagsToAdd.filter((tag) => tag.id !== tagId))
    } else {
      setSelectedTagsToRemove(selectedTagsToRemove.filter((tag) => tag.id !== tagId))
    }
  }

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))

  return (
    <div className="mt-4 border rounded-md p-4 bg-card">
      <Tabs defaultValue="category">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="category">
            <FolderOpen className="h-4 w-4 mr-2" />
            Update Category
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="h-4 w-4 mr-2" />
            Manage Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="batch-category">Select Category</Label>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Remove Category)</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCategoryUpdate} disabled={!selectedCategory}>
            Apply Category to Selected Files
          </Button>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4 mt-4">
          <Tabs defaultValue="add-tags">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add-tags">Add Tags</TabsTrigger>
              <TabsTrigger value="remove-tags">Remove Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="add-tags" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="tag-search">Search Tags</Label>
                <Input
                  id="tag-search"
                  placeholder="Search for tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />

                <Label className="mt-2">Available Tags</Label>
                <ScrollArea className="h-32 border rounded-md">
                  <div className="p-2 flex flex-wrap gap-2">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => handleAddTag(tag)}
                        >
                          {tag.name}
                          <Plus className="h-3 w-3 ml-1" />
                        </Badge>
                      ))
                    ) : (
                      <div className="p-2 text-muted-foreground">No tags found</div>
                    )}
                  </div>
                </ScrollArea>

                {selectedTagsToAdd.length > 0 && (
                  <>
                    <Label className="mt-2">Selected Tags to Add</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTagsToAdd.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveTagFromSelection(tag.id, true)}
                            className="rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag.name}</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button onClick={handleAddTags} disabled={selectedTagsToAdd.length === 0}>
                Add Tags to Selected Files
              </Button>
            </TabsContent>

            <TabsContent value="remove-tags" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Select Tags to Remove</Label>
                <ScrollArea className="h-32 border rounded-md">
                  <div className="p-2 flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTagsToRemove.some((t) => t.id === tag.id) ? "destructive" : "outline"}
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            if (selectedTagsToRemove.some((t) => t.id === tag.id)) {
                              setSelectedTagsToRemove(selectedTagsToRemove.filter((t) => t.id !== tag.id))
                            } else {
                              setSelectedTagsToRemove([...selectedTagsToRemove, tag])
                            }
                          }}
                        >
                          {tag.name}
                          {selectedTagsToRemove.some((t) => t.id === tag.id) ? <X className="h-3 w-3 ml-1" /> : null}
                        </Badge>
                      ))
                    ) : (
                      <div className="p-2 text-muted-foreground">No tags available</div>
                    )}
                  </div>
                </ScrollArea>

                {selectedTagsToRemove.length > 0 && (
                  <>
                    <Label className="mt-2">Tags to Remove</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTagsToRemove.map((tag) => (
                        <Badge key={tag.id} variant="destructive" className="flex items-center gap-1">
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveTagFromSelection(tag.id, false)}
                            className="rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {tag.name}</span>
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button variant="destructive" onClick={handleRemoveTags} disabled={selectedTagsToRemove.length === 0}>
                Remove Tags from Selected Files
              </Button>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}

