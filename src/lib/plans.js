export const PLAN_META = {
  starter: {
    label: "Starter",
    price: 0,
    currency: "USD",
    limitAlerts: 5,
    limitAccounts: 1,
    features: [
      "5 opportunity alerts per day",
      "Basic draft workspace",
      "1 connected account",
      "Community support"
    ]
  },
  pro: {
    label: "Pro",
    price: 19,
    currency: "USD",
    limitAlerts: null,
    limitAccounts: 3,
    features: [
      "Unlimited opportunity alerts",
      "Advanced draft workspace",
      "3 connected accounts",
      "Priority support",
      "Analytics dashboard",
      "Content recycling"
    ]
  },
  agency: {
    label: "Agency",
    price: 79,
    currency: "USD",
    limitAlerts: null,
    limitAccounts: null,
    features: [
      "Everything in Pro",
      "Unlimited accounts",
      "Team collaboration",
      "White-label reports",
      "Dedicated support",
      "API access"
    ]
  }
};

export const PAID_PLAN_KEYS = ["pro", "agency"];
