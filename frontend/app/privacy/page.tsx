import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const shellClassName = "mx-auto w-full max-w-4xl px-6 lg:px-8"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className={shellClassName}>
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Privacy</CardTitle>
            <CardDescription>
              Xsaas stores workspace data, billing state, and connected account details only to run your automation and keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <p>
              We keep session data, workspace settings, drafts, and automation history so the product can generate, schedule, and publish content for your workspace.
            </p>
            <p>
              Connected X account tokens are stored encrypted on the server. Billing details are handled through PayPal and are not stored as raw card data in Xsaas.
            </p>
            <p>
              If you want account data removed, contact support and we can delete the workspace data associated with your account.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
