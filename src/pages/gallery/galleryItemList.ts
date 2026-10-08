import { cdn } from "../../utils/cdn";
import type { CSSProperties } from "react";

interface ImageProperty {
    src: string;
    type?: 'image' | 'video' | 'youtube' | 'streamable';
    modifiers?: CSSProperties;
    containerModifiers?: CSSProperties;
    /** Intrinsic pixel size. Lets the browser reserve a tile's space before its lazy image arrives. */
    width?: number;
    height?: number;
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
 *
 * The last six entries (JAN*, MOU_*) are the exception to "everything is on the
 * CDN": they are served from public/images/gallery. They were converted to WebP
 * at 2048px, quality 82, EXIF/GPS stripped (98.1 MB down to 1.4 MB) and the camera
 * JPEGs were deleted from the repo.
 */

/** Video + 8 photos in the fixed cross. Keep in sync with the `.galleryHero` rules in Gallery.module.scss. */
export const HERO_COUNT = 9;

const galleryImageProperties: ImageProperty[] = [
    // --- Hero cross (fixed 9 slots: video + 2 top + 2 left + 2 right + 2 bottom) ---
    {
        src: cdn('/videos/1_Glimpse_of_MM2k23.mp4'),
        type: 'video',
    },
    { src: cdn('/images/gallery/top1.webp'), type: 'image' },         // top-left
    { src: cdn('/images/gallery/mm1.webp'), type: 'image' },          // top-right (group on red flower petal steps)
    { src: cdn('/images/gallery/left-up.webp'), type: 'image' },      // left-top
    { src: cdn('/images/gallery/left-bottom.webp'), type: 'image' },  // left-bottom
    { src: cdn('/images/gallery/gallery5.webp'), type: 'image' },     // right-top (beside the video, top)
    { src: cdn('/images/gallery/right-bottom.webp'), type: 'image' }, // right-bottom
    { src: cdn('/images/gallery/gallery1.webp'), type: 'image' },     // bottom-left (under video - live concert with neon blue lights)
    { src: cdn('/images/gallery/gallery6.webp'), type: 'image' },     // bottom-right (under video - concert stage with full truss lights)

    // --- Row 1: Concert Stage Triptych (Audience viewing the Singer in the center) ---
    { src: cdn('/images/gallery/gallery4.webp'), type: 'image' },     // Left: cheering crowd of girls with phones raised
    { src: cdn('/images/gallery/mm7.webp'), type: 'image' },          // Middle: the Singer in snakeskin jacket
    { src: cdn('/images/gallery/gallery3.webp'), type: 'image' },     // Right: concert audience facing the stage/singer

    // --- Remaining flowing festival gallery ---
    { src: cdn('/images/gallery/mm4.webp'), type: 'image' },          // Mohan Babu sir at festival stall
    { src: cdn('/images/gallery/mm5.webp'), type: 'image' },
    { src: cdn('/images/gallery/mm6.webp'), type: 'image' },

    // --- Local photos: 2048px WebP in public/images/gallery (not on the CDN) ---
    { src: '/images/gallery/JAN04159.webp', type: 'image', width: 2048, height: 1366 },
    { src: '/images/gallery/JAN04195.webp', type: 'image', width: 2048, height: 1366 },
    { src: '/images/gallery/JAN04821.webp', type: 'image', width: 2048, height: 1366 },
    { src: '/images/gallery/MOU_0710.webp', type: 'image', width: 2048, height: 1367 },
    { src: '/images/gallery/MOU_2321.webp', type: 'image', width: 2048, height: 1367 },
    { src: '/images/gallery/MOU_6557.webp', type: 'image', width: 2048, height: 1367 },
];

export default galleryImageProperties;
export type { ImageProperty };
