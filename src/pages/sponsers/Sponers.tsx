import styles from "./Sponsers.module.scss";
import heading from "/svgs/sponsors/sponsorsHead.png";
import BackButton from "../components/backButton/BackButton";
import { useEffect } from "react";

import dollarsGroup from "/images/sponsors/Dollars_group.png";
import hetero from "/images/sponsors/Hetero.png";
import kalanjali from "/images/sponsors/Kalanjali.png";
import makeMyTrip from "/images/sponsors/Make_My_trip.png";
import prakashArts from "/images/sponsors/Prakash_arts.png";
import talentio from "/images/sponsors/Talentio.png";

const sponsors = {
  title: {
    head: "",
    img: dollarsGroup,
    name: "Dollars Group",
    link: "#",
  },
  otherSponsers: [
    {
      head: "",
      img: hetero,
      name: "Hetero",
      link: "#",
    },
    {
      head: "",
      img: kalanjali,
      name: "Kalanjali",
      link: "#",
    },
    {
      head: "",
      img: makeMyTrip,
      name: "Make My Trip",
      link: "#",
    },
    {
      head: "",
      img: prakashArts,
      name: "Prakash Arts",
      link: "#",
    },
    {
      head: "",
      img: talentio,
      name: "Talentio",
      link: "#",
    },
  ],
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
          <a
            href={sponsors.title.link}
            target="_blank"
            rel="noreferrer"
            draggable={false}
          >
            <div className={styles.titleSponsor}>
              {sponsors.title.head && (
                <div className={styles.head}>{sponsors.title.head}</div>
              )}
              <div className={styles.titleSponsImage}>
                <img
                  src={sponsors.title.img}
                  alt={sponsors.title.name}
                  draggable={false}
                />
              </div>
              <div className={`${styles.titleSponsName} ${styles.sponsName}`}>
                {sponsors.title.name}
              </div>
            </div>
          </a>

          <div className={styles.otherSponsors}>
            {sponsors.otherSponsers.map((sponsor, index) => (
              <a
                href={sponsor.link}
                target="_blank"
                rel="noreferrer"
                key={index}
                draggable={false}
              >
                <div className={styles.otherSponsor}>
                  {sponsor.head && (
                    <div className={styles.head}>{sponsor.head}</div>
                  )}

                  <div
                    className={`${styles.otherSponsImage} ${styles.sponsImage}`}
                  >
                    <img
                      src={sponsor.img}
                      alt={sponsor.name}
                      draggable={false}
                    />
                  </div>
                  <div
                    className={`${styles.otherSponsName} ${styles.sponsName}`}
                  >
                    {sponsor.name}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsors;
