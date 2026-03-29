"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Settings,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageToggle } from "@/components/language-toggle"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"

type SessionPayload = {
  user?: {
    fullName?: string
    email?: string
  }
  workspaces?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const handingOffOAuthRef = useRef(false)

  const navigation = useMemo(
    () => [
      { name: t.nav.dashboard, href: "/dashboard", icon: Home },
      { name: t.nav.opportunities, href: "/dashboard/opportunities", icon: Zap },
      { name: t.nav.drafts, href: "/dashboard/drafts", icon: FileText },
    ],
    [t]
  )

  const settingsNavigation = useMemo(
    () => [
      { name: t.nav.workspace, href: "/dashboard/settings", icon: Settings },
      { name: t.nav.billing, href: "/dashboard/billing", icon: CreditCard },
    ],
    [t]
  )

  useEffect(() => {
    if (typeof window === "undefined" || handingOffOAuthRef.current) {
      return
    }

    const currentUrl = new URL(window.location.href)
    const code = currentUrl.searchParams.get("code")
    const state = currentUrl.searchParams.get("state")
    const error = currentUrl.searchParams.get("error")
    const hasOAuthParams = Boolean(code && state) || Boolean(error)

    if (!window.opener || !hasOAuthParams) {
      return
    }

    handingOffOAuthRef.current = true
    const callbackUrl = new URL("/api/x/connect/callback", window.location.origin)
    currentUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    window.location.replace(callbackUrl.toString())
  }, [pathname])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        if (!response.ok) {
          router.replace("/login")
          return
        }

        const data = await response.json()
        if (isMounted) {
          setSession(data)
        }
      } catch {
        router.replace("/login")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const workspaces = session?.workspaces || []
  const currentWorkspace = workspaces[0]?.name || t.nav.workspace
  const userName = session?.user?.fullName || session?.user?.email || "Member"
  const userEmail = session?.user?.email || ""
  const avatarInitials = useMemo(() => {
    const source = session?.user?.fullName || session?.user?.email || "XS"
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() || "")
      .join("")
  }, [session])

  const pageTitle =
    navigation.find((item) => pathname === item.href)?.name ||
    settingsNavigation.find((item) => pathname === item.href)?.name ||
    t.dashboard.pageTitles.dashboard

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          {t.dashboard.loadingWorkspace}
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-sm font-bold text-background">X</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Xsaas</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="px-2 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4" />
                      <span className="truncate">{currentWorkspace}</span>
                    </div>
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{t.dashboard.workspaces}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem key={workspace.id} asChild>
                      <Link href="/dashboard/settings">
                        <Building2 className="mr-2 size-4" />
                        {workspace.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.nav.menuGroup}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t.nav.settingsGroup}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsNavigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{t.dashboard.myAccount}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 size-4" />
                  {t.nav.workspace}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing">
                  <CreditCard className="mr-2 size-4" />
                  {t.nav.billing}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                {t.nav.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-6 lg:px-8">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-1 items-center justify-between gap-4">
              <h1 className="text-lg font-semibold">{pageTitle}</h1>
              <div className="flex items-center gap-2">
                <ThemeToggle variant="outline" />
                <LanguageToggle variant="outline" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
