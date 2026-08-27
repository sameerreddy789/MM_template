# Requirements Document: Mobile Music Player Redesign

## 1. Technical Stack
- **Framework**: React 18 / Vite
- **Language**: TypeScript (`.tsx`)
- **Styling**: SCSS Modules (`LandingRevamp.module.scss`) with CSS custom properties & media queries
- **Animation**: Framer Motion (container scroll reveal/hide) + Hardware-accelerated CSS Keyframes (Equalizer `.songWave`)
- **State Management**: Zustand (`useMusicStore`, `useNavVisibilityStore`)

---

## 2. Dependencies & Assets
- **Audio Element**: Global audio engine managed in `src/utils/store.ts` and `BackgroundMusic.tsx`.
- **Playlist Tracks**: Existing background tracks in `/sounds/`:
  - `Shape of U x Carnatic.mp3`
  - `FUNK DESTRAVADO slowed.mp3`
  - `bg-music.mp3`
  - `bg-music2.mp3`
- **Icons**: Inline SVG vector path transport icons (Prev, Play, Pause, Next) for crisp rendering on high-DPI retina mobile screens without extra network roundtrips.

---

## 3. Responsive & Aesthetic Constraints
- **Target Breakpoint**: `@media screen and (max-width: 730px)` and `@media (aspect-ratio < 8/12)`.
- **Theme Palette**:
  - Primary Midnight Sapphire: `rgba(8, 18, 38, 0.85)` / `#081226`
  - Secondary Ambient Glow: `rgba(56, 189, 248, 0.25)` / `#38bdf8`
  - Metallic Gold Accents: `#f2dd7c`, `#d4af37`, `rgba(242, 221, 124, 0.6)`
  - Frosted Backdrop Filter: `blur(10px)` with webkit support
- **Performance**: Zero JavaScript main-thread bottlenecks during playback; visualizer animations restricted strictly to CSS `transform: scaleY()` with `will-change: transform`.
- **Touch Optimization**: Smooth active tap states, no tap highlight boxes, touch targets >= 40px for thumbs.
