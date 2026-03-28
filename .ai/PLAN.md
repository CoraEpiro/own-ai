# Own AI — Product Roadmap

> Full plan covering UI/UX, auth, data, mobile, desktop, billing, and everything in between.
> This is a living document — update it as priorities shift.

---

## The Vision

All major AI models (ChatGPT, Claude, Gemini, and more) in one app.
No monthly subscriptions — pay only for what you use (API cost + small commission).
Available everywhere: web, iOS, Android, macOS, Windows.
Primary target: students who need AI during exams and specific periods, not year-round.

---

## Phase 1 — UI/UX Polish (Web First)
> Goal: Make the existing web app feel like a premium, finished product.

### Landing Page (does not exist yet)
- Hero section — clear value prop: "All AI models. One app. Pay only for what you use."
- Feature highlights (multi-model, voice, PDF, web search, etc.)
- Pricing explainer — show how usage-based is cheaper than subscriptions
- Call to action — Sign up / Try free
- Responsive design, dark mode support

### Navigation & Layout
- Shared layout shell — sidebar persists when navigating to Dashboard, Profile, Buckets
- Sidebar footer icon row needs visible labels (not just tooltips)
- Active state indicators on sidebar footer icons (highlight when on that page)
- Proper routing — `/settings` instead of `/profile`, consistent naming throughout
- Back navigation that doesn't send you back to chat only

### Loading & Empty States
- Replace the giant unstyled spinner (`h-32 w-32`) everywhere with a branded loader
- Skeleton screens for conversation list and message history
- Empty state personality on auth page (illustration or tagline)
- Better empty conversation state (already has welcome screen — refine it)

### Dialogs & Notifications
- Replace all `alert()` calls in AdminPage with `react-hot-toast`
- Replace `confirm()` in ProfilePage ("Clear all memories") with a proper modal
- Consistent toast positioning and styling across the app

### Analytics Dashboard
- Fix dark mode — currently hardcoded light background (`bg-gray-50`), breaks in dark mode
- Better loading state (skeleton, not spinner)
- Add pagination to all tables in AdminPage
- Make filters more intuitive

### In-Chat Experience
- Real-time cost display per message ("~$0.003") — big trust-builder for students
- Message timestamps visible on hover
- Better mobile web layout (chat input stays pinned, keyboard doesn't push content up)
- Keyboard shortcut discoverability (Cmd+K for new chat, Cmd+/, etc.)

### Settings / Profile Page
- Add password change functionality
- Add account deletion option
- Add theme preference toggle on the page (not just sidebar)
- Show join date and total usage summary

### Code Quality (enables everything above)
- Split `ChatInterface.tsx` (2321 lines) into:
  - `Sidebar.tsx`
  - `MessageList.tsx`
  - `InputBar.tsx`
  - `WelcomeScreen.tsx`
  - `VoicePanel.tsx`
- This is the most important refactor — everything else is easier after this

---

## Phase 2 — Authentication Upgrade
> Goal: Reduce signup friction, add social login, support mobile native auth.

### Google OAuth
- Backend: new `/api/auth/google` endpoint — verifies Google ID token, creates or logs in user
- Frontend: "Continue with Google" button on auth screen
- Mobile: `@codetrix-studio/capacitor-google-auth` native plugin on iOS/Android
- Store JWT same as current email/password flow

### Apple Sign-In
- **Required by Apple** if any third-party login exists on iOS
- Backend: new `/api/auth/apple` endpoint — verifies Apple identity token
- Frontend: "Continue with Apple" button (shown on Apple devices, optional on web)
- Mobile: `@capacitor-community/apple-sign-in` native plugin

### Remember Me / Biometric Auth (Mobile)
- On login success, offer "Use Face ID / Touch ID next time"
- Store JWT securely in `@capacitor/preferences` (not localStorage)
- On app open: check for stored token → biometric prompt → auto-login
- Plugin: `@capacitor-community/biometric-auth`

### Forgot Password
- "Forgot password?" link on login form
- Email reset flow via Supabase Auth email (or custom email endpoint)
- Reset password page at `/reset-password?token=...`

### Database Changes
- Add `auth_provider` column to `users` table (`email`, `google`, `apple`)
- Add `google_id` and `apple_id` columns (nullable)
- Add `avatar_url` column (populated from Google/Apple profile)

---

## Phase 3 — Data & Storage Improvements
> Goal: Move everything into Supabase (which IS PostgreSQL — no separate DB needed), eliminate client-side JSON/localStorage hacks.

### What to Fix
- Voice model/voice preference currently stored in `localStorage` → move to `users` table (persist across devices)
- Theme preference (dark/light) stored in `localStorage` → move to `users` table
- Conversation summary strategy is in-memory → ensure DB-backed with proper truncation
- PDF-to-audio job state is in-memory (server restart loses jobs) → persist jobs in a new `audio_jobs` table

### New Table: `audio_jobs`
```sql
CREATE TABLE audio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',  -- pending, processing, complete, failed, cancelled
  mode TEXT,                       -- summary, narration, podcast
  filename TEXT,
  result_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### New Columns on `users`
```sql
ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark';
ALTER TABLE users ADD COLUMN voice_model TEXT;
ALTER TABLE users ADD COLUMN voice_name TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN apple_id TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```

### User Preferences API
- `GET /api/user/preferences` — returns all user preferences
- `PUT /api/user/preferences` — updates any preference field
- Frontend syncs on login instead of reading localStorage

---

## Phase 4 — Billing & Payments
> Goal: Actually charge users — this is what turns the project into a business.

### Stripe Integration
- Backend: add `stripe` package, new `/api/billing/` route group
- User balance stored in `users.balance NUMERIC(12,4)` (in EUR/USD)
- Every AI response deducts from balance (cost + commission %)
- If balance hits zero, block new messages with a clear "Top up to continue" prompt

### Top-Up Flow
- `/billing` page — show current balance, usage this month, top-up button
- Stripe Checkout session for top-up amounts (€5, €10, €20, custom)
- Webhook: `payment_intent.succeeded` → credit user balance in DB
- Stripe Customer Portal for payment history and receipts

### Commission
- Define `COMMISSION_RATE` env var (e.g. `0.20` = 20% on top of API cost)
- Applied at charge time in the streaming endpoint
- Visible to user: "AI cost: €0.003 + service fee: €0.001 = €0.004"

### Usage Guards
- Check balance before processing each message
- Return clear error if insufficient balance (frontend shows modal, not toast)
- Add low-balance warning at €1.00 remaining
- Optional: per-user spend limit (`users.monthly_limit`)

### Admin Transactions
- The `admin_transactions` table is already built — wire it up
- Record every charge, top-up, refund as a transaction
- Admin panel already has the UI — connect it to real Stripe data

---

## Phase 5 — Mobile App (Capacitor)
> Goal: iOS + Android app shipped to App Store and Play Store.

### Setup
- Create `/mobile` folder in monorepo
- Initialize Capacitor project wrapping the `/frontend` build
- Configure `capacitor.config.ts` with app ID `com.ownai.app`
- Add iOS and Android targets

### Native Plugins to Install
| Plugin | Purpose |
|---|---|
| `@capacitor/microphone` | Voice recording |
| `@capacitor/camera` | Image capture for uploads |
| `@capacitor/filesystem` | File storage and downloads |
| `@capacitor/preferences` | Secure JWT/token storage |
| `@capacitor/push-notifications` | Push notifications |
| `@capacitor/haptics` | Haptic feedback on interactions |
| `@capacitor/status-bar` | Status bar styling |
| `@capacitor/keyboard` | Handle keyboard show/hide |
| `@codetrix-studio/capacitor-google-auth` | Google Sign-In |
| `@capacitor-community/apple-sign-in` | Apple Sign-In |
| `@capacitor-community/biometric-auth` | Face ID / Touch ID |

### Mobile-Specific UI Adjustments
- Safe area handling (notch, home indicator)
- Input stays pinned above keyboard (`@capacitor/keyboard` events)
- Pull-to-refresh on conversation list
- Native share sheet for sharing AI responses
- Bottom tab bar navigation (more natural on mobile than sidebar)
- App icon and splash screen

### Platform Guards
```typescript
import { Capacitor } from '@capacitor/core';
if (Capacitor.isNativePlatform()) {
  // use native plugin
} else {
  // use web fallback
}
```

### App Store Requirements
- Privacy policy page (required)
- Terms of service page (required)
- App Store screenshots (6.5", 5.5", iPad)
- Apple: Apple Sign-In required alongside Google login
- Google: target SDK 34+, provide data safety form

---

## Phase 6 — Desktop App (Electron)
> Goal: Polish and distribute the Electron app for macOS and Windows.

### Current State
- `/desktop` folder exists with Electron 31
- `electron-builder` configured for macOS (dmg + zip) and Windows (NSIS + portable)
- App ID: `com.ownai.desktop`

### What Needs Doing
- Wire up auto-updater (`electron-updater`) so users get updates automatically
- macOS code signing and notarization (required for Gatekeeper)
- Windows code signing (reduces "Unknown publisher" warnings)
- Native menu bar with keyboard shortcuts
- Tray icon with quick actions
- Deep link support (`ownai://`) for OAuth callbacks
- System notifications via Electron's `Notification` API

### Distribution
- macOS: Mac App Store OR direct download (dmg)
- Windows: Microsoft Store OR direct download (NSIS installer)
- Auto-update server: GitHub Releases or a simple S3 bucket

---

## Phase 7 — Growth Features
> Goal: Features that drive retention and word-of-mouth among students.

### Referral System
- Invite link generates referral code
- Referred user gets €1 credit on signup
- Referring user gets €0.50 when referred user spends their first €2
- Tracked via `referrals` table

### Sharing & Export
- Share a conversation as a public read-only link
- Export conversation as PDF or Markdown
- "Copy as Markdown" button on any AI response

### Student-Specific Features
- Study mode — focused UI, no distractions, Pomodoro timer
- Flashcard generation from any conversation
- Quiz mode — AI generates questions from uploaded notes
- Exam calendar integration (add subjects, AI reminds and offers study help)

### Team / Group Plans
- Shared workspace for study groups
- Shared knowledge buckets across team members
- Team billing — one card, split usage

### PWA (Progressive Web App)
- `manifest.json` + service worker
- "Add to Home Screen" prompt on mobile browsers
- Offline support for viewing past conversations
- Push notifications via Web Push API

---

## Technical Debt to Address Alongside Features

| Item | Priority |
|---|---|
| Split `ChatInterface.tsx` (2321 lines) | High — do in Phase 1 |
| Remove `localStorage` for preferences | Medium — Phase 3 |
| Add pagination to Admin tables | Medium — Phase 1 |
| Move PDF job state to database | Medium — Phase 3 |
| Add request logging / monitoring | Medium — before billing |
| Rate limit per user (not just per IP) | High — before billing |
| Input sanitization audit | High — before billing |
| Rotate exposed keys in `ENVIRONMENT_SETUP.md` | Critical — do now |

---

## Summary Timeline

```
Now          UI/UX polish + refactor ChatInterface
             → Landing page, layout shell, dark mode fix, modals

Next         Auth upgrade
             → Google + Apple OAuth, biometric Remember Me

Then         Data cleanup
             → Preferences to DB, audio jobs table

Then         Billing
             → Stripe top-up, balance deduction, commission

Then         Mobile
             → Capacitor setup, native plugins, App Store

Parallel     Desktop polish
             → Auto-updater, signing, distribution

Later        Growth features
             → Referrals, sharing, study tools, PWA
```
