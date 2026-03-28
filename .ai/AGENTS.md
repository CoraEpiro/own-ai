# Agent Roles & Pipeline

This file defines how Claude Code, Codex CLI, and Cursor work together on this project.

---

## Agent Roles

### Claude Code — Architect & Orchestrator
**Strengths:** Architecture, complex logic, backend, API design, auth, streaming, review, integration

**Does:**
- Chats with user to fully understand a feature
- Writes the feature spec to `.ai/specs/`
- Defines types, API contracts, folder structure for the feature
- Provides the exact Codex CLI command to use
- Reviews Codex output after implementation
- Handles complex backend logic directly (streaming, WebSocket, auth, DB)
- Integrates and merges branches

**Does NOT:**
- Write boilerplate UI screens (delegates to Codex)
- Do repetitive component work (delegates to Codex)

---

### Codex CLI — Implementer
**Strengths:** Building screens, UI components, repetitive work, converting specs to code fast

**Does:**
- Reads `CLAUDE.md` + the assigned spec from `.ai/specs/`
- Implements exactly what the spec describes
- Works on a dedicated feature branch
- Follows all conventions in `CLAUDE.md`
- Does not make architecture decisions — follows the spec

**Does NOT:**
- Modify files outside the feature scope defined in the spec
- Change the database schema
- Modify backend routes (unless the spec explicitly includes it)
- Make judgment calls — if unclear, adds a `// TODO: clarify` comment

**How to invoke:**
```bash
codex "Read CLAUDE.md and .ai/specs/<feature-name>.md carefully, then implement the full task described. Work on branch feature/<feature-name>. Follow all conventions in CLAUDE.md exactly."
```

---

### Cursor — Human-in-the-Loop Editor
**Strengths:** Inline editing, style tweaks, quick fixes while actively looking at the file

**Does:**
- Tweaks UI details after Codex builds a screen
- Quick style adjustments, copy changes
- Active pair programming with the user
- Fast one-line fixes

**Does NOT:**
- Do large feature implementations
- Touch backend or database

---

## The Pipeline (Step by Step)

```
┌─────────────────────────────────────────────────────────┐
│  1. CHAT                                                │
│     User describes feature to Claude Code               │
│     Claude asks clarifying questions                    │
│     Both agree on scope and approach                    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  2. SPEC                                                │
│     Claude writes .ai/specs/<feature-name>.md           │
│     Spec includes: goal, files to create/edit,          │
│     types, API endpoints, component structure, notes    │
│     Claude also defines any shared types needed         │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  3. ASSIGN                                              │
│     Claude provides exact Codex CLI command             │
│     User runs Codex in a separate terminal              │
│     Codex reads CLAUDE.md + spec and implements         │
│     Codex works on branch: feature/<feature-name>       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  4. REVIEW                                              │
│     User tells Claude Code when Codex is done           │
│     Claude reads Codex's output                         │
│     Claude fixes issues, fills gaps, ensures quality    │
│     User tweaks UI details in Cursor if needed          │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│  5. MERGE                                               │
│     Claude integrates branch into main                  │
│     User tests on device/browser                        │
│     Done — move to next feature                         │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Spec Format

When Claude writes a spec, it uses this format:

```markdown
# Spec: <Feature Name>

## Goal
One paragraph describing what this feature does and why.

## Scope
- What to build
- What NOT to touch

## Branch
feature/<feature-name>

## Files to Create
- path/to/file.ts — description

## Files to Edit
- path/to/existing.ts — what to change and why

## Types / Interfaces
(TypeScript types Codex should define or use)

## API Endpoints
(If backend work is needed — method, route, request/response shape)

## Component Structure
(For UI work — component hierarchy, props, state)

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes for Codex
Any special instructions, gotchas, or context Codex needs.
```

---

## File Ownership Rules

To avoid conflicts, each agent works only in its assigned scope:

| Scope | Owner |
|---|---|
| Backend routes, services, middleware | Claude Code |
| Database migrations | Claude Code only |
| Shared types (`/types/`) | Claude Code defines, Codex uses |
| Feature UI screens | Codex |
| Shared UI components | Coordinated — Claude defines API, Codex implements |
| Mobile (`/mobile/`) | Codex (screens) + Claude (native plugins, config) |
| Config files (vite, tailwind, capacitor) | Claude Code only |

---

## Branch Naming

```
feature/<feature-name>     New feature
fix/<bug-name>             Bug fix
polish/<area-name>         UI/UX improvement
refactor/<area-name>       Code cleanup
```

All agents create their own branch. Never work directly on `main`.

---

## Codex Tips

- Always tell Codex to read `CLAUDE.md` first — it has all the context
- Keep specs focused — one feature per spec, not multiple
- If Codex drifts or makes wrong decisions, refine the spec and re-run
- Codex works best with concrete specs — the more specific, the better the output
- After Codex finishes, always have Claude Code review before merging
