import BackButton from '../components/backButton/BackButton';
import styles from './Brochure.module.scss';
import { Helmet } from 'react-helmet-async';
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
                    <div className={styles.brochureContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontFamily: 'var(--regFont)' }}>
                        Brochure Coming Soon...
                    </div>
                </div>
            </div>
        </div>
    )
}
