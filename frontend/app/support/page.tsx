import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const shellClassName = "mx-auto w-full max-w-4xl px-6 lg:px-8"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className={shellClassName}>
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Support</CardTitle>
            <CardDescription>
              Use this page as the support entry point while the full ticket system is still being wired into the product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center text-sm text-muted-foreground">
            <p>
              For billing, account access, or automation issues, contact <a className="font-medium text-foreground underline" href="mailto:stevensanchezdev@gmail.com">stevensanchezdev@gmail.com</a>.
            </p>
            <p>
              Include your workspace name, the page where the problem happened, and a screenshot if possible so support can reproduce it faster.
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
