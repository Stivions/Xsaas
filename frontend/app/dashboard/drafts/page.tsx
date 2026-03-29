"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit2, Trash2, Calendar, Send, Clock } from "lucide-react"

interface Draft {
  id: string
  content: string
  status: "draft" | "scheduled" | "published"
  createdAt: string
  updatedAt: string
  scheduledFor?: string
  characterCount: number
}

const initialDrafts: Draft[] = [
  {
    id: "1",
    content: "Thread idea: 5 lessons I learned from building my first SaaS product. Most people focus on the tech, but the real challenge is...",
    status: "draft",
    createdAt: "2026-03-28",
    updatedAt: "2026-03-28",
    characterCount: 142,
  },
  {
    id: "2",
    content: "The best time to post on X is when your audience is active, not when the \"experts\" say. Track your own data.",
    status: "scheduled",
    createdAt: "2026-03-27",
    updatedAt: "2026-03-28",
    scheduledFor: "2026-03-30 09:00",
    characterCount: 118,
  },
  {
    id: "3",
    content: "Unpopular opinion: You don't need to post every day to grow on X. Quality over quantity. Here's why...",
    status: "scheduled",
    createdAt: "2026-03-26",
    updatedAt: "2026-03-27",
    scheduledFor: "2026-03-31 14:00",
    characterCount: 105,
  },
  {
    id: "4",
    content: "Working on something exciting. Can't wait to share more soon.",
    status: "draft",
    createdAt: "2026-03-25",
    updatedAt: "2026-03-25",
    characterCount: 62,
  },
  {
    id: "5",
    content: "Just finished reading \"The Mom Test\" - essential for anyone building products. Key takeaway: Never ask people if they would buy something. Watch what they actually do.",
    status: "draft",
    createdAt: "2026-03-24",
    updatedAt: "2026-03-24",
    characterCount: 175,
  },
]

function getStatusColor(status: Draft["status"]) {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground"
    case "scheduled":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "published":
      return "bg-green-500/10 text-green-600 border-green-500/20"
  }
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts)
  const [newDraftContent, setNewDraftContent] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [editContent, setEditContent] = useState("")

  const handleCreateDraft = () => {
    if (!newDraftContent.trim()) return

    const newDraft: Draft = {
      id: Date.now().toString(),
      content: newDraftContent,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      characterCount: newDraftContent.length,
    }

    setDrafts([newDraft, ...drafts])
    setNewDraftContent("")
    setIsDialogOpen(false)
  }

  const handleDeleteDraft = (id: string) => {
    setDrafts(drafts.filter((draft) => draft.id !== id))
  }

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft)
    setEditContent(draft.content)
  }

  const handleSaveEdit = () => {
    if (!editingDraft || !editContent.trim()) return

    setDrafts(
      drafts.map((draft) =>
        draft.id === editingDraft.id
          ? {
              ...draft,
              content: editContent,
              updatedAt: new Date().toISOString().split("T")[0],
              characterCount: editContent.length,
            }
          : draft
      )
    )
    setEditingDraft(null)
    setEditContent("")
  }

  const draftCount = drafts.filter((d) => d.status === "draft").length
  const scheduledCount = drafts.filter((d) => d.status === "scheduled").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Drafts</h2>
          <p className="text-muted-foreground">
            {draftCount} drafts, {scheduledCount} scheduled
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New Draft
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Draft</DialogTitle>
              <DialogDescription>
                Write your post. You can save it as a draft or schedule it for later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="What's on your mind?"
                value={newDraftContent}
                onChange={(e) => setNewDraftContent(e.target.value)}
                className="min-h-32 resize-none"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{newDraftContent.length} / 280 characters</span>
                {newDraftContent.length > 280 && (
                  <span className="text-destructive">Thread required</span>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDraft} disabled={!newDraftContent.trim()}>
                Save Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
            <DialogDescription>Make changes to your draft.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What's on your mind?"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{editContent.length} / 280 characters</span>
              {editContent.length > 280 && (
                <span className="text-destructive">Thread required</span>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingDraft(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editContent.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Edit2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No drafts yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Start writing your first post. Save ideas, polish your content, and schedule posts.
            </p>
            <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create your first draft
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(draft.status)}`}>
                    {draft.status}
                  </Badge>
                  {draft.scheduledFor && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {draft.scheduledFor}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditDraft(draft)}>
                      <Edit2 className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="mr-2 size-4" />
                      Schedule
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="mr-2 size-4" />
                      Post now
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-4 text-sm leading-relaxed">{draft.content}</p>
              </CardContent>
              <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted-foreground">
                <span>{draft.characterCount} characters</span>
                <span>Updated {draft.updatedAt}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
