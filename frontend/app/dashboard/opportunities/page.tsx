"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Radar, RefreshCw, Settings, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useLanguage } from "@/lib/language-context"

type OpportunitiesPayload = {
  opportunities?: Array<{
    topic: string
    score: number
    sourceKind: string
    articleTitle: string
    articleLink: string
    articleSnippet: string
    articlePublishedAt?: string | null
    trendLink?: string
  }>
  workspace?: {
    xConnectionStatus?: string
    automation?: {
      enabled?: boolean
      mode?: "draft_only" | "auto_post"
      source?: string
      topics?: string[]
    }
  }
}

export default function OpportunitiesPage() {
  const { t } = useLanguage()
  const [payload, setPayload] = useState<OpportunitiesPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function loadData() {
    const response = await fetch("/api/opportunities", { cache: "no-store" })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || "Failed to load opportunities.")
    }

    setPayload(data)
  }

  useEffect(() => {
    let isMounted = true

    async function run() {
      try {
        await loadData()
      } catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : "Failed to load opportunities.")
        }
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

  async function handleRefresh() {
    setIsRefreshing(true)
    setStatusMessage("")
    try {
      await loadData()
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load opportunities.")
    } finally {
      setIsRefreshing(false)
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

  const connectionStatus =
    payload?.workspace?.xConnectionStatus === "connected" ? t.settings.connected : t.settings.notConnected
  const automationMode =
    payload?.workspace?.automation?.mode === "auto_post" ? t.settings.automationAutoPost : t.settings.automationDraftOnly
  const topics = payload?.workspace?.automation?.topics || []
  const opportunities = payload?.opportunities || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.opportunities.title}</h2>
          <p className="text-muted-foreground">{t.opportunities.subtitle}</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Spinner className="mr-2" /> : <RefreshCw className="mr-2 size-4" />}
          {isRefreshing ? t.opportunities.refreshing : t.opportunities.refresh}
        </Button>
      </div>

      {statusMessage ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="size-5" />
            {t.opportunities.engineTitle}
          </CardTitle>
          <CardDescription>{t.opportunities.engineDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">{t.settings.connectionStatus}</p>
              <p className="mt-1 text-sm text-muted-foreground">{connectionStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t.settings.automationMode}</p>
              <p className="mt-1 text-sm text-muted-foreground">{automationMode}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{t.opportunities.priorityTopics}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topics.length ? (
                topics.map((topic) => (
                  <Badge key={topic} variant="secondary">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{t.common.noData}</span>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 size-4" />
              {t.dashboard.openSettings}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Zap className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.opportunities.emptyTitle}</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.opportunities.emptyDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard/settings">{t.dashboard.openSettings}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.opportunities.topSignals}</CardTitle>
            <CardDescription>{t.opportunities.realSignalsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            {opportunities.map((opportunity) => (
              <div key={`${opportunity.topic}-${opportunity.articleLink}`} className="rounded-xl border p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{opportunity.topic}</Badge>
                  <Badge variant="outline">
                    {t.opportunities.score}: {opportunity.score}
                  </Badge>
                  <Badge variant="secondary">
                    {opportunity.sourceKind === "news" ? t.opportunities.sourceNews : t.opportunities.sourceFallback}
                  </Badge>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-tight">{opportunity.articleTitle}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{opportunity.articleSnippet}</p>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>
                    {t.opportunities.published}:{" "}
                    {opportunity.articlePublishedAt
                      ? new Date(opportunity.articlePublishedAt).toLocaleString()
                      : t.common.noData}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {opportunity.articleLink ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={opportunity.articleLink} target="_blank" rel="noreferrer">
                        {t.opportunities.openSource}
                        <ArrowUpRight className="ml-2 size-4" />
                      </a>
                    </Button>
                  ) : null}
                  {opportunity.trendLink ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={opportunity.trendLink} target="_blank" rel="noreferrer">
                        {t.opportunities.openTrend}
                        <ArrowUpRight className="ml-2 size-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
