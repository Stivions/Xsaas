"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Zap, Quote, Reply, Search, ExternalLink, Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react"

type OpportunityType = "all" | "post" | "quote" | "reply"

interface Opportunity {
  id: string
  type: "post" | "quote" | "reply"
  author: string
  handle: string
  content: string
  likes: number
  replies: number
  retweets: number
  time: string
  relevance: "high" | "medium" | "low"
  topic: string
}

const opportunities: Opportunity[] = [
  {
    id: "1",
    type: "quote",
    author: "Sarah Chen",
    handle: "@sarahchen_design",
    content: "The best products are built by teams who understand that design is not just how it looks, but how it works. Functionality and aesthetics must work together.",
    likes: 2400,
    replies: 89,
    retweets: 312,
    time: "2h ago",
    relevance: "high",
    topic: "Design",
  },
  {
    id: "2",
    type: "reply",
    author: "Alex Rivera",
    handle: "@alexrivera_vc",
    content: "What tools are you using to track your audience growth in 2026? Looking for recommendations beyond the usual suspects.",
    likes: 156,
    replies: 234,
    retweets: 45,
    time: "4h ago",
    relevance: "high",
    topic: "Tools",
  },
  {
    id: "3",
    type: "post",
    author: "Trending Topic",
    handle: "#CreatorEconomy",
    content: "Discussions about monetization strategies, platform changes, and what it takes to build a sustainable creator business in 2026.",
    likes: 15000,
    replies: 890,
    retweets: 2100,
    time: "1h ago",
    relevance: "high",
    topic: "Creator Economy",
  },
  {
    id: "4",
    type: "quote",
    author: "Marcus Johnson",
    handle: "@marcusjohnson",
    content: "Just shipped our v2 and learned so much about what users actually want vs what we thought they wanted. Thread on the key insights...",
    likes: 890,
    replies: 45,
    retweets: 123,
    time: "3h ago",
    relevance: "medium",
    topic: "Startups",
  },
  {
    id: "5",
    type: "reply",
    author: "Emma Watson",
    handle: "@emmawatson_tech",
    content: "Building in public question: How do you balance transparency with competitive advantage? Where do you draw the line?",
    likes: 234,
    replies: 167,
    retweets: 34,
    time: "5h ago",
    relevance: "medium",
    topic: "Building in Public",
  },
  {
    id: "6",
    type: "post",
    author: "Trending Topic",
    handle: "#AITools",
    content: "The AI tools landscape is shifting rapidly. New tools launching daily, established players iterating fast.",
    likes: 8900,
    replies: 456,
    retweets: 1200,
    time: "30m ago",
    relevance: "medium",
    topic: "AI",
  },
  {
    id: "7",
    type: "quote",
    author: "David Park",
    handle: "@davidpark_growth",
    content: "Hot take: Most growth tactics from 2024 are completely dead. Here's what's actually working now...",
    likes: 3200,
    replies: 234,
    retweets: 567,
    time: "6h ago",
    relevance: "high",
    topic: "Growth",
  },
  {
    id: "8",
    type: "reply",
    author: "Lisa Thompson",
    handle: "@lisathompson",
    content: "Fellow creators: What's your content workflow look like? Still struggling to find the right system.",
    likes: 89,
    replies: 312,
    retweets: 23,
    time: "8h ago",
    relevance: "low",
    topic: "Productivity",
  },
]

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

function getTypeIcon(type: "post" | "quote" | "reply") {
  switch (type) {
    case "post":
      return Zap
    case "quote":
      return Quote
    case "reply":
      return Reply
  }
}

function getRelevanceColor(relevance: "high" | "medium" | "low") {
  switch (relevance) {
    case "high":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "low":
      return "bg-muted text-muted-foreground"
  }
}

export default function OpportunitiesPage() {
  const [filter, setFilter] = useState<OpportunityType>("all")
  const [search, setSearch] = useState("")
  const [relevance, setRelevance] = useState<string>("all")

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesType = filter === "all" || opp.type === filter
    const matchesSearch =
      search === "" ||
      opp.content.toLowerCase().includes(search.toLowerCase()) ||
      opp.author.toLowerCase().includes(search.toLowerCase()) ||
      opp.topic.toLowerCase().includes(search.toLowerCase())
    const matchesRelevance = relevance === "all" || opp.relevance === relevance
    return matchesType && matchesSearch && matchesRelevance
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Find Opportunities</CardTitle>
          <CardDescription>
            Discover the best posts to engage with based on your interests and audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by topic, author, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={relevance} onValueChange={setRelevance}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All relevance</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as OpportunityType)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="post">
            <Zap className="mr-1.5 size-3.5" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="quote">
            <Quote className="mr-1.5 size-3.5" />
            Quotes
          </TabsTrigger>
          <TabsTrigger value="reply">
            <Reply className="mr-1.5 size-3.5" />
            Replies
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="space-y-4">
            {filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="mb-4 size-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No opportunities found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opportunity) => {
                const Icon = getTypeIcon(opportunity.type)
                return (
                  <Card key={opportunity.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{opportunity.author}</span>
                            <span className="text-sm text-muted-foreground">
                              {opportunity.handle}
                            </span>
                            <span className="text-sm text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">
                              {opportunity.time}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{opportunity.content}</p>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Heart className="size-4" />
                              {formatNumber(opportunity.likes)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="size-4" />
                              {formatNumber(opportunity.replies)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Repeat2 className="size-4" />
                              {formatNumber(opportunity.retweets)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {opportunity.topic}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs capitalize ${getRelevanceColor(opportunity.relevance)}`}
                            >
                              {opportunity.relevance} relevance
                            </Badge>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2 sm:flex-col">
                          <Button variant="outline" size="sm">
                            <Bookmark className="mr-1.5 size-3.5" />
                            Save
                          </Button>
                          <Button size="sm">
                            <ExternalLink className="mr-1.5 size-3.5" />
                            View on X
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
