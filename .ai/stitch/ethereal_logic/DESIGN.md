# Design System Documentation: The Ethereal Intelligence

## 1. Overview & Creative North Star
**Creative North Star: The Luminescent Curator**

This design system moves away from the "SaaS-standard" boxy layout in favor of a high-end, editorial experience. It is designed to feel like a high-performance tool wrapped in a gallery aesthetic. We achieve this through **The Luminescent Curator** principle: the UI acts as a dark, quiet gallery where the AI’s intelligence provides the only light.

To break the "template" look, we utilize **intentional asymmetry**. Large typographic headers (Sora) should be paired with generous, "unbalanced" white space to draw the eye toward key interactions. Overlapping elements—such as glass cards bleeding over section transitions—create a sense of three-dimensional depth that feels bespoke and premium.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a "Neutral-First" philosophy, using deep zinc tones to provide a canvas for our signature brand gradient.

### The Brand Gradient
- **Values:** Indigo `#6366F1` → Violet `#8B5CF6` → Fuchsia `#D946EF` (135deg).
- **Usage:** Reserved strictly for high-impact moments: Primary CTAs, active states, and data visualizations. It represents the "spark" of AI.

### Surface Hierarchy & Nesting
We reject the flat web. Hierarchy is built through **Tonal Layering**, treating the UI as a series of physical sheets of glass and obsidian.
- **Base Layer:** `surface` (#131313) or `surface_container_lowest` (#0E0E0E) for the main background.
- **Secondary Layer:** `surface_container_low` (#1C1B1B) for sidebars or secondary navigation.
- **Component Layer:** `surface_container` (#201F1F) or `surface_container_high` (#2A2A2A) for interactive cards.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. Use a `surface_container_low` section sitting against a `surface` background to define a zone. 

### The "Glass & Gradient" Rule
Floating elements (modals, popovers, hovering cards) must utilize **Glassmorphism**. 
- **Recipe:** `surface_variant` at 40% opacity + 20px Backdrop Blur. 
- This allows the underlying background to bleed through, ensuring the UI feels integrated and organic rather than "pasted on."

---

## 3. Typography

Our typography is a dialogue between geometric modernity and utilitarian precision.

| Level | Token | Font Family | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Sora | 3.5rem | Bold, geometric, authoritative. |
| **Headline** | `headline-md` | Sora | 1.75rem | Used for section titles; high contrast. |
| **Title** | `title-lg` | Inter | 1.375rem | Semi-bold; for card headers. |
| **Body** | `body-md` | Inter | 0.875rem | Standard UI text; high readability. |
| **Code** | `label-sm` | JetBrains Mono | 0.6875rem | For tokens, AI model IDs, and prompts. |

**Editorial Note:** Always use `display` and `headline` styles with tight letter-spacing (-0.02em) to maintain a "premium print" feel. Body text should have generous line height (1.6) to provide breathing room.

---

## 4. Elevation & Depth

We achieve a sense of "premium weight" through ambient light simulation rather than structural lines.

- **The Layering Principle:** Depth is achieved by "stacking" surface-container tiers. Place a `surface_container_highest` card on a `surface_container_low` section to create a soft, natural lift.
- **Ambient Shadows:** When a floating effect is required, shadows must be extra-diffused. Use a 40px blur at 8% opacity, tinted with `primary` (#C0C1FF) to mimic the glow of the screen.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: use `outline_variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** Gradient background (Indigo to Fuchsia). White text. On hover: a subtle "Gradient Glow" (box-shadow) that mimics light emitting from the button.
- **Secondary:** Ghost style. Transparent background with a 1px border using the Indigo `primary` token at 40% opacity.
- **Tertiary:** Text-only using `on_surface_variant`. No background or border.

### Glassmorphism Cards
- **Radius:** 16px (`lg`).
- **Style:** Background `surface_variant` (alpha 0.4), 20px backdrop-blur, and a subtle top-down gradient stroke (white alpha 0.1 to white alpha 0).
- **Rule:** Forbid divider lines within cards. Use `0.75rem` to `1rem` of vertical white space to separate header from body.

### Provider Badges
Specific indicators for AI models must be pill-shaped with subtle backgrounds:
- **OpenAI:** Emerald (#10B981) background at 15% opacity, Emerald text.
- **Anthropic:** Amber (#F59E0B) background at 15% opacity, Amber text.
- **Google:** Sky Blue (#0EA5E9) background at 15% opacity, Sky Blue text.

### Inputs & Fields
- **Radius:** 12px (`DEFAULT`).
- **Style:** `surface_container_highest` background. No border. On focus: A 1px outer glow using the `primary` token.

---

## 6. Do's and Don'ts

### Do
- **Do** use JetBrains Mono for all AI-generated strings or system metadata to distinguish "Machine" from "Human."
- **Do** use "Surface Nesting" to group content (e.g., a dark `surface_container_lowest` chat input inside a `surface_container_low` chat window).
- **Do** allow for generous margins (32px+) between major UI blocks to convey a premium, unhurried feeling.

### Don't
- **Don't** use 1px solid lines to separate list items. Use a `4px` gap and a slight hover state change to `surface_bright`.
- **Don't** use pure white (#FFFFFF) for body text. Use `on_surface` (#E5E2E1) to reduce eye strain in dark mode.
- **Don't** apply the brand gradient to more than two elements on a single screen. Overuse diminishes the "premium" impact.