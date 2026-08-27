# Requirements Document: Elongated Octagon Mobile Player & Header Layout

## 1. Technical Requirements
- **Framework**: React 18 / TypeScript
- **Styling**: SCSS Modules (`LandingRevamp.module.scss`, `Navbar.module.scss`)
- **Responsive Breakpoints**: `@media (max-width: 800px)`, `@media (max-width: 730px)`, `(aspect-ratio < 8/12)`
- **Animation**: CSS Keyframes + Framer Motion (synchronized header exit/enter)
- **State**: Zustand (`useMusicStore`, `useNavVisibilityStore`, `useMainHamStore`)

---

## 2. Geometry, Color Tokens & Layout Specs
- **Player Shape**: Elongated Octagon (`polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)`)
- **Header Coordinate Alignment**:
  - Left player: `top: 16px; left: 16px; height: 44px;`
  - Right hamburger: `top: 16px; right: 16px; height: 44px;`
- **Logo Coordinate Clearance**:
  - `top: clamp(75px, 11vh, 105px)`
- **Color Palette**:
  - Imperial Gold: `#f2dd7c`, `#d4af37`, `#f59e0b`
  - Cosmic Navy Glass: `rgba(6, 14, 30, 0.94)`, `rgba(10, 24, 52, 0.9)`
  - Electric Cyan Glow: `#38bdf8`, `rgba(56, 189, 248, 0.3)`
