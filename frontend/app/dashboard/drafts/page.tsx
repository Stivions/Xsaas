"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

type DraftStatus = "draft" | "scheduled" | "published"
type DraftSource = "manual" | "automation"

interface Draft {
  id: string
  content: string
  status: DraftStatus
  source: DraftSource
  createdAt: string
  updatedAt: string
  scheduledFor?: string | null
  characterCount: number
  externalPostUrl?: string
  publishedAt?: string | null
}

export default function DraftsPage() {
  const { t } = useLanguage()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [newDraftContent, setNewDraftContent] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [publishingDraftId, setPublishingDraftId] = useState("")
  const [statusMessage, setStatusMessage] = useState("")

  async function loadDrafts() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/drafts", { cache: "no-store" })
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setDrafts(data.drafts || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDrafts()
  }, [])

  const handleCreateDraft = async () => {
    if (!newDraftContent.trim()) return
    setIsSaving(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newDraftContent.trim(), status: "draft", source: "manual" }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatusMessage(data.error || "Failed to create draft.")
        return
      }
      const data = await response.json()
      setDrafts((current) => [data.draft, ...current])
      setNewDraftContent("")
      setIsDialogOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDraft = async (id: string) => {
    setStatusMessage("")
    const previous = drafts
    setDrafts((current) => current.filter((draft) => draft.id !== id))
    const response = await fetch(`/api/drafts/${id}`, { method: "DELETE" })
    if (!response.ok) {
      setDrafts(previous)
      const data = await response.json().catch(() => ({}))
      setStatusMessage(data.error || "Failed to delete draft.")
    }
  }

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft)
    setEditContent(draft.content)
  }

  const handleSaveEdit = async () => {
    if (!editingDraft || !editContent.trim()) return
    setIsSaving(true)
    setStatusMessage("")
    try {
      const response = await fetch(`/api/drafts/${editingDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatusMessage(data.error || "Failed to update draft.")
        return
      }
      const data = await response.json()
      setDrafts((current) => current.map((draft) => (draft.id === editingDraft.id ? data.draft : draft)))
      setEditingDraft(null)
      setEditContent("")
    } finally {
      setIsSaving(false)
    }
  }

  const markDraftStatus = async (id: string, status: DraftStatus) => {
    setStatusMessage("")
    const scheduledFor = status === "scheduled" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
    const response = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, scheduledFor }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setStatusMessage(data.error || "Failed to update draft.")
      return
    }
    const data = await response.json()
    setDrafts((current) => current.map((draft) => (draft.id === id ? data.draft : draft)))
  }

  const handleGenerateDraft = async () => {
    setIsGenerating(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/automation/run", {
        method: "POST",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setStatusMessage(data.error || "Failed to generate draft.")
        return
      }
      const data = await response.json()
      setDrafts((current) => [data.draft, ...current])
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublishDraft = async (draftId: string) => {
    setPublishingDraftId(draftId)
    setStatusMessage("")
    try {
      const response = await fetch(`/api/drafts/${draftId}/publish`, {
        method: "POST",
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatusMessage(data.error || "Failed to publish draft.")
        return
      }

      setDrafts((current) => current.map((draft) => (draft.id === draftId ? data.draft : draft)))
      if (data?.draft?.externalPostUrl) {
        setStatusMessage(data.draft.externalPostUrl)
      }
    } finally {
      setPublishingDraftId("")
    }
  }

  const draftCount = drafts.filter((draft) => draft.status === "draft").length
  const scheduledCount = drafts.filter((draft) => draft.status === "scheduled").length

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          {t.drafts.loadingDrafts}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.drafts.title}</h2>
          <p className="text-muted-foreground">
            {draftCount} {t.drafts.summaryDrafts}, {scheduledCount} {t.drafts.summaryScheduled}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleGenerateDraft} disabled={isGenerating}>
            {isGenerating ? <Spinner className="mr-2" /> : <Sparkles className="mr-2 size-4" />}
            {isGenerating ? t.drafts.generatingAi : t.drafts.generateAi}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                {t.drafts.newDraft}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.drafts.createTitle}</DialogTitle>
                <DialogDescription>{t.drafts.createDescription}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder={t.drafts.placeholder}
                  value={newDraftContent}
                  onChange={(event) => setNewDraftContent(event.target.value)}
                  className="min-h-32 resize-none"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{newDraftContent.length} / 280</span>
                  {newDraftContent.length > 280 ? <span className="text-destructive">{t.drafts.threadRequired}</span> : null}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.drafts.cancel}
                </Button>
                <Button onClick={handleCreateDraft} disabled={!newDraftContent.trim() || isSaving}>
                  {isSaving ? <Spinner className="mr-2" /> : null}
                  {t.drafts.saveDraft}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.drafts.editTitle}</DialogTitle>
            <DialogDescription>{t.drafts.editDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={t.drafts.placeholder}
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              className="min-h-32 resize-none"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{editContent.length} / 280</span>
              {editContent.length > 280 ? <span className="text-destructive">{t.drafts.threadRequired}</span> : null}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingDraft(null)}>
              {t.drafts.cancel}
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editContent.trim() || isSaving}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {t.drafts.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Edit2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.drafts.emptyTitle}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t.drafts.emptyDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                {t.drafts.emptyCta}
              </Button>
              <Button variant="outline" onClick={handleGenerateDraft} disabled={isGenerating}>
                {isGenerating ? <Spinner className="mr-2" /> : <Sparkles className="mr-2 size-4" />}
                {isGenerating ? t.drafts.generatingAi : t.drafts.generateAi}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {t.drafts.status[draft.status]}
                  </Badge>
                  <Badge variant={draft.source === "automation" ? "default" : "secondary"} className="text-xs">
                    {t.drafts.source[draft.source]}
                  </Badge>
                  {draft.scheduledFor ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(draft.scheduledFor).toLocaleString()}
                    </span>
                  ) : null}
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
                      {t.drafts.actions.edit}
                    </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => markDraftStatus(draft.id, "scheduled")}>
                    <Calendar className="mr-2 size-4" />
                    {t.drafts.actions.schedule}
                  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePublishDraft(draft.id)} disabled={publishingDraftId === draft.id}>
                      <Sparkles className="mr-2 size-4" />
                      {t.drafts.actions.postNow}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t.drafts.actions.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-5 text-sm leading-relaxed">{draft.content}</p>
                {draft.externalPostUrl ? (
                  <a
                    href={draft.externalPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <ExternalLink className="size-4" />
                    {draft.externalPostUrl}
                  </a>
                ) : null}
              </CardContent>
              <div className="flex items-center justify-between border-t px-6 py-3 text-xs text-muted-foreground">
                <span>
                  {draft.characterCount} {t.drafts.characters}
                </span>
                <span>
                  {draft.publishedAt
                    ? `${t.drafts.status.published} ${new Date(draft.publishedAt).toLocaleDateString()}`
                    : `${t.drafts.updated} ${new Date(draft.updatedAt).toLocaleDateString()}`}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
