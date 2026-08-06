import BackButton from '../components/backButton/BackButton';
import styles from './Brochure.module.scss';
import { FaDownload } from 'react-icons/fa6';

const pdfFile = "/Brochure.pdf";

export default function Brochure() {

    return (
        <div className={styles.brochurePageBg}>
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
