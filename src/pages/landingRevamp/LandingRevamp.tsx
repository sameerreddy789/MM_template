import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

import useOverlayStore from "../../utils/store";
import styles from "./LandingRevamp.module.scss";

import { useGSAP } from "@gsap/react";
import Navbar from "../components/navbar/Navbar";
import landingImage from "/images/hero_hills.png";
import TirumalaHills from "../components/TirumalaHills/TirumalaHills";
import mobileMountains from "/images/hero_hills.png";
import tree from "/images/landing/new tree.png";
import treeMob from "/images/landing/new tree.png";

import insta from "/svgs/landing/insta.svg";
import instaLamp from "/svgs/landing/instaLamp.svg";
import youtube from "/svgs/landing/youtube.svg";
import youtubeLamp from "/svgs/landing/youtubeLamp.svg";
import mobileBackground from "/svgs/landing/mobileBackground.svg";
import mobileRegisterBtn from "/svgs/landing/mobileRegisterBtn.svg";
import registerBtn from "/svgs/landing/registerBtn.svg";
import eventsBtn from "/svgs/landing/mobileEventsBtn.svg";
import wire from "/svgs/landing/wire.svg";
import logo from "/images/logo.png";
import mobileCloud from "/images/landing/cloud_1.png";
import AboutUs from "../aboutus/AboutUs";
import FloatingCloud from "./components/FloatingCloud/FloatingCloud";
// import ContactDoors from "../contact/ContactDoors";
// import Ham from "../components/ham/ham";
import MainHam from "../components/mainHam/mainHam";
import Lenis from "@studio-freight/lenis";

import { useMainHamStore, useNavVisibilityStore } from "../../utils/store";
import { motion } from "framer-motion";
import ContactDoors from "../contact/ContactDoors";
import { Helmet } from "react-helmet";
import ScrollLabel from "./components/ScrollLabel";
gsap.registerPlugin(ScrollTrigger);


// Bars for the music player's background visualiser. Many thin bars rather than a
// few thick ones is what keeps it slim instead of blocky. Timings are derived from
// the index rather than Math.random() so the pattern stays identical across
// renders - a random one would reshuffle every second when the countdown ticks and
// make the wave stutter. The long, spread-out durations give the slow travelling
// ripple you get in a Spotify-style equaliser rather than a frantic flicker.
const WAVE_BARS = Array.from({ length: 26 }, (_, i) => ({
  duration: 1.15 + ((i * 37) % 17) / 20, // 1.15s - 1.95s
  delay: -(((i * 53) % 23) / 20), // negative: bars start mid-cycle, already staggered
}));

const socialLinks = [
  {
    icon: youtube,
    lamp: youtubeLamp,
    classNameDiv: styles.linkdenDiv,
    classNameLamp: styles.linkdenLamp,
    classNameIcon: styles.linkdenIcon,
    url: "https://www.youtube.com/c/MohanaMantra",
  },
  {
    icon: insta,
    lamp: instaLamp,
    classNameDiv: styles.instaDiv,
    classNameLamp: styles.instaLamp,
    classNameIcon: styles.instaIcon,
    url: "https://www.instagram.com/mohana_mantra/",
  },
];

export default function LandingRevamp({
  goToPage,
  onToggle,
  onNext,
  onPrev,
  audioRef,
}: {
  goToPage: (path: string) => void;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  // Written by the navbar's scroll listener; the player mirrors it.
  const isNavVisible = useNavVisibilityStore((state) => state.isNavVisible);
  const overlayIsActive = useOverlayStore((state) => state.isActive);
  const removeGif = useOverlayStore((state) => state.removeGif);
  const setRemoveGif = useOverlayStore((state) => state.setRemoveGif);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const registerButtonRef = useRef<HTMLDivElement>(null);
  const eventsButtonRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLImageElement>(null);
  const landingMobileRef = useRef<HTMLImageElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  // const isHamOpen = useHamStore((state) => state.isHamOpen);
  const isMainHamOpen = useMainHamStore((state) => state.isMainHamOpen);
  // const setIsHamOpen = useHamStore((state) => state.setHamOpen);
  const setIsMainHamOpen = useMainHamStore((state) => state.setMainHamOpen);

  const treeImageRef = useRef<HTMLImageElement>(null);
  const scrollerRef = useRef<HTMLImageElement>(null);

  const aboutUsContRef = useRef<HTMLDivElement>(null);
  const aboutUsWrapperRef = useRef<HTMLDivElement>(null);

  const [scrollHeight, setScrollHeight] = useState(window.innerHeight);
  const [heroOverlap, setHeroOverlap] = useState(0);

  useEffect(() => {
    const updateScrollerMetrics = () => {
      const scrollerHeight = scrollerRef.current?.scrollHeight ?? 0;

      // The hero is only about one viewport tall, so subtracting 1.4 viewports
      // used to floor this at 0 and give the hero timeline zero length: the tree
      // zoom, background scale and countdown exit never ran. Keep at least one
      // viewport of travel so the timeline always has somewhere to go.
      setScrollHeight(
        Math.max(
          window.innerHeight,
          scrollerHeight - window.innerHeight * 1.4
        )
      );
      setHeroOverlap(0);
    };

    updateScrollerMetrics();

    const resizeObserver = new ResizeObserver(updateScrollerMetrics);
    if (scrollerRef.current) resizeObserver.observe(scrollerRef.current);
    window.addEventListener("resize", updateScrollerMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollerMetrics);
    };
  }, [removeGif]);

  useEffect(() => {
    const refreshFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => window.cancelAnimationFrame(refreshFrame);
  }, [heroOverlap]);

  // Mirror the audio element's real state. Reading `audioRef.current?.paused` as
  // an effect dependency never worked: a ref mutation doesn't re-render, so the
  // icon went stale whenever playback changed from anywhere other than a click
  // (autoplay on Enter, track changes, the track finishing).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = () => setIsPlaying(!audio.paused);
    sync();

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);

    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
    };
  }, [audioRef]);

  useEffect(() => {
    if (overlayIsActive) {
      setTimeout(() => {
        setRemoveGif();
      }, 3000);
    }
  }, [overlayIsActive]);

  useEffect(() => {
    if (removeGif && wrapperRef.current) {
      wrapperRef.current.style.maskImage = "none";
      // Use CSS class instead of position changes
      document.body.classList.remove("scroll-locked");
    }
    if (!removeGif) {
      // Lock scroll with CSS class during overlay
      document.body.classList.add("scroll-locked");
    }
  }, [removeGif]);

  // Cleanup: always unlock scroll when this component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      document.body.classList.remove("scroll-locked");
      document.body.style.position = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  // The countdown moved to the registration page; this keeps only the
  // scroll-to-top that used to ride along with its timer effect.
  useEffect(() => {
    document.scrollingElement?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      // wrapper: document.body,
      // content: document.body,
      lerp: window.innerWidth < 730 ? 0.1 : 0.1, // higher lerp for mobile for smoother scroll
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Use GSAP ticker for better sync with ScrollTrigger
    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(raf);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  useGSAP(() => {
    if (treeImageRef.current && landingRef.current) {
      gsap.set(treeImageRef.current, {
        // autoAlpha: 1,
        // scale: 1,
        // y: 0,
        force3D: false,
      });

      gsap.set(landingRef.current, {
        // autoAlpha: 1,
        // scale: 1,
        // y: 0,
        force3D: false,
      });

      gsap.set(scrollerRef.current, {
        // autoAlpha: 1,
        // scale: 1,
        // y: 0,
        force3D: false,
      });
    }

    gsap.fromTo(
      registerButtonRef.current,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "50vh",
          end: "+=145vh",
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      eventsButtonRef.current,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "50vh",
          end: "+=145vh",
          scrub: true,
        },
      }
    );



    // The logo sits above the tree now, so it also has to leave with the hero,
    // otherwise it stays parked over the about and contact sections.
    gsap.fromTo(
      logoRef.current,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "30vh",
          end: "+=70vh",
          scrub: true,
        },
      }
    );

    const mm = gsap.matchMedia();

    mm.add("(max-width: 730px) or (aspect-ratio < 8/12)", () => {
      // const masterTimeline = gsap.timeline({
      //   scrollTrigger: {
      //     trigger: wrapperRef.current,
      //     start: "top top",
      //     end: `+=300vh`,
      //     scrub: true,
      //     invalidateOnRefresh: true,
      //   },
      // });

      // masterTimeline

      gsap.to(
        treeImageRef.current,
        {
          scale: 1.15,
          ease: "power2.inOut",
          force3D: false,
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: `+=300vh`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
        // 0
      );

      gsap.to(
        landingMobileRef.current,
        {
          scale: 1.08,
          // y: "8%",
          ease: "power2.inOut",
          force3D: false,
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: `+=300vh`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
        // 0
      );


    });
    mm.add("(min-width: 730px) and (aspect-ratio > 8/12)", () => {
      const masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: `+=${scrollHeight}px`,
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      });
      masterTimeline

        .to(
          treeImageRef.current,
          {
            scale: 1.2,
            // y: "14%",
            duration: 2,
            force3D: false,
          },
          0
        )
        .to(
          landingRef.current,
          {
            scale: 1.1,
            // y: "8%",
            duration: 2,
            force3D: false,
          },
          0
        );





    });
    return () => {
      mm.revert();
    };
  }, [scrollHeight]);

  // useGSAP(() => {
  //   const scrollAnimationTimeline = gsap.timeline({
  //     scrollTrigger: {
  //       trigger: wrapperRef.current,
  //       scrub: true,
  //       start: "top top",
  //       end: "+=800vh",
  //       onEnter: (self) => console.log("ENTERED:", self.trigger),
  //       onLeave: (self) => console.log("LEFT:", self.trigger),
  //       onUpdate: (self) => {
  //         console.log("ACTIVE:", self.trigger, "Progress:", self.progress);
  //       },
  //     },
  //   });

  //   scrollAnimationTimeline
  //     .to(
  //       treeImageRef.current,
  //       {
  //         scale: 1.2,
  //         y: "14%",
  //         duration: 4,
  //         ease: "power2.out",
  //       },
  //       0
  //     )
  //     .to(
  //       landingRef.current,
  //       {
  //         scale: 1.1,
  //         duration: 4,
  //         ease: "power2.out",
  //       },
  //       0
  //     );
  // }, []);

  return (
    <>
      <main
        className={`${styles.wrapper} ${!removeGif ? styles.pointerNoneEvent : ""
          } ${overlayIsActive ? styles.mask : ""}`}
        ref={wrapperRef}
      >
        <Navbar />

        <div className={styles.mobileEventsBtnContainer} ref={eventsButtonRef}>
          <img
            src={eventsBtn}
            className={styles.mobileEventsBtn}
            onClick={() => goToPage("/events")}
            alt="Events Button"
          />

          <div className={styles.mobileEventsBtnText}>Events</div>
        </div>

        <div
          className={
            isMainHamOpen
              ? `${styles.mainHamContainer} ${styles.mainHamOpen}`
              : styles.mainHamContainer
          }
        >
          <div onClick={() => setIsMainHamOpen(false)}></div>
          <div className={styles.showMainHam}>
            <MainHam goToPage={goToPage} />
          </div>
        </div>
        <div className={styles.logoContainer} ref={logoRef}>
          <img src={logo} className={styles.logo} alt="Logo" />
        </div>

        <div className={styles.backgroundContainer}>
          <div className={styles.desktopBackground} ref={landingRef}>
            <TirumalaHills animated />
            
            <FloatingCloud cloudId={1} top="12%" left="-5%" width="22vw" opacity={0.55} duration={38} delay={0} />
            <FloatingCloud cloudId={2} top="25%" right="-5%" width="18vw" opacity={0.45} duration={48} delay={8} direction="reverse" />
            <FloatingCloud cloudId={3} top="5%" left="38%" width="15vw" opacity={0.35} duration={55} delay={15} hideOnMobile />
            <FloatingCloud cloudId={4} top="32%" left="20%" width="25vw" opacity={0.5} duration={45} delay={5} hideOnTablet />
            <FloatingCloud cloudId={2} top="15%" right="25%" width="16vw" opacity={0.4} duration={60} delay={12} direction="reverse" hideOnTablet />
          </div>

          <div
            className={styles.mobileBackgroundContainer}
            ref={landingMobileRef}
          >
            <img
              src={mobileMountains}
              className={styles.mobileMountains}
              alt="Mountains"
            // ref={landingMobileRef}
            />
            <img
              src={mobileBackground}
              alt="mobile"
              className={styles.mobileBackground}
            />

            <img src={mobileCloud} className={styles.mobileCloud} alt="cloud" />
          </div>
        </div>
        <ScrollLabel />
        <div className={styles.musicControlsContainer}>
          <motion.div
            className={styles.customMusicControls}
            // Same target offset and spring as the navbar in Navbar.tsx, driven off
            // the shared store, so the two slide away and return together rather
            // than the player staying pinned over about us / contact.
            initial={{ y: 0, opacity: 1 }}
            // Travels further than the navbar's -120 because it sits lower in the
            // viewport: -120 left a sliver of the frame on screen. Fading as well
            // guarantees it is gone regardless of where the frame ends up.
            animate={{
              y: isNavVisible ? 0 : -180,
              opacity: isNavVisible ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            // Not clickable once hidden.
            style={{ pointerEvents: isNavVisible ? "auto" : "none" }}
          >
            <div className={styles.playerMain}>
              <button className={styles.playBtn} onClick={onPrev}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="7" y="6" width="2" height="12" />
                  <polygon points="17,6 9,12 17,18" />
                </svg>
              </button>
              <div className={styles.verticalDivider} />
              <button
                className={styles.playBtn}
                onClick={onToggle}
                aria-label={isPlaying ? "Pause music" : "Play music"}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                )}
              </button>
              <div className={styles.verticalDivider} />
              <button className={styles.playBtn} onClick={onNext}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="7,6 15,12 7,18" />
                  <rect x="15" y="6" width="2" height="12" />
                </svg>
              </button>

              {/* Ambient visualiser layered behind the transport controls, so it
                  fills the whole frame rather than occupying a slot in the row.
                  Decorative only - the play/pause button is the actual control. */}
              <div
                className={`${styles.songWave} ${
                  isPlaying ? styles.playing : ""
                }`}
                aria-hidden="true"
              >
                {WAVE_BARS.map((bar, i) => (
                  <span
                    key={i}
                    style={{
                      animationDuration: `${bar.duration}s`,
                      animationDelay: `${bar.delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <div className={styles.scrollerWrapper}>
          <div className={styles.scroller} ref={scrollerRef}>
            <div className={styles.landingContainer}>
              <div
                className={styles.registerBtnContainer}
                onClick={() => goToPage("/register")}
                ref={registerButtonRef}
              >
                <img
                  src={registerBtn}
                  className={styles.registerBtn}
                  alt="Register"
                />
                <img
                  src={mobileRegisterBtn}
                  className={styles.mobileRegisterBtn}
                  alt="Register"
                />
                <div className={styles.registerBtnText}>Register</div>
              </div>

              <div className={styles.foregroundContainer}>
                <div className={styles.treeContainer} ref={treeContainerRef}>
                  <div className={styles.tree} ref={treeImageRef}>
                    <div className={styles.socialLinksContainer}>
                      <div className={styles.wire}>
                        <img src={wire} alt="Wire" />
                      </div>
                      {socialLinks.map((link, index) => (
                        <div
                          key={index}
                          className={`${styles.socialLinkContainer} ${link.classNameDiv}`}
                        >
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                          >
                            <img
                              src={link.icon}
                              alt="Icon"
                              className={`${styles.socialIcon} ${link.classNameIcon}`}
                            />
                            <img
                              src={link.lamp}
                              alt="Lamp"
                              className={`${styles.socialLamp} ${link.classNameLamp}`}
                            />
                          </a>
                        </div>
                      ))}
                    </div>
                    <div className={styles.audioTagContainer}>
                      <div className={styles.wire}>
                        <img src={wire} alt="Wire" />
                      </div>
                      {/* <svg
                        fill="#fff"
                        version="1.1"
                        id="Capa_1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="800px"
                        height="800px"
                        viewBox="0 0 345.09 345.089"
                        className={styles.audioTag}
                        onClick={onToggle}
                      >
                        <g>
                          <path
                            d="M172.539,0.003C77.405,0.003,0,77.405,0,172.544c0,95.141,77.405,172.542,172.539,172.542
                            c95.137,0,172.551-77.401,172.551-172.542C345.084,77.405,267.676,0.003,172.539,0.003z M151.973,209.493
                            c0,6.323-2.879,12.105-7.449,14.952c-4.566,2.876-10.064,2.348-14.201-1.388l-31.243-28.019c-1.414,0.648-2.996,1.045-4.668,1.045
                            H68.254c-6.167,0-11.166-5.008-11.166-11.175v-26.166c0-6.173,4.999-11.16,11.166-11.16h26.157c2.072,0,3.996,0.604,5.65,1.58
                            l30.261-27.16c2.372-2.12,5.188-3.2,8.022-3.2c2.104,0,4.23,0.606,6.179,1.819c4.57,2.882,7.449,8.656,7.449,14.964V209.493z
                            M186.503,206.802c-2.456,0-4.918-0.942-6.791-2.816c-3.753-3.759-3.753-9.848,0-13.595c4.768-4.768,7.397-11.103,7.397-17.858
                            c0-6.737-2.63-13.081-7.397-17.852c-3.753-3.753-3.753-9.839,0-13.589c3.753-3.759,9.842-3.759,13.595,0
                            c8.395,8.398,13.03,19.57,13.03,31.441c0,11.89-4.636,23.059-13.03,31.453C191.421,205.86,188.971,206.802,186.503,206.802z
                            M215.356,227.092c-2.456,0-4.924-0.937-6.792-2.81c-3.753-3.76-3.753-9.842,0-13.596c21.035-21.028,21.017-55.25-0.012-76.281
                            c-3.753-3.75-3.753-9.839,0-13.589s9.842-3.756,13.595,0c28.529,28.531,28.529,74.942,0.006,103.466
                            C220.28,226.156,217.818,227.092,215.356,227.092z M251.007,250.74c-1.88,1.873-4.342,2.81-6.792,2.81
                            c-2.462,0-4.93-0.937-6.797-2.81c-3.759-3.76-3.759-9.836,0-13.596c17.252-17.258,26.745-40.189,26.745-64.6
                            c0-24.403-9.5-47.351-26.77-64.602c-3.753-3.75-3.753-9.839,0-13.589c3.759-3.759,9.842-3.759,13.595,0
                            c20.897,20.888,32.402,48.654,32.402,78.191C283.385,202.094,271.886,229.861,251.007,250.74z"
                          />
                        </g>
                      </svg> */}
                      {/* <svg
                        width="667"
                        height="601"
                        viewBox="0 0 667 601"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.audioTag}
                        onClick={onToggle}
                      >
                        <path
                          d="M433.333 41.748C433.333 5.79397 390.85 -13.2804 363.983 10.609L214.265 143.718C209.688 147.787 203.778 150.034 197.654 150.034H75C33.5787 150.034 0 183.613 0 225.034V374.964C0 416.384 33.5787 449.964 75 449.964H197.652C203.776 449.964 209.688 452.211 214.264 456.281L363.98 589.404C390.85 613.298 433.333 594.224 433.333 558.268V41.748ZM247.487 181.085L383.333 60.3077V539.708L247.488 418.918C233.758 406.708 216.025 399.964 197.652 399.964H75C61.193 399.964 50 388.771 50 374.964V225.034C50 211.227 61.193 200.034 75 200.034H197.654C216.025 200.034 233.757 193.291 247.487 181.085ZM566.387 96.659C577.48 88.441 593.137 90.7737 601.357 101.869C642.39 157.271 666.667 225.878 666.667 300.081C666.667 374.284 642.39 442.891 601.357 498.294C593.137 509.391 577.48 511.724 566.387 503.504C555.29 495.288 552.96 479.631 561.177 468.534C596.05 421.451 616.667 363.211 616.667 300.081C616.667 236.954 596.05 178.714 561.177 131.628C552.96 120.533 555.29 104.877 566.387 96.659ZM504.767 179.059C516.907 172.486 532.08 177.001 538.653 189.143C556.527 222.163 566.667 259.974 566.667 300.081C566.667 340.188 556.527 378.001 538.653 411.021C532.08 423.161 516.907 427.678 504.767 421.104C492.623 414.531 488.107 399.358 494.68 387.218C508.697 361.324 516.667 331.671 516.667 300.081C516.667 268.491 508.697 238.838 494.68 212.946C488.107 200.804 492.623 185.632 504.767 179.059Z"
                          fill="#413f43ff"
                        />
                      </svg> */}
                      {/* <svg
                        width="526"
                        height="526"
                        viewBox="0 0 526 526"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.audioTag}
                        onClick={onToggle}
                      >
                        <path
                          d="M215.333 148L163.333 200H121.199C97.9994 200 77.066 200.4 74.7993 200.8L70.666 201.6V270.133V338.667H116.933H163.199L215.599 390.933L267.999 443.333V269.6C267.999 174.133 267.866 96.0001 267.599 96.0001C267.466 96.0001 243.866 119.333 215.333 148Z"
                          fill="#ffdfd0"
                        />
                        <path
                          d="M400.132 120.534L394.399 126.267L402.932 136.134C414.399 149.467 417.732 154.134 426.132 168.4C449.732 208.4 458.532 260.8 449.466 307.6C442.666 342.8 425.066 378.667 402.666 403.067L394.266 412.267L400.532 418.4L406.799 424.667L415.866 415.067C437.732 392 455.866 358.267 464.666 324.667C480.799 262.534 469.466 198.534 433.066 145.067C425.466 134 408.799 114.667 406.799 114.667C406.266 114.667 403.332 117.334 400.132 120.534Z"
                          fill="#ffdfd0"
                        />
                        <path
                          d="M350.934 169.734C347.867 172.8 345.334 176 345.334 176.8C345.334 177.6 347.2 179.867 349.467 182.134C356.267 188.4 368.8 208.534 373.334 220.267C391.067 266 383.2 316 352.534 353.467L344.934 362.8L351.067 369.067L357.2 375.2L361.467 371.334C367.334 365.6 379.067 348.8 384.4 337.867C397.2 312.534 400.534 298.4 400.4 268.667C400.4 248.534 400 244.534 396.934 233.067C392.4 216.134 385.867 201.334 376.934 187.734C369.734 176.8 359.334 164 357.467 164C356.934 164 354 166.534 350.934 169.734Z"
                          fill="#ffdfd0"
                        />
                        <path
                          d="M301.467 219.2C298.533 222.267 296 225.2 296 225.6C296 226.133 298.4 230 301.333 234.267C308 243.733 312.533 257.733 312.533 269.333C312.667 280.533 308.133 295.067 302 303.467C295.067 313.2 295.067 312.933 301.6 319.6L307.733 325.6L311.467 321.467C316.4 316 324.267 302.267 327.2 293.867C330.8 284.133 331.6 261.6 328.8 250.8C325.467 237.867 313.467 216.267 308.533 214.133C307.733 213.867 304.533 216.133 301.467 219.2Z"
                          fill="#ffdfd0"
                        />
                      </svg> */}
                    </div>

                    <img
                      src={tree}
                      // className={styles.tree}
                      className={styles.treeDesktop}
                      alt="Tree"
                      loading="eager"
                      fetchPriority="high"
                      style={{ contain: "none" }}
                    />
                    <img
                      src={treeMob}
                      alt="TreeMobile"
                      className={styles.treeMob}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <div className={styles.treeExtender}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={styles.bottomContainer}
          style={{ marginTop: -heroOverlap }}
        >
          <div className={styles.bottomOverlay} />
          <div className={styles.aboutUsContainer} ref={aboutUsContRef}>
            <div className={styles.aboutUsWrapper} ref={aboutUsWrapperRef}>
              <AboutUs isBackBtn={false} />
              <div className={styles.aboutUsBottom} id="aboutUsBottom" />
            </div>
            {aboutUsContRef.current &&
              aboutUsWrapperRef && ( // bottomSpacerRef.current &&
                <ContactDoors
                  pinElemRef={aboutUsContRef}
                  triggerElemRef={aboutUsWrapperRef}
                />
              )}
          </div>
          {/* <div className={styles.bottomSpacer} ref={bottomSpacerRef}/> */}
        </div>
      </main>
      <Helmet>
        <title>MohanaMantra 2K26 | MBU</title>
      </Helmet>
    </>
  );
}
