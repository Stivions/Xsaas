"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Radar, Settings, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useLanguage } from "@/lib/language-context"

type BillingPayload = {
  workspace?: {
    xConnectionStatus?: string
  }
}

export default function OpportunitiesPage() {
  const { t } = useLanguage()
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const response = await fetch("/api/billing/config", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (isMounted) {
          setBilling(data)
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

  const connectionStatus = billing?.workspace?.xConnectionStatus === "connected" ? t.settings.connected : t.settings.notConnected

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.opportunities.title}</h2>
        <p className="text-muted-foreground">{t.opportunities.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="size-5" />
            {t.opportunities.engineTitle}
          </CardTitle>
          <CardDescription>{t.opportunities.engineDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t.settings.connectionStatus}</p>
            <p className="text-sm text-muted-foreground">{connectionStatus}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 size-4" />
              {t.dashboard.openSettings}
            </Link>
          </Button>
        </CardContent>
      </Card>

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
            <Button variant="outline" asChild>
              <Link href="/dashboard/billing">
                {t.dashboard.openBilling}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
