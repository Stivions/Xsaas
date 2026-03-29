"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"
import { getPlanUi, type PlanKey } from "@/lib/plan-ui"

type WorkspacePayload = {
  workspace?: {
    id: string
    name: string
    slug: string
    plan: string
    status: string
    xConnectionStatus: string
    automation: {
      enabled: boolean
      language: "en" | "es"
      tone: "sharp" | "analytical" | "friendly"
      topics: string[]
      brandVoice: string
      audience: string
      cadenceMinutes: number
      mode: "draft_only"
      lastRunAt?: string | null
      lastStatus?: string
      lastError?: string
      lastDraftId?: string
    }
  }
}

type BillingPayload = {
  currentPlan?: string
  usage?: {
    connectedAccounts?: { used: number; limit: number | null }
  }
}

type AutomationStatusPayload = {
  automation?: {
    lastRunAt?: string | null
    lastStatus?: string
    lastError?: string
    lastDraft?: {
      content?: string
    } | null
  }
}

type AutomationForm = {
  enabled: boolean
  language: "en" | "es"
  tone: "sharp" | "analytical" | "friendly"
  topics: string
  brandVoice: string
  audience: string
  cadenceMinutes: number
  mode: "draft_only"
}

const defaultForm: AutomationForm = {
  enabled: false,
  language: "es",
  tone: "sharp",
  topics: "",
  brandVoice: "",
  audience: "",
  cadenceMinutes: 180,
  mode: "draft_only",
}

export default function SettingsPage() {
  const { language, t } = useLanguage()
  const [workspaceData, setWorkspaceData] = useState<WorkspacePayload | null>(null)
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [automationStatus, setAutomationStatus] = useState<AutomationStatusPayload | null>(null)
  const [form, setForm] = useState<AutomationForm>(defaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function loadData() {
    const [workspaceResponse, billingResponse, automationResponse] = await Promise.all([
      fetch("/api/workspace", { cache: "no-store" }),
      fetch("/api/billing/config", { cache: "no-store" }),
      fetch("/api/automation/status", { cache: "no-store" }),
    ])

    if (workspaceResponse.ok) {
      const workspacePayload = await workspaceResponse.json()
      setWorkspaceData(workspacePayload)
      const automation = workspacePayload.workspace?.automation
      if (automation) {
        setForm({
          enabled: Boolean(automation.enabled),
          language: automation.language || "es",
          tone: automation.tone || "sharp",
          topics: Array.isArray(automation.topics) ? automation.topics.join(", ") : "",
          brandVoice: automation.brandVoice || "",
          audience: automation.audience || "",
          cadenceMinutes: automation.cadenceMinutes || 180,
          mode: automation.mode || "draft_only",
        })
      }
    }

    if (billingResponse.ok) {
      setBilling(await billingResponse.json())
    }

    if (automationResponse.ok) {
      setAutomationStatus(await automationResponse.json())
    }
  }

  useEffect(() => {
    let isMounted = true

    async function run() {
      try {
        await loadData()
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation: {
            ...form,
            topics: form.topics,
          },
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to save automation.")
      }

      setWorkspaceData({ workspace: data.workspace })
      setStatusMessage(t.settings.automationSaved)
      await loadData()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t.settings.automationErrorState)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRunNow() {
    setIsRunning(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/automation/run", {
        method: "POST",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to run automation.")
      }
      await loadData()
      setStatusMessage(t.settings.automationSaved)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t.settings.automationErrorState)
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          {t.common.loading}
        </div>
      </div>
    )
  }

  const currentWorkspace = workspaceData?.workspace
  const xStatus = currentWorkspace?.xConnectionStatus === "connected" ? t.settings.connected : t.settings.notConnected
  const accountUsage = billing?.usage?.connectedAccounts
  const currentPlanLabel = getPlanUi(language, ((billing?.currentPlan || "starter") as PlanKey)).name
  const automationState = automationStatus?.automation?.lastStatus || currentWorkspace?.automation?.lastStatus || "idle"
  const automationStateLabel =
    automationState === "success"
      ? t.settings.automationSuccess
      : automationState === "running"
        ? t.settings.automationRunning
        : automationState === "error"
          ? t.settings.automationErrorState
          : t.settings.automationIdle

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.settings.title}</h2>
        <p className="text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      {statusMessage ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.workspaceTitle}</CardTitle>
          <CardDescription>{t.settings.workspaceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium">{t.settings.workspaceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentWorkspace?.name || t.common.noData}</p>
          </div>
          <div>
            <p className="text-sm font-medium">{t.settings.workspaceSlug}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentWorkspace?.slug || t.common.noData}</p>
          </div>
          <div>
            <p className="text-sm font-medium">{t.settings.currentPlan}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentPlanLabel || t.common.noData}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.connectionTitle}</CardTitle>
          <CardDescription>{t.settings.connectionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">{t.settings.connectionStatus}</p>
            <div className="mt-2">
              <Badge variant={xStatus === t.settings.connected ? "default" : "secondary"}>{xStatus}</Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{t.settings.accountsTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.settings.accountsDescription}</p>
            <p className="mt-2 text-sm font-medium">
              {accountUsage?.limit === null
                ? `${accountUsage?.used ?? 0}`
                : `${accountUsage?.used ?? 0} / ${accountUsage?.limit ?? 0}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.automationTitle}</CardTitle>
          <CardDescription>{t.settings.automationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={automationState === "success" ? "default" : automationState === "error" ? "destructive" : "secondary"}>
                  {automationStateLabel}
                </Badge>
                <Badge variant="outline">{currentWorkspace?.automation?.mode === "draft_only" ? t.settings.automationDraftOnly : currentWorkspace?.automation?.mode}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.settings.automationLastRun}:{" "}
                {automationStatus?.automation?.lastRunAt
                  ? new Date(automationStatus.automation.lastRunAt).toLocaleString()
                  : t.common.noData}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={handleRunNow} disabled={isRunning}>
                {isRunning ? <Spinner className="mr-2" /> : null}
                {isRunning ? t.settings.automationRunning : t.settings.automationRunNow}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2" /> : null}
                {isSaving ? t.settings.automationSaving : t.settings.automationSave}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="automation-enabled">{t.settings.automationEnabled}</Label>
                </div>
                <Switch
                  id="automation-enabled"
                  checked={form.enabled}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.settings.automationLanguage}</Label>
                <Select value={form.language} onValueChange={(value: "en" | "es") => setForm((current) => ({ ...current, language: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Espanol</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.settings.automationTone}</Label>
                <Select
                  value={form.tone}
                  onValueChange={(value: "sharp" | "analytical" | "friendly") => setForm((current) => ({ ...current, tone: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharp">{t.settings.toneOptions.sharp}</SelectItem>
                    <SelectItem value="analytical">{t.settings.toneOptions.analytical}</SelectItem>
                    <SelectItem value="friendly">{t.settings.toneOptions.friendly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-audience">{t.settings.automationAudience}</Label>
                <Input
                  id="automation-audience"
                  value={form.audience}
                  onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-cadence">{t.settings.automationCadence}</Label>
                <Input
                  id="automation-cadence"
                  type="number"
                  min={15}
                  value={form.cadenceMinutes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cadenceMinutes: Number(event.target.value) || 180 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="automation-topics">{t.settings.automationTopics}</Label>
                <Textarea
                  id="automation-topics"
                  value={form.topics}
                  onChange={(event) => setForm((current) => ({ ...current, topics: event.target.value }))}
                  className="min-h-28"
                />
                <p className="text-xs text-muted-foreground">{t.settings.automationTopicsHelp}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-brand-voice">{t.settings.automationBrandVoice}</Label>
                <Textarea
                  id="automation-brand-voice"
                  value={form.brandVoice}
                  onChange={(event) => setForm((current) => ({ ...current, brandVoice: event.target.value }))}
                  className="min-h-28"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.settings.automationMode}</Label>
                <Select value={form.mode} onValueChange={(value: "draft_only") => setForm((current) => ({ ...current, mode: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft_only">{t.settings.automationDraftOnly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{t.settings.automationLastDraft}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {automationStatus?.automation?.lastDraft?.content || t.common.noData}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.localOnlyTitle}</CardTitle>
          <CardDescription>{t.settings.localOnlyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <ThemeToggle variant="outline" />
          <LanguageToggle variant="outline" />
          <Badge variant="secondary">{language.toUpperCase()}</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
