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
    { src: '/images/gallery/top1.png', type: 'image', modifiers: { objectFit: 'cover', objectPosition: 'center' } },
    { src: '/images/gallery/left-up.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/left-bottom.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/right-up.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/right-bottom.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/bottom1.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/bottom2.png', type: 'image', modifiers: { objectFit: 'cover' } }
]

export default galleryImageProperties;
export type { ImageProperty };