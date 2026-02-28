

## Plan: Animated Rainbow "Hot Offers" Text + Realistic Fire Icon

### Changes

**1. `src/index.css` — Add two new animations:**
- **Rainbow text animation**: A `@keyframes rainbow-text` that cycles through multiple colors (green, cyan, purple, orange, gold, pink) matching the snake glow palette. Applied via a `.text-rainbow` class using `background-clip: text` with an animated gradient.
- **Fire flicker animation**: A `@keyframes fire-flicker` that makes the fire icon pulse in size, opacity, and color (orange → red → yellow) to simulate realistic flickering flames. Applied via `.fire-icon` class.

**2. `src/components/dashboard/FeaturedOffersSection.tsx` — Update the title and icon:**
- Replace the static `<Flame>` icon with a styled version wrapped in the `.fire-icon` class with orange/red colors and the flicker animation.
- Replace the static white "Hot Offers" text with a `<span>` using the `.text-rainbow` class for the cycling color effect.
- Apply to both the loading state header (line 113-114) and the main render header (line 129-130).

### Technical Details

Rainbow text: Uses `background: linear-gradient(90deg, ...)` with `background-size: 300%` and `background-clip: text`, animated via `background-position` keyframes at ~3s cycle.

Fire flicker: Combines `transform: scale()`, `filter: brightness()`, and color changes with irregular timing steps (0%, 20%, 40%, 60%, 80%, 100%) for a realistic non-uniform flicker at ~0.8s cycle.

