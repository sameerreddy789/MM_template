import { useState } from 'react';
import styles from './Gallery.module.scss';
import { type ImageProperty } from './galleryItemList';

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

    // Organic tilt for festival photo gallery:
    // - Hero items (0..8) remain crisp & straight (0deg)
    // - Row 1 concert triptych: Left card tilts toward singer (+1.2deg), Singer stands straight (0deg), Right card tilts toward singer (-1.2deg)
    // - Following cards have subtle natural polaroid angles
    let tilt = 0;
    if (index === 9) {
        tilt = 1.2; // tilts slightly toward center
    } else if (index === 10) {
        tilt = 0;   // singer in center spotlight
    } else if (index === 11) {
        tilt = -1.2; // tilts slightly toward center
    } else if (index > 11) {
        const flowingTilts = [-1.3, 1.1, -1.0, 1.4, -1.2, 0.9, -1.4, 1.2];
        tilt = flowingTilts[(index - 12) % flowingTilts.length];
    }

    return (
        <div 
            className={styles.galleryImageContainer} 
            style={{
                ...galleryItem.containerModifiers,
                '--tilt': `${tilt}deg`,
            } as any}
            onClick={onClick}
        >
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