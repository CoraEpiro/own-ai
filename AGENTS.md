# Own AI — Codex Workflow

Use this file as the repo-root instruction file for Codex work in this project.

## Read Order

Before implementing anything, read:

1. `CLAUDE.md`
2. `.ai/DESIGN_PLAN.md`
3. `.ai/PLAN.md`
4. The assigned file in `.ai/specs/`
5. Any relevant Stitch references in `.ai/stitch/`

If those sources conflict, use this priority order:

1. Assigned spec in `.ai/specs/`
2. `CLAUDE.md`
3. `.ai/DESIGN_PLAN.md`
4. `.ai/PLAN.md`
5. Stitch screenshots in `.ai/stitch/`

Stitch screenshots are a visual reference, not permission to invent product behavior that is not in the spec.

## Working Style

- Implement one scoped feature at a time.
- Do not treat "perfect the whole frontend" as one task. Break work into specs.
- Preserve existing user changes unless the active spec explicitly replaces them.
- Prefer additive, reviewable changes over broad rewrites.
- If a file is large and hard to maintain, split it only when the spec allows it.

## Design Expectations

- Follow the neutral-first brand system in `.ai/DESIGN_PLAN.md`.
- Use the brand gradient sparingly and intentionally.
- Build desktop, tablet, and mobile-responsive layouts by default.
- Keep hover as an enhancement, never the only way to access critical actions.
- Consider future Electron and Capacitor use when making layout decisions.
- Add polished empty, loading, error, hover, focus, and disabled states.

## Frontend Constraints

- Frontend work belongs in `frontend/` unless the spec explicitly includes shared config.
- Do not change backend routes, database schema, or env contracts unless the spec says so.
- Reuse shared styles, tokens, and components when possible.
- Avoid hardcoded one-off colors in components when a token can be introduced instead.

## Verification

After implementation, run the relevant checks for the touched scope when possible:

- `npm --prefix frontend run build`
- `npm --prefix frontend run lint`
- `npm --prefix frontend run e2e` for flows covered by Playwright

If a command cannot run, say why.

## Stitch References

If screenshots exist in `.ai/stitch/`, use them as follows:

- Match layout, spacing intent, hierarchy, and interaction ideas.
- Fill in missing states and responsive behavior from the design system.
- Improve details where the screenshot is underspecified, but stay on-brand.
- Do not copy visual mistakes from the screenshot if they violate the design brief.

## Deliverable Standard

A feature is not done when the primary screen looks close enough. It is done when:

- The main flow works
- States are covered
- The layout adapts well to smaller screens
- The code is maintainable
- The result aligns with the design brief and the active spec
