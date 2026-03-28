# Own AI — Agent Reference

> Read this file fully before writing any code. This is the single source of truth for all agents (Claude Code, Codex, Cursor).

---

## What This Project Is

**Own AI** is an all-in-one multi-LLM chat platform with usage-based pricing. Instead of paying $20/month per AI service, users pay only for what they use (API cost + small commission). Primary target: students who need AI during exams and specific periods, not year-round.

**Founders:** Denis + friend (2-person student team)
**Stage:** Working web app, actively being polished. Adding mobile (Capacitor), billing, and OAuth next.

---

## Monorepo Structure

```
own-ai/
├── backend/          Node.js + Express + TypeScript  →  Railway
├── frontend/         React 18 + Vite + TypeScript    →  Vercel
├── desktop/          Electron wrapper of frontend    →  macOS + Windows
├── mobile/           Capacitor wrapper (to be built) →  iOS + Android
├── .ai/              Agent coordination files
├── CLAUDE.md         ← you are here
└── package.json      Monorepo root (workspace scripts)
```

---

## Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js with TypeScript (`tsx` dev, `tsc` prod)
- **Framework:** Express 4
- **WebSocket:** `ws` — OpenAI Realtime API relay for voice
- **Auth:** Custom JWT (`jsonwebtoken`) + `bcryptjs` password hashing
- **Database:** Supabase (`@supabase/supabase-js`) — PostgreSQL with RLS
- **File uploads:** `multer` (memory storage, 20–25MB limits)
- **PDF parsing:** `pdf-parse`
- **HTTP client:** `axios`
- **Security:** `helmet`, `express-rate-limit`, CORS allowlist
- **Deployment:** Railway (`Procfile` + `railway.json`)

### Frontend (`/frontend`)
- **Framework:** React 18 with TypeScript
- **Build:** Vite 5
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS 3 + `@tailwindcss/typography`
- **Icons:** Lucide React
- **Charts:** Chart.js + react-chartjs-2
- **Markdown:** `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `remark-breaks`
- **Diagrams:** Mermaid 11
- **Syntax highlighting:** `react-syntax-highlighter`
- **Notifications:** `react-hot-toast`
- **Deployment:** Vercel (`vercel.json`)

### Mobile (`/mobile`) — TO BE BUILT
- **Wrapper:** Capacitor 6
- **Base:** Same React app from `/frontend` (shared build)
- **Target:** iOS + Android
- **Key plugins needed:** microphone, camera, filesystem, Google Auth, Apple Sign-In, biometric auth, push notifications, preferences (secure storage)

### Desktop (`/desktop`)
- **Framework:** Electron 31
- **Packaging:** `electron-builder` — macOS (dmg + zip), Windows (NSIS + portable)
- **App ID:** `com.ownai.desktop`

---

## Database Schema (Supabase / PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | id (UUID), email, password (bcrypt), bio TEXT, is_admin BOOL |
| `conversations` | id, user_id, title, model, summary, system_prompt, folder_id |
| `chat_messages` | id, user_id, conversation_id, role, message, model, tokens_used, cost, attachments JSONB, reply_to JSONB |
| `folders` | id, user_id, name, sort_order |
| `memories` | id, user_id, content TEXT (max 200 chars), capped at 100 per user |
| `buckets` | id, user_id, name, description |
| `bucket_entries` | id, bucket_id, title, content, entry_type, sort_order |
| `conversation_buckets` | (conversation_id, bucket_id) composite PK |
| `admin_feedback` | id, user_id, type, subject, message, status, admin_note |
| `admin_transactions` | id, user_id, type, amount, currency, status, metadata JSONB |

---

## AI Providers & Models

### OpenAI (`OPENAI_API_KEY`)
- `gpt-5.4` — flagship, 1M context
- `gpt-5-mini` — fast/affordable, 400K context
- `gpt-5.3-chat-latest` — conversation-optimized
- `o3`, `o3-mini`, `o4-mini` — reasoning models
- `gpt-realtime-1.5`, `gpt-realtime`, `gpt-realtime-mini` — voice/realtime

### Anthropic (`CLAUDE_API_KEY`)
- `claude-opus-4-6` — most intelligent
- `claude-sonnet-4-6` — balanced
- `claude-haiku-4-5-20251001` — fastest/cheapest

### Google (`GEMINI_API_KEY`)
- `gemini-2.5-flash` — fast reasoning + vision, 1M context
- Also used for web search via Google Grounding

### Auto
- Virtual model — heuristic engine picks best model per prompt

---

## Backend API Routes

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Email + password registration |
| `POST /api/auth/login` | Login, returns 7-day JWT |
| `POST /api/stream-chat` | Main streaming chat endpoint (SSE) |
| `GET /api/user/me` | Current user profile |
| `GET/PUT /api/user/bio` | Custom instructions (2000 char) |
| `GET /api/dashboard/analytics` | Token usage, cost breakdown |
| `GET /api/models` | Available model definitions |
| `POST /api/upload` | File/image upload → Supabase Storage |
| `POST /api/audio` | PDF-to-audio job |
| `GET/POST/DELETE /api/folders` | Conversation folders CRUD |
| `GET/POST/DELETE /api/buckets` | Knowledge buckets CRUD |
| `GET/POST/DELETE /api/memories` | Persistent user memories CRUD |
| `GET /api/recommend-model` | Heuristic model recommendation |
| `GET/PATCH /api/admin/*` | Admin panel (requires isAdmin JWT) |
| `POST /api/feedback` | User feedback submission |
| `WS /ws/realtime` | WebSocket relay → OpenAI Realtime API |

**Auth middleware:** JWT verified via `authMiddleware`. Admin protected via `requireAdmin`.

---

## Environment Variables

### Backend (required)
```
OPENAI_API_KEY
CLAUDE_API_KEY
GEMINI_API_KEY
JWT_SECRET
FRONTEND_URL
CONNECTION_STRING      # Supabase PostgreSQL connection string
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PORT                   # default 3001
```

### CORS Allowed Origins
```
http://localhost:5173
http://localhost:3000
https://own-ai-alpha.vercel.app
https://own-ai.aliguliyev.com
process.env.FRONTEND_URL
```

---

## Features Built

- Multi-provider streaming chat (OpenAI, Claude, Gemini) via SSE
- Auto model selection (heuristic per prompt category)
- Voice mode — WebSocket relay to OpenAI Realtime API + STT/TTS bridge for Claude/Gemini
- PDF-to-audio (3 modes: summary 4min, narration 8min, podcast 15min dual-voice)
- File/image uploads (stored in Supabase Storage)
- Web search (Gemini Flash + Google Grounding, 4 modes)
- Conversation management (titles, summaries, context windowing)
- Conversation folders
- Knowledge Buckets (user-curated context injected into chats)
- Persistent memories (AI-extracted, up to 100 per user)
- Reply-to messages (thread quoting)
- Custom system prompts per conversation
- User bio / custom instructions (2000 chars, injected into every chat)
- Analytics dashboard (token usage, cost by model/provider/day)
- Admin panel (stats, user management, feedback inbox, transaction ledger)
- Dark/light theme with provider-specific color themes (OpenAI green, Anthropic amber, Google blue, Auto purple)
- Markdown + LaTeX + Mermaid rendering

---

## Planned Features (priority order)

1. **Google + Apple OAuth** — backend endpoints + frontend buttons + Capacitor native plugins
2. **Stripe billing** — per-user balance, usage charges, top-up flow
3. **Capacitor mobile** — `/mobile` folder wrapping the frontend
4. **UI polish** — landing page, shared layout shell, dark mode for analytics, better loading states
5. **In-chat cost display** — real-time cost per message
6. **Budget alerts** — per-user spend limits
7. **PWA support** — installable web app

---

## Coding Conventions

### General
- **TypeScript everywhere** — no `any` unless absolutely unavoidable, always type properly
- **No console.log in production code** — use proper error handling
- **No hardcoded strings** — API URLs from config, colors from theme
- **Async/await** — no raw `.then()` chains
- **Early returns** — avoid deep nesting

### Backend
- All routes in `/backend/src/routes/`
- All DB operations in `/backend/src/services/databaseService.ts`
- All middleware in `/backend/src/middleware/`
- New routes must be registered in `/backend/src/index.ts`
- Always validate request body with `express-validator`
- Always use `authMiddleware` on protected routes
- Return consistent JSON: `{ data }` on success, `{ error: message }` on failure

### Frontend
- All pages in `/frontend/src/pages/`
- All reusable components in `/frontend/src/components/`
- Feature-specific components co-located with feature
- Tailwind only for styling — no inline styles, no CSS modules
- Use `react-hot-toast` for all user notifications — never `alert()` or `confirm()`
- Use Lucide React for all icons
- Dark mode: always implement both light and dark variants

### Mobile (Capacitor)
- Lives in `/mobile/`
- Shares API service layer with frontend where possible
- Use `@capacitor/preferences` for all token/auth storage (not localStorage)
- All native plugin access must be guarded: check platform before calling native APIs
- Handle both web and native code paths cleanly

---

## What NOT to Do

- Never use `alert()`, `confirm()`, or `prompt()` — use toasts and modals
- Never hardcode API base URLs — always use the config layer
- Never commit `.env` files
- Never put business logic inside React components — extract to hooks or services
- Never edit `supabase-schema.sql` directly — create a new migration file (`supabase-migration-00X.sql`)
- Never skip TypeScript types — if you're tempted to use `any`, define the type instead
- Never add features not requested in the current task spec
- Never modify files outside your assigned feature scope (see `.ai/AGENTS.md`)

---

## Agent Pipeline

See `.ai/AGENTS.md` for the full agent workflow.

**Short version:**
1. User chats with Claude Code about a feature
2. User says "implement it" → Claude writes a spec to `.ai/specs/feature-name.md`
3. Claude provides the exact Codex CLI command to run
4. Codex implements on a feature branch
5. Claude reviews and integrates
6. User tests and approves

Specs live in `.ai/specs/`. Never delete specs after completion — they serve as documentation.
