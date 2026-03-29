"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CreditCard, Layers, Sparkles, Users, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useLanguage } from "@/lib/language-context"
import { getPlanUi, type PlanKey } from "@/lib/plan-ui"

type SessionPayload = {
  user?: {
    fullName?: string
    email?: string
  }
}

type BillingPayload = {
  currentPlan?: string
  usage?: {
    opportunityAlerts?: { used: number; limit: number | null }
    connectedAccounts?: { used: number; limit: number | null }
  }
}

type WorkspacePayload = {
  workspace?: {
    automation?: {
      enabled?: boolean
      lastRunAt?: string | null
      lastStatus?: string
      lastError?: string
    }
  }
}

export default function DashboardPage() {
  const { language, t } = useLanguage()
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [workspaceData, setWorkspaceData] = useState<WorkspacePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [sessionResponse, billingResponse, workspaceResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/billing/config", { cache: "no-store" }),
          fetch("/api/workspace", { cache: "no-store" }),
        ])

        if (sessionResponse.ok && isMounted) {
          setSession(await sessionResponse.json())
        }

        if (billingResponse.ok && isMounted) {
          setBilling(await billingResponse.json())
        }

        if (workspaceResponse.ok && isMounted) {
          setWorkspaceData(await workspaceResponse.json())
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const currentPlan = ((billing?.currentPlan || "starter") as PlanKey)
  const currentPlanUi = getPlanUi(language, currentPlan)
  const alertUsed = billing?.usage?.opportunityAlerts?.used ?? 0
  const alertLimit = billing?.usage?.opportunityAlerts?.limit
  const remainingAlerts = alertLimit == null ? t.dashboard.unlimited : Math.max(alertLimit - alertUsed, 0)
  const accountUsed = billing?.usage?.connectedAccounts?.used ?? 0
  const accountLimit = billing?.usage?.connectedAccounts?.limit
  const automation = workspaceData?.workspace?.automation
  const automationValue = automation?.enabled
    ? automation?.lastStatus === "running"
      ? t.dashboard.automationRunning
      : automation?.lastStatus === "error"
        ? t.dashboard.automationError
        : t.dashboard.automationReady
    : t.dashboard.automationDisabled

  const metrics = useMemo(
    () => [
      {
        title: t.dashboard.planCard,
        value: currentPlanUi.name,
        description: t.dashboard.currentPlanTitle,
        icon: CreditCard,
        href: "/dashboard/billing",
        actionLabel: t.dashboard.openBilling,
      },
      {
        title: t.dashboard.alertsUsed,
        value: alertLimit === null ? String(alertUsed) : `${alertUsed}/${alertLimit}`,
        description: t.billing.alertsUsedToday,
        icon: Zap,
        href: "/dashboard/billing",
        actionLabel: t.dashboard.openBilling,
      },
      {
        title: t.dashboard.connectedAccounts,
        value: accountLimit === null ? String(accountUsed) : `${accountUsed}/${accountLimit}`,
        description: accountLimit === null ? t.dashboard.unlimited : t.dashboard.connectedAccounts,
        icon: Users,
        href: "/dashboard/settings",
        actionLabel: t.dashboard.openSettings,
      },
      {
        title: t.dashboard.automationStatus,
        value: automationValue,
        description: automation?.lastRunAt
          ? `${t.dashboard.lastRun}: ${new Date(automation.lastRunAt).toLocaleString()}`
          : t.dashboard.lastRun,
        icon: Sparkles,
        href: "/dashboard/settings",
        actionLabel: t.dashboard.openSettings,
      },
    ],
    [accountLimit, accountUsed, alertLimit, alertUsed, automation?.lastRunAt, automationValue, currentPlanUi.name, t]
  )

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

  const displayName = session?.user?.fullName || session?.user?.email || "there"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t.dashboard.pageTitles.dashboard}, {displayName}
        </h2>
        <p className="text-muted-foreground">{t.dashboard.overview}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              <div className="mt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={metric.href}>
                    {metric.actionLabel}
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.dashboard.activityTitle}</CardTitle>
                <CardDescription>{t.dashboard.activityDescription}</CardDescription>
              </div>
              <Badge variant="secondary">{currentPlanUi.name}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-dashed p-8 text-center">
              <h3 className="text-lg font-semibold">{t.dashboard.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t.dashboard.emptyDescription}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard/settings">{t.dashboard.openSettings}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/drafts">{t.dashboard.goToDrafts}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.alertsRemaining}</CardTitle>
            <CardDescription>{alertLimit === null ? t.dashboard.unlimited : t.dashboard.alertsRemaining}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">{remainingAlerts}</div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">{t.dashboard.automationStatus}</p>
              <p className="mt-2 text-sm text-muted-foreground">{automationValue}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">{t.dashboard.lastRun}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {automation?.lastRunAt ? new Date(automation.lastRunAt).toLocaleString() : t.common.noData}
              </p>
            </div>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/billing">{t.dashboard.openBilling}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
