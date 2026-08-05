import styles from "./MediaPartners.module.scss";
import background from "/images/mediaPartners/bg1.jpg";
import heading from "/svgs/mediaPartners/mediaHead.svg";
import dummy from "/images/logo.png";
import Back from "/svgs/registration/back.svg";
import { useContext } from "react";
import { navContext } from "../../App";
import captures from "/images/mediaPartners/Captures.png";

let mediaPatners = [
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "Jhoom Baba",
    link: "https://www.instagram.com/jhoombaba22?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "Kanika Devrani",
    link: "https://www.instagram.com/kanika_devrani?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
  {
    head: "Official Vlogging Partner",
    img: dummy,
    name: "Zack Vlogs",
    link: "https://www.instagram.com/zack_vlogs/",
  },
  {
    head: "Official Coverage Partner",
    img: captures,
    name: "Captures",
    link: "https://www.instagram.com/captures.inc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
  {
    head: "Official Outreach Partners",
    img: dummy,
    name: "Inglu",
    link: "https://www.instagram.com/inglu_events/",
  },
  {
    head: "BITS GOT LATENT PANEL",
    img: dummy,
    name: "Sarcaaster",
    link: "https://www.instagram.com/sarcaaster_/",
  },
  {
    head: "Official Media Partners",
    img: dummy,
    name: "Bronx",
    link: "https://www.instagram.com/rap.bronx?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
];

const MediaPatners = () => {
  const { goToPage } = useContext(navContext);

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
                      alt={mediaPatner.name}
                      draggable={false}
                    />
                  </div>
                  <div className={styles.patnersName}>{mediaPatner.name}</div>
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
