import styles from "./Events.module.scss";
import Text from "/images/events/text.png";
import dance from "/images/events/dancef.webp";
import drama from "/images/events/dramaf.webp";
import music from "/images/events/music1.webp";
import misc from "/images/events/misc1.webp";
import photography from "/images/events/proshow.webp";
import Eventspage from "./components/Eventspage";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import TextMobile from "/images/events/TextMobile.png";
import BackButton from "../components/backButton/BackButton";
import { Helmet } from "react-helmet-async";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import EventFrame from "./components/EventFrame/EventFrame";

interface FanImage {
  src: string;
  mobileSrc?: string;
  alt: string;
  className: string;
  shape: "quizzes" | "music" | "photography" | "dance" | "misc";
  innerImageSrc?: string;
  objectPosition?: string;
  scale?: number;
}

const fanImages: FanImage[] = [
  {
    src: drama,
    alt: "Technoholic",
    className: styles.quizzes,
    shape: "quizzes"
  },
  { src: music, alt: "Music", className: styles.music, shape: "music" },
  {
    src: photography,
    alt: "Pro Shows",
    className: styles.photography,
    shape: "photography"
  },
  { src: dance, alt: "Kalakshetra", className: styles.dance, shape: "dance" },
  { src: misc, alt: "Spot Events", className: styles.misc, shape: "misc" },
];
// const speed = 500; // constant speed in pixels/second
// delay factor per degree

const rotationAngles = [-30, -135, -185, -225, -305];
// const rotationAngles = [-30, -75, -120, -165, -215]; final without scales
// const rotationAngles = [-40, -85, -110, -145, -195];
// const rotationAngles = [-80, -92, -103, -114, -126];
// const rotationAngles = [-72, -92, -103, -114, -134];
// const rotationAngles = [-72, -92, -103, -112, -134];

// const fanImages: FanImage[] = [
//   { src: quizzes, alt: "Quizzes", className: styles.quizzes },
//   { src: music, alt: "Music", className: styles.music },
//   { src: photography, alt: "Photography", className: styles.photography },
//   { src: dance, alt: "Dance", className: styles.dance },
//   { src: misc, alt: "Misc", className: styles.misc },
// ];

const Events: React.FC = () => {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.mohanamantra.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: "https://www.mohanamantra.com/events",
      },
    ],
  };
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 1.45)")
      .matches
  );
  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 1200px) and (max-aspect-ratio: 1.45)"
    );

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const [showImages, setShowImages] = useState(true);
  const [showEventPage, setShowEventPage] = useState(false);
  const [foldFan, setFoldFan] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const EventRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!canHover) return;

    const cleanups: (() => void)[] = [];

    imageRefs.current.forEach((img) => {
      if (!img) return;

      const hoverTween = gsap.to(img, {
        scale: 1.05,
        filter: "saturate(1.5)",
        duration: 0.2,
        ease: "power1.out",
        paused: true,
        startAt: { filter: "saturate(1)" },
      });

      const onEnter = () => hoverTween.play();
      const onLeave = () => hoverTween.reverse();

      img.addEventListener("mouseenter", onEnter);
      img.addEventListener("mouseleave", onLeave);
      img.addEventListener("click", onLeave);

      cleanups.push(() => {
        img.removeEventListener("mouseenter", onEnter);
        img.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [canHover]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      imageRefs.current.forEach((img) => {
        if (img) {
          gsap.killTweensOf(img);
        }
      });
    };
  }, []);

  const handleImageClick = (alt: string) => {
    setSelectedCategory(alt);
    setFoldFan(true);
    imageRefs.current.forEach((img) => {
      if (!img) return;
      gsap.killTweensOf(img);
      img.style.filter = "saturate(1)";
      img.style.scale = "1";
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowImages(false);
    }, 1800);

    setShowEventPage(true);

    const mm = gsap.matchMedia();

    // MOBILE
    mm.add("(max-width: 1200px) and (max-aspect-ratio: 1.45)", () => {
      const mobileOrder = [1, 0, 4, 3, 2];

      requestAnimationFrame(() => {
        mobileOrder.forEach((originalIndex, orderIndex) => {
          const imgEl = imageRefs.current[originalIndex];
          if (!imgEl) return;

          const origin = (() => {
            const rect = imgEl.getBoundingClientRect();
            const rec = EventRef.current?.getBoundingClientRect();
            if (!rec) return { x: 0, y: 0 };
            return {
              x: rec.left - rect.left,
              y: rec.top + rec.height / 2 - rect.top,
            };
          })();

          gsap.killTweensOf(imgEl);
          gsap.set(imgEl, { scale: 1 });
          imgEl.style.transformOrigin = `${origin.x}px ${origin.y}px`;

          gsap.to(imgEl, {
            rotate: rotationAngles[orderIndex],
            duration: 1.7,
            scaleX: [1, 2].includes(originalIndex) ? 0.2 : 1,
            scaleY: [0, 3, 4].includes(originalIndex) ? 0.2 : 1,
            ease: "linear",
          });
        });
      });
    });

    // DESKTOP
    mm.add("(min-width: 1201px), (min-aspect-ratio: 1.46)", () => {
      requestAnimationFrame(() => {
        fanImages.forEach((_, i) => {
          const imgEl = imageRefs.current[i];
          if (!imgEl) return;

          const origin = (() => {
            const rect = imgEl.getBoundingClientRect();
            const rec = EventRef.current?.getBoundingClientRect();
            if (!rec) return { x: 0, y: 0 };
            return {
              x: rec.left + rec.width / 2 - rect.left,
              y: rec.bottom - rect.top,
            };
          })();

          gsap.killTweensOf(imgEl);
          gsap.set(imgEl, { scale: 1 });
          imgEl.style.transformOrigin = `${origin.x}px ${origin.y}px`;
          imgEl.style.pointerEvents = "none";
          gsap.to(imgEl, {
            rotate: rotationAngles[i],
            duration: 1.7,
            scaleX: [1, 2, 3].includes(i) ? 0.2 : 1,
            scaleY: [0, 4].includes(i) ? 0.2 : 1,
            ease: "linear",
          });
        });
      });
    });
  };

  const handleBackFromCategory = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    imageRefs.current.forEach((img) => {
      if (!img) return;
      gsap.killTweensOf(img);
      gsap.set(img, { clearProps: "all" });
    });
    setShowEventPage(false);
    setSelectedCategory(null);
    setFoldFan(false);
    setShowImages(true);
  };

  return (
    <div
      className={styles.eventsmaincontainer}
      ref={EventRef}
    >
      <div className={styles.background}></div>
      <Helmet>
        <title>Events | MohanaMantra 2K26 | MBU</title>
        <meta
          name="description"
          content="Explore the diverse events at MohanaMantra 2K26 — Kalakshetra, Technoholic, Music, Pro Shows, and Spot Events across dance, drama, tech, and more."
        />
        <link rel="canonical" href="https://www.mohanamantra.com/events" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Events | MohanaMantra 2K26 | MBU" />
        <meta property="og:description" content="Explore Kalakshetra, Technoholic, Music, Pro Shows, and Spot Events at MohanaMantra 2K26." />
        <meta property="og:image" content="https://www.mohanamantra.com/images/logo.webp" />
        <meta property="og:url" content="https://www.mohanamantra.com/events" />
        <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Events | MohanaMantra 2K26 | MBU" />
        <meta name="twitter:description" content="Kalakshetra, Technoholic, Music, Pro Shows & Spot Events at MohanaMantra 2K26." />
        <meta name="twitter:image" content="https://www.mohanamantra.com/images/logo.webp" />
        <meta name="twitter:site" content="@Mohana_Mantra" />
      </Helmet>
      <BreadCrumb data={breadcrumbJsonLd} />
      {!showEventPage && (
        <div>
          <BackButton className={styles.aboutBB} />
        </div>
      )}
      {/* <img src={Text} alt="Text" className={styles.text} /> */}

      {showImages && (
        <div className={styles.eventscontainer}>
          <h2 style={{ display: "none" }}>
            Events | MohanaMantra 2K26 | MBU
          </h2>
          {fanImages.map((img, i) => {
            return (
              <EventFrame
                key={i}
                shape={img.shape}
                frameSrc={img.src}
                innerImageSrc={img.innerImageSrc}
                objectPosition={img.objectPosition}
                scale={img.scale}
                alt={img.alt}
                data-nosnippet
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                className={`${img.className} ${foldFan ? `${styles.fold} ${styles.folding}` : ""
                  }`}
                onClick={() => handleImageClick(img.alt)}
              />
            );
          })}
          <img
            src={isMobile ? TextMobile : Text}
            alt="Text"
            className={styles.text}
          />
        </div>
      )}

      {showEventPage && selectedCategory && (
        <div className={styles.eventspageWrapper}>
          <Eventspage category={selectedCategory} onBack={handleBackFromCategory} />
        </div>
      )}
    </div>
  );
};

export default Events;
