import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./DrawingPreloader.module.scss";
import useOverlayStore from "../../../utils/store";

const imagesToPreload = [
  "/images/doors/Door1.webp",
  "/images/doors/Door2.webp",
  "/images/doors/Door3.webp",
  "/images/doors/Door4.webp",
  "/videos/ink-spread-5.gif",
  "/svgs/landing/hamClouds/cloud1.min.svg",
  "/svgs/landing/hamClouds/cloud2.min.svg",
  "/svgs/landing/hamClouds/cloud3.min.svg",
  "/svgs/landing/hamClouds/cloud4.min.svg",
  "/svgs/landing/hamClouds/cloud5.min.svg",
  "/svgs/landing/hamClouds/cloud6.min.svg",
  "/svgs/landing/insta.svg",
  "/svgs/landing/linkden.svg",
  "/svgs/landing/moon1.svg",
  "/svgs/landing/moonHam.svg",
  "/images/hero_hills.webp",
  "/images/landing/new tree.webp",
  "/svgs/landing/insta.svg",
  "/svgs/landing/x.svg",
  "/svgs/landing/linkden.svg",
  "/svgs/landing/wire.svg",
  "/svgs/landing/instaLamp.svg",
  "/svgs/landing/linkdenLamp.svg",
  "/svgs/landing/mobileBackground.svg",
  "/svgs/landing/mobileRegisterBtn.svg",
  "/svgs/landing/registerBtn.svg",
  "/images/logo.webp",
  "/images/landing/mobileCloud.png",
  "/images/registration/reg-banner.webp",
  "/svgs/registration/bg-extended.svg",
  "/svgs/registration/bg-mobile.svg",
  "/svgs/registration/scrollThumb.svg",
  "/svgs/registration/scroll-bar.svg",
  "/svgs/registration/leftarr.svg",
  "/svgs/registration/rightarr.svg",
  "/images/contact/contact-banner.webp",
  "/images/contact/ContactCard1.webp",
  "/images/contact/DoorsCombined.webp",
  "/images/contact/DoorsMobile.webp",
  "/svgs/aboutus/letter1.svg",
  "/svgs/aboutus/letter2.svg",
  "/svgs/aboutus/letter3.svg",
  "/svgs/aboutus/letter4.svg",
  "/svgs/aboutus/letter5.svg",
  "/svgs/aboutus/letter6.svg",
  "/svgs/aboutus/letter7.svg",
  "/svgs/aboutus/letter8.svg",
  "/svgs/aboutus/header.svg",
  "/svgs/aboutus/fan.webp",
  "/svgs/aboutus/prev.svg",
  "/svgs/aboutus/pause.svg",
  "/svgs/aboutus/next.svg",
  "/svgs/aboutus/reghead.svg",
  "/svgs/aboutus/play.svg",
  "/svgs/aboutus/nextarr.svg",
  "/svgs/aboutus/borde.svg",
  "/svgs/aboutus/instaicon.svg",
  "/svgs/aboutus/xicon.svg",
  "/svgs/aboutus/linkedin.svg",
  "/svgs/aboutus/yticon.svg",
  "/svgs/aboutus/abtus.svg",
  "/images/aboutus/background.jpg",
  "/images/aboutus/backg.webp",
  "/images/aboutus/abtbck.webp",
  "/videos/dragon-reveal.webp",
];

const soundsToPreload: string[] = [];

export default function DrawingPreloader({
  className,
  onEnter,
}: {
  className?: string;
  onEnter: () => void;
}) {
  const overlaySetActive = useOverlayStore((state: any) => state.setActive);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  // Path lengths are measured once: getTotalLength() is expensive on this artwork
  const lengthsRef = useRef<number[]>([]);
  const [pathsReady, setPathsReady] = useState(false);

  useEffect(() => {
    let loadedAssets = 0;

    const preloadImage = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadedAssets++;
          setProgress(
            (loadedAssets / (imagesToPreload.length + soundsToPreload.length)) *
              99
          );
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
          resolve(img);
        };
        img.onerror = (err) => {
          console.error("Image failed to load", err, img);
          loadedAssets++;
          setProgress(
            (loadedAssets / (imagesToPreload.length + soundsToPreload.length)) *
              99
          );
          resolve(img);
        };
      });
    };
    const preloadSound = (src: string) => {
      return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.onloadeddata = () => {
          loadedAssets++;
          setProgress(
            (loadedAssets / (imagesToPreload.length + soundsToPreload.length)) *
              99
          );
          resolve(audio);
        };
        audio.onerror = (err) => {
          console.error("Audio failed to load", err, audio);
          loadedAssets++;
          setProgress(
            (loadedAssets / (imagesToPreload.length + soundsToPreload.length)) *
              99
          );
          resolve(audio);
        };
      });
    };

    Promise.all([
      ...imagesToPreload.map((src, i) =>
        preloadImage(src).then(async (img) => {
          await new Promise((resolve) => setTimeout(resolve, 1000 * i));
          return img;
        })
      ),
      ...soundsToPreload.map((src, i) =>
        preloadSound(src).then(async (audio) => {
          await new Promise((resolve) => setTimeout(resolve, 1000 * i));
          return audio;
        })
      ),
    ])
      .then(() => {})
      .catch((err) => {
        console.error("Error preloading images:", err);
      });
    console.log("Preloading images completed");
  }, []);

  // Measure each path once and prime it as "not yet drawn"
  const primePaths = (paths: SVGPathElement[]) => {
    pathsRef.current = paths;
    lengthsRef.current = paths.map((path) => {
      let length = 0;
      try {
        length = path.getTotalLength();
      } catch {
        length = 0;
      }
      if (length > 0) {
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
      }
      return length;
    });
    setPathsReady(paths.length > 0);
  };

  // Fetch the Indian temple theme sketch and inject it for all viewports (mobile and desktop)
  useEffect(() => {
    let cancelled = false;

    fetch("/svgs/landing/LatestProcessed.svg")
      .then((res) => res.text())
      .then((markup) => {
        const wrapper = svgWrapperRef.current;
        if (cancelled || !wrapper) return;

        wrapper.innerHTML = markup.replace(/<\?xml[^>]*\?>/, "");
        const injected = wrapper.querySelector("svg");
        if (!injected) return;

        injected.setAttribute("preserveAspectRatio", "xMidYMid slice");
        injected.setAttribute("width", "100%");
        injected.setAttribute("height", "100%");
        injected.style.position = "absolute";
        injected.style.inset = "0";
        injected.style.width = "100%";
        injected.style.height = "100%";

        primePaths(Array.from(injected.querySelectorAll("path")));
      })
      .catch((err) => console.error("Failed to load preloader sketch:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // Reveal the sketch in step with asset loading
  useGSAP(() => {
    const paths = pathsRef.current;
    if (paths.length === 0) return;

    const revealed = progress / 99;

    paths.forEach((path, index) => {
      const length = lengthsRef.current[index];
      if (!length) return;

      const start = index / paths.length;
      const end = (index + 1) / paths.length;
      if (revealed <= start) return;

      const segment = Math.min(1, (revealed - start) / (end - start));
      gsap.to(path, {
        strokeDashoffset: length * (1 - segment),
        duration: 1.404,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  }, [progress, pathsReady]);

  // Loading ends once every asset is in and the sketch has finished drawing.
  useEffect(() => {
    if (progress < 99) return;
    const timer = setTimeout(() => setIsAnimating(false), 1755);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isAnimating) {
        overlaySetActive();
        onEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnimating]);

  return (
    <div className={styles.overlay} ref={svgContainerRef}>
      <div
        ref={svgWrapperRef}
        aria-label="Overlay"
        className={
          className
            ? `${styles.drawingPreloader} ${className} ${styles.sketchImage}`
            : styles.drawingPreloader
        }
        style={{ position: "relative", width: "100%", height: "100%" }}
      />
      {isAnimating ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className={styles.percentage}>{Math.round(progress)}%</div>
        </div>
      ) : (
        <div className={styles.infoContainer}>
          <div className={styles.btnContainer}>
            <button
              className={styles.enterButton}
              onClick={() => {
                overlaySetActive();
                onEnter();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  overlaySetActive();
                  onEnter();
                }
              }}
            >
              <div className={styles.enterButtonText}>Enter</div>
            </button>
          </div>
          <div className={styles.infoText}>
            United By Art. Inspired by Culture. Enter the world of Mohanamantra
            2K26
          </div>
        </div>
      )}
    </div>
  );
}
