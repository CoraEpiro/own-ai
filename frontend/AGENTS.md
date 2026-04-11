# Frontend Scope Guide

This file applies to work inside `frontend/`.

## Source Of Truth

For UI work, always use:

1. `../CLAUDE.md`
2. `../.ai/DESIGN_PLAN.md`
3. The active spec in `../.ai/specs/`
4. Stitch references in `../.ai/stitch/`

## What Good Looks Like

- Premium, intentional UI
- Responsive across desktop, tablet, and mobile web
- Ready to be wrapped by Electron and future Capacitor without layout hacks
- Consistent motion, spacing, radius, and typography
- Accessible keyboard focus and readable contrast

## Implementation Rules

- Keep pages in `src/pages/`
- Keep reusable UI in `src/components/`
- Use hooks or helper modules for logic that should not live inside view components
- Prefer design tokens and shared utility classes over one-off inline styling
- Use `react-hot-toast`, never browser dialogs
- Preserve router structure unless the spec explicitly changes routes

## Platform Readiness

When building shared UI, assume it should work well for:

- Web desktop
- Web mobile
- Electron desktop shell
- Future Capacitor mobile shell

That means:

- Avoid fixed-height assumptions that break on mobile keyboards
- Avoid hover-only disclosure for primary actions
- Leave room for safe-area padding strategies
- Keep navigation adaptable between sidebar and mobile-friendly patterns

## When Using Stitch Screens

- Name references clearly by screen and state
- Prefer separate screenshots for desktop and mobile
- Add your own polish where the screenshot is vague
- Keep the product feel cohesive across screens, not screenshot-by-screenshot
