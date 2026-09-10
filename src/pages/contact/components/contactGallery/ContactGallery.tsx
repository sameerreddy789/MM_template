import styles from './ContactGallery.module.scss';
import { contactRows } from './contacts';
import ContactCardBody from './ContactCardBody';
import contactBanner from '/images/contact/contact-banner.webp'
import { useEffect, useState } from 'react';

interface HoriBarDetails {
    numOfBars: number,
    firstBarPos: number,
    barGap: number
}

/**
 * Finds the top offset of the first tag that sits on a row below the first one.
 *
 * The previous version indexed a fixed slot (`items[3]` on desktop), which only
 * held for an eight-tag, two-by-two-per-group layout. The rows are now 1 / 3 / 1,
 * so that index lands on a first-row tag and the measured gap collapses to zero.
 * Scanning for the first genuinely lower tag works for any row shape.
 */
const findSecondRowTop = (items: HTMLCollection, firstRowTop: number) => {
    for (let i = 1; i < items.length; i++) {
        const top = items[i].getBoundingClientRect().top;
        // 1px of slack absorbs sub-pixel rounding between siblings on a row.
        if (top - firstRowTop > 1) return top;
    }
    return null;
}

export default function ContactGallery({ setHoriBarDetails }: { setHoriBarDetails?: React.Dispatch<React.SetStateAction<HoriBarDetails | undefined>> }) {

    // Only used to re-measure the lattice bars; the layout itself is CSS-driven.
    const [, setViewportWidth] = useState<number>(window.innerWidth);

    useEffect(() => {
        const calculateHoriBarPos = () => {
            const contactItems = document.getElementsByClassName(styles.contactItem);
            const firstRowItem = contactItems[0];
            if (!firstRowItem) return;
            const firstRowRelPos = firstRowItem.getBoundingClientRect().top

            const secondRowRelPos = findSecondRowTop(contactItems, firstRowRelPos);
            if (secondRowRelPos === null) return;

            let barGap = Math.round(secondRowRelPos - firstRowRelPos);
            barGap = barGap / 2;

            if (barGap <= 0) return; // Prevent Invalid Array Length crash if items aren't laid out yet

            const firstRowAbsPos = firstRowRelPos + (document.scrollingElement?.scrollTop || 0);

            const firstBarPos = Math.round(firstRowAbsPos % barGap);
            const numOfBars = Math.max(0, Math.round((document.body.clientHeight - firstBarPos || 0)/barGap));

            if (setHoriBarDetails) setHoriBarDetails({numOfBars, firstBarPos, barGap})
        }

        const handleResize = () => {
            setViewportWidth(window.innerWidth)
            calculateHoriBarPos()
        }
        document.body.style.position = "static";
        calculateHoriBarPos()
        window.addEventListener("resize", handleResize)

        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <div className={styles.contactContent}>
            <div className={styles.contactHeading}>
                <img className={styles.contactBanner} src={contactBanner} alt="Contact Us"></img>
            </div>
            <div className={styles.contactRows}>
                {contactRows.map((row, rowIndex) => (
                    <div className={styles.contactRow} key={rowIndex}>
                        {row.map((contact) => (
                            <div className={styles.contactItem} key={contact.section}>
                                <ContactCardBody contact={contact} styles={styles} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
