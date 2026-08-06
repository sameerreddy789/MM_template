import type { CSSProperties } from "react";

interface ImageProperty {
    src: string;
    modifiers?: CSSProperties
}

const galleryImageProperties: ImageProperty[] = [
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
    {
        src: '/images/logo.png',
        modifiers: { objectFit: 'contain', background: '#1a1a2e' }
    },
]

export default galleryImageProperties;
export type { ImageProperty };