import { cdn } from "../../utils/cdn";
import styles from "./Sponsers.module.scss";
const heading = cdn("/svgs/sponsors/sponsorsHead.webp");
import BackButton from "../components/backButton/BackButton";
import { useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import SEO from "../../components/SEO";


const sponsorLogos = [
  { name: "Beautiful Tirupati", img: encodeURI(cdn("/images/sponsors/Beautiful_Tirupati.webp")) },
  { name: "CS Overseas", img: encodeURI(cdn("/images/sponsors/CS-Overseas.webp")) },
  { name: "ED-West", img: encodeURI(cdn("/images/sponsors/ED-West.webp")) },
  { name: "IMFS", img: encodeURI(cdn("/images/sponsors/IMFS.webp")) },
  { name: "Mango Tranquil", img: encodeURI(cdn("/images/sponsors/Mango_Tranquil.webp")) },
  { name: "MayaBazaar", img: encodeURI(cdn("/images/sponsors/MayaBazaar.webp")) },
  { name: "Nellorians", img: encodeURI(cdn("/images/sponsors/Nellorians.webp")) },
  { name: "Sahanah", img: encodeURI(cdn("/images/sponsors/Sahanah.webp")) },
  { name: "Sneha", img: encodeURI(cdn("/images/sponsors/Sneha.webp")) },
  { name: "Kalanjali", img: encodeURI(cdn("/images/sponsors/kalanjali.webp")) },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 35, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};


const Sponsors = () => {
  useEffect(() => {
    document.body.classList.remove("scroll-locked");
    document.body.style.position = "";
    document.body.style.overflow = "";
    document.body.style.height = "";
    document.documentElement.style.overflow = "";
  }, []);

  return (
    <motion.div
      className={styles.Wrapper}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        minHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        zIndex: 1,
      }}
    >
      <BackButton />
      <SEO
        title="Sponsors | MohanaMantra 2K26 | MBU"
        description="Meet the sponsors powering MohanaMantra 2K26 at Mohan Babu University. Partner with us for the biggest cultural fest."
        canonicalUrl="https://mm-template.vercel.app/sponsors"
      />
      <div className={styles.buttonWrapper}></div>

      <div className={styles.backgroundImage}></div>

      <motion.div
        className={styles.heading}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <img src={heading} alt="heading" draggable={false} />
      </motion.div>

      <div className={styles.sponsors}>
        <motion.div
          className={styles.previousSponsorsHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.badge}>✦ Previous Editions ✦</div>
          <h2 className={styles.subTitle}>Our Previous Sponsors</h2>
          <p className={styles.subDescription}>
            Proudly honoring the esteemed partners and brands who supported MohanaMantra in our previous editions.
          </p>
        </motion.div>

        {/* Dynamic Animated Sponsor Cards Grid */}
        <motion.div
          className={styles.sponsorGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ perspective: 1000 }}
        >
          {sponsorLogos.map((sponsor, index) => (
            <motion.div
              key={index}
              className={styles.sponsorCard}
              variants={cardVariants}
              whileHover={{
                scale: 1.05,
                y: -8,
                rotateX: 4,
                rotateY: -4,
                transition: { type: "spring", stiffness: 300, damping: 15 },
              }}
              whileTap={{ scale: 0.97 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className={styles.logoWrapper}>
                <img
                  src={sponsor.img}
                  alt={sponsor.name}
                  draggable={false}
                  onError={(e) => {
                    // Fallback to avoid broken image display
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className={styles.cardTitle}>{sponsor.name}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sponsors;


