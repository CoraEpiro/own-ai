# Spec: Landing Page

## Goal

Build a premium marketing landing page for Own AI that clearly communicates the core value proposition for students: all major AI models in one app, transparent pay-as-you-go pricing, and a product that feels modern, credible, and worth trusting.

## Scope

- Add a public landing page route
- Create a polished hero, feature/value sections, pricing explanation, cross-platform section, and CTA area
- Use the motion and visual system from `.ai/DESIGN_PLAN.md`
- Make the page fully responsive across desktop, tablet, and mobile
- Link clearly into the auth/signup flow

## Out Of Scope

- Backend changes
- CMS or admin-editable marketing content
- Final SEO/performance tuning beyond reasonable frontend hygiene

## Branch

`feature/landing-page`

## Files To Create

- `frontend/src/pages/LandingPage.tsx`
- `frontend/src/components/landing/` components as needed for hero, feature grid, pricing section, trust section, and footer

## Files To Edit

- `frontend/src/App.tsx` — add landing route and route flow
- `frontend/src/index.css` — landing-specific motion helpers only if shared and reusable
- `frontend/src/config/` files only if route or copy constants genuinely need a shared home

## Component Structure

- `LandingPage`
- `LandingHero`
- `FeatureGrid`
- `PricingExplainer`
- `PlatformSection`
- `CallToAction`
- `LandingFooter`

## Content Priorities

- "All the AI. None of the waste."
- Unified access to OpenAI, Claude, and Gemini
- €2 free credit, no card required
- Transparent usage-based pricing instead of stacked subscriptions
- Available on web now, with desktop and mobile roadmap confidence

## Acceptance Criteria

- [ ] Public route exists and feels like a real premium product page
- [ ] The page reflects the brand brief instead of looking generic or template-like
- [ ] CTA routes users cleanly into auth
- [ ] Desktop, tablet, and mobile layouts are all considered
- [ ] Motion adds atmosphere without harming readability or performance
- [ ] The page supports the product story for web, desktop, and future mobile platforms

## Verification

- Run `npm --prefix frontend run build`
- Run `npm --prefix frontend run lint`
- Run Playwright route/smoke coverage if available

## Notes For Codex

- Prefer bold, brand-led composition over standard SaaS blocks
- Use screenshots in `.ai/stitch/landing/` if present
- If screenshots are incomplete, fill gaps using `.ai/DESIGN_PLAN.md`
