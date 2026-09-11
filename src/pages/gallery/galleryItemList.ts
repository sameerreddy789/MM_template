import type { CSSProperties } from "react";

interface ImageProperty {
    src: string;
    type?: 'image' | 'video' | 'youtube' | 'streamable';
    modifiers?: CSSProperties;
    containerModifiers?: CSSProperties;
}

/**
 * Gallery.tsx splits this array into two pieces by position:
 *
 * - The first HERO_COUNT entries (the video plus 8 photos) render in
 *   `.galleryHero`, a fixed symmetric cross: video centred, 2 photos above,
 *   2 below, 2 left, 2 right. This is a deliberate, hand-placed layout for
 *   exactly 9 items, the same way the whole gallery used to be pinned by
 *   `nth-child` - it is kept intentionally fixed-size rather than made to
 *   flow, because a symmetric cross does not have a general rule for "one
 *   more photo".
 * - Everything after that flows into `.galleryContent`, an open-ended grid
 *   that takes any number of photos.
 *
 * To change which photos are featured in the cross, move entries above or
 * below the HERO_COUNT line - nothing else needs editing. The current split
 * is a positional choice, not a curated one: slots 2-5 are the four photos
 * that were already in the gallery (kept for continuity), slots 6-9 are
 * simply the first four 2K25 photos in file order. Swap in whichever of your
 * photos you'd rather see featured.
 *
 * The 2K25 photos were converted from the camera originals to WebP capped at
 * 1600px, which took them from 57.5 MB to 2.05 MB across the thirteen. If more
 * are added, do the same rather than dropping raw JPGs in: unconverted, these
 * alone outweighed the entire JS bundle by fifty times.
 */

/** Video + 8 photos in the fixed cross. Keep in sync with the `.galleryHero` rules in Gallery.module.scss. */
export const HERO_COUNT = 9;

const galleryImageProperties: ImageProperty[] = [
    // --- Hero cross (fixed 9 slots: video + 2 top + 2 left + 2 right + 2 bottom) ---
    {
        src: '/videos/1_Glimpse_of_MM2k23.mp4',
        type: 'video',
        modifiers: { objectFit: 'contain' }
    },
    { src: '/images/gallery/top1.webp', type: 'image', modifiers: { objectFit: 'cover', objectPosition: 'center' } },       // top-left
    { src: '/images/gallery/gallery1.webp', type: 'image', modifiers: { objectFit: 'cover' } },                            // top-right
    { src: '/images/gallery/left-up.webp', type: 'image', modifiers: { objectFit: 'cover' } },                             // left-top
    { src: '/images/gallery/left-bottom.webp', type: 'image', modifiers: { objectFit: 'cover' } },                         // left-bottom
    { src: '/images/gallery/gallery2.webp', type: 'image', modifiers: { objectFit: 'cover' } },                            // right-top
    { src: '/images/gallery/right-bottom.webp', type: 'image', modifiers: { objectFit: 'cover' } },                        // right-bottom
    { src: '/images/gallery/mm1.webp', type: 'image', modifiers: { objectFit: 'cover', objectPosition: 'center' } },       // bottom-left (under video)
    { src: '/images/gallery/mm2.webp', type: 'image', modifiers: { objectFit: 'cover', objectPosition: 'center' } },       // bottom-right (under video)

    // --- Flows below the cross, in any quantity ---
    { src: '/images/gallery/gallery3.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/gallery4.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/gallery5.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { 
        src: '/images/gallery/gallery6.webp', 
        type: 'image', 
        modifiers: { objectFit: 'contain', backgroundColor: '#0a0a0a' },
        containerModifiers: { gridColumn: 'span 2', gridRow: 'span 2' }
    }, // Full view of concert stage with truss lights
    { src: '/images/gallery/mm3.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/mm4.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/mm5.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/mm6.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { 
        src: '/images/gallery/mm7.webp', 
        type: 'image', 
        modifiers: { objectFit: 'contain', backgroundColor: '#0a0a0a' },
        containerModifiers: { gridColumn: 'span 2', gridRow: 'span 2' }
    }  // Full portrait view of singer without cropping
]

export default galleryImageProperties;
export type { ImageProperty };
