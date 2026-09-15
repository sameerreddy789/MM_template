import { cdn } from "../../../../utils/cdn";
import styles from "../../AboutUs.module.scss";
const instaicon = cdn("/svgs/aboutus/instaicon.svg");
const yticon = cdn("/svgs/aboutus/yticon.svg");

const SocialLinks = () => (
  <div className={styles.social}>
    <a href="https://www.youtube.com/c/MohanaMantra" target="_blank" rel="noopener noreferrer"><img src={yticon} /></a>
    <a href="https://www.instagram.com/mohana_mantra/" target="_blank" rel="noopener noreferrer"><img src={instaicon} /></a>
  </div>
);

export default SocialLinks;
