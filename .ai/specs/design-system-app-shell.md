# Spec: Design System And App Shell

## Goal

Create the visual and structural foundation for the redesigned frontend so every later screen can inherit a cohesive premium system. This includes tokens, typography, global motion primitives, and a shared authenticated shell that works across desktop, tablet, and mobile web while staying compatible with Electron and future Capacitor wrapping.

## Scope

- Build or refine the global design token layer in the frontend
- Align typography, color usage, spacing, shadows, and radius with `.ai/DESIGN_PLAN.md`
- Establish reusable motion primitives for entrances, hover, and modal transitions
- Create a shared authenticated app shell pattern for chat, dashboard, settings/profile, buckets, and admin
- Define responsive navigation behavior for wide and narrow screens
- Improve the global toaster styling only if needed for consistency

## Out Of Scope

- Backend or database changes
- Billing flows
- OAuth
- Final screen-specific content polish
- Mobile native plugin work

## Branch

`feature/design-system-app-shell`

## Files To Create

- `frontend/src/components/layout/AppShell.tsx` — shared authenticated shell
- `frontend/src/components/layout/AppSidebar.tsx` — responsive sidebar navigation
- `frontend/src/components/layout/AppTopbar.tsx` — top bar for smaller viewports and shared actions
- `frontend/src/components/ui/` components as needed for buttons, cards, section headers, skeletons, badges, and empty states

## Files To Edit

- `frontend/src/index.css` — token layer, global motion utilities, font usage, shared utility classes
- `frontend/tailwind.config.cjs` — theme extensions for tokens and utilities when justified
- `frontend/src/App.tsx` — route shell integration only if required
- Existing page files only as needed to adopt the shared shell

## Types / Interfaces

- Navigation item type for shell/sidebar
- Shared UI component props for variant-based buttons/cards/badges

## Component Structure

- `AppShell`
- `AppSidebar`
- `AppTopbar`
- `ShellContent`
- Shared primitives used by pages

## Acceptance Criteria

- [ ] Brand tokens match the neutral-first direction from `.ai/DESIGN_PLAN.md`
- [ ] Gradient usage is reserved for emphasis, not base surfaces
- [ ] Shared shell works across desktop and mobile breakpoints
- [ ] Primary navigation is consistent across chat, dashboard, profile/settings, buckets, and admin
- [ ] Focus states, hover states, loading states, and empty states feel intentional and branded
- [ ] The structure supports future desktop and mobile wrappers without redesigning the entire layout

## Verification

- Run `npm --prefix frontend run build`
- Run `npm --prefix frontend run lint`
- Run relevant Playwright smoke or layout tests if available

## Notes For Codex

- Use `.ai/DESIGN_PLAN.md` as the visual source of truth
- Build for maintainability first; this foundation should make later screens easier to implement
- Prefer extracting reusable primitives instead of adding more complexity to `ChatInterface.tsx`
