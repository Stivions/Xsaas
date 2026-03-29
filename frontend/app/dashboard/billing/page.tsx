"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Check, CreditCard, Download, Zap } from "lucide-react"

const invoices = [
  { id: "INV-001", date: "Mar 1, 2026", amount: "$0.00", status: "Paid" },
  { id: "INV-002", date: "Feb 1, 2026", amount: "$0.00", status: "Paid" },
  { id: "INV-003", date: "Jan 1, 2026", amount: "$0.00", status: "Paid" },
]

type BillingPayload = {
  currentPlan?: string
  plans?: Array<{
    id: string
    name: string
    price: number
    features: string[]
    current?: boolean
  }>
  usage?: {
    opportunityAlerts?: { used: number; limit: number | null }
    connectedAccounts?: { used: number; limit: number | null }
  }
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingPayload | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadBilling() {
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
          setIsLoadingPage(false)
        }
      }
    }

    void loadBilling()

    return () => {
      isMounted = false
    }
  }, [])

  const handleUpgrade = async (planName: string) => {
    setIsUpgrading(planName)
    setStatusMessage("")

    try {
      const response = await fetch("/api/billing/checkout-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName.toLowerCase() }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout flow")
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setStatusMessage(
        data.nextStep || "PayPal checkout is not wired yet. The backend is ready for the next integration step."
      )
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to create checkout flow")
    } finally {
      setIsUpgrading(null)
    }
  }

  const plans = useMemo(
    () =>
      (billing?.plans || []).map((plan) => ({
        name: plan.name,
        description:
          plan.id === "starter"
            ? "For creators just getting started"
            : plan.id === "pro"
              ? "For serious creators and solopreneurs"
              : "For teams and agencies",
        price: plan.price === 0 ? "Free" : `$${plan.price}`,
        period: plan.price === 0 ? "" : "/month",
        features: plan.features,
        current: Boolean(plan.current),
        recommended: plan.id === "pro",
      })),
    [billing]
  )

  if (isLoadingPage) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          Loading billing...
        </div>
      </div>
    )
  }

  const currentPlanLabel = billing?.currentPlan
    ? billing.currentPlan.charAt(0).toUpperCase() + billing.currentPlan.slice(1)
    : "Starter"
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>{`You're currently on the ${currentPlanLabel} plan`}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {currentPlanLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-3xl font-bold">{plans.find((plan) => plan.current)?.price || "Free"}</p>
              <p className="text-sm text-muted-foreground">Membership billing</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="#plans">View all plans</a>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Opportunity alerts used today</span>
              <span className="font-medium">
                {alertsLimit ? `${alertsUsed} / ${alertsLimit}` : `${alertsUsed} / unlimited`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${alertsLimit ? Math.min(100, Math.round((alertsUsed / alertsLimit) * 100)) : 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Resets daily at midnight UTC</p>
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
              <h3 className="font-semibold">Unlock unlimited opportunities</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro and remove the daily ceiling on opportunity discovery.
              </p>
            </div>
          </div>
          <Button onClick={() => handleUpgrade("Pro")} disabled={isUpgrading === "Pro"}>
            {isUpgrading === "Pro" ? <Spinner className="mr-2" /> : null}
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>

      <div id="plans">
        <h2 className="mb-6 text-xl font-semibold">All Plans</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.recommended ? "border-primary" : ""}>
              {plan.recommended && (
                <div className="flex justify-center">
                  <Badge className="-mt-3">Most popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.current && <Badge variant="secondary">Current</Badge>}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
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
                    Current plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isUpgrading === plan.name}
                  >
                    {isUpgrading === plan.name ? <Spinner className="mr-2" /> : null}
                    {plan.name === "Agency" ? "Contact sales" : "Upgrade"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your billing setup and upgrade path</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="font-medium">PayPal subscriptions</p>
                <p className="text-sm text-muted-foreground">Billing is wired for PayPal plan upgrades</p>
              </div>
            </div>
            <Badge variant="outline">
              {accountLimit ? `${accountUsed}/${accountLimit} accounts` : `${accountUsed} accounts`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice, index) => (
              <div key={invoice.id}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{invoice.amount}</p>
                      <Badge variant="secondary" className="text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="size-4" />
                      <span className="sr-only">Download invoice</span>
                    </Button>
                  </div>
                </div>
                {index < invoices.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
