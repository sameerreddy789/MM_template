import { useState } from 'react';
import styles from './Gallery.module.scss';
import { type ImageProperty } from './galleryItemList';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface GalleryItemProps {
    galleryItem: ImageProperty;
    index: number;
    onClick: ()  => void;
}

function GalleryItem({ galleryItem, index, onClick }: GalleryItemProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    }

    const handleError = () => {
        setIsError(true);
    }

    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to(`#gallery-image-${index}`, {
            scrollTrigger: {
                trigger: `#gallery-image-${index}`,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
            scale: (0.1 * Math.random()) + 1,
            objectPosition: `center +=${(10 * Math.random())}%`,
        })
    })

    return (
        <div className={styles.galleryImageContainer} onClick={onClick}>
            {galleryItem.type === 'streamable' ? (
                <iframe 
                    className={styles.galleryImage}
                    src={`https://streamable.com/e/${galleryItem.src}?autoplay=1&loop=1`}
                    frameBorder="0"
                    allow="autoplay"
                    style={galleryItem.modifiers}
                />
            ) : galleryItem.type === 'youtube' ? (
                <iframe 
                    className={styles.galleryImage}
                    src={`https://www.youtube.com/embed/${galleryItem.src}?autoplay=1&mute=1&loop=1&playlist=${galleryItem.src}&controls=0&showinfo=0&rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ pointerEvents: 'none', ...galleryItem.modifiers }}
                />
            ) : galleryItem.type === 'video' ? (
                <video 
                    className={styles.galleryImage} 
                    style={galleryItem.modifiers}
                    src={galleryItem.src} 
                    id={`gallery-image-${index}`}
                    autoPlay loop playsInline
                    onClick={(e) => {
                        e.stopPropagation();
                        const video = e.currentTarget;
                        if (video.paused) {
                            video.play();
                        } else {
                            video.pause();
                        }
                    }}
                />
            ) : (
                <>
                    <div className={isLoading ? styles.overlayVisible : styles.overlayHidden}>
                        <p className={styles.overlayText}>{!isError ? "Loading" : "Could not load image"}</p>
                    </div>
                    <img 
                        className={styles.galleryImage} 
                        style={galleryItem.modifiers}
                        src={galleryItem.src} 
                        onLoad={handleLoad}
                        onError={handleError}
                        loading='lazy'
                        id={`gallery-image-${index}`}
                        alt={`gallery-image-${index}`}
                    />
                </>
            )}
        </div>
    )
}

export default GalleryItem;