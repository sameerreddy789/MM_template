import styles from "./ComingSoon.module.scss";
import { useContext } from "react";
import { navContext } from "../../App";
import { motion, type Variants } from "framer-motion";


const ComingSoon: React.FC = () => {
  const { goToPage } = useContext(navContext);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 35, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };


  return (
    <motion.div
      className={styles.comingSoon}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className={styles.overlay}></div>

      {/* Floating Animated Glow Orbs in Background */}
      <motion.div
        className={styles.glowOrb1}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.glowOrb2}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
          x: [0, -25, 0],
          y: [0, 25, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className={styles.glassCard}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className={styles.title}>
          Coming Soon
        </motion.h1>
        <motion.p variants={itemVariants} className={styles.subtitle}>
          The page you are looking for is currently being crafted with magic & passion.
        </motion.p>

        <motion.div variants={itemVariants} className={styles.buttons}>
          <motion.span
            onClick={() => goToPage && goToPage("/")}
            className={styles.btn}
            whileHover={{
              scale: 1.07,
              y: -4,
              boxShadow: "0 10px 30px rgba(230, 57, 70, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Go Home
          </motion.span>
          <motion.span
            onClick={() => goToPage && goToPage("/events")}
            className={`${styles.btn} ${styles.secondary}`}
            whileHover={{
              scale: 1.07,
              y: -4,
              boxShadow: "0 10px 30px rgba(238, 160, 205, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Events
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ComingSoon;

