import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const shellClassName = "mx-auto w-full max-w-4xl px-6 lg:px-8"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className={shellClassName}>
        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl">Password help</CardTitle>
            <CardDescription>
              Password reset emails are not wired yet, so this page points users to the current recovery flow instead of leaving a dead button.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center text-sm text-muted-foreground">
            <p>
              If you lost access, contact <a className="font-medium text-foreground underline" href="mailto:stevensanchezdev@gmail.com">stevensanchezdev@gmail.com</a> from the email tied to your account.
            </p>
            <p>
              Include your workspace name so we can verify ownership and help you recover access safely.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/login">Back to login</Link>
              </Button>
              <Button asChild>
                <Link href="/support">Open support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
