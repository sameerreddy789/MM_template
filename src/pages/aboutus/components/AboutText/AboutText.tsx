import styles from"../../AboutUs.module.scss"
import abtus from "/svgs/aboutus/abtus.svg";
import aboutTextBG from "/images/aboutus/abtbck.png";

interface AboutTextProps {
  isMobile: boolean;
}

const AboutText = ({ isMobile }: AboutTextProps) => (
  <div className={styles.abt}>
    <div
      className={styles.aboutback}
      style={{ backgroundImage: isMobile ? "none" : `url("${aboutTextBG}")` }}
    >
      <p>
        Mohana Mantra is the annual techno-cultural festival of Mohan Babu University
                — a vibrant celebration of student creativity, talent, and diversity. From
                music and dance to theatre and art, it brings performances, workshops,
                masterclasses, and industry talks under one platform. More than a festival,
                it's a tradition where students connect, collaborate, and create lasting
                memories showing a true reflection of the university's culture and spirit.
      </p>
    </div>
    <div className={styles.abtus}>
      <img src={abtus} alt="ABOUT US" />
      <h3>ABOUT US</h3>
    </div>
  </div>
);

export default AboutText;
