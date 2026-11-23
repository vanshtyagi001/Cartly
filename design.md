# 🎨 Cartly Design System & Language Specification

> **Cartly** is crafted with an editorial, minimalist design language that fuses contemporary Japanese architectural restraint, high-end print editorial layout (e.g., *Kinfolk*, *Cereal*), and warm tactile digital surfaces. It eschews generic e-commerce clutter in favor of intentional negative space, refined typography, and purposeful micro-interactions.

---

## 1. Design Philosophy & Principles

### 1.1 The "Warm Paper" Canvas
Unlike sterile corporate platforms that rely on pure clinical gray (`#F3F4F6`), Cartly uses an organic, warm paper/alabaster surface (`#FAF9F6`). This gives the student campus hub an inviting, tactile magazine feel while maintaining high readability.

### 1.2 Dual-Typeface Tension
The typography pairs an expressive, literary serif typeface (*Lora*) with a rigorous, high-legibility geometric sans-serif (*DM Sans*). 
- **Serif** delivers emotion, prestige, and human scale.
- **Sans-serif** handles utilitarian tasks: metrics, navigation, parameters, and form controls.

### 1.3 Architectural Grid & Hairlines
Layouts rely on crisp 1px structural dividing lines (`border-stone-200`) rather than heavy dropshadows or floating card blobs. Content aligns to structural horizontal and vertical axes reminiscent of architectural drawings.

### 1.4 Deliberate Motion & Ease
Transitions do not snap harshly; they breathe. Cartly employs custom cubic-bezier curves (`cubic-bezier(0.25, 0.1, 0.25, 1)`) and leisurely durations (up to 1.5s for image scale) to create a sense of calm and precision.

---

## 2. Color Palette & Token System

Cartly strictly adheres to a natural stone and warm monochrome palette:

```
┌────────────────────────────────────────────────────────┐
│  SURFACES                                              │
│  [#FAF9F6] Warm Paper Base  - Main canvas & backgrounds│
│  [#FFFFFF] Pure White       - Cards, inputs & sheets   │
│  [#0C0A09] Stone 950        - Footer & deep overlays   │
├────────────────────────────────────────────────────────┤
│  CONTENT & INK                                         │
│  [#1C1917] Stone 900        - Primary headlines & CTA  │
│  [#78716C] Stone 500        - Body copy & nav links    │
│  [#A8A29E] Stone 400        - Micro-labels & captions  │
├────────────────────────────────────────────────────────┤
│  STRUCTURAL LINES                                      │
│  [#E7E5E4] Stone 200        - 1px architectural borders│
│  [#F5F5F4] Stone 100        - Subtle dividers          │
└────────────────────────────────────────────────────────┘
```

### 2.1 Color Tokens Table

| Token Role | Hex Code | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Paper Canvas** | `#FAF9F6` | `bg-[#FAF9F6]` | Global page backdrop, hero background, input background |
| **Pure Surface** | `#FFFFFF` | `bg-white` | Form card surfaces, checkout rows, product detail panels |
| **Primary Ink** | `#1C1917` | `text-stone-900` / `bg-stone-900` | Headlines, primary CTA buttons, active state highlights |
| **Secondary Ink**| `#78716C` | `text-stone-500` | Paragraphs, navigation links, secondary metadata |
| **Subdued Ink**  | `#A8A29E` | `text-stone-400` | Eyebrow tags, category labels, placeholder text |
| **Deep Ink / Dark Surface** | `#0C0A09` | `bg-stone-950` | Footer background, hero reveal overlay |
| **Primary Border**| `#E7E5E4` | `border-stone-200` | Dividers, card boundaries, table rows, input strokes |
| **Subtle Border** | `#F5F5F4` | `border-stone-100` | Inner row separators, dropdown dividers |
| **Error / Alert** | `#991B1B` | `text-red-800` / `bg-red-50` / `border-red-200` | Validation errors, failed authentication alerts |
| **Success**      | `#065F46` | `text-emerald-800` / `bg-emerald-50` / `border-emerald-200` | Confirmed actions, login feedback |

---

## 3. Typography Hierarchy

Fonts are imported via Google Fonts inside `frontend/src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Lora:ital,wght@0,400..700;1,400..700&display=swap');
```

Tailwind `@theme` configuration:
- `--font-serif`: `"Lora", serif`
- `--font-sans`: `"DM Sans", sans-serif`

### 3.1 Typographic Scale & Roles

| Style Role | Font Family | Size / Leading | Weight / Tracking | Example Classes | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Lora (*serif*) | `5rem`–`8rem` / `leading-[1.05]` | Light/Medium `tracking-tighter` | `text-5xl md:text-8xl font-serif tracking-tighter` | Homepage Hero title |
| **Page Title** | Lora (*serif*) | `2.25rem`–`3rem` | Regular/Medium `tracking-tight` | `text-4xl md:text-5xl font-serif text-stone-900 tracking-tight` | "Checkout", "Your Orders", "Create Account" |
| **Section Title** | Lora (*serif*) | `1.5rem`–`1.875rem` | Regular `tracking-tight` | `text-2xl font-serif text-stone-900 tracking-tight` | "Your Cart", Product detail names |
| **Eyebrow / Kicker** | DM Sans (*sans*) | `0.625rem` (10px) | Medium/Semibold `tracking-[0.25em]`–`tracking-[0.3em]` | `text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400` | "ESSENTIALS", "CAMPUS SURVIVAL HUB" |
| **Navigation Link** | DM Sans (*sans*) | `0.6875rem` (11px) | Medium `tracking-[0.2em]` | `text-[11px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900` | Header navigation & Sign In |
| **Body Paragraph** | DM Sans (*sans*) | `0.875rem` (14px) | Regular `leading-relaxed` | `text-sm font-sans text-stone-500 leading-relaxed` | Product descriptions, sub-headings |
| **Action Label** | DM Sans (*sans*) | `0.75rem` (12px) | Medium `tracking-[0.15em]` | `text-xs uppercase tracking-[0.15em] font-medium` | Primary CTA buttons, "Confirm & Pay" |
| **Form Label** | DM Sans (*sans*) | `0.625rem` (10px) | Medium `tracking-widest` | `text-[10px] uppercase tracking-widest font-medium text-stone-500` | Input field labels, table headers |

---

## 4. Layout, Spacing & Geometry Rules

### 4.1 Sharp vs. Rounded Corners
Cartly intentionally minimizes rounded pill shapes in favor of crisp, gallery-style rectilinear geometry:
- **Buttons & Cards**: Sharp, right-angle corners (`rounded-none` or subtle default) to convey architectural precision.
- **Avatar Badges & Counter Pills**: Strict circular geometry (`rounded-full`) reserved exclusively for avatars and badge counts (e.g. cart badge count, user initial circle).

### 4.2 Proportions & Aspect Ratios
- **Catalog Grid**: `aspect-square` (1:1) with `mix-blend-multiply` image treatments on `#FAF9F6` backgrounds.
- **Editorial Portrait Frame**: `aspect-[4/5]` or `aspect-[3/4]` used in the Hero expandable panel and checkout item thumbnails.

### 4.3 Container Limits
- Max content width: `max-w-[1400px]` for spacious catalog & checkout views.
- Centered reading width: `max-w-[1000px]` for order lists.
- Focused form width: `max-w-[440px]` for authentication and login flows.

---

## 5. Component Patterns & UI Conventions

### 5.1 Primary Action Button (The "Solid Ink" CTA)
```jsx
<button className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 hover:bg-black transition-all duration-300 flex items-center justify-center gap-2">
  <span>Submit</span>
</button>
```
- **States**: `hover:bg-black`, `disabled:opacity-50 disabled:cursor-not-allowed`.

### 5.2 Form Inputs
```jsx
<div>
  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
    Email Address
  </label>
  <input
    type="email"
    className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all duration-200"
  />
</div>
```
- **Resting**: Warm paper background (`#FAF9F6`) with delicate stone border (`border-stone-200`).
- **Focus**: Transitions to crisp white (`bg-white`) with high-contrast stone border (`border-stone-900`).

### 5.3 Micro-Underline Slide Transition (Tabs & Navigation)
Active or hovered states often feature an animated hairline indicator:
```css
after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-stone-900 
after:transition-all after:duration-[400ms] after:ease-[cubic-bezier(0.25,0.1,0.25,1)] 
after:w-0 hover:after:w-full
```

### 5.4 Elevation & Shadows
Soft, diffused ambient light:
- `shadow-sm`: Used for card panels and form containers.
- `shadow-xl shadow-stone-900/5`: Floating dropdowns and menus.
- `shadow-2xl shadow-stone-900/10`: Off-canvas drawers (e.g. `CartDrawer`).

---

## 6. Motion & Interaction Design

### 6.1 Custom Cubic-Bezier Curves
```
transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
```
Used on:
- Hero expandable image viewport transitions (`duration-[1.2s]`).
- Sliding cart drawer (`duration-500`).
- Product card hover image scaling (`scale-105 duration-[1.5s]`).

### 6.2 Easter Egg Cipher Shuffle
The top brand logo ("Cartly.") features a character shuffle animation on click:
- Randomizes characters using `ABCDEFGHIJKLMNOPQRSTUVWXYZ`.
- Progressively locks in the true brand glyphs from left to right.
- Retains pure UI interaction with no route shifts.

---

## 7. Responsive Breakpoints

Cartly follows the standard Tailwind CSS viewport scale:
- **Mobile (`< 640px`)**: Full-width compact forms, 2-column catalog grids, collapsed navigation links.
- **Tablet (`md: 768px`)**: Visible horizontal navigation, 3-column catalog grid.
- **Desktop (`lg: 1024px`)**: Split checkout layout (65% item table / 35% sticky summary), 4-column catalog.
- **Wide (`xl: 1280px+`)**: 5-column product catalog, enlarged hero imagery.

---

*Document generated for Cartly / EquipU design compliance and future feature expansion.*
