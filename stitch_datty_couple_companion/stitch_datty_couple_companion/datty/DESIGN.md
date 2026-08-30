---
name: Datty
colors:
  surface: '#fff8f7'
  surface-dim: '#e7d6d6'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f0'
  surface-container: '#fceae9'
  surface-container-high: '#f6e4e4'
  surface-container-highest: '#f0dfde'
  on-surface: '#221919'
  on-surface-variant: '#544245'
  inverse-surface: '#382e2e'
  inverse-on-surface: '#feedec'
  outline: '#867275'
  outline-variant: '#d9c1c4'
  surface-tint: '#984259'
  primary: '#60162e'
  on-primary: '#ffffff'
  primary-container: '#7d2d44'
  on-primary-container: '#ff9bb2'
  inverse-primary: '#ffb1c1'
  secondary: '#645c5e'
  on-secondary: '#ffffff'
  secondary-container: '#e8dddf'
  on-secondary-container: '#696162'
  tertiary: '#472b2c'
  on-tertiary: '#ffffff'
  tertiary-container: '#604141'
  on-tertiary-container: '#d8aeae'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9df'
  primary-fixed-dim: '#ffb1c1'
  on-primary-fixed: '#3f0018'
  on-primary-fixed-variant: '#7a2b42'
  secondary-fixed: '#ebe0e2'
  secondary-fixed-dim: '#cfc4c6'
  on-secondary-fixed: '#201a1c'
  on-secondary-fixed-variant: '#4c4547'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#e7bcbc'
  on-tertiary-fixed: '#2d1515'
  on-tertiary-fixed-variant: '#5e3f3f'
  background: '#fff8f7'
  on-background: '#221919'
  surface-variant: '#f0dfde'
typography:
  display-lg:
    fontFamily: ebGaramond
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: ebGaramond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: ebGaramond
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-md:
    fontFamily: ebGaramond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: auto
---

## Brand & Style

This design system establishes an intimate digital sanctuary for couples. The visual direction leans into a **Premium Editorial** aesthetic, blending the warmth of a shared journal with the sophistication of a high-end lifestyle publication. 

The personality is intentionally dual-natured: **playful** in its interactions to encourage discovery, yet **secure and timeless** in its presentation to honor the gravity of a relationship. We move away from the frantic energy of dating apps toward a settled, rhythmic experience. The interface uses generous whitespace and a "quiet" UI to ensure that the couple's photos and shared memories remain the focal point. 

The aesthetic is characterized by:
- **Quiet Luxury:** High-contrast serif headings paired with expansive, breathable layouts.
- **Organic Sophistication:** A blend of soft tactile surfaces and deep, meaningful color accents.
- **Focus on Continuity:** Design elements that feel like they belong to a single, evolving story.

## Colors

The palette is anchored by the seed color, a deep berry (`#7D2D44`), which represents depth, passion, and maturity. This is balanced by a range of soft blushes and warm neutrals to keep the experience feeling approachable and light.

- **Primary (Deep Berry):** Used for key actions, active states, and brand-defining typographic moments.
- **Secondary (Soft Blush):** Primarily used for large surface areas, containers, and subtle backgrounds to soften the UI.
- **Tertiary (Warm Rose):** Applied to decorative elements, icons, and secondary buttons.
- **Neutral (Charcoal Ember):** Reserved for body text and functional UI borders to ensure high legibility without the harshness of pure black.
- **Background (Parchment):** A slightly off-white base that feels more organic and warm than a clinical white.

## Typography

The typographic system utilizes a classic serif-sans pairing to evoke a "modern heirloom" feel. 

**ebGaramond** is our voice of intimacy. Use it for all expressive moments: headings, question prompts, and reflective titles. It should never be used for functional labels or dense UI controls.

**manrope** provides the structural clarity. Its geometric yet friendly proportions make it ideal for body copy, settings, and navigation. 

For mobile screens, decrease headline sizes slightly but maintain the generous line-height to preserve the editorial "breathability." Use the `label-md` style for navigation and buttons to provide a crisp, authoritative contrast to the flowing serif headings.

## Layout & Spacing

This design system uses a **Fluid Grid** model with strict margin constraints to ensure an intimate, focused feel even on larger devices.

- **Grid:** A 4-column grid for mobile and an 8-column centered grid for tablets.
- **Philosophy:** Spacing follows a 4px base unit. We prioritize "macro-spacing" (xl and xxl) between sections to separate shared moments from functional UI, creating a sense of calm.
- **Reflow:** On desktop, content should be contained within a maximum width of 1024px to prevent photo-centric layouts from becoming overwhelming and to maintain the vertical "feed" rhythm typical of personal journals.

## Elevation & Depth

To maintain a soft and approachable atmosphere, we avoid harsh shadows and heavy borders. Depth is achieved through **Tonal Layering** and **Ambient Glows**.

- **Surfaces:** Use the secondary color (`#F8ECEE`) for containers to create a "recessed" or "pillowed" look against the parchment background.
- **Shadows:** Only use shadows on floating elements like question cards and primary action buttons. Shadows should be ultra-diffused, using the primary berry color at 5-8% opacity rather than black, creating a subtle "warm glow" effect.
- **Glassmorphism:** Use a subtle backdrop blur (12px - 20px) for the bottom navigation bar and top headers to provide a sense of depth while scrolling through photo-rich content.

## Shapes

The shape language is defined by a **Rounded** philosophy. While the base `roundedness` is set to 2 (0.5rem), this design system heavily utilizes `rounded-xl` (1.5rem) for its most visible components to create a soft, safe, and friendly environment.

- **Base Components:** Input fields and small buttons use the standard 0.5rem radius.
- **Primary Containers:** Question cards, photo frames, and modal sheets must use **1.5rem (rounded-xl)**.
- **Pill Elements:** Status indicators and the active state of the 6-tab navigation should be fully rounded (pill-shaped) to provide a playful, modern touch.

## Components

### Navigation (6-Tab System)
The bottom navigation features 6 distinct icons. Labels use `label-sm`. The active state is indicated by a soft berry-tinted pill behind the icon, rather than a simple color change, to increase the tactile feel.

### Question Deck Cards
These are the centerpiece of the app. They feature a `rounded-xl` radius, a soft berry-tinted shadow, and centered `headline-md` text in `ebGaramond`. Use a vertical swipe gesture for navigation between cards.

### Shared Moment Photo Layouts
Photos should never have sharp corners. They follow the `rounded-lg` (1rem) rule. Layouts should be asymmetrical where possible to feel like a scrapbooked journal rather than a rigid grid.

### Buttons
- **Primary:** Filled with the primary berry color, white `label-md` text, and a `rounded-lg` shape.
- **Secondary:** Outlined with a 1px berry border or a soft blush fill.
- **Playful State:** When pressed, buttons should scale down slightly (0.97) to provide haptic-like visual feedback.

### Input Fields
Inputs use a warm neutral border that thickens slightly on focus. The background is a very faint version of the secondary blush to distinguish it from the main page background.

### Chips & Tags
Used for "Moods" or "Activity Categories." These are always pill-shaped with `label-sm` typography and high contrast against their background for easy scanning.