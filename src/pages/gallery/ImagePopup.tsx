import { useState } from 'react';
import styles from './Gallery.module.scss';
import galleryItemList from './galleryItemList';
import { FaLeftLong, FaRightLong } from 'react-icons/fa6';
import closeButton from '/images/gallery/close_button.png'

interface ImagePopupProps {
    index: number;
    onClose: () => void;
}

export default function ImagePopup({ index, onClose }: ImagePopupProps) {
    
    const [currentImageIndex, setCurrentImageIndex] = useState(index);

    return (
        <div className={styles.imagePopup}>
            <div className={styles.imageCycleContainer}>
                <div className={styles.cycleButtonContainer}>
                    <div 
                        className={styles.cycleButton}
                        onClick={() => setCurrentImageIndex(prev => (prev - 1) < 0 ? galleryItemList.length - 1 : prev - 1)}
                    ><FaLeftLong className={styles.cycleButtonIcon} /></div>
                </div>
                <div className={styles.imagePopupImageContainer}>
                    {galleryItemList[currentImageIndex].type === 'streamable' ? (
                        <iframe 
                            className={styles.imagePopupImage}
                            src={`https://streamable.com/e/${galleryItemList[currentImageIndex].src}?autoplay=1`}
                            frameBorder="0"
                            allow="autoplay"
                            allowFullScreen
                        />
                    ) : galleryItemList[currentImageIndex].type === 'youtube' ? (
                        <iframe 
                            className={styles.imagePopupImage}
                            src={`https://www.youtube.com/embed/${galleryItemList[currentImageIndex].src}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : galleryItemList[currentImageIndex].type === 'video' ? (
                        <video
                            className={styles.imagePopupImage}
                            src={galleryItemList[currentImageIndex].src}
                            autoPlay loop controls
                            onClick={(e) => {
                                const video = e.currentTarget;
                                if (video.paused) {
                                    video.play();
                                } else {
                                    video.pause();
                                }
                            }}
                        />
                    ) : (
                        <img 
                            className={styles.imagePopupImage} 
                            src={galleryItemList[currentImageIndex].src} 
                            alt={`image-popup-${currentImageIndex}`} 
                        />
                    )}
                </div>
                <div className={styles.cycleButtonContainer}>
                    <div 
                        className={styles.cycleButton}
                        onClick={() => setCurrentImageIndex(prev => (prev + 1) === galleryItemList.length ? 0 : prev + 1)}
                    ><FaRightLong className={styles.cycleButtonIcon} /></div>
                </div>
            </div>
            <div className={styles.closeButton} onClick={onClose} style={{backgroundImage: `url(${closeButton})`}}></div>
        </div>
    )
}
