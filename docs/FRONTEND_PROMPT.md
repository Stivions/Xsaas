# Frontend Prompt

Copy this into the tool or site you want to use for the frontend:

```text
Build a modern SaaS frontend called Xsaas.

Context:
- Xsaas is a membership product for creators and small brands that want to grow on X.
- The product helps users discover post opportunities, quote-tweet opportunities, reply opportunities, drafts, workspace settings, and billing.
- This is not a crypto scam site, not a random AI toy, and not a generic template.
- The founder has low budget, so the first version must feel premium and credible without being bloated.

Main goal:
- Create a landing page plus an authenticated dashboard UI.

Style direction:
- Clean, bold, editorial SaaS.
- Serious but modern.
- Avoid generic AI purple gradients.
- Use a sharper, high-trust visual language.
- Good typography, strong spacing, clear hierarchy.
- Should feel like a product for ambitious creators, not a corporate bank and not a cheap template.
- Desktop and mobile both need to look intentional.

Brand:
- Product name: Xsaas
- Positioning: Your X growth copilot
- Core ideas: publish smarter, quote faster, reply better, organize everything

Pages to design:
1. Landing page
2. Login page
3. Register page
4. Dashboard home
5. Opportunities page
6. Drafts page
7. Workspace settings page
8. Billing page

Landing page sections:
- Hero with strong headline and subheadline
- Problem section
- Product feature grid
- How it works
- Pricing cards: Starter, Pro, Agency
- FAQ
- Final CTA

Dashboard requirements:
- Left sidebar navigation
- Top bar with workspace switcher and user menu
- Dashboard cards for:
  - post opportunities
  - quote-tweet opportunities
  - reply opportunities
  - draft count
  - plan status
- Opportunities table/list with filters
- Draft editor card/list
- Billing screen with current plan and upgrade CTA

Important UX:
- Make it look like a real SaaS product ready to sell.
- No fake metrics everywhere.
- Use realistic placeholder copy.
- Add subtle motion only where it helps.
- Avoid overdesigned glassmorphism.

Tech preference:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style primitives if needed

API assumptions:
- Backend base URL comes from env
- Auth routes:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
- Billing routes:
  - GET /api/billing/config
  - POST /api/billing/checkout-link
- Health route:
  - GET /health

Deliver:
- complete frontend code
- clean folder structure
- env example
- components split well
- responsive screens
- no placeholder lorem ipsum junk
```
