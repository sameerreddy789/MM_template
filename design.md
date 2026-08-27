# Design Document: Mobile Music Player & Header Refinements

## 1. Overview & Objectives
Refine the mobile UI layout and music player based on specific design requirements:
1. **Elongated Octagon Music Player**: Transform the mobile music player geometry into a sleek, elongated octagon with precision chamfered/beveled 45° corners, crisp dual-tone gold/cyan metallic border, and deep midnight-sapphire glassmorphism.
2. **Header Alignment**: Perfectly align the music player on the top-left with the hamburger menu on the top-right across mobile viewports (identical top offset `16px`, matched vertical center and bounding height).
3. **MM Logo Positioning**: Adjust mobile `.logoContainer` top offset to `clamp(75px, 11vh, 105px)` so it rests gracefully in the sky expanse, clear of the top header controls and without covering the Gopuram temple tower in the background.

---

## 2. Geometry & Component Architecture

### 2.1 Elongated Octagonal Player (`.playerMain`)
- **Silhouette**: 8-sided polygon with symmetrical 45° corner bevels:
  `clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)`.
- **Border Treatment**: Ultra-sharp vector stroke with SVG outline and dual gold/cyan gradient (`#f2dd7c` → `#38bdf8` → `#d4af37`), accented with 4 corner diamond notches.
- **Glass Backdrop**: Premium midnight sapphire gradient (`linear-gradient(135deg, rgba(6, 14, 30, 0.94) 0%, rgba(10, 24, 52, 0.9) 50%, rgba(6, 14, 30, 0.96) 100%)`) with `16px` frosted glass blur.
- **Controls & Equalizer**:
  - Crisp, minimal vector transport buttons (Prev, Play/Pause, Next) with active press micro-interactions.
  - Subtle integrated cyan/gold equalizer wave (`.songWave`) animating along the bottom facet of the octagon during playback.

### 2.2 Top Header Symmetry & Alignment
- **Positioning**: Both `.musicControlsContainer` (left) and `.nav` with `.hamMenuBtn` (right) positioned at `top: 16px` with symmetric horizontal padding (`16px`).
- **Dimensions**: Synchronized 44px container heights ensuring exact baseline and vertical alignment.
- **Scroll Response**: Synchronous spring exit animation (`y: -140px`, `opacity: 0`) when scrolling down, returning on scroll up.

### 2.3 Mobile Logo & Gopuram Clearance
- Adjusted `.logoContainer` mobile offset to `top: clamp(75px, 11vh, 105px)` and width `min(270px, 62vw)` to ensure ample breathing room between the top controls and the temple Gopuram below.
