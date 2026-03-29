"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Zap, Quote, Reply, FileText, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"

const stats = [
  {
    title: "Post Opportunities",
    value: "12",
    description: "New topics trending in your niche",
    icon: Zap,
    href: "/dashboard/opportunities?type=post",
    trend: "+3 today",
  },
  {
    title: "Quote Opportunities",
    value: "8",
    description: "High-engagement posts to quote",
    icon: Quote,
    href: "/dashboard/opportunities?type=quote",
    trend: "+2 today",
  },
  {
    title: "Reply Opportunities",
    value: "24",
    description: "Conversations to join",
    icon: Reply,
    href: "/dashboard/opportunities?type=reply",
    trend: "+7 today",
  },
  {
    title: "Drafts",
    value: "5",
    description: "Posts in your workspace",
    icon: FileText,
    href: "/dashboard/drafts",
    trend: "2 scheduled",
  },
]

const recentOpportunities = [
  {
    type: "quote",
    author: "@productdesigner",
    content: "The best products are built by teams who understand that design is not just how it looks...",
    engagement: "2.4k likes",
    time: "2h ago",
  },
  {
    type: "reply",
    author: "@startupfounder",
    content: "What tools are you using to track your audience growth in 2026?",
    engagement: "156 replies",
    time: "4h ago",
  },
  {
    type: "post",
    author: "Trending topic",
    content: "#CreatorEconomy is trending with discussions about monetization strategies",
    engagement: "15k posts",
    time: "1h ago",
  },
]

export default function DashboardPage() {
  const [session, setSession] = useState<{ user?: { fullName?: string; email?: string } } | null>(null)
  const [billing, setBilling] = useState<{
    currentPlan?: string
    usage?: {
      opportunityAlerts?: { used: number; limit: number | null }
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [sessionResponse, billingResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/billing/config", { cache: "no-store" }),
        ])

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          if (isMounted) {
            setSession(sessionData)
          }
        }

        if (billingResponse.ok) {
          const billingData = await billingResponse.json()
          if (isMounted) {
            setBilling(billingData)
          }
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
          Loading dashboard...
        </div>
      </div>
    )
  }

  const displayName = session?.user?.fullName || session?.user?.email || "there"
  const currentPlan = billing?.currentPlan || "starter"
  const alertUsed = billing?.usage?.opportunityAlerts?.used ?? 0
  const alertLimit = billing?.usage?.opportunityAlerts?.limit
  const usageRatio = alertLimit ? Math.min(100, Math.round((alertUsed / alertLimit) * 100)) : 100

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {displayName}</h2>
        <p className="text-muted-foreground">{"Here's what's happening with your X growth today."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="mr-1 size-3" />
                  {stat.trend}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={stat.href}>
                    View
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</CardTitle>
              <CardDescription>
                {alertLimit ? `You're using ${alertUsed} of ${alertLimit} daily opportunity alerts` : "Your plan has unlimited opportunity alerts"}
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/billing">Upgrade to Pro</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${usageRatio}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Opportunities</CardTitle>
              <CardDescription>Top opportunities from the last 24 hours</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/opportunities">
                View all
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOpportunities.map((opportunity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  {opportunity.type === "quote" && <Quote className="size-4" />}
                  {opportunity.type === "reply" && <Reply className="size-4" />}
                  {opportunity.type === "post" && <Zap className="size-4" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{opportunity.author}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {opportunity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{opportunity.engagement}</span>
                    <span>{opportunity.time}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
