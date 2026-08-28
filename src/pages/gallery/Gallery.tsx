import BackButton from '../components/backButton/BackButton';
import styles from './Gallery.module.scss';
import galleryItemList from './galleryItemList';
import GalleryItem from './GalleryItem';
import { useRef, useState } from 'react';
import ImagePopup from './ImagePopup';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Helmet } from 'react-helmet-async';

function Gallery() {

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const activeImageIndex = useRef<number>(0);

    const handleGalleryItemClick = (index: number) => {
        activeImageIndex.current = index;
        setIsPopupOpen(true);
    }

    ScrollTrigger.normalizeScroll(true);

    return (
        <div className={styles.galleryPage}>
            <Helmet>
                <title>Gallery | MohanaMantra 2K26 | MBU</title>
                <meta name="description" content="Browse photos and highlights from MohanaMantra 2K26 at Mohan Babu University. Relive the magic of dance, music, drama, and tech events." />
                <link rel="canonical" href="https://www.mohanamantra.com/gallery" />
                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Gallery | MohanaMantra 2K26 | MBU" />
                <meta property="og:description" content="Photos and highlights from MohanaMantra 2K26 at MBU." />
                <meta property="og:image" content="https://www.mohanamantra.com/images/logo.webp" />
                <meta property="og:url" content="https://www.mohanamantra.com/gallery" />
                <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Gallery | MohanaMantra 2K26 | MBU" />
                <meta name="twitter:description" content="Photos and highlights from MohanaMantra 2K26 at MBU." />
                <meta name="twitter:image" content="https://www.mohanamantra.com/images/logo.webp" />
                <meta name="twitter:site" content="@Mohana_Mantra" />
            </Helmet>
            <div className={styles.background} />
            <BackButton className={styles.backButton} to="/" />
            <h1 className={styles.galleryTitle}>Gallery</h1>
            <div className={styles.galleryContent}>
                {
                    galleryItemList.map((galleryItem, index) => 
                        <GalleryItem 
                            key={index} 
                            galleryItem={galleryItem} 
                            index={index} 
                            onClick={() => handleGalleryItemClick(index)}
                        />
                    )
                }
            </div>

            {isPopupOpen && <ImagePopup index={activeImageIndex.current} onClose={() => setIsPopupOpen(false)} />}
        </div>
    )
}

export default Gallery;