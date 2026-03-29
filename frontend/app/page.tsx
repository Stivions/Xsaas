"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, MessageSquare, RefreshCcw, Layers, ArrowRight, Quote, Reply, FileText } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { LanguageToggle } from "@/components/language-toggle"

function Header() {
  const { t } = useLanguage()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
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
        <div className="flex items-center gap-3">
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
  
  return (
    <section className="relative overflow-hidden border-b bg-background py-24 md:py-32">
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-6">
            {t.landing.badge}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            {t.landing.heroTitle.split(".")[0]}.
            <br />
            <span className="text-muted-foreground">{t.landing.heroTitle.split(".")[1] || ""}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl">
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
          <p className="mt-6 text-sm text-muted-foreground">
            {t.landing.ctaNote}
          </p>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  const { t } = useLanguage()
  
  const problems = [
    {
      title: t.landing.problemCards.scroll.title,
      description: t.landing.problemCards.scroll.description,
    },
    {
      title: t.landing.problemCards.missed.title,
      description: t.landing.problemCards.missed.description,
    },
    {
      title: t.landing.problemCards.ideas.title,
      description: t.landing.problemCards.ideas.description,
    },
  ]
  
  return (
    <section className="border-b py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.problemTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.problemSubtitle}
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {problem.description}
                </p>
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
    {
      icon: Zap,
      title: t.landing.features.post.title,
      description: t.landing.features.post.description,
    },
    {
      icon: Quote,
      title: t.landing.features.quote.title,
      description: t.landing.features.quote.description,
    },
    {
      icon: Reply,
      title: t.landing.features.reply.title,
      description: t.landing.features.reply.description,
    },
    {
      icon: FileText,
      title: t.landing.features.drafts.title,
      description: t.landing.features.drafts.description,
    },
    {
      icon: Layers,
      title: t.landing.features.analytics.title,
      description: t.landing.features.analytics.description,
    },
    {
      icon: RefreshCcw,
      title: t.landing.features.schedule.title,
      description: t.landing.features.schedule.description,
    },
  ]

  return (
    <section id="features" className="border-b py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.featuresTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.featuresSubtitle}
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="relative overflow-hidden">
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
    {
      step: "01",
      title: t.landing.steps.connect.title,
      description: t.landing.steps.connect.description,
    },
    {
      step: "02",
      title: t.landing.steps.discover.title,
      description: t.landing.steps.discover.description,
    },
    {
      step: "03",
      title: t.landing.steps.create.title,
      description: t.landing.steps.create.description,
    },
    {
      step: "04",
      title: t.landing.steps.grow.title,
      description: t.landing.steps.grow.description,
    },
  ]

  return (
    <section id="how-it-works" className="border-b py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.howItWorksTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.howItWorksSubtitle}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background text-sm font-bold">
                    {step.step}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mt-2 h-full w-px bg-border" />
                  )}
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
  const { t } = useLanguage()
  
  const plans = [
    {
      name: t.landing.plans.starter.name,
      description: t.landing.plans.starter.description,
      price: t.landing.plans.starter.price,
      period: t.landing.plans.starter.period,
      features: t.landing.plans.starter.features,
      cta: t.landing.plans.starter.cta,
      popular: false,
    },
    {
      name: t.landing.plans.pro.name,
      description: t.landing.plans.pro.description,
      price: t.landing.plans.pro.price,
      period: t.landing.plans.pro.period,
      features: t.landing.plans.pro.features,
      cta: t.landing.plans.pro.cta,
      popular: true,
      popularLabel: t.landing.plans.pro.popular,
    },
    {
      name: t.landing.plans.agency.name,
      description: t.landing.plans.agency.description,
      price: t.landing.plans.agency.price,
      period: t.landing.plans.agency.period,
      features: t.landing.plans.agency.features,
      cta: t.landing.plans.agency.cta,
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="border-b py-24 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.pricingTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.pricingSubtitle}
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "relative border-foreground" : ""}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>{plan.popularLabel}</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
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
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.faqTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.faqSubtitle}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {t.landing.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
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
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t.landing.ctaTitle}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t.landing.ctaSubtitle}
          </p>
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
      <div className="container">
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
              Support
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © 2026 Xsaas. {t.landing.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
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
