"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Check, X as XIcon } from "lucide-react"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("My Workspace")
  const [notifications, setNotifications] = useState({
    opportunities: true,
    weeklyDigest: true,
    productUpdates: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Settings</CardTitle>
          <CardDescription>
            Manage your workspace name and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              This is the name that appears in your sidebar and reports.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-4 border-t pt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Spinner className="mr-2" /> : null}
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          {showSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="size-4" />
              Changes saved
            </span>
          )}
        </CardFooter>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your X accounts connected to this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@johndoe</span>
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Connected Mar 15, 2026</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              <XIcon className="mr-2 size-4" />
              Connect another X account
            </Button>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>
              Your Starter plan allows 1 connected account.{" "}
              <a href="/dashboard/billing" className="font-medium text-foreground underline">
                Upgrade to Pro
              </a>{" "}
              for up to 3 accounts.
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="opportunities-notifications">Opportunity alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new opportunities match your interests
              </p>
            </div>
            <Switch
              id="opportunities-notifications"
              checked={notifications.opportunities}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, opportunities: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest">Weekly digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your growth and top opportunities
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={notifications.weeklyDigest}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, weeklyDigest: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="product-updates">Product updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new features and improvements
              </p>
            </div>
            <Switch
              id="product-updates"
              checked={notifications.productUpdates}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, productUpdates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Delete workspace</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all its data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete workspace
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
