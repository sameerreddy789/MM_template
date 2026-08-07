import type { CSSProperties } from "react";

interface ImageProperty {
    src: string;
    type?: 'image' | 'video' | 'youtube' | 'streamable';
    modifiers?: CSSProperties;
}

const galleryImageProperties: ImageProperty[] = [
    {
        src: 'w82a8m',
        type: 'streamable',
        modifiers: { objectFit: 'cover' }
    },
    { src: '/images/gallery/DSC07093.JPG', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/GETH0373.JPG', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/events/music.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/events/photography.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/events/dance.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/gallery/DSC07093.JPG', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/events/drama.png', type: 'image', modifiers: { objectFit: 'cover' } },
    { src: '/images/events/music.png', type: 'image', modifiers: { objectFit: 'cover' } }
]

export default galleryImageProperties;
export type { ImageProperty };