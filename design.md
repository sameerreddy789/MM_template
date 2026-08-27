# Design Document: Mobile Music Player Redesign (Elevated Ornate Indian Blue & Gold)

## 1. Project & Feature Overview
Redesign the mobile music player from a generic pill into an elevated, designer-grade **Ornate Royal Indian & Cyber-Mythic HUD Player**. The widget pairs with the ornate mobile hamburger button, incorporating traditional temple toran finials, lotus/chakra motifs, sacred geometric gold lattice, a central sunburst medallion for the play button, and an ultra-refined glowing audio wave.

---

## 2. Visual Architecture & SVG Design System

### 2.1 Outer Frame & Filigree Borders
- **Silhouette**: Elegant beveled cartridge / ornate stepped architectural cartouche with temple bracket corner notches.
- **Flanking Motifs (Left & Right Wings)**: Detailed SVG filigree featuring sacred lotus petals, gold chevron accents, and miniature sapphire gems.
- **Glassmorphism Backdrop**: Multi-stop deep cosmic navy glass (`linear-gradient(135deg, rgba(6, 14, 30, 0.94) 0%, rgba(10, 24, 52, 0.88) 50%, rgba(5, 12, 26, 0.96) 100%)`) with `14px` blur.
- **Border Trim**: Double-line metallic gold filigree (`linear-gradient(90deg, #d4af37, #fff2a8, #d4af37, #38bdf8, #d4af37)`) with etched corner brackets (`border-image` / SVG vector overlays).

### 2.2 Central Sunburst Medallion (Play / Pause)
- **Central Focus**: A circular golden chakra/mandala halo surrounding the play/pause button.
- **State Changes**:
  - *Playing*: Medallion glows with a warm sapphire & gold aura (`drop-shadow(0 0 10px rgba(242, 221, 124, 0.75))`) and subtle slow rotation/pulsing rhythm.
  - *Paused*: Soft metallic gold sheen.
- **Icons**: Custom sharp, royal Indian stylized Play and Pause vectors with diamond cuts.

### 2.3 Flanking Transport Controls (Prev & Next)
- **Vectors**: Custom carved arrowhead glyphs with toran diamond notches.
- **Interactions**: Tactile active press response (`transform: scale(0.88)`) with shimmering cyan-gold spark.

### 2.4 Ultra-Refined Micro-Equalizer (`.songWave`)
- **Integration**: Refined, hairline soundwave array recessed gracefully along the lower trim with rounded tops, glowing from royal cyan (`#38bdf8`) into warm imperial gold (`#f2dd7c`), ensuring zero visual clutter behind icons.

---

## 3. Component Flow & Interactions
- Seamless sync with navigation scroll physics.
- Haptic-like visual scaling and zero tap highlight latency.
