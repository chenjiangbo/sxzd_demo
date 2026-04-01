# Design System Documentation: The Institutional Architect

## 1. Overview & Creative North Star
This design system is engineered for the high-stakes environment of the guarantee and surety industry. It rejects the "disposable" feel of consumer SaaS in favor of a digital environment that feels as permanent and secure as a marble-clad financial institution.

**Creative North Star: "The Institutional Architect"**
The system is defined by structural integrity, intentional depth, and editorial precision. We move beyond the "flat" web by utilizing a sophisticated layering of surfaces and high-contrast typography. We avoid traditional grid-bound templates by using **intentional asymmetry**—such as offset headers and varied card widths—to guide the eye through dense data without overwhelming the user. The goal is to feel "Stable and Robust," communicating authority through what is *not* there (clutter, lines, flashy effects) as much as what is.

---

## 2. Colors & Surface Philosophy
The palette is rooted in Deep Navy and Professional Blue, balanced by a sophisticated range of "cool" neutrals.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Structural boundaries must be defined solely through background color shifts. 
- Use `surface` (#f8f9ff) for the base page.
- Use `surface-container-low` (#eff4ff) to define sidebar or utility regions.
- Use `surface-container-lowest` (#ffffff) for primary content cards to make them "pop" against the background without a border.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Tier 1 (Base):** `surface`
- **Tier 2 (Sectioning):** `surface-container`
- **Tier 3 (Interaction/Focus):** `surface-container-highest`

### The "Glass & Teal" Rule
For AI-driven insights or "Agent Intelligence" features, utilize the **Tertiary Cyan/Teal** tokens (`tertiary_fixed_dim`: #6bd8cb). Apply a subtle backdrop-blur (12px–20px) and a semi-transparent `surface_variant` to create a "Glassmorphism" effect for floating AI panels, distinguishing human-entered data from machine-generated suggestions.

---

## 3. Typography
We use a dual-font strategy to balance institutional authority with high-density utility.

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels modern and architectural. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) to create strong, editorial-style entry points for pages.
*   **Interface & Data (Inter):** Chosen for its exceptional legibility at small sizes. Use `body-md` (0.875rem) for standard data entry and `label-sm` (0.6875rem) for metadata and status badges.

**Hierarchy Note:** High-level financial totals should always use `headline-lg` in `primary` (#001736) to command attention, while descriptive text stays in `on_surface_variant` (#43474f) to reduce cognitive load.

---

## 4. Elevation & Depth
Depth in this system is a functional tool, not a decoration.

*   **The Layering Principle:** Instead of shadows, use "Tonal Stacking." Place a `surface-container-lowest` card on a `surface-container-low` section. The slight shift in hex value creates a soft, natural lift.
*   **Ambient Shadows:** If a component must float (e.g., a modal or dropdown), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(11, 28, 48, 0.06);`. The shadow color is derived from `on_surface`, not pure black, ensuring it feels like a natural part of the environment.
*   **Ghost Borders:** If a border is required for accessibility (e.g., input fields), use the `outline_variant` token at **20% opacity**. Never use 100% opaque, high-contrast borders.

---

## 5. Components

### Cards & Lists
*   **Cards:** Use `surface-container-lowest` with a corner radius of `lg` (0.5rem). **Never use dividers.** Use vertical white space (Spacing Scale `6` or `8`) to separate list items within a card.
*   **Data Tables:** Forbid horizontal lines. Use subtle zebra-striping with `surface-container-low` and `surface-container-lowest`. Headers should be `label-md` in all-caps with 0.05em tracking for a professional "ledger" look.

### Buttons & Inputs
*   **Primary Button:** `primary` (#001736) background with `on_primary` (#ffffff) text. Use a subtle gradient from `primary` to `primary_container` to add "soul" and depth. Radius: `md` (0.375rem).
*   **Tertiary/AI Button:** Use a `surface_variant` glass effect with a `tertiary` (#001b18) stroke at 20% opacity.
*   **Input Fields:** Use `surface-container-lowest` with a "Ghost Border." Focus states should transition the border to `secondary` (#3755c3) without changing the border width.

### Status Badges
*   Use high-saturation tokens for the container (e.g., `error_container`) but keep text high-contrast (`on_error_container`). Badges must use `full` (9999px) roundedness to contrast against the architectural squareness of the layout.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use intentional asymmetry. Align a headline to the far left while the data card is slightly inset to create an editorial feel.
*   **Do** use `Spacing 10` (2.25rem) or `12` (2.75rem) between major sections to let the "Institutional" atmosphere breathe.
*   **Do** use the Teal/Cyan tokens exclusively for AI or "Smart" suggestions to build a mental shortcut for the user.

### Don’t:
*   **Don’t** use 1px solid gray lines to separate content. It makes the SaaS look generic.
*   **Don’t** use "Cyberpunk" glows. High-end fintech is about stability, not flash.
*   **Don’t** use pure black (#000000) for text or shadows. Use `primary` (#001736) or `on_surface` (#0b1c30) for a softer, more premium contrast.
*   **Don’t** crowd the interface. If information density is high, increase the usage of `body-sm` and `label-md` rather than cramming large text into small spaces.