import BackButton from '../components/backButton/BackButton';
import styles from './Brochure.module.scss';
import { Helmet } from 'react-helmet-async';
import { FaDownload } from 'react-icons/fa6';

const BROCHURE_PDF = '/MMBrochure.pdf';

export default function Brochure() {

    return (
        <div className={styles.brochurePageBg}>
            <Helmet>
                <title>Brochure | MohanaMantra 2K26 | MBU</title>
                <meta name="description" content="Download the official brochure for MohanaMantra 2K26, the grand cultural festival of Mohan Babu University." />
                <link rel="canonical" href="https://www.mohanamantra.com/brochure" />
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <div className={styles.backgroundImage}></div>
            <div className={styles.brochurePage}>
                <BackButton />
                <div className={styles.title}>Brochure</div>
                <div className={styles.brochureWrapper}>
                    <div className={styles.brochureContainer}>
                        <object data={BROCHURE_PDF} type="application/pdf" className={styles.brochureIframe} aria-label="MohanaMantra 2K26 brochure PDF viewer">
                            <iframe src={BROCHURE_PDF} className={styles.brochureIframe} title="MohanaMantra 2K26 brochure PDF viewer" />
                        </object>
                        <a
                            href={BROCHURE_PDF}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className={styles.downloadButton}
                            aria-label="Download brochure PDF"
                            title="Download brochure PDF"
                        >
                            <FaDownload />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
