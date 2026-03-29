import type { Language } from "@/lib/copy"

export type PlanKey = "starter" | "pro" | "agency"

export const defaultPlanPrices: Record<PlanKey, number> = {
  starter: 0,
  pro: 19,
  agency: 79,
}

export const planUi = {
  en: {
    starter: {
      name: "Starter",
      description: "For creators just getting started",
      features: [
        "5 opportunity alerts per day",
        "Basic draft workspace",
        "1 connected account",
        "Community support",
      ],
      cta: "Get Started",
    },
    pro: {
      name: "Pro",
      description: "For serious creators and solopreneurs",
      features: [
        "Unlimited opportunity alerts",
        "Advanced draft workspace",
        "3 connected accounts",
        "Priority support",
        "Analytics dashboard",
        "Content recycling",
      ],
      cta: "Start Free Trial",
      popular: "Most popular",
    },
    agency: {
      name: "Agency",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "Unlimited accounts",
        "Team collaboration",
        "White-label reports",
        "Dedicated support",
        "API access",
      ],
      cta: "Contact Sales",
    },
  },
  es: {
    starter: {
      name: "Starter",
      description: "Para creadores que estan empezando",
      features: [
        "5 alertas de oportunidad por dia",
        "Espacio basico de borradores",
        "1 cuenta conectada",
        "Soporte comunitario",
      ],
      cta: "Comenzar",
    },
    pro: {
      name: "Pro",
      description: "Para creadores serios y solopreneurs",
      features: [
        "Alertas de oportunidad ilimitadas",
        "Espacio avanzado de borradores",
        "3 cuentas conectadas",
        "Soporte prioritario",
        "Panel de analitica",
        "Reciclaje de contenido",
      ],
      cta: "Prueba gratis",
      popular: "Mas popular",
    },
    agency: {
      name: "Agencia",
      description: "Para equipos y agencias",
      features: [
        "Todo lo de Pro",
        "Cuentas ilimitadas",
        "Colaboracion en equipo",
        "Reportes white-label",
        "Soporte dedicado",
        "Acceso API",
      ],
      cta: "Contactar ventas",
    },
  },
} as const

export function getPlanUi(language: Language, planKey: PlanKey) {
  return planUi[language][planKey]
}
