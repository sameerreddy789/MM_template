import BackButton from '../components/backButton/BackButton';
import styles from './Gallery.module.scss';
import galleryItemList, { HERO_COUNT } from './galleryItemList';
import GalleryItem from './GalleryItem';
import { useEffect, useRef, useState } from 'react';
import ImagePopup from './ImagePopup';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SEO from '../../components/SEO';

// The video plus its symmetric ring of 8 photos (2 above, 2 below, 2 each side) -
// a fixed cross layout, same idea as the gallery's original mosaic. Everything
// after these render below in the open-ended flowing grid. See the comment atop
// galleryItemList.ts for how to change which photos are featured here.
const heroItems = galleryItemList.slice(0, HERO_COUNT);
const restItems = galleryItemList.slice(HERO_COUNT);

function Gallery() {

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const activeImageIndex = useRef<number>(0);

    const handleGalleryItemClick = (index: number) => {
        activeImageIndex.current = index;
        setIsPopupOpen(true);
    }

    // normalizeScroll smooths the scrub animations against mobile address-bar
    // resizing. It was previously called straight from the render body, which both
    // re-ran it on every render and left it switched on globally after this page
    // unmounted - where it fights the landing page's Lenis for ownership of the
    // scroll position. Scoped to this route's lifetime instead.
    useEffect(() => {
        ScrollTrigger.normalizeScroll(true);
        // Braces matter: normalizeScroll returns an Observer, and a cleanup
        // function is not allowed to return a value.
        return () => {
            ScrollTrigger.normalizeScroll(false);
        };
    }, []);

    // The page scrolls now, so it has to undo any scroll lock a previously mounted
    // page left on the body - the landing page pins it while its intro runs.
    useEffect(() => {
        document.body.classList.remove('scroll-locked');
        document.body.style.position = 'static';
        document.body.style.overflow = '';
        document.body.style.height = '';
    }, []);

    return (
        <div className={styles.galleryPage}>
            <SEO
                title="Gallery | MohanaMantra 2K26 | MBU"
                description="Browse photos and highlights from MohanaMantra 2K26 at Mohan Babu University. Relive the magic of dance, music, drama, and tech events."
                canonicalUrl="https://mm-template.vercel.app/gallery"
            />
            <div className={styles.background} />
            <BackButton className={styles.backButton} to="/" />
            <h1 className={styles.galleryTitle}>Gallery</h1>

            <div className={styles.galleryHero}>
                {
                    heroItems.map((galleryItem, index) =>
                        <GalleryItem
                            key={index}
                            galleryItem={galleryItem}
                            index={index}
                            onClick={() => handleGalleryItemClick(index)}
                        />
                    )
                }
            </div>

            <div className={styles.galleryContent}>
                {
                    restItems.map((galleryItem, index) => 
                        <GalleryItem 
                            key={index + HERO_COUNT} 
                            galleryItem={galleryItem} 
                            index={index + HERO_COUNT} 
                            onClick={() => handleGalleryItemClick(index + HERO_COUNT)}
                        />
                    )
                }
            </div>

            {isPopupOpen && <ImagePopup index={activeImageIndex.current} onClose={() => setIsPopupOpen(false)} />}
        </div>
    )
}

export default Gallery;