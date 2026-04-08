# DESIGN BRIEF: Own AI — Complete UI/UX Redesign

---

## PRODUCT OVERVIEW

Own AI is a premium multi-LLM chat platform that gives users access to all 
major AI models — ChatGPT (OpenAI), Claude (Anthropic), and Gemini (Google) — 
in a single, unified application with usage-based pricing.

**Core value proposition:**
Instead of paying $20/month per AI service (ChatGPT Plus + Claude Pro + Gemini 
Advanced = $60+/month), users pay only for what they actually use: raw API cost 
plus a small platform commission. There is no waste, no commitment.

**Primary target user:** University students who need AI intensively during 
exam periods and project deadlines but not year-round. Students are cost-aware, 
design-conscious, and switch fast if the product feels cheap.

**Platforms:** Web app (primary), iOS, Android, macOS desktop, Windows desktop.

**Pricing model:**
- Sign up free → get €2 in AI credits, no card required
- When credits run out → €2/month subscription + pay-as-you-go API usage
- One combined monthly charge, fully transparent per-message cost display

---

## BRAND IDENTITY

**Brand name:** Own AI
**Brand tagline options:** 
  - "All the AI. None of the waste."
  - "Every AI. One app. Pay for what you use."
  - "Make AI yours."

**Brand personality:**
  - Smart but not corporate
  - Premium but not elitist
  - Playful with restraint — personality in the details, not in-your-face
  - Trustworthy (transparent pricing is a key differentiator)
  - Empowering — "own" means ownership, control, personalization

**Brand archetype:** The Magician — makes complex, expensive things feel 
accessible and almost effortless. Transforms how students interact with AI.

---

## VISUAL IDENTITY SYSTEM

### Logo Concept
The Own AI logo should be a minimal wordmark or symbol that suggests convergence 
and intelligence. Concept: A stylized "O" or abstract node that looks like 
multiple streams converging into one point — representing all AI models 
unifying into one app. The mark should work as a single-color icon, gradient 
icon, and wordmark. Clean, geometric, modern.

---

### Color System

**Philosophy: Neutral-first. Gradient as spark.**
The brand gradient is powerful precisely because it is RESERVED. The canvas —
backgrounds, surfaces, borders, text — must be pure neutral zinc/gray. No purple
tint baked into the base layer. When the gradient appears on a button, active
state, or highlight, it feels electric against the neutral ground. If everything
is purple, nothing is. Think Linear, Vercel, Raycast — neutral canvas, color as
punctuation.

**Primary Brand Gradient:**
  Indigo #6366F1 → Violet #8B5CF6 → Fuchsia #D946EF (135deg)

  This gradient is the soul of the brand — multiple AI streams converging into
  one. None of the major AI competitors use this range. It is distinctly Own AI.

  Apply ONLY to:
    - Primary CTA buttons and their hover/glow states
    - Active/selected state indicators (left border accent, tab underline)
    - Progress bars and loading states
    - Logo mark and icon
    - Key hero graphics and decorative section accents
    - Input focus rings
    - Streaming cursor in chat

  Never apply to: base backgrounds, body text, standard borders, surface fills.

**Dark Mode (default — students overwhelmingly prefer dark)**
  Background base:    #0A0A0A  (pure near-black — zero color tint)
  Surface 1:          #111113  (sidebar, panels — neutral dark gray)
  Surface 2:          #18181B  (cards, modals — zinc-900)
  Surface 3:          #27272A  (dropdowns, elevated cards — zinc-800)
  Border subtle:      rgba(255, 255, 255, 0.06)
  Border default:     rgba(255, 255, 255, 0.10)
  Border strong:      rgba(255, 255, 255, 0.18)
  Text primary:       #FAFAFA  (pure near-white — no purple tint)
  Text secondary:     #A1A1AA  (zinc-400)
  Text muted:         #52525B  (zinc-600)

**Light Mode**
  Background base:    #FFFFFF  (pure white)
  Surface 1:          #FAFAFA  (zinc-50)
  Surface 2:          #F4F4F5  (zinc-100)
  Surface 3:          #E4E4E7  (zinc-200)
  Border subtle:      rgba(0, 0, 0, 0.06)
  Border default:     rgba(0, 0, 0, 0.10)
  Border strong:      rgba(0, 0, 0, 0.18)
  Text primary:       #09090B  (zinc-950 — near-black, no tint)
  Text secondary:     #71717A  (zinc-500)
  Text muted:         #A1A1AA  (zinc-400)

**Semantic Colors:**
  Success: #10B981 (emerald-500)
  Warning: #F59E0B (amber-400)
  Error:   #EF4444 (red-500)
  Info:    #6366F1 (brand indigo)

**AI Provider Accent Colors (applied contextually when that model is active):**
  The neutral base makes these accents vivid and impactful — they pop clearly.
  - OpenAI / ChatGPT: #10B981 (emerald)
  - Anthropic / Claude: #F59E0B (amber)
  - Google / Gemini:  #3B82F6 (sky blue)
  - Auto mode:        #8B5CF6 (violet — brand color)

  Provider accent usage:
    - Model badge: accent color at 12% opacity background + accent color border
    - Active conversation left border: 2px solid accent color
    - Chat input focus border: accent color (overrides default gradient focus)
    - Message action row icons: accent color on hover
    - All transitions: 300ms smooth color shift when switching models

---

### Typography

**Display / Hero Headlines:** "Sora" — geometric, modern, slightly rounded, 
perfect for tech products targeting a younger audience. Conveys approachability 
without losing intelligence.
  - Hero: 72px / 800 weight / tight letter spacing (-0.03em)
  - H1: 48px / 700 weight
  - H2: 36px / 700 weight
  - H3: 24px / 600 weight

**Body / UI:** "Inter" — the gold standard for product UIs. Universally readable,
trusted, optimized for screens at all sizes.
  - Body large: 16px / 400 weight / 1.6 line height
  - Body: 14px / 400 weight / 1.5 line height
  - Small/caption: 12px / 400 weight

**Monospace (for code blocks, token counts, cost numbers):** "JetBrains Mono"
  - Code blocks: 13px / 400 weight

**Number displays (cost, token count):** Use "Inter" with tabular-nums feature 
enabled so numbers don't jump when updating.

---

### Spacing & Shape System

**Border radius:**
  - Components (inputs, buttons): 12px
  - Cards and panels: 16px
  - Large modals: 24px
  - Pill badges/tags: 999px (fully rounded)
  - Avatar: 50% (circle)

**Shadows (Dark mode):**
  Neutral-tinted — no purple bleed into shadows.
  - Subtle:   0 1px 3px rgba(0,0,0,0.5)
  - Card:     0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)
  - Elevated: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)
  - Glow (CTAs only): 0 0 24px rgba(99,102,241,0.5), 0 0 48px rgba(139,92,246,0.25)
    — gradient glow reserved exclusively for primary buttons and active CTA states

**Shadows (Light mode):**
  - Subtle:   0 1px 3px rgba(0,0,0,0.08)
  - Card:     0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)
  - Elevated: 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08)

---

### UI Components Spec

**Primary Button:**
  Background: Brand gradient (indigo → violet)
  Text: White, 14px, 600 weight
  Padding: 12px 24px
  Radius: 12px
  Hover: Slight brightness increase + scale(1.02) + glow shadow
  Active: scale(0.98)
  Loading: Animated shimmer overlay on gradient

**Secondary Button:**
  Background: transparent
  Border: 1px solid border-default color (neutral)
  Text: #6366F1 (light mode) or #A5A6FF (dark mode)
  Hover: Background rgba(99,102,241,0.08), border color shifts to indigo

**Ghost Button / Icon Button:**
  No background, no border
  Text/icon: Secondary color
  Hover: Background surface + scale(1.05)

**Input Fields:**
  Background: Surface 2
  Border: 1px solid border color, transitions to indigo on focus
  Focus ring: 2px rgba(99,102,241,0.3) glow
  Radius: 12px
  Padding: 12px 16px
  Placeholder: Muted text color

**Model/Provider Badges:**
  Small pill with provider icon + model name
  Background: Provider accent color at 15% opacity
  Border: Provider accent color at 30% opacity
  Text: Provider accent color

**Cards:**
  Glassmorphism style — frosted glass look
  Background: Surface 2 + backdrop-blur(12px)
  Border: 1px solid rgba(255,255,255,0.07) [dark] / rgba(0,0,0,0.07) [light]
  Radius: 16px

---

### Motion & Animation Design System

**Philosophy:**
Motion is information, not decoration. Every animation communicates state.
Fast micro-interactions (hover, click) use snappy spring physics. Page
transitions and entrances use slightly slower, cinematic motion. 3D depth
is achieved through CSS perspective and transforms — no heavy JS libraries
required for the base experience. All animations are CSS-implementable.

**Core timing:**
  - Micro:    80–150ms  (button press, icon swap, toggle)
  - Standard: 200–300ms (dropdown open, card hover, tab switch)
  - Cinematic:350–500ms (page transition, modal, onboarding step)
  - Easing:   cubic-bezier(0.34, 1.56, 0.64, 1) for spring-feel entrances
              ease-out for exits and page-leave transitions

---

**LANDING PAGE MOTION (CSS keyframes)**

Hero Background — Animated Gradient Mesh:
  Three large radial gradient orbs placed on the hero section.
  Each orb: 700–900px diameter, brand gradient colors at 15% opacity.
  Each drifts independently on a slow infinite loop using CSS @keyframes:
    Orb 1 (indigo tint):  drifts top-left → top-right, 28s loop
    Orb 2 (violet tint):  drifts center → bottom-left, 34s loop
    Orb 3 (fuchsia tint): drifts right → center-top, 22s loop
  Result: A slowly breathing, living background that suggests intelligence.
  CSS pattern:
    @keyframes drift { 0%,100% { transform: translate(0,0) }
                       50% { transform: translate(80px,-60px) } }
    animation: drift 28s ease-in-out infinite;

Hero Headline — Staggered Word Entrance:
  H1 words animate in one by one on page load:
  Each word: opacity 0→1 + translateY(24px→0), 450ms ease-out
  Stagger: 65ms between each word. Total sequence ~600ms.

Hero Product Mockup — CSS 3D Perspective Float:
  Browser/device frame rendered with CSS 3D transform:
    transform: perspective(1200px) rotateX(6deg) rotateY(-8deg)
  Creates a natural desk-view angle — like looking at a tilted laptop screen.
  Float animation: translateY(0px→-14px→0px), 4.5s ease-in-out infinite
  On desktop mouse move: tilt tracks cursor position smoothly:
    rotateX changes ±4deg, rotateY changes ±7deg, 200ms transition lag
  Glow under mockup pulses:
    box-shadow: 0 50px 120px rgba(99,102,241,0.2) — pulses 0.2→0.35, 3s loop
  A second smaller mobile mockup sits lower-right, more dramatic angle:
    perspective(800px) rotateX(-2deg) rotateY(-18deg)

Floating Feature Badges (around the mockup):
  4 small glassmorphism badges floating near the mockup.
  Each entrance: opacity 0→1 + translateY(12px→0), staggered 250ms apart.
  Idle float: each badge on its own slow oscillation (3.2s, 4.0s, 3.6s, 4.4s)
    so they never feel synchronized — organic, independent movement.

Scroll-Driven Section Entrances (Intersection Observer):
  Every content section below the hero triggers on scroll entry (20% visible):
    Cards: opacity 0→1 + translateY(28px→0), staggered 60ms per card
    Headlines: opacity 0→1 + translateY(14px→0), 380ms ease-out
    Charts/tables: opacity 0→1 + scale(0.97→1), 400ms

Feature Bento Cards — CSS 3D Mouse-Track Tilt:
  Each card responds to mouse hover with a 3D tilt:
    transform: perspective(600px) rotateX(Ydeg) rotateY(Xdeg)
    Calculated from mouse position relative to card center. Max ±8deg.
    100ms transition while moving, 300ms spring-back on mouse leave.
  Accompanied by: translateY(-4px) + shadow deepening.
  Icon inside card is a "foreground layer": translateZ(20px→36px) on hover
    — creates a parallax depth effect with pure CSS.

Pricing Calculator — Live Number Roll Animation:
  When the slider moves, the monthly cost estimate updates with a digit-roll:
  Each digit: scaleY(1→0) exit, new digit scaleY(0→1) entrance, 120ms.
  Staggered right-to-left across digits, 20ms offset each.

---

**APP MOTION (CSS + minimal JS)**

Page / Route Transitions:
  Enter: opacity 0→1 + translateX(16px→0), 250ms ease-out
  Exit:  opacity 1→0 + translateX(-12px), 180ms ease-in
  Both run simultaneously for a smooth directional flow.

Sidebar Animations:
  New conversation appears: opacity 0→1 + translateX(-10px→0), 200ms
  Conversation deleted: opacity 1→0 + translateX(-10px) + height→0, 220ms
  Hover: background transition 120ms, action icons slide in from right
    (translateX(6px→0) + opacity 0→1), 140ms stagger between icons.
  Folder expand/collapse: height transition with ease-in-out, chevron rotates
    0→90deg, 200ms.

Model Selector Dropdown:
  Open: scaleY(0.9→1) + opacity 0→1, transform-origin top center, 200ms spring
  Each model option staggers in: 25ms delay per item from top.
  Selected item: brief background flash (highlight pulse), then dropdown closes.
  The model badge in the sidebar/input bar transitions color to new provider
  accent: 300ms color + background-color transition.

Chat Message Entrances:
  Each new message appears from below with spring:
    opacity 0→1 + translateY(14px→0) + scale(0.97→1), 280ms spring

  AI "thinking" state (before first token):
    Three dots with staggered bounce — 80ms offset each dot.
    Dots colored with brand gradient (indigo, violet, fuchsia per dot).
    When first token arrives: dots fade out 150ms, text begins streaming.

  Text streaming:
    Words appear progressively. Cursor blink at stream end:
      1px wide bar, brand gradient color, 550ms blink cycle.
    On stream complete: cursor fades out, cost pill fades in.

  Cost pill entrance (bottom of each AI message on completion):
    opacity 0→1 + scale(0.92→1), 200ms. Coin icon rotates 0→360deg once.

Input Bar Focus:
  On focus: top border transitions from border-default → 2px gradient border,
  200ms. Input area height subtly expands 8px with transition.

Provider Accent Color Transition:
  Switching models triggers a 300ms transition on all accent-colored elements:
  color, background-color, border-color all change simultaneously.
  Creates a satisfying "mode shift" moment across the whole sidebar + input.

Skeleton Loading Screens:
  All loading states use shaped skeletons matching real content layout.
  Shimmer: linear-gradient sweeps left→right, 1.4s loop.
  Dark: #18181B → #27272A → #18181B
  Light: #F4F4F5 → #E4E4E7 → #F4F4F5

Modal Entrance / Exit:
  Backdrop: rgba(0,0,0,0) → rgba(0,0,0,0.65) + backdrop-blur(0→10px), 250ms
  Card: scale(0.93→1) + opacity 0→1 + translateY(10px→0), 300ms spring
  Exit: reverse at 180ms.

Tab Switching (AI Studio, Settings):
  Active tab indicator: gradient pill slides horizontally to new position,
  200ms spring (no fade — the pill physically moves).
  Tab content: opacity 0→1 + translateX(±12px→0), 220ms.

Theme Toggle (Dark/Light):
  Sun ↔ Moon icon morphs: rotate(0→180deg) + scale(1→0→1), 300ms.
  Background colors transition: 350ms ease-in-out across all surfaces.
  A brief radial "flash" ripples from the toggle button outward, 400ms.

---

**3D DESIGN ELEMENTS (CSS-only, no Three.js)**

Landing Hero Mockup (full spec):
  Outer wrapper: perspective: 1200px
  Laptop frame: rotateX(6deg) rotateY(-8deg) rotateZ(0deg)
    — looks like a laptop slightly angled on a desk
  Screen content (the UI screenshot): fills the frame, sharp, real-looking
  Drop shadow: 0 60px 120px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1)
  Mobile device: perspective(800px) rotateX(-2deg) rotateY(-18deg)
    positioned lower-right, overlapping the laptop slightly
  On hover: laptop rotates slightly toward cursor (mouse-tracking tilt)

Onboarding Model Selection Cards:
  3D hover lean: perspective(800px) rotateY(varies with mouse X position)
  Max ±10deg rotation. 100ms during movement, 300ms spring return on leave.
  Selected card: scale(1.05) + translateZ(12px) + gradient glow underneath.

Feature Icons on Landing (Parallax Depth Layer):
  Each feature card has a foreground icon/illustration layer:
    position: absolute, transform: translateZ(20px) in a 3D context
  Background: translateZ(0px) — base layer
  On hover: icon layer shifts to translateZ(40px) + slight cursor-tracking XY
  Creates satisfying depth without any JS library.

Onboarding Celebration (Step 4 — "You're all set!"):
  CSS confetti: 40 small colored spans, each with:
    random initial positions around center, random rotation
    animation: fall down + rotate + fade, 1.2–2s duration, random delays
    Colors: brand gradient palette (indigo, violet, fuchsia, white)
  Logo mark: scale(1→1.15→1) + glow pulse, 600ms ease-in-out, plays once.

---

## PAGE 1: LANDING WEBSITE

**Mood board references:** Linear.app's polish, Vercel's dark elegance, 
Raycast's attention to detail, but warmer and more accessible for students.
Not corporate — feels like it was made by smart people who care.

**Layout: Full-width, scroll-driven, dark by default (with light mode toggle)**

---

**Section 1 — Hero**

Full viewport height. Dark background with an animated gradient mesh in the 
background — deep purple/indigo clouds that slowly shift and breathe (CSS 
animated radial gradients or Three.js particle mesh). The mesh should feel 
like neural network activity — alive, intelligent.

Top navigation bar:
  - Logo left (Own AI wordmark + icon)
  - Center: Navigation links (Features, Pricing, About)
  - Right: "Log in" ghost button + "Get started free" primary gradient button
  - Sticky, with blur backdrop on scroll: background becomes
    rgba(10,10,10,0.85) + backdrop-blur(20px) — neutral dark, not purple-tinted

Hero content centered:
  - Eyebrow label: Small pill badge with gradient border reading 
    "ChatGPT · Claude · Gemini" with tiny provider icons
  - H1 (72px, Sora 800): "All the AI." on first line. 
    "None of the waste." on second line with brand gradient text treatment.
  - Sub-headline (20px Inter 400, secondary text color): 
    "Access every major AI model in one app. Pay only for what you use — 
    not $60/month in subscriptions you barely use."
  - Two CTA buttons side by side:
    1. "Start free — no card required" (primary gradient button, large)
    2. "See how pricing works" (ghost button)
  - Below CTAs: Trust signal row — "€2 free credits • No card required • 
    Cancel anytime" with checkmark icons in brand gradient

Hero visual:
  3D floating mockup of the Own AI chat interface — either a realistic browser 
  frame or a floating device mockup (desktop + mobile stacked at slight angle). 
  The mockup shows an active chat conversation with multiple AI providers. 
  The device frame should gently float up and down (2px, 4-second loop). 
  Around the mockup: Small floating badges that appear with animation:
    - "Claude Sonnet — $0.003 per message"
    - "Web search enabled"  
    - "Voice mode active"
    - "Auto-selected best model"
  These badges orbit or float near the main mockup.

---

**Section 2 — Problem/Solution (The "Why" Section)**

Headline: "Stop paying for AI you don't use."

Two-column layout with visual comparison:

LEFT "Before Own AI":
  Stack of 3 subscription cards (ChatGPT Plus, Claude Pro, Gemini Advanced)
  Each showing: logo + "$20/month" + red strike-through
  Total at bottom: "$60/month" in red
  Below: "Whether you use it or not."

RIGHT "With Own AI":
  Single Own AI card
  Shows: "This month: €4.20" with breakdown
  Small itemized list: "32 Claude messages · 18 GPT messages · €4.20 total"
  Below: "Pay only for what you actually use."

Arrow or visual connection between the two sides. Animated counter showing 
"savings this month" increasing in real-time.

---

**Section 3 — Feature Highlights**

Headline: "Everything you need. Nothing you don't."

Bento-grid layout (like Linear's feature section) — 6 feature cards in an 
asymmetric grid. Each card has: Icon (Lucide), Feature name, 1-line description, 
and a mini visual/illustration.

Features to show:
  1. "Every AI Model" — Grid of provider logos (OpenAI, Anthropic, Google)
     with model names listed below each
  2. "Voice Mode" — Animated audio waveform visualization
  3. "PDF to Audio" — Document icon transforming into headphones
  4. "Web Search" — Globe with search results flowing in
  5. "Knowledge Buckets" — Database icon with documents/notes flowing in
  6. "Auto Model Selection" — AI brain choosing between models automatically

Cards should animate on scroll (appear from below, staggered by 60ms each).

---

**Section 4 — Live Pricing Transparency**

This is a major trust-builder and differentiator. Make it bold.

Headline: "Transparent pricing. Always."
Sub: "See exactly what each AI model costs. No surprises."

Table or card grid showing all models:
  Each row/card: Provider logo | Model name | "Input: $0.00X/1K tokens" | 
  "Output: $0.00X/1K tokens" | "~$0.00X per typical message"

Color-code by provider using the accent colors.

Below table: Interactive cost calculator
  - "How much would a typical month cost you?"
  - Slider: "Messages per day" (1-50)
  - Dropdown: Preferred model
  - Result: Live updating "~€X.XX/month" + comparison to subscription cost + savings

---

**Section 5 — Social Proof (Student-focused)**

Headline: "Built for students who think subscriptions are insane."

3 quote cards from student users:
  - Each: Photo avatar (illustrated, not real photos) + quote + 
    "Student, [University name]" + monthly savings amount
  - Quotes should feel authentic and student-specific
  - Cards rotate on a subtle carousel on mobile

---

**Section 6 — CTA Section**

Full-width gradient section (brand gradient as background, or deep dark with 
gradient text).

Large H2: "Start free today."
Body: "Get €2 in AI credits — no card required. Try every AI model, voice mode, 
web search, and more. Pay only when you love it."
Big CTA button.

---

**Section 7 — Footer**

Dark background. Logo + tagline. Three columns: Product links, Company links, 
Legal links. Bottom row: Copyright + "Made for students, by students."

---

## PAGE 2: AUTH PAGES (Login & Signup)

**Design both Login and Signup states. Both Light and Dark modes.**
**Responsive: Mobile, iPad, Desktop**

**Layout (Desktop):** Split screen
  - Left half (60%): Visual panel — animated brand gradient background with 
    floating UI mockup elements, brand tagline, and feature bullet points 
    ("All AI models in one" / "€2 free to start" / "Pay as you go"). 
    The left panel should feel premium and inviting.
  - Right half (40%): Auth form panel — clean, minimal

**Layout (Mobile/iPad):** Single column, logo at top, form below, left panel 
content collapsed into a brief tagline above the form.

**Auth form:**
  - Logo + "Own AI" wordmark at top
  - Toggle: "Log in" | "Sign up" (pill toggle, not separate pages)
  
  LOGIN form fields:
    - Email input (with mail icon prefix)
    - Password input (with lock icon, show/hide toggle)
    - "Forgot password?" link (right-aligned, small)
    - "Log in" primary gradient button (full width)
    - Divider: "— or continue with —"
    - Google OAuth button (white/surface card with Google logo + "Continue with Google")
    - Apple OAuth button (dark/black with Apple logo + "Continue with Apple")
    - Below: "Don't have an account? Sign up" link

  SIGNUP form fields:
    - Email input
    - Password input
    - Confirm password input
    - "Create account" primary gradient button
    - Same OAuth buttons
    - "€2 free credits, no card required" trust note in small muted text
    - Checkmark: "By signing up you agree to our Terms and Privacy Policy"
    - Below: "Already have an account? Log in" link

**Micro-interactions:**
  - Form fields: Focus causes border to glow with brand gradient
  - Error state: Red glow + shake animation
  - Success (login): Button transforms to checkmark with success animation
  - OAuth buttons: Hover lifts card slightly

---

## PAGE 3: MAIN CHAT APP

**This is the heart of the product. Think ChatGPT meets a premium design system.**
**Design both: (A) Empty state — no chat selected, (B) Active chat with messages**
**Both Light and Dark modes. Mobile, iPad, Desktop.**

---

**Desktop Layout (3-panel):**

LEFT PANEL — Sidebar (260px wide, collapsible to icon-only rail at 56px)

  The sidebar contains ONLY two things: the new chat button and conversation
  history. No navigation links. No tabs. No analytics. No buckets. Nothing
  else. It is a focused conversation browser — exactly like Claude.ai or
  ChatGPT's sidebar. Clean and purposeful.

  TOP AREA:
    - Own AI logo mark (small, 28px) + "Own AI" wordmark — top-left
    - "New Chat" button directly below: full-width, gradient background,
      white text, pencil/plus icon. Rounded 12px.

  SEARCH:
    - "Search conversations..." input below the new chat button.
      Subtle — icon-only (magnifier) until clicked, then expands with text.
      Background: Surface 2, no border until focused.

  CONVERSATION LIST (takes up all remaining vertical space, scrollable):
    Grouped by recency — section labels in muted text, small caps:
      "TODAY"
      "YESTERDAY"
      "THIS WEEK"
      "OLDER"
    Each conversation item:
      - Title (truncated at ~30 chars with ellipsis)
      - Right side: tiny time label ("2h ago") in muted text
      - Tiny model provider dot (3px colored circle, provider accent color)
        at the very right edge
      - Active/selected: 2px left border in current provider accent color
        + Surface 2 background (subtle elevation)
      - Hover: Surface 3 background + action icons slide in from right:
          Pencil (rename) | Folder-move | Trash (delete)
          Each 16px icon, 140ms stagger slide-in animation

    FOLDER SECTIONS (interspersed in the list, above ungrouped chats):
      - Folder header row: folder icon + folder name + chevron + chat count
      - Click to expand/collapse with smooth height animation
      - Inside: same conversation item style as above
      - "New folder" appears as a ghost row at the bottom of the folder list

  SIDEBAR FOOTER (fixed at bottom, very compact — NOT a nav bar):
    A single row of 4 small icon buttons (28px each), with tooltips on hover.
    No labels. Separated from conversation list by a subtle border-subtle line.
      1. User avatar (circular, 28px) — click opens a small popover menu:
           "Denis R." name + email at top, then:
           ─────────────────
           ⚙  Settings
           ✦  AI Studio
           📊 Analytics
           ─────────────────
           🚪 Log out
         Popover: glassmorphism card, appears above-left, spring animation
      2. Moon/Sun icon — theme toggle (dark/light)
      3. Keyboard shortcut icon (?) — opens shortcuts reference modal
      No other icons. Keep this strip minimal.

CENTER PANEL — Main chat area (fills remaining space)
  See 3A and 3B below.

---

**3A: Empty State (No chat selected / Welcome screen)**

The welcome screen replaces the chat area when no conversation is active.

Center-aligned content:
  - Own AI logo mark (large, animated — subtle breathing glow effect)
  - H2: "What can I help you with?" or "Good morning, Denis." (personalized)
  - Current model indicator: "Using [Model Name]" with provider accent color badge
  - Token/cost meter: Small indicator showing remaining credits (e.g., "€1.84 remaining")

Below greeting: 4 suggestion cards in a 2x2 grid (or horizontal row on mobile)
  Each card: Lucide icon + short prompt text
  Examples:
    - "Explain a complex topic simply"
    - "Help me write or improve text"
    - "Debug my code"
    - "Brainstorm ideas with me"
  Cards should have hover effect (slight lift, gradient border appears)

Below suggestions: Feature quick-access icon bar
  Small icons with labels: "Web Search" | "Voice Mode" | "Upload File" | 
  "Knowledge Buckets" | "PDF to Audio"

Input bar at bottom (same as active chat, see 3B)

---

**3B: Active Chat with Messages**

Chat message area (scrollable):
  The chat fills the center, with messages stacked vertically.

  USER messages:
    - Right-aligned (or full-width left-aligned — your choice)
    - Background: Brand gradient or surface 3 color
    - Rounded corners: 16px all sides, but bottom-right corners less rounded 
      (chat bubble look)
    - Contains: Text + optional file/image attachment thumbnails
    - Timestamp shown on hover

  AI ASSISTANT messages:
    - Left-aligned, full width
    - Background: Surface 2 (subtle card-like)
    - TOP of message: Provider badge ("Claude Sonnet" in amber, "GPT-5" in green, etc.)
    - Contains: Markdown rendered text, code blocks (dark surface, monospace, 
      syntax highlighted with line numbers), LaTeX math, Mermaid diagrams
    - BOTTOM of message action row (appears on hover): 
      Copy | Regenerate | Reply | Cost display ("~$0.003")
    - Streaming state: Animated typing cursor at end of text stream

  Special message elements:
    - Code blocks: Dark surface (#0A0A14) with language badge, copy button, 
      line numbers. Syntax highlighting with muted colors.
    - Inline cost indicator: Small pill at bottom of each AI message showing 
      "~$0.003 · 847 tokens" in muted text with tiny coin icon

Chat input bar (bottom, sticky):
  - Full-width frosted glass panel (backdrop-blur, slight transparency)
  - Large multiline textarea: "Ask anything..." placeholder
  - LEFT of textarea: Attachment button (+ icon → reveals upload options)
    When file attached: Preview thumbnail appears above input
  - RIGHT of textarea icon row:
    - Voice mode toggle (microphone icon)
    - Web search toggle (globe icon, shows active state)
    - Knowledge Bucket selector (database icon)
    - Send button (right arrow, gradient background, disabled when empty)
  - Below textarea: Context indicator row (small, muted)
    Shows: Active bucket name if any + context token count + "Clear context" link

Model selector dropdown (when opened):
  Full-featured dropdown modal or panel showing:
  - Sections by provider: OpenAI | Anthropic | Google | Auto
  - Each model: Name + short description + "Fast" / "Balanced" / "Most capable" tag
  - Current selection highlighted with gradient
  - Provider accent colors applied to each section

---

**Mobile Layout for Chat:**
  - Sidebar hidden by default, hamburger icon reveals it as a slide-in drawer 
    (covers 85% of screen width) with dark overlay backdrop
  - Chat fills full screen
  - Input bar sticks above keyboard
  - Model selector accessible via tap on model badge at top bar
  - Bottom navigation bar: Home | Search | New Chat | Profile
  
**iPad Layout:**
  - Sidebar always visible as narrow panel (220px)
  - Can be toggled to icon-only rail
  - Chat fills remaining space

---

## PAGE 4: SETTINGS DASHBOARD

**Tab-based settings page. Both Light and Dark. Mobile, iPad, Desktop.**

**Layout:**
  - Same sidebar navigation as main app (consistent layout shell)
  - Settings main area with tab navigation:
    - "Profile" (default)
    - "Billing & Usage" (links to Analytics section too)
    - "Security"

**Settings: Profile Tab**

User profile card at top:
  - Large avatar (circular, 80px) with edit overlay on hover (camera icon)
  - Display name (editable inline)
  - Email (shown, not editable without verification)
  - "Member since [date]" in muted text
  - Account tier badge: "Free" or "Active" with gradient

Below: Form sections with clear labels
  - "Display Name" input
  - "Email" input (disabled, with note "Contact support to change")
  - "Password" section: "Change password" collapsible form
    - Current password, New password, Confirm password
    - Update button
  - "Account" danger zone section:
    - "Delete Account" button (red, secondary/ghost style, with confirmation modal)
    - Modal should have clear warning: "This will delete all your conversations and data permanently."

**Settings: Billing Tab**

Account balance card (top, prominent):
  - Large display: "€1.84" remaining balance
  - Progress bar showing usage vs. top-up amount
  - "Top Up" CTA button (gradient)
  - "Manage subscription" link → opens Paddle customer portal

Subscription status section:
  - Current plan: "Free" or "Active (€2/month)"
  - Next billing date
  - Usage this cycle: "€2.14 used · 1,847 messages"

Recent transactions list:
  - Last 5 transactions with: Date | Description | Amount
  - "View full history" link

Payment method section:
  - Shows last 4 digits of card or payment method
  - "Manage payment methods" → Paddle portal

---

## PAGE 5: ANALYTICS DASHBOARD

**Can live as a dedicated page OR as a "Usage" tab inside Settings. Design both.**
**Data visualization heavy. Both Light and Dark. Mobile, iPad, Desktop.**

**Overview stat cards row (top):**
  4 cards in a row (2x2 on mobile):
    - Total tokens used (all time): Large animated number + subtitle
    - Total cost (all time): Large animated number + "€X.XX"
    - Total messages: Large number
    - Favorite model: Model name + provider badge

Each card: Glassmorphism style, subtle gradient border, animated number on load.

**Charts section:**

1. "Daily Usage" — Line chart (7 days or 30 days toggle)
   - Two lines: Token count (primary) + Cost in € (secondary, right axis)
   - Gradient fill under the line (indigo → transparent)
   - Interactive tooltips on hover showing: date, tokens, cost, messages
   - Time range toggle: 7 days | 30 days | All time

2. "Cost by Provider" — Donut/pie chart
   - Colored by provider accent colors (OpenAI emerald, Claude amber, Gemini blue)
   - Interactive: Click segment highlights that provider in all other charts
   - Legend below or beside with: Provider name + % share + total €

3. "Model Breakdown" — Horizontal bar chart
   - One bar per model used
   - Bars colored by provider
   - Shows: tokens used + cost in € per model

**Detailed table (below charts):**
  - Filterable by: Date range, Provider, Model
  - Columns: Model | Provider | Messages | Input tokens | Output tokens | Cost
  - Color-coded rows by provider
  - Sortable columns
  - Pagination (10 rows per page)

**Export button:** "Export CSV" — top right of table

---

## PAGE 6: AI STUDIO

**The user's personal AI workspace — everything that makes their AI uniquely
theirs. Tabs for Custom Instructions, Memory, Voice, and Knowledge Buckets.**
**Both Light and Dark. Mobile, iPad, Desktop.**

Page header (inside the main app shell, same sidebar):
  - Title: "AI Studio" (H1, Sora)
  - Subtitle: "Personalize how your AI thinks, speaks, and what it knows."
  - Header icon: A stylized "studio" mark — spark or wand icon in brand gradient

Tab navigation (horizontal pill tabs below header):
  "Instructions" | "Memory" | "Knowledge Buckets" | "Voice & Audio"
  Active tab: gradient background pill, smooth slide animation between tabs.

---

### Tab 1: Custom Instructions

Header: "Teach your AI about you."
Sub: "These instructions are injected into every conversation automatically."

Large textarea (prominent):
  - Min height 160px, expands as user types
  - Placeholder: "Tell the AI about yourself, your preferences, how you like
    responses formatted, what to avoid... Example: 'I'm a computer science
    student. Prefer concise answers with TypeScript code examples. Always
    explain your reasoning.'"
  - Bottom right: Character counter "X / 2000" with a thin gradient progress
    bar that fills as the user types — turns amber near the limit, red at max
  - "Save Instructions" button below (primary gradient, full width on mobile)

"Quick Presets" section below:
  Label: "Start from a preset →" in muted text
  Horizontal scroll row of preset chips/cards:
    - "Code Expert" (Code2 icon, emerald tint)
    - "Writing Assistant" (PenLine icon, violet tint)
    - "Math Tutor" (GraduationCap icon, amber tint)
    - "Research Analyst" (Search icon, blue tint)
    - "Reasoning Mode" (Brain icon, fuchsia tint)
  Each chip: Icon + name + 1-line description. Clicking fills the textarea
  with the preset prompt and shows a "✓ Applied" state briefly before reset.

---

### Tab 2: Memory

Header: "What your AI knows about you."
Sub: "Own AI extracts facts from your conversations automatically.
     Review and remove anything you don't want remembered."

Stats bar: "42 / 100 memories" with a thin gradient progress bar.
If nearing 100: bar turns amber with a warning tooltip.

Memory list:
  Masonry or standard list of memory cards:
    Each card:
      - Memory text (the fact, e.g. "Denis is a computer science student at TU Berlin")
      - Small tag: learned from conversation context (optional subtle label)
      - Relative timestamp ("3 days ago") in muted text
      - Delete button (X icon, right corner, red on hover, slide-out animation on delete)

Empty state (no memories):
  Centered illustrated icon (brain with empty thought bubbles)
  "No memories yet."
  "As you chat, Own AI quietly learns things about you — your name, major,
   preferences, and more. They'll appear here."

Bottom of list:
  "Clear all memories" — ghost button, red text, left-aligned.
  Clicking opens a confirmation modal:
    Title: "Clear all memories?"
    Body: "This will permanently delete all 42 memories. Your AI will start
           learning from scratch."
    Buttons: "Cancel" (ghost) | "Clear all" (red primary)

---

### Tab 3: Knowledge Buckets

Header: "Your AI's reference library."
Sub: "Create collections of notes, documents, and text. Attach any bucket
     to a conversation and the AI will always have that context available."

Top action bar:
  Left: "X buckets" count in muted text
  Right: "New Bucket" button (gradient, with + icon)

EMPTY STATE:
  Centered large illustration — stylized layered cylinders (database) with
  small document cards floating around it in brand gradient colors.
  "No knowledge buckets yet."
  "Create your first bucket — paste lecture notes, research, a project
   brief, or anything you want your AI to reference."
  "Create a bucket →" primary gradient button.

POPULATED STATE — Bucket grid:
  2-column grid (desktop/tablet), 1 column (mobile).
  Each bucket card:
    - Icon: colored cylinder/database icon, tinted in a soft brand color
    - Bucket name (Heading 4, bold)
    - Description (1-2 lines, muted, truncated with ellipsis)
    - Stats row: "X entries" + "Updated 2 days ago" in muted caption
    - Bottom row: "Open" text button (brand color) + "•••" overflow menu
      (Rename, Duplicate, Delete)
    - Hover: card lifts 3px + subtle gradient border appears
    - Selected/open state: gradient border + slight background glow

BUCKET DETAIL VIEW:
  When a bucket is opened — the right side of the page (desktop) expands
  into a split panel, OR on mobile a full-screen sheet slides up from bottom.

  Detail panel header:
    - Editable bucket name (click to edit inline, shows pencil icon on hover)
    - Editable description (same pattern)
    - "X entries" badge
    - "Attach to current chat" CTA button (if coming from a chat context)
    - Close / back button

  Entry list (below header):
    Each entry card:
      - Entry title (bold)
      - Content preview (first 3 lines of text, truncated)
      - Entry type badge: "Note" / "Code" / "Reference" / "Link"
        styled as small rounded pill with subtle color
      - Hover: reveals Edit (pencil) and Delete (trash) icon buttons
        that slide in from right

  "Add Entry" area (bottom of detail panel or floating button):
    Inline form that expands on click:
      - "Title" input
      - "Content" textarea (large, auto-expands, monospace font option toggle)
      - Entry type selector: pill toggle between Note / Code / Reference
      - "Save Entry" primary button + "Cancel" ghost button

  EMPTY bucket state (no entries yet):
    "No entries yet — add your first note, code snippet, or reference."
    Small + icon with "Add entry" link.

ATTACHING BUCKETS TO CHATS:
  Visual callout at the bottom of the Buckets tab:
    Info card with database icon:
    "How to use buckets in a chat: Open a conversation → click the
     database icon in the chat input bar → select which buckets to attach."

---

### Tab 4: Voice & Audio

Header: "Voice mode settings."
Sub: "Configure how Own AI sounds and behaves during voice conversations."

Voice selection section:
  Label: "AI Voice"
  Grid of voice option cards (2×3, or horizontal scroll on mobile):
    Each card:
      - Voice name (e.g. "Ash", "Nova", "Shimmer", "Alloy")
      - Personality descriptor in muted text ("Neutral", "Warm", "Bright")
      - "▶ Preview" button — plays a short audio sample
      - Selected state: gradient border + gradient checkmark badge top-right
      - Hover: slight lift + glow

Voice model section:
  Label: "Realtime Model"
  Three radio-card options side by side:
    - "GPT Realtime Mini" — "Fastest · Great for quick back-and-forth"
    - "GPT Realtime 1.5" — "Balanced · Recommended" (highlighted as default)
    - "GPT Realtime" — "Most natural · Slightly higher cost"

PDF to Audio defaults:
  Label: "Default podcast mode"
  Three pill toggle options:
    "Summary (4 min)" | "Narration (8 min)" | "Podcast (15 min)"

  "Secondary podcast voice" dropdown (only active when Podcast mode selected):
    Dropdown showing available voices for the second speaker
    Grayed out / disabled when Summary or Narration is selected.

"Save voice settings" button — bottom, full width on mobile.

--

## PAGE 7: ONBOARDING FLOW (Post-Signup, First-Time User)

**3-4 step onboarding wizard. Mobile and Desktop.**
**This is crucial for student conversions — make it fast, exciting, frictionless.**

Step progress indicator: Dots or numbered steps at top.

Step 1 — Welcome
  Full-screen gradient background. Own AI logo large.
  "Welcome to Own AI, Denis!"
  "You have €2.00 in free credits. Let's get you set up in 30 seconds."
  "Next →" button

Step 2 — Pick Your First AI
  "Choose your starting AI model:"
  3 large cards:
    - OpenAI / ChatGPT (emerald accent) — "Best for general tasks"
    - Claude (amber accent) — "Best for writing & analysis"  
    - Gemini (blue accent) — "Best for research & multimodal"
    - Auto (violet) — "Let us pick the best model for each question"
  Cards should animate in with stagger.
  "I'll recommend" hint text below.

Step 3 — Quick Custom Instructions (optional)
  "Tell your AI a little about you:" (optional, skip-able)
  Pre-filled suggestions as toggle chips the user can select:
    "I'm a student" / "I write code" / "I prefer concise answers" / 
    "I use LaTeX for math" / "I want step-by-step explanations"
  Selecting chips builds the instruction automatically.
  Big "Skip" ghost button + "Set up" gradient button.

Step 4 — Ready
  Celebration animation: Confetti or particle burst, logo glows
  "You're all set!"
  "Your €2.00 in credits are ready. Start your first conversation."
  "Start chatting →" button → goes to main chat page with a suggested 
  first message pre-populated as a hint.

---

## GENERAL DESIGN RULES (APPLY TO ALL PAGES)

1. **Skeleton screens everywhere, never spinners** — skeleton loading states 
   should match the exact layout of the content they are loading.

2. **Toast notifications** — bottom-right corner, glassmorphism style, 
   with success (emerald), error (red), and info (blue) variants. 
   Auto-dismiss with progress bar. Never use browser alert() dialogs.

3. **Empty states** — every list/table/grid must have a beautifully designed 
   empty state with an illustration or icon + headline + sub-text + CTA.

4. **Modal dialogs** — all confirmations (delete, clear, logout) use modals 
   with a blurred overlay backdrop. Modal slides in with scale animation. 
   Destructive actions always have a red confirmation button.

5. **Responsive behavior:**
   - Desktop (1280px+): Full sidebar + content layout
   - iPad (768px-1279px): Collapsible sidebar panel
   - Mobile (< 768px): Hidden sidebar (hamburger), bottom navigation bar for 
     key actions, full-screen panels

6. **Accessibility:**
   - All interactive elements have clear focus states (2px brand-colored 
     focus ring)
   - Sufficient color contrast on all text
   - Icon buttons always have tooltips

7. **Micro-interactions on every interactive element:**
   - Buttons scale slightly on hover and active
   - List items lift on hover
   - Checkboxes and toggles animate
   - Copy buttons transform to a checkmark for 2 seconds after copying

8. **The provider accent color system should be pervasive in the chat:**
   When Claude is the active model, amber accents appear on the model badge, 
   the active conversation in the sidebar, and subtly on the chat input border. 
   Switching models transitions all these colors smoothly.

9. **Cost transparency everywhere:**
   Small, non-intrusive cost indicators on every AI message. 
   Running total visible in the sidebar or input bar. 
   Never hidden — this is a brand differentiator.

10. **Glassmorphism applied consistently:**
    Sidebar panels, dropdowns, modals, and tooltip cards should use 
    backdrop-blur with slightly transparent surfaces — gives a layered, 
    premium depth to the interface.
