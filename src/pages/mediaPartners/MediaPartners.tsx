import styles from "./MediaPartners.module.scss";
import background from "/images/mediaPartners/bg1.webp";
import heading from "/svgs/mediaPartners/mediaHead.svg";
import dummy from "/images/logo.webp";
import Back from "/svgs/registration/back.svg";
import { useContext, useEffect } from "react";
import { navContext } from "../../App";
import { motion, type Variants } from "framer-motion";


const mediaPatners = [
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "",
    link: "#",
  },
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "",
    link: "#",
  },
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "",
    link: "#",
  },
  {
    head: "Official Coverage Partner",
    img: dummy,
    name: "",
    link: "#",
  },
  {
    head: "Official Outreach Partners",
    img: dummy,
    name: "",
    link: "#",
  },
  {
    head: "Official Media Partners",
    img: dummy,
    name: "",
    link: "#",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 35, scale: 0.93 },
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


const MediaPatners = () => {
  const { goToPage } = useContext(navContext);

  useEffect(() => {
    document.body.classList.remove("scroll-locked");
    document.body.style.position = "";
    document.body.style.overflow = "";
    document.body.style.height = "";
    document.documentElement.style.overflow = "";
  }, []);

  const backButtonHandler = () => {
    goToPage?.("/");
  };

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
      <motion.button
        onClick={backButtonHandler}
        className={styles.backBtn}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        <img src={Back} alt="Back Button" />
      </motion.button>

      <div className={styles.backgroundImage}>
        <img src={background} alt="background image" draggable={false} />
      </div>

      <motion.div
        className={styles.heading}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <img src={heading} alt="heading" draggable={false} />
      </motion.div>

      <div className={styles.mediaPatners}>
        <motion.div
          className={styles.otherMediaPatners}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ perspective: 1000 }}
        >
          {mediaPatners.map((mediaPatner, index) => (
            <motion.a
              key={index}
              href={mediaPatner.link}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              variants={cardVariants}
              whileHover={{
                scale: 1.04,
                y: -8,
                rotateX: 3,
                rotateY: -3,
                transition: { type: "spring", stiffness: 300, damping: 15 },
              }}
              whileTap={{ scale: 0.97 }}
              style={{ transformStyle: "preserve-3d", textDecoration: "none" }}
            >
              <div className={styles.mediaPatner}>
                {mediaPatner.head !== "" && (
                  <div className={styles.head}>{mediaPatner.head}</div>
                )}
                <div className={styles.patnersImage}>
                  <img
                    src={mediaPatner.img}
                    alt={mediaPatner.head}
                    draggable={false}
                  />
                </div>
                {mediaPatner.name !== "" && (
                  <div className={styles.patnersName}>{mediaPatner.name}</div>
                )}
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MediaPatners;

