import styles from "./Sponsers.module.scss";
import heading from "/svgs/sponsors/sponsorsHead.webp";
import BackButton from "../components/backButton/BackButton";
import { useEffect } from "react";
import sponsors6K from "/images/sponsors/Sponsors_6K.webp";
import { motion, type Variants } from "framer-motion";


const sponsorLogos = [
  { name: "Beautiful Tirupati", img: encodeURI("/images/sponsors/Beautiful Tirupati.jpeg") },
  { name: "CS Overseas", img: encodeURI("/images/sponsors/CS-Overseas.jpeg") },
  { name: "ED-West", img: encodeURI("/images/sponsors/ED-West.jpeg") },
  { name: "IMFS", img: encodeURI("/images/sponsors/IMFS.jpeg") },
  { name: "Mango Tranquil", img: encodeURI("/images/sponsors/Mango Tranquil.jpeg") },
  { name: "MayaBazaar", img: encodeURI("/images/sponsors/MayaBazaar.jpeg") },
  { name: "Nellorians", img: encodeURI("/images/sponsors/Nellorians.jpeg") },
  { name: "Sahanah", img: encodeURI("/images/sponsors/Sahanah.jpeg") },
  { name: "Sneha", img: encodeURI("/images/sponsors/Sneha.jpeg") },
  { name: "Kalanjali", img: encodeURI("/images/sponsors/kalanjali.jpeg") },
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <img
            src={sponsors6K}
            alt="Main Sponsors Banner"
            style={{
              width: "100%",
              maxWidth: "1000px",
              height: "auto",
              objectFit: "contain",
              borderRadius: "16px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            draggable={false}
          />
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


