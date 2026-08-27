# Design Document: Mobile Music Player Redesign (Subtle Blue & Gold)

## 1. Project & Feature Overview
Redesign the floating music player on mobile devices for the Mohana Mantra web application with a premium, subtle blue and gold glassmorphic aesthetic. The player maintains responsive parity with desktop while elevating mobile ergonomics, visual depth, and aesthetic harmony with the Indian ornate mobile hamburger navigation.

---

## 2. Page & Component Structure

### Landing Page (`LandingRevamp.tsx`) — Mobile Viewport (`<= 730px` / `max-aspect-ratio < 8/12`)

#### Floating Music Player Widget
- **Purpose**: Provide seamless ambient background audio controls (Play/Pause, Next, Previous) with dynamic visualizer feedback on mobile screens.
- **Placement**: Fixed top-left viewport corner (`top: 15px; left: 12px;`), harmoniously balanced with the top-right ornate hamburger button.
- **Visual Container (Capsule Glassmorphism)**:
  - **Backdrop**: Deep frosted midnight-sapphire glass (`rgba(8, 18, 38, 0.82)`) with `backdrop-filter: blur(10px)`.
  - **Border & Trim**: Delicate 1px - 1.5px metallic gold hairline frame (`linear-gradient(135deg, rgba(242, 221, 124, 0.7), rgba(184, 134, 11, 0.4), rgba(56, 189, 248, 0.3))`).
  - **Shadow & Glow**: Soft dual ambient halo (`box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.15), inset 0 0 8px rgba(242, 221, 124, 0.1)`).
  - **Shape**: Rounded capsule / sleek pill geometry (`border-radius: 9999px` / `24px`) with polished inner padding.
- **Controls & Typography**:
  - **Previous / Next Buttons**: Subtle brushed gold glyphs (`#f2dd7c` / `#d4af37`) with smooth tactile active scaling (`transform: scale(0.9)` on tap).
  - **Play / Pause Central Button**: Highlighted gold glyph with a subtle cyan/gold accent glow (`filter: drop-shadow(0 0 6px rgba(242, 221, 124, 0.6))`).
  - **Dividers**: Refined translucent dual-tone vertical dividers (`rgba(242, 221, 124, 0.3)`).
- **Dynamic Dual-Tone Equalizer Wave (`.songWave`)**:
  - Background audio visualizer layered subtly beneath the buttons.
  - Staggered hairline equalizer bars alternating in subtle royal blue (`#38bdf8` / `#0284c7`) and warm gold (`#f2dd7c` / `#eab308`).
  - Smooth compositor-driven `scaleY` CSS animation that rests gracefully when paused and animates when playing.

---

## 3. User Flow & Interactions
1. **Initial State**: Player rests elegantly on top-left of mobile viewport in idle/playing state.
2. **Scroll Interaction**: Automatically animates smoothly upward with spring physics alongside the navbar when scrolling down, and glides back into view when scrolling up or at top of page.
3. **Play/Pause Toggle**: Instant audio toggle via Zustand music store with reactive visualizer bar animation trigger.
4. **Track Navigation**: Previous/Next triggers track skip in the store with immediate haptic-like button scaling feedback.
5. **Touch Ergonomics**: Minimum 40px+ touch target heights with `-webkit-tap-highlight-color: transparent` to prevent mobile browser tap flashes.
