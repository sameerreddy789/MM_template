import styles from "./Sponsers.module.scss";
import heading from "/svgs/sponsors/sponsorsHead.png";
import BackButton from "../components/backButton/BackButton";
import { useEffect } from "react";
import sponsors6K from "/images/sponsors/Sponsors_6K.png";

const Sponsors = () => {
  useEffect(() => {
    document.body.classList.remove("scroll-locked");
    document.body.style.position = "";
    document.body.style.overflow = "";
    document.body.style.height = "";
    document.documentElement.style.overflow = "";
  }, []);

  return (
    <>
      <div
        className={styles.Wrapper}
        style={{
          opacity: 1,
          transition: "opacity 0.8s ease-in-out",
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

        <div className={styles.heading}>
          <img src={heading} alt="heading" draggable={false} />
        </div>
        
        <div className={styles.sponsors}>
          <img src={sponsors6K} alt="Sponsors" style={{ width: '100%', maxWidth: '1000px', height: 'auto', objectFit: 'contain' }} draggable={false} />
        </div>
      </div>
    </>
  );
};

export default Sponsors;
