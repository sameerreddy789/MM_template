import styles from "./MediaPartners.module.scss";
import background from "/images/mediaPartners/bg1.jpg";
import heading from "/svgs/mediaPartners/mediaHead.svg";
import dummy from "/images/logo.png";
import Back from "/svgs/registration/back.svg";
import { useContext, useEffect } from "react";
import { navContext } from "../../App";

let mediaPatners = [
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
        <button onClick={backButtonHandler} className={styles.backBtn}>
          <img src={Back} alt="Back Button" />
        </button>
        <div className={styles.backgroundImage}>
          <img src={background} alt="background image" draggable={false} />
        </div>

        <div className={styles.heading}>
          <img src={heading} alt="heading" draggable={false} />
        </div>
        <div className={styles.mediaPatners}>
          <div className={styles.otherMediaPatners}>
            {mediaPatners.map((mediaPatner, index) => (
              <a
                href={mediaPatner.link}
                target="_blank"
                rel="noreferrer"
                draggable={false}
              >
                <div key={index} className={styles.mediaPatner}>
                  {mediaPatner.head != "" && (
                    <div className={styles.head}>{mediaPatner.head}</div>
                  )}
                  <div className={styles.patnersImage}>
                    <img
                      src={mediaPatner.img}
                      alt={mediaPatner.head}
                      draggable={false}
                    />
                  </div>
                  {mediaPatner.name != "" && (
                    <div className={styles.patnersName}>{mediaPatner.name}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MediaPatners;
