import { cdn } from "../../utils/cdn";
import { useEffect, useRef, useState } from "react";
import styles from "./AboutUs.module.scss";
const Header = cdn("/svgs/aboutus/header.svg");
const fan = cdn("/svgs/aboutus/fan.webp");
const prev = cdn("/svgs/aboutus/prev.svg");
const pause = cdn("/svgs/aboutus/pause.svg");
const next = cdn("/svgs/aboutus/next.svg");
const Reg = cdn("/svgs/aboutus/reghead.svg");
const play = cdn("/svgs/aboutus/play.svg");
const nextarr = cdn("/svgs/aboutus/nextarr.svg");
import BackButton from "../components/backButton/BackButton";
const PlayButton = cdn("/svgs/aboutus/borde.svg");
const aboutPageBG = cdn("/images/aboutus/background.webp");
const aboutPageBGMobile = cdn("/images/aboutus/backg.webp");
const letter1 = cdn("/svgs/aboutus/letter1.svg");
const letter2 = cdn("/svgs/aboutus/letter2.svg");
const letter3 = cdn("/svgs/aboutus/letter3.svg");
const letter4 = cdn("/svgs/aboutus/letter4.svg");
const letter5 = cdn("/svgs/aboutus/letter5.svg");
const letter6 = cdn("/svgs/aboutus/letter6.svg");
const letter7 = cdn("/svgs/aboutus/letter7.svg");
const letter8 = cdn("/svgs/aboutus/letter8.svg");
import VideoMetaData from "./components/VideoMetaData";
import SEO from "../../components/SEO";
import SocialLinks from "./components/SocialLinks/SocialLinks";
import AboutText from "./components/AboutText/AboutText";
import { useYouTubePlayer } from "./components/useYoutubePlayer/useYoutubePlayer";
import { useFanAnimation } from "./components/useFanAnimation/useFanAnimation";
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface AboutUsProps {
  isBackBtn?: boolean;
}

const icons = [
  letter1,
  letter2,
  letter3,
  letter4,
  letter5,
  letter6,
  letter7,
  letter8,
];

// Playlist order drives the prev/next buttons, which wrap around:
// 1. Mohana Mantra's #aftermovie 2023
// 2. Curtain Raiser Event at Mohan Babu University
// 3. Mohana Mantra 2K23 | Flashmob | MGB Felicity Mall
const videos = ["6cVU9EKoMgs", "0BfL50EqmS4", "RE1WSzLeQVo"];

// Structured data has to describe the video actually embedded first, otherwise
// the VideoObject points at something that isn't on the page.
const mainVideoMetadata = {
  id: videos[0],
  title: "Mohana Mantra's #aftermovie 2023",
  description:
    "Mohana Mantra is an annual techno-cultural festival held at Mohan Babu University, celebrating the diversity and creativity of our student body with events showcasing music, dance, theatre, and more.",
  uploadDate: "2024-08-06T05:25:38-07:00",
};
const iconImages: HTMLImageElement[] = icons.map((src) => {
  const img = new Image();
  img.src = src;
  img.alt = "Letters";
  return img;
});

const AboutUs = ({ isBackBtn = true }: AboutUsProps) => {
  // const [current, setCurrent] = useState(0);
  // const [isPlaying, setIsPlaying] = useState(false);
  const AboutRef = useRef<HTMLDivElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  // const playerRef = useRef<any>(null);

  const fan2Ref = useRef<HTMLImageElement>(null);
  const fan1Ref = useRef<HTMLImageElement>(null);

  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 0.75) ")
      .matches
  );
  const { isPlaying, nextVideo, prevVideo, togglePlayPause } = useYouTubePlayer(videos, playerContainerRef);
  useFanAnimation(fan1Ref, fan2Ref, isMobile, iconImages, styles);


  useEffect(() => {
    const handleResize = () =>
      setIsMobile(
        window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 0.75) ")
          .matches
      );

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      <SEO
        title="About Us | MohanaMantra 2K26 | MBU"
        description="Learn about MohanaMantra 2K26, the flagship cultural festival of Mohan Babu University. Discover our history, vision, and the team behind the fest."
        canonicalUrl="https://mm-template.vercel.app/aboutus"
      />
      <div
        className={styles.AboutContainer}
        ref={AboutRef}
        style={{
          backgroundImage: `url("${isMobile ? aboutPageBGMobile : aboutPageBG
            }")`,
        }}
      >
        <VideoMetaData
          videoId={mainVideoMetadata.id}
          title={mainVideoMetadata.title}
          description={mainVideoMetadata.description}
          uploadDate={mainVideoMetadata.uploadDate}
        />

        <div className={styles.header}>
          <img src={isMobile ? Reg : Header} alt="About Us" />
        </div>

        <div className={styles.content3D}>
          <div className={styles.wrapper}>
            <button onClick={prevVideo} className={styles.arr}>
              <img
                src={nextarr}
                className={styles.prevarr}
                width="100%"
                alt="Next Arrow"
              ></img>
            </button>
            <div className={styles.vid}>
              <div
                onClick={togglePlayPause}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "16px",
                  zIndex: "20",
                }}
              >
                <div
                  ref={playerContainerRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "16px",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <img src={fan} alt="fan1" ref={fan1Ref} className={styles.fan1} />
              <img src={fan} alt="fan2" ref={fan2Ref} className={styles.fan2} />
            </div>

            <button onClick={nextVideo} className={styles.arr}>
              <img
                src={nextarr}
                className={styles.nextarr}
                width="100%"
                alt="Next Arrow"
              ></img>
            </button>

            <div className={styles.controls}>
              <div className={styles.a1}></div>
              <div className={styles.buttonContainer}>
                <img
                  src={PlayButton}
                  className={styles.background}
                  alt="Buttons"
                />
                <div className={styles.buttonGroup}>
                  <button onClick={prevVideo}>
                    <img
                      src={prev}
                      alt="Previous Button"
                      className={styles.btns1}
                    />
                  </button>
                  <div className={styles.a1}></div>
                  <button onClick={togglePlayPause}>
                    <img
                      src={isPlaying ? play : pause}
                      alt="Pause Button"
                      className={styles.btns2}
                    />
                  </button>
                  <div className={styles.a1}></div>
                  <button onClick={nextVideo}>
                    <img
                      src={next}
                      alt="Next Button"
                      className={styles.btns3}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AboutText isMobile={isMobile} />
        </div>
        <SocialLinks />
        {isBackBtn && <BackButton className={styles.aboutBB} />}
      </div>
    </div>
  );
};

export default AboutUs;
