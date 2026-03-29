"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Check, FileText, Layers, Quote, RefreshCcw, Reply, Zap } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"
import { defaultPlanPrices, getPlanUi, type PlanKey } from "@/lib/plan-ui"

const shellClassName = "mx-auto w-full max-w-7xl px-6 lg:px-8"

function Header() {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={`${shellClassName} flex h-16 items-center justify-between`}>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">X</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Xsaas</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.features}
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t.landing.howItWorksTitle}
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.pricing}
          </Link>
          <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            {t.nav.faq}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="ghost" />
          <LanguageToggle variant="ghost" />
          <Button variant="ghost" asChild>
            <Link href="/login">{t.nav.login}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{t.nav.getStarted}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const { t } = useLanguage()
  const [firstLine, secondLine = ""] = t.landing.heroTitle.split(". ")

  return (
    <section className="relative overflow-hidden border-b bg-background py-24 md:py-32">
      <div className={`${shellClassName} relative`}>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            {t.landing.badge}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            {firstLine}.
            <br />
            <span className="text-muted-foreground">{secondLine}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            {t.landing.heroSubtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                {t.landing.heroCta}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">{t.landing.heroSecondaryCta}</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t.landing.ctaNote}</p>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  const { t } = useLanguage()

  const problems = [
    t.landing.problemCards.scroll,
    t.landing.problemCards.missed,
    t.landing.problemCards.ideas,
  ]

  return (
    <section className="border-b py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.problemTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.problemSubtitle}</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const { t } = useLanguage()

  const features = [
    { icon: Zap, ...t.landing.features.post },
    { icon: Quote, ...t.landing.features.quote },
    { icon: Reply, ...t.landing.features.reply },
    { icon: FileText, ...t.landing.features.drafts },
    { icon: Layers, ...t.landing.features.analytics },
    { icon: RefreshCcw, ...t.landing.features.schedule },
  ]

  return (
    <section id="features" className="border-b py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.featuresTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.featuresSubtitle}</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="size-5 text-foreground" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { t } = useLanguage()
  const steps = [
    { step: "01", ...t.landing.steps.connect },
    { step: "02", ...t.landing.steps.discover },
    { step: "03", ...t.landing.steps.create },
    { step: "04", ...t.landing.steps.grow },
  ]

  return (
    <section id="how-it-works" className="border-b py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.howItWorksTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.howItWorksSubtitle}</p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background text-sm font-bold">
                    {step.step}
                  </div>
                  {index < steps.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const { language, t } = useLanguage()
  const proPlan = getPlanUi(language, "pro")
  const popularLabel = "popular" in proPlan ? proPlan.popular : ""

  const plans = useMemo(
    () =>
      (["starter", "pro", "agency"] as PlanKey[]).map((planKey) => {
        const ui = getPlanUi(language, planKey)
        const price = defaultPlanPrices[planKey]
        return {
          id: planKey,
          ...ui,
          priceLabel: price === 0 ? (language === "es" ? "Gratis" : "Free") : `$${price}`,
          period: price === 0 ? "" : language === "es" ? "/mes" : "/month",
          popular: planKey === "pro",
        }
      }),
    [language]
  )

  return (
    <section id="pricing" className="border-b py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.pricingTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.pricingSubtitle}</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? "relative border-foreground" : ""}>
              {plan.popular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>{popularLabel}</Badge>
                </div>
              ) : null}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.priceLabel}</span>
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
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQ() {
  const { t } = useLanguage()

  return (
    <section id="faq" className="border-b py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.faqTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.faqSubtitle}</p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {t.landing.faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  const { t } = useLanguage()

  return (
    <section className="py-24 md:py-32">
      <div className={shellClassName}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.landing.ctaTitle}</h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{t.landing.ctaSubtitle}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                {t.landing.ctaButton}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t py-12">
      <div className={shellClassName}>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-sm font-bold text-background">X</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Xsaas</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.landing.footer.privacy}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.landing.footer.terms}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t.landing.footer.support}
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">(c) 2026 Xsaas. {t.landing.footer.rights}</p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
