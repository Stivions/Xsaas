import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const shellClassName = "mx-auto w-full max-w-4xl px-6 lg:px-8"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className={shellClassName}>
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Terms</CardTitle>
            <CardDescription>
              Xsaas is a workflow and automation product. You remain responsible for the content published through your connected accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <p>
              Use the product in line with X platform rules, applicable laws, and your own brand policies. Do not use the service for spam, impersonation, or abusive automation.
            </p>
            <p>
              Paid plans unlock higher limits and connected-account capacity, but they do not guarantee reach, impressions, or revenue.
            </p>
            <p>
              We may suspend workspaces that are used for harmful, fraudulent, or clearly abusive activity.
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
