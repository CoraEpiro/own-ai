# Spec: Auth Redesign

## Goal

Redesign the authentication experience so it feels premium, trustworthy, and on-brand while remaining compatible with the existing email/password backend flow. The screen should carry the product’s brand story, reduce signup friction, and work cleanly on both desktop and mobile.

## Scope

- Redesign the auth page and auth form UI
- Improve hierarchy, copy, form states, and responsive behavior
- Support sign in and create account modes using the current backend API
- Add polished loading, success, validation, and error states
- Keep the structure ready for future Google and Apple OAuth buttons

## Out Of Scope

- Implementing Google OAuth
- Implementing Apple Sign-In
- Backend auth contract changes
- Password reset flow unless it already exists in scope elsewhere

## Branch

`feature/auth-redesign`

## Files To Create

- Feature-specific auth components if the current form needs to be split for maintainability

## Files To Edit

- `frontend/src/pages/AuthPage.tsx`
- `frontend/src/components/AuthForm.tsx`
- Shared token/style files only when needed for consistency

## Component Structure

- `AuthPage`
- `AuthForm`
- Optional extracted parts for hero panel, provider buttons, password strength, trust messaging, and success state

## UX Requirements

- Desktop: two-panel composition is acceptable if it remains elegant and focused
- Mobile: remove decorative excess and prioritize clarity, speed, and spacing
- Preserve strong keyboard and form usability
- Leave clear placeholders for future social login options without fake functionality

## Acceptance Criteria

- [ ] Sign in and create account flows remain functional
- [ ] Error, validation, loading, and success states are polished
- [ ] The page feels visually connected to the landing page and app shell
- [ ] Mobile layout feels intentionally designed, not like a squeezed desktop screen
- [ ] The screen supports future multi-platform expansion without a redesign

## Verification

- Run `npm --prefix frontend run build`
- Run `npm --prefix frontend run lint`
- Run Playwright auth smoke coverage if available

## Notes For Codex

- Use Stitch references in `.ai/stitch/auth/` if present
- Respect the current backend contract and auth context
- Do not add fake OAuth behavior; only visual placeholders are acceptable if clearly non-functional
