---
name: Pitch Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7974'
  outline-variant: '#bec9c3'
  surface-tint: '#0c6b54'
  primary: '#004c3a'
  on-primary: '#ffffff'
  primary-container: '#00664f'
  on-primary-container: '#90e1c4'
  inverse-primary: '#85d6b9'
  secondary: '#7c5800'
  on-secondary: '#ffffff'
  secondary-container: '#feb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#8a0015'
  on-tertiary: '#ffffff'
  tertiary-container: '#b60020'
  on-tertiary-container: '#ffc2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f3d5'
  primary-fixed-dim: '#85d6b9'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513e'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#ffba20'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#930017'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  bracket-gap-v: 24px
  bracket-gap-h: 40px
---

## Brand & Style

The design system is built to capture the electric energy of the World Cup while maintaining the rigorous clarity required for tournament brackets and sports data. The personality is "Professional Fanatic"—it balances the precision of a sports broadcast with the celebratory, vibrant spirit of a global festival.

The aesthetic follows a **Modern Sporty Minimalism**. It utilizes expansive white space and a structured grid to manage complex data, punctuated by high-energy color accents that mimic stadium lighting and turf textures. The UI should feel inviting and lightweight, avoiding the heavy, dark "gamer" aesthetic often found in sports apps in favor of a clean, daylight-infused atmosphere.

Key characteristics:
- **Clarity first:** Information hierarchy is paramount for bracket tracking.
- **Dynamic accents:** Motion and color are used to signal momentum and victory.
- **Approachable:** Softened geometry makes the competitive aspect feel friendly and inclusive.

## Colors

The palette is anchored by a deep **Pitch Green** (Primary), providing a grounded, professional foundation. **Stadium Gold** (Secondary) is used for "winner" states, trophies, and primary actions, while **Energetic Red** (Tertiary) provides high-contrast accents for live indicators and scores.

The background system relies on a clean "Off-White" (#F8FAFC) to reduce eye strain during long sessions of data entry or viewing. Neutral slates are used for borders and secondary text to maintain a soft, modern feel rather than harsh pure blacks.

- **Primary (Pitch Green):** Used for navigation, headers, and core brand elements.
- **Secondary (Stadium Gold):** Reserved for highlights, active predictions, and success states.
- **Tertiary (Energetic Red):** Used for "Live" badges, match alerts, and critical calls to action.
- **Neutral (Slate):** Used for typography, bracket lines, and empty states.

## Typography

The typographic system is designed for high-speed scanning. **Montserrat** provides a bold, geometric authority for headlines, evoking the feel of stadium signage. **Inter** is the workhorse for all UI elements, chosen for its exceptional legibility in data-heavy environments.

For specific numeric data—such as scores, group points, and times—**JetBrains Mono** is introduced to ensure tabular figures align perfectly, making it easier to compare statistics at a glance.

- **Headlines:** Use Bold or ExtraBold weights to create a strong visual anchor.
- **Data Labels:** Use the `label-caps` style for section headers (e.g., "GROUP A").
- **Scorelines:** Always use the `data-mono` role for match results to ensure character width consistency.

## Layout & Spacing

The design system uses an **8px grid system** for consistent spatial relationships. The layout philosophy is a **Fluid Grid** that adapts from a single-column mobile view to a wide-format horizontal "Tree" view for desktop brackets.

- **The Bracket View:** On desktop, use a fixed horizontal gap of 40px between tournament rounds to allow for connecting lines. On mobile, the bracket should switch to a "Round-by-Round" tabbed view or a vertically stacked accordion.
- **Margins:** 16px safe areas on mobile, expanding to 32px or centered containers on large screens.
- **Gutters:** Standardized 16px spacing between cards and match modules.

## Elevation & Depth

This design system uses **Tonal Layering** supplemented by **Ambient Shadows** to create a sense of physical cards on a digital pitch. 

- **Level 0 (Pitch):** The base background (#F8FAFC).
- **Level 1 (Match Cards):** White background with a subtle 1px border (#E2E8F0) and a soft, low-opacity shadow (Color: Primary, Blur: 12px, Opacity: 4%) to lift the card slightly.
- **Level 2 (Active/Hover):** When a user interacts with a match or prediction, the shadow deepens and gains a slight green tint to signal focus.
- **Overlay (Modals/Popovers):** Higher elevation with 15% backdrop blur to maintain context of the bracket underneath.

## Shapes

The shape language is friendly and modern. A standard radius of **12px (rounded-md)** is applied to match cards and containers to soften the data-heavy layout. 

- **Buttons & Inputs:** Use a 12px radius.
- **Selection Indicators:** Small badges (e.g., "W" or "L") use a `rounded-full` (pill) shape for immediate distinction from square-ish data cells.
- **Connectors:** Lines connecting bracket nodes should have a 4px corner radius on their bends to match the overall softness of the system.

## Components

### Buttons
- **Primary:** Stadium Gold background with Pitch Green text for maximum contrast and "celebratory" feel.
- **Secondary:** Pitch Green outline with 1px stroke.
- **State Change:** Buttons should use a subtle scale-down effect (0.98) on click to feel "squishy" and tactile.

### Match Cards
The core unit of the system. Each card displays two team flags (circular), team names, and scores. The "Winner" side is highlighted with a Stadium Gold vertical bar on the left edge.

### Chips & Badges
- **Live Badge:** Tertiary Red background with a pulsing dot animation.
- **Status Chips:** Small, pill-shaped markers for "Full Time," "Extra Time," or "Penalties" using neutral slate backgrounds.

### Input Fields
Used for score predictions. These should be centered, monospaced text fields with clear +/- steppers for a touch-friendly experience on mobile.

### Tournament Connectors
The lines between matches are #CBD5E1 (Light Slate). When a winner is selected, the path should animate to Pitch Green, visually tracing the team's journey through the bracket.