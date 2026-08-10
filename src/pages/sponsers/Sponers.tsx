import styles from "./Sponsers.module.scss";
import heading from "/svgs/sponsors/sponsorsHead.svg";
import dummy from "/images/logo.png";
import Back from "/svgs/registration/back.svg";
import { useContext, useEffect } from "react";
import { navContext } from "../../App";

//nothing is changed

const sponsors = {
  title: {
    head: "Official Title Sponsor",
    img: dummy,
    name: "Sponsor Name",
    link: "#",
  },
  otherSponsers: [
    {
      head: "Associate Title Sponsor",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Diamond Sponsor",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Co-Powered By",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Skincare Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Community Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Travel Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Infrastructure Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Beauty and Wellness Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Commute Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Banking Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Pasta Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Music Streaming Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Beverage Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Technology Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Hygiene Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Bath and BodyCare Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "Official Snack Partner",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
    {
      head: "",
      img: dummy,
      name: "Sponsor Name",
      link: "#",
    },
  ],
};

const Sponsors = () => {
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
              <div className={styles.head}>{sponsors.title.head}</div>
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
                  <div
                    className={
                      sponsor.head
                        ? styles.head
                        : `${styles.head} ${styles.other}`
                    }
                  >
                    {sponsor.head}
                  </div>

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
