import styles from "../../AboutUs.module.scss";
import instaicon from "/svgs/aboutus/instaicon.svg";
import yticon from "/svgs/aboutus/yticon.svg";

const SocialLinks = () => (
  <div className={styles.social}>
    <a href="https://www.youtube.com/c/MohanaMantra" target="_blank" rel="noopener noreferrer"><img src={yticon} /></a>
    <a href="https://www.instagram.com/mohana_mantra/" target="_blank" rel="noopener noreferrer"><img src={instaicon} /></a>
  </div>
);

export default SocialLinks;
