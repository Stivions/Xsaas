"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
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
      mode: "draft_only" | "auto_post"
      source: "trends_news"
      lastRunAt?: string | null
      lastStatus?: string
      lastError?: string
      lastDraftId?: string
      lastPublishedPostUrl?: string
      lastPublishedAt?: string | null
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
    lastPublishedPostUrl?: string
    lastPublishedAt?: string | null
    lastDraft?: {
      content?: string
      externalPostUrl?: string
    } | null
  }
}

type XStatusPayload = {
  providerReady?: boolean
  redirectUri?: string
  scopes?: string[]
  account?: {
    username?: string
    displayName?: string
    scopes?: string[]
    lastError?: string
  } | null
}

type AutomationForm = {
  enabled: boolean
  language: "en" | "es"
  tone: "sharp" | "analytical" | "friendly"
  topics: string
  brandVoice: string
  audience: string
  cadenceMinutes: number
  mode: "draft_only" | "auto_post"
  source: "trends_news"
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
  source: "trends_news",
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const { language, t } = useLanguage()
  const [workspaceData, setWorkspaceData] = useState<WorkspacePayload | null>(null)
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [automationStatus, setAutomationStatus] = useState<AutomationStatusPayload | null>(null)
  const [xStatus, setXStatus] = useState<XStatusPayload | null>(null)
  const [form, setForm] = useState<AutomationForm>(defaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isConnectingX, setIsConnectingX] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function loadData() {
    const [workspaceResponse, billingResponse, automationResponse, xStatusResponse] = await Promise.all([
      fetch("/api/workspace", { cache: "no-store" }),
      fetch("/api/billing/config", { cache: "no-store" }),
      fetch("/api/automation/status", { cache: "no-store" }),
      fetch("/api/x/status", { cache: "no-store" }),
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
          source: automation.source || "trends_news",
        })
      }
    }

    if (billingResponse.ok) {
      setBilling(await billingResponse.json())
    }

    if (automationResponse.ok) {
      setAutomationStatus(await automationResponse.json())
    }

    if (xStatusResponse.ok) {
      setXStatus(await xStatusResponse.json())
    }
  }

  useEffect(() => {
    const xState = searchParams.get("x")
    if (xState === "connected") {
      setStatusMessage(t.settings.xCallbackConnected)
    } else if (xState === "error" || xState === "oauth_error") {
      setStatusMessage(t.settings.xCallbackError)
    } else if (xState === "state_mismatch" || xState === "invalid_state" || xState === "invalid_callback") {
      setStatusMessage(t.settings.xStateError)
    } else if (xState === "missing_client") {
      setStatusMessage(t.settings.xClientMissing)
    }
  }, [
    searchParams,
    t.settings.xCallbackConnected,
    t.settings.xCallbackError,
    t.settings.xStateError,
    t.settings.xClientMissing,
  ])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return
      }

      const payload = event.data
      if (!payload || payload.type !== "xsaas-x-connect") {
        return
      }

      setIsConnectingX(false)

      if (payload.status === "connected") {
        setStatusMessage(t.settings.xCallbackConnected)
        void loadData()
        return
      }

      if (payload.status === "missing_client") {
        setStatusMessage(t.settings.xClientMissing)
        return
      }

      if (payload.status === "invalid_state" || payload.status === "state_mismatch") {
        setStatusMessage(t.settings.xStateError)
        return
      }

      setStatusMessage(t.settings.xCallbackError)
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [
    t.settings.xCallbackConnected,
    t.settings.xCallbackError,
    t.settings.xClientMissing,
    t.settings.xStateError,
  ])

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

  async function handleDisconnectX() {
    setIsDisconnecting(true)
    setStatusMessage("")
    try {
      const response = await fetch("/api/x/disconnect", {
        method: "POST",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect X account.")
      }
      await loadData()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t.settings.xCallbackError)
    } finally {
      setIsDisconnecting(false)
    }
  }

  function handleConnectX() {
    setStatusMessage("")

    const width = 560
    const height = 760
    const left = Math.max(window.screenX + (window.outerWidth - width) / 2, 0)
    const top = Math.max(window.screenY + (window.outerHeight - height) / 2, 0)
    const popup = window.open(
      "/api/x/connect/start?popup=1",
      "xsaas-x-connect",
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      setStatusMessage(t.settings.xPopupBlocked)
      return
    }

    setIsConnectingX(true)
    popup.focus()

    const watcher = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(watcher)
        setIsConnectingX(false)
      }
    }, 500)
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
  const xStatusLabel = xStatus?.account ? t.settings.connected : t.settings.notConnected
  const accountUsage = billing?.usage?.connectedAccounts
  const currentPlanLabel = getPlanUi(language, ((billing?.currentPlan || "starter") as PlanKey)).name
  const isPaidPlan = (billing?.currentPlan || "starter") !== "starter"
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
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">{t.settings.connectionStatus}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={xStatusLabel === t.settings.connected ? "default" : "secondary"}>{xStatusLabel}</Badge>
                <Badge variant={xStatus?.providerReady ? "outline" : "secondary"}>
                  {xStatus?.providerReady ? t.settings.xReady : t.settings.xMissing}
                </Badge>
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
          </div>

          <div className="rounded-lg border p-4">
            {xStatus?.account ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t.settings.xConnectedAs}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {xStatus.account.displayName || xStatus.account.username} @{xStatus.account.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t.settings.xScopes}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(xStatus.account.scopes || []).map((scope) => (
                      <Badge key={scope} variant="outline">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                {xStatus.account.lastError ? (
                  <p className="text-sm text-destructive">{xStatus.account.lastError}</p>
                ) : null}
                <Button variant="outline" onClick={handleDisconnectX} disabled={isDisconnecting}>
                  {isDisconnecting ? <Spinner className="mr-2" /> : null}
                  {t.settings.disconnectX}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{t.settings.xNoAccount}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.settings.xWindowHelp}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isPaidPlan ? t.settings.xPremiumSession : t.settings.xStarterSession}
                  </p>
                </div>
                <Button type="button" onClick={handleConnectX} disabled={!xStatus?.providerReady || isConnectingX}>
                  {isConnectingX ? <Spinner className="mr-2" /> : null}
                  {t.settings.connectX}
                </Button>
              </div>
            )}
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
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={automationState === "success" ? "default" : automationState === "error" ? "destructive" : "secondary"}>
                  {automationStateLabel}
                </Badge>
                <Badge variant="outline">
                  {currentWorkspace?.automation?.mode === "auto_post" ? t.settings.automationAutoPost : t.settings.automationDraftOnly}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.settings.automationLastRun}:{" "}
                {automationStatus?.automation?.lastRunAt
                  ? new Date(automationStatus.automation.lastRunAt).toLocaleString()
                  : t.common.noData}
              </p>
              {automationStatus?.automation?.lastPublishedPostUrl ? (
                <a
                  href={automationStatus.automation.lastPublishedPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {automationStatus.automation.lastPublishedPostUrl}
                </a>
              ) : null}
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
                <Select
                  value={form.mode}
                  onValueChange={(value: "draft_only" | "auto_post") => setForm((current) => ({ ...current, mode: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft_only">{t.settings.automationDraftOnly}</SelectItem>
                    <SelectItem value="auto_post">{t.settings.automationAutoPost}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.settings.automationSource}</Label>
                <Select
                  value={form.source}
                  onValueChange={(value: "trends_news") => setForm((current) => ({ ...current, source: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trends_news">{t.settings.automationTrendsNews}</SelectItem>
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
            {automationStatus?.automation?.lastDraft?.externalPostUrl ? (
              <a
                href={automationStatus.automation.lastDraft.externalPostUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
              >
                {automationStatus.automation.lastDraft.externalPostUrl}
              </a>
            ) : null}
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
