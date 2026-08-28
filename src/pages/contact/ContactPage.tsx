import ContactGallery from './components/contactGallery/ContactGallery';
import styles from './Contact.module.scss';
import doors from '/images/contact/DoorsCombined.webp';
import doorsMobile from '/images/contact/DoorsMobile.webp';
import BackButton from '../components/backButton/BackButton';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

interface HoriBarDetails {
    numOfBars: number,
    firstBarPos: number,
    barGap: number
}

export default function Contact() {

    const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 900)
    const [horiBarDetails, setHoriBarDetails] = useState<HoriBarDetails>();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);

        window.addEventListener("resize", handleResize)

        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <div className={styles.contactPageWrapper}>
            <Helmet>
                <title>Contact Us | MohanaMantra 2K26 | MBU</title>
                <meta name="description" content="Contact the organizers of MohanaMantra 2K26. Find key contact information for team members, and get in touch for partnerships, queries, or support." />
                <link rel="canonical" href="https://www.mohanamantra.com/contact" />
                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Contact Us | MohanaMantra 2K26 | MBU" />
                <meta property="og:description" content="Get in touch with the MohanaMantra 2K26 team for partnerships, queries, or support." />
                <meta property="og:image" content="https://www.mohanamantra.com/images/logo.webp" />
                <meta property="og:url" content="https://www.mohanamantra.com/contact" />
                <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Contact Us | MohanaMantra 2K26 | MBU" />
                <meta name="twitter:description" content="Reach out to the MohanaMantra 2K26 organizing team at MBU." />
                <meta name="twitter:image" content="https://www.mohanamantra.com/images/logo.webp" />
                <meta name="twitter:site" content="@Mohana_Mantra" />
            </Helmet>
            <div className={styles.contactPageBg}>
                {
                    Array(horiBarDetails?.numOfBars).fill(null).map((_, i) => 
                        <div 
                            className={styles.horiBar} 
                            key={i} 
                            style={{
                                top: `${i*(horiBarDetails?.barGap || 0) + (horiBarDetails?.firstBarPos || 0)}px`
                            }} 
                        >
                            {
                                Array(isMobile ? 5 : 3).fill(null).map(() => <div />)
                            }
                        </div>
                    )
                }
            </div>
            <div className={styles.contactPage} style={{backgroundImage: `url(${isMobile ? doorsMobile : doors})`}} >
                    {/* <div className={styles.contactBg}> */}
                    {/* <img className={styles.contactBgImg} src={door1} />
                    <img className={styles.contactBgImg} src={door2} /> */}
                    {/* <div className={styles.contactBgImg} style={{backgroundImage: door1}} />
                    <div className={styles.contactBgImg} style={{backgroundImage: door2}} />
                </div> */}
                
                <div className={styles.contactContent}>
                    <ContactGallery setHoriBarDetails={setHoriBarDetails} />
                </div>
                <BackButton className={styles.contactBB} />
            </div>
        </div>
    );
}