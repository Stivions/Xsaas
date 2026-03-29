"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, CreditCard, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useLanguage } from "@/lib/language-context"
import { getPlanUi, type PlanKey } from "@/lib/plan-ui"

type BillingPayload = {
  currentPlan?: string
  paypal?: {
    webhookConfigured?: boolean
  }
  plans?: Array<{
    id: PlanKey
    price: number
    providerPlanId?: string
    current?: boolean
  }>
  usage?: {
    opportunityAlerts?: { used: number; limit: number | null }
    connectedAccounts?: { used: number; limit: number | null }
  }
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const { language, t } = useLanguage()
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  async function loadBilling() {
    const response = await fetch("/api/billing/config", { cache: "no-store" })
    if (!response.ok) {
      return
    }

    const data = await response.json()
    setBilling(data)
  }

  useEffect(() => {
    let isMounted = true

    async function run() {
      try {
        await loadBilling()
      } finally {
        if (isMounted) {
          setIsLoadingPage(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const state = searchParams.get("paypal")
    const subscriptionId =
      searchParams.get("subscription_id") ||
      (typeof window !== "undefined" ? window.localStorage.getItem("xsaas_pending_subscription_id") : "")

    if (state === "cancel") {
      setStatusMessage(t.billing.cancelled)
      return
    }

    if (state !== "success" || !subscriptionId) {
      return
    }

    let isMounted = true

    async function syncSubscription() {
      setStatusMessage(t.billing.success)
      const response = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      })
      const data = await response.json()

      if (!isMounted) {
        return
      }

      if (!response.ok) {
        setStatusMessage(data.error || t.billing.syncError)
        return
      }

      await loadBilling()
      window.localStorage.removeItem("xsaas_pending_subscription_id")
      setStatusMessage(`${t.billing.success} ${data.paypalStatus || ""}`.trim())
    }

    void syncSubscription()

    return () => {
      isMounted = false
    }
  }, [searchParams, t.billing.cancelled, t.billing.success, t.billing.syncError])

  const handleUpgrade = async (planId: PlanKey, providerPlanId?: string) => {
    setIsUpgrading(planId)
    setStatusMessage("")

    if (!providerPlanId) {
      setStatusMessage(t.billing.checkoutNotReady)
      setIsUpgrading(null)
      return
    }

    try {
      const response = await fetch("/api/billing/checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.billing.checkoutError)
      }

      if (data.url) {
        window.localStorage.setItem("xsaas_pending_subscription_id", data.providerSubscriptionId || "")
        setStatusMessage(t.billing.redirecting)
        window.location.href = data.url
        return
      }

      setStatusMessage(t.billing.checkoutNotReady)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t.billing.checkoutError)
    } finally {
      setIsUpgrading(null)
    }
  }

  const plans = useMemo(() => {
    const backendPlans = billing?.plans || []
    return backendPlans.map((plan) => {
      const ui = getPlanUi(language, plan.id)
      return {
        id: plan.id,
        name: ui.name,
        description: ui.description,
        features: ui.features,
        priceLabel: plan.price === 0 ? (language === "es" ? "Gratis" : "Free") : `$${plan.price}`,
        period: plan.price === 0 ? "" : language === "es" ? "/mes" : "/month",
        current: Boolean(plan.current),
        recommended: plan.id === "pro",
        providerPlanId: plan.providerPlanId,
        cta: plan.id === "agency" ? t.billing.contactSales : t.billing.upgrade,
      }
    })
  }, [billing?.plans, language, t.billing.contactSales, t.billing.upgrade])

  if (isLoadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          {t.billing.loading}
        </div>
      </div>
    )
  }

  const currentPlan = ((billing?.currentPlan || "starter") as PlanKey)
  const currentPlanLabel = getPlanUi(language, currentPlan).name
  const alertsUsed = billing?.usage?.opportunityAlerts?.used ?? 0
  const alertsLimit = billing?.usage?.opportunityAlerts?.limit
  const accountUsed = billing?.usage?.connectedAccounts?.used ?? 0
  const accountLimit = billing?.usage?.connectedAccounts?.limit

  return (
    <div className="space-y-8">
      {statusMessage ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{t.billing.currentPlan}</CardTitle>
              <CardDescription>
                {t.billing.currentPlanDescription} {currentPlanLabel}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm">
                {currentPlanLabel}
              </Badge>
              <Badge variant={billing?.paypal?.webhookConfigured ? "default" : "secondary"}>
                {t.billing.webhookState}:{" "}
                {billing?.paypal?.webhookConfigured ? t.billing.webhookReady : t.billing.webhookMissing}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-3xl font-bold">{plans.find((plan) => plan.current)?.priceLabel || "Free"}</p>
              <p className="text-sm text-muted-foreground">{t.billing.membershipBilling}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="#plans">{t.billing.viewAllPlans}</a>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.billing.alertsUsedToday}</span>
              <span className="font-medium">
                {alertsLimit === null ? `${alertsUsed}` : `${alertsUsed} / ${alertsLimit}`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${alertsLimit ? Math.min(100, Math.round((alertsUsed / alertsLimit) * 100)) : 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t.billing.resetNote}</p>
          </div>
        </CardFooter>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Zap className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold">{t.billing.unlockTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.billing.unlockDescription}</p>
            </div>
          </div>
          <Button
            onClick={() => handleUpgrade("pro", plans.find((plan) => plan.id === "pro")?.providerPlanId)}
            disabled={isUpgrading === "pro"}
          >
            {isUpgrading === "pro" ? <Spinner className="mr-2" /> : null}
            {t.billing.upgradeToPro}
          </Button>
        </CardContent>
      </Card>

      <div id="plans">
        <h2 className="mb-6 text-xl font-semibold">{t.billing.allPlans}</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.recommended ? "border-primary" : ""}>
              {plan.recommended ? (
                <div className="flex justify-center">
                  <Badge className="-mt-3">{t.billing.mostPopular}</Badge>
                </div>
              ) : null}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.current ? <Badge variant="secondary">{t.billing.current}</Badge> : null}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.current ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t.billing.currentPlanButton}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.id, plan.providerPlanId)}
                    disabled={isUpgrading === plan.id}
                  >
                    {isUpgrading === plan.id ? <Spinner className="mr-2" /> : null}
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.billing.paymentMethod}</CardTitle>
          <CardDescription>{t.billing.paymentMethodDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="font-medium">{t.billing.paymentProvider}</p>
                <p className="text-sm text-muted-foreground">{t.billing.paymentProviderDescription}</p>
              </div>
            </div>
            <Badge variant="outline">
              {accountLimit === null ? `${accountUsed}` : `${accountUsed}/${accountLimit}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.billing.noInvoicesTitle}</CardTitle>
          <CardDescription>{t.billing.noInvoicesDescription}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
