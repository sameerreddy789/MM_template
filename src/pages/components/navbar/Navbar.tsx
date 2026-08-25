import styles from "./Navbar.module.scss";
import { useEffect, useContext, useRef } from "react";
import { useNavVisibilityStore, useMainHamStore } from "../../../utils/store";
import { navContext } from "../../../App";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import moon from "/svgs/landing/moon1.svg";
import moonHam from "/svgs/landing/moonHam.svg";
import cloud1 from "/svgs/landing/hamClouds/cloud1.min.svg";
import cloud2 from "/svgs/landing/hamClouds/cloud2.min.svg";
import cloud3 from "/svgs/landing/hamClouds/cloud3.min.svg";
import cloud4 from "/svgs/landing/hamClouds/cloud4.min.svg";
import cloud5 from "/svgs/landing/hamClouds/cloud5.min.svg";
import cloud6 from "/svgs/landing/hamClouds/cloud6.min.svg";
// import debouncedHandler from "../../../utils/debounce";
// import { rect } from "framer-motion/client";

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { label: "Events", links: "/events" },
  { label: "Brochure", links: "/brochure" },
  { label: "Sponsors", links: "/sponsors" },
  { label: "Gallery", links: "/gallery" },
];

export default function Navbar({
  variant = "default",
}: {
  variant?: "default" | "about";
}) {
  const { goToPage } = useContext(navContext);
  const setMainHamOpen = useMainHamStore((state) => state.setMainHamOpen);
  const navRef = useRef<HTMLElement>(null);
  // Published to the store so the music player can hide alongside the header.
  const navShow = useNavVisibilityStore((state) => state.isNavVisible);
  const setNavShow = useNavVisibilityStore((state) => state.setNavVisible);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    let ticking = false;
    const threshold = 20;

    const isPhone = () =>
      window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 1.45)")
        .matches;

    const handleScroll = () => {
      if (isPhone()) {
        setNavShow(true);
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollY.current;

          if (diff > threshold && currentY > 80) {
            setNavShow(false);
          } else if (diff < 9 - threshold) {
            setNavShow(true);
          }

          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    const handleResize = () => {
      if (isPhone()) {
        setNavShow(true);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [setNavShow]);

  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!navRef.current) return;

    // console.log("Setting up scroll-based color change");

    const timer = setTimeout(() => {
      const targets = navRef.current?.querySelectorAll(
        `.${styles.actualLabel}`
      );

      if (!targets || targets.length === 0) {
        console.warn("No navbar text elements found");
        return;
      }

      // console.log("Found targets:", targets.length);

      ScrollTrigger.refresh();

      const colorAnimation = gsap.fromTo(
        document.body,
        {
          "--navlink-color": "#f2f2f2",
        },
        {
          scrollTrigger: {
            trigger: document.body,
            start: `+=${window.innerHeight * 1.5}`,
            end: `+=${window.innerHeight * 0.5}`,
            scrub: 1,
            // onEnter: () => console.log("Color change TRIGGERED at 150vh"),
            // onLeave: () => console.log("Color change ENDED"),
            // onUpdate: (self) => console.log("Scroll progress:", self.progress),
          },
          //color: "#C0B063",
          "--navlink-color": "#c0b063",
          ease: "none",
          // markers: "true",
        }
      );

      return () => {
        // console.log("Cleaning up scroll trigger");
        const element = document.getElementById("navbar-scroll-trigger");
        if (element) {
          element.remove();
        }

        if (colorAnimation?.scrollTrigger) {
          colorAnimation.scrollTrigger.kill();
        }

        colorAnimation?.kill();
      };
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: navShow ? 0 : -120 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      ref={navRef}
      className={`${styles.nav} ${
        variant === "about" ? styles.aboutVariant : ""
      }`}
    >
      <div
        className={styles.hamMenuBtn}
        onClick={() => setMainHamOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Open Navigation Menu"
      >
        <div className={styles.desktopHamElements}>
          <img src={moon} alt="moon" className={styles.moon} />
          <img src={moonHam} alt="moonHam" className={styles.moonHam} />
          <div className={styles.hamLine} aria-hidden="true" />
          <div className={styles.clouds}>
            <img
              src={cloud1}
              alt="Cloud1"
              className={`${styles.cloud1} ${styles.cloud}`}
            />
            <img
              src={cloud2}
              alt="Cloud2"
              className={`${styles.cloud2} ${styles.cloud}`}
            />
            <img
              src={cloud3}
              alt="Cloud3"
              className={`${styles.cloud3} ${styles.cloud}`}
            />
            <img
              src={cloud4}
              alt="Cloud4"
              className={`${styles.cloud4} ${styles.cloud}`}
            />
            <img
              src={cloud5}
              alt="Cloud5"
              className={`${styles.cloud5} ${styles.cloud}`}
            />
            <img
              src={cloud6}
              alt="Cloud6"
              className={`${styles.cloud6} ${styles.cloud}`}
            />
          </div>
        </div>

        {/* Indian Festive Mobile Hamburger Badge */}
        <div className={styles.mobileIndianHamIcon} aria-hidden="true">
          <svg viewBox="0 0 52 52" className={styles.indianHamSvg}>
            {/* Outer ornate mandala/sunburst dotted ring */}
            <circle
              cx="26"
              cy="26"
              r="23"
              stroke="#c0b063"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              fill="none"
              opacity="0.85"
            />
            <circle
              cx="26"
              cy="26"
              r="20"
              stroke="#f59e0b"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />

            {/* Indian Toran / Arch Petals at cardinal points */}
            <path d="M26 3 L28.5 7 L23.5 7 Z" fill="#f59e0b" />
            <path d="M26 49 L28.5 45 L23.5 45 Z" fill="#f59e0b" />
            <path d="M3 26 L7 28.5 L7 23.5 Z" fill="#f59e0b" />
            <path d="M49 26 L45 28.5 L45 23.5 Z" fill="#f59e0b" />

            {/* 3 Indian Royal Stylized Gold Bars with Diamond Center */}
            <g className={styles.barGroup}>
              {/* Top Bar */}
              <rect x="13" y="16" width="26" height="2.5" rx="1.25" fill="#f2dd7c" />
              <polygon points="26,14.5 28,17.25 26,20 24,17.25" fill="#f59e0b" />

              {/* Middle Bar */}
              <rect x="10" y="24.75" width="32" height="2.5" rx="1.25" fill="#fff7d6" />
              <polygon points="26,23 28.5,26 26,29 23.5,26" fill="#f59e0b" />
              <circle cx="26" cy="26" r="1.2" fill="#fff" />

              {/* Bottom Bar */}
              <rect x="13" y="33.5" width="26" height="2.5" rx="1.25" fill="#f2dd7c" />
              <polygon points="26,32 28,34.75 26,37.5 24,34.75" fill="#f59e0b" />
            </g>
          </svg>
        </div>
      </div>
      <div className={styles.navItemsContainer}>
        <ul>
          {navItems.slice(0, 2).map((item) => (
            <li
              key={item.label}
              className={styles.navItem}
              onClick={() => goToPage?.(item.links)}
            >
              <div className={styles.navLink}>
                <div className={styles.actualLabel}>{item.label}</div>
              </div>
            </li>
          ))}
        </ul>
        <ul>
          {navItems.slice(2).map((item) => (
            <li
              key={item.label}
              className={styles.navItem}
              onClick={() => goToPage?.(item.links)}
            >
              <div className={styles.navLink}>
                <div className={styles.actualLabel}>{item.label}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.nav>
  );
}
