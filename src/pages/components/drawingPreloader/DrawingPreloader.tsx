import { cdn } from "../../../utils/cdn";
import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./DrawingPreloader.module.scss";
import useOverlayStore from "../../../utils/store";

const imagesToPreload = [
  cdn("/images/doors/Door1.webp"),
  cdn("/images/doors/Door2.webp"),
  cdn("/images/doors/Door3.webp"),
  cdn("/images/doors/Door4.webp"),
  cdn("/videos/ink-spread-5.gif"),
  cdn("/svgs/landing/insta.svg"),
  cdn("/svgs/landing/moon1.svg"),
  cdn("/svgs/landing/moonHam.svg"),
  cdn("/images/hero_hills.webp"),
  cdn("/images/landing/new_tree.webp"),
  cdn("/svgs/landing/wire.svg"),
  cdn("/svgs/landing/instaLamp.svg"),
  cdn("/svgs/landing/mobileRegisterBtn.svg"),
  cdn("/svgs/landing/registerBtn.svg"),
  cdn("/images/logo.webp"),
  cdn("/images/landing/cloud_1.webp"),
  cdn("/images/registration/reg-banner.webp"),
  cdn("/svgs/registration/bg-extended.svg"),
  cdn("/svgs/registration/bg-mobile.svg"),
  cdn("/svgs/registration/scrollThumb.svg"),
  cdn("/svgs/registration/scroll-bar.svg"),
  cdn("/svgs/registration/leftarr.svg"),
  cdn("/svgs/registration/rightarr.svg"),
  cdn("/images/contact/contact-banner.webp"),
  cdn("/images/contact/ContactCard1.webp"),
  cdn("/images/contact/DoorsCombined.webp"),
  cdn("/images/contact/DoorsMobile.webp"),
  cdn("/svgs/aboutus/letter1.svg"),
  cdn("/svgs/aboutus/letter2.svg"),
  cdn("/svgs/aboutus/letter3.svg"),
  cdn("/svgs/aboutus/letter4.svg"),
  cdn("/svgs/aboutus/letter5.svg"),
  cdn("/svgs/aboutus/letter6.svg"),
  cdn("/svgs/aboutus/letter7.svg"),
  cdn("/svgs/aboutus/letter8.svg"),
  cdn("/svgs/aboutus/header.svg"),
  cdn("/svgs/aboutus/fan.webp"),
  cdn("/svgs/aboutus/prev.svg"),
  cdn("/svgs/aboutus/pause.svg"),
  cdn("/svgs/aboutus/next.svg"),
  cdn("/svgs/aboutus/reghead.svg"),
  cdn("/svgs/aboutus/play.svg"),
  cdn("/svgs/aboutus/nextarr.svg"),
  cdn("/svgs/aboutus/borde.svg"),
  cdn("/svgs/aboutus/instaicon.svg"),
  cdn("/svgs/aboutus/xicon.svg"),
  cdn("/svgs/aboutus/linkedin.svg"),
  cdn("/svgs/aboutus/yticon.svg"),
  cdn("/svgs/aboutus/abtus.svg"),
  cdn("/images/mediaPartners/bg1.webp"),
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
    const totalAssets = Math.max(1, imagesToPreload.length + soundsToPreload.length);

    const updateProgress = () => {
      loadedAssets++;
      const currentPct = Math.min(99, Math.round((loadedAssets / totalAssets) * 99));
      setProgress((prev) => Math.max(prev, currentPct));
    };

    const preloadImage = (src: string) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          updateProgress();
          resolve(img);
        };
        img.onerror = () => {
          updateProgress();
          resolve(null);
        };
      });
    };

    const preloadSound = (src: string) => {
      return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.onloadeddata = () => {
          updateProgress();
          resolve(audio);
        };
        audio.onerror = () => {
          updateProgress();
          resolve(null);
        };
      });
    };

    // Smooth baseline timer to guarantee visual progress even on fast/cached loads
    const smoothTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          clearInterval(smoothTimer);
          return 99;
        }
        return Math.min(99, prev + 4);
      });
    }, 120);

    Promise.all([
      ...imagesToPreload.map((src) => preloadImage(src)),
      ...soundsToPreload.map((src) => preloadSound(src)),
    ])
      .then(() => {
        setProgress(99);
        clearInterval(smoothTimer);
      })
      .catch((err) => {
        console.error("Error preloading images:", err);
        setProgress(99);
        clearInterval(smoothTimer);
      });

    return () => clearInterval(smoothTimer);
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

    fetch(cdn("/svgs/landing/LatestProcessed.svg"))
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
          <div className={styles.loadingPill}>
            <div className={styles.loaderRing}>
              <div className={styles.spinner} />
              <span className={styles.percentageText}>{Math.round(progress)}%</span>
            </div>
            <div className={styles.loadingDetails}>
              <span className={styles.loadingTitle}>MohanaMantra 2K26</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
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
