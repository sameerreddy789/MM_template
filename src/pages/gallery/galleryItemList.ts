import type { CSSProperties } from "react";

interface ImageProperty {
    src: string;
    type?: 'image' | 'video' | 'youtube' | 'streamable';
    modifiers?: CSSProperties;
}

const galleryImageProperties: ImageProperty[] = [
    {
        src: '/videos/1_Glimpse_of_MM2k23.mp4',
        type: 'video',
        modifiers: { objectFit: 'contain' }
    },
    { src: '/images/gallery/top1.webp', type: 'image', modifiers: { objectFit: 'cover', objectPosition: 'center' } },
    { src: '/images/gallery/left-up.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/left-bottom.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/right-up.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/right-bottom.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/bottom1.webp', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/bottom2.webp', type: 'image', modifiers: { objectFit: 'cover' } }
]

export default galleryImageProperties;
export type { ImageProperty };