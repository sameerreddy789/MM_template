import styles from "./Events.module.scss";
import Text from "/images/events/text.png";
import dance from "/images/events/dancef.webp";
import drama from "/images/events/dramaf.webp";
import dramaMobile from "/images/events/DramaMobilef.png";
import music from "/images/events/music1.png";
import misc from "/images/events/misc1.webp";
import photography from "/images/events/proshow.png";
import danceMobile from "/images/events/DanceMobilef.png";
import musicMobile from "/images/events/MusicMobilef.png";
import miscMobile from "/images/events/MiscMobilef.png";
import photographyMobile from "/images/events/PhotographyMobilef.png";
import Eventspage from "./components/Eventspage";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import TextMobile from "/images/events/TextMobile.png";
import BackButton from "../components/backButton/BackButton";
import SEO from "../../components/SEO";
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
 mobileSrc: dramaMobile,
 alt: "Technoholic",
 className: styles.quizzes,
 shape: "quizzes"
 },
 { src: music, mobileSrc: musicMobile, alt: "Band Night", className: styles.music, shape: "music" },
 {
 src: photography,
 mobileSrc: photographyMobile,
 alt: "DJ Night",
 className: styles.photography,
 shape: "photography"
 },
 { src: dance, mobileSrc: danceMobile, alt: "Kalakshetra", className: styles.dance, shape: "dance" },
 { src: misc, mobileSrc: miscMobile, alt: "Spot Events", className: styles.misc, shape: "misc" },
];

const rotationAngles = [-30, -135, -185, -225, -305];

const Events: React.FC = () => {
 const breadcrumbJsonLd = {
 "@context": "https://schema.org",
 "@type": "BreadcrumbList",
 itemListElement: [
 {
 "@type": "ListItem",
 position: 1,
 name: "Home",
 item: "https://mm-template.vercel.app/",
 },
 {
 "@type": "ListItem",
 position: 2,
 name: "Events",
 item: "https://mm-template.vercel.app/events",
 },
 ],
 };
 const [isMobile, setIsMobile] = useState(
 window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 1.45)")
 .matches
 );
 const [canHover, setCanHover] = useState(
 window.matchMedia("(hover: hover) and (pointer: fine)").matches
 );

 // canHover was previously read once at component-init and never re-evaluated.
 // On a tablet that gets a mouse attached, or on a desktop in a touch-and-mouse
 // hybrid mode, the value would lie for the rest of the session. Listen for
 // changes instead.
 useEffect(() => {
 const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
 const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
 mq.addEventListener("change", handler);
 return () => mq.removeEventListener("change", handler);
 }, []);

 // Tracks every gsap.matchMedia() instance we create so the cleanup effect can
 // call .revert() on them. Without this the match-media listeners and the
 // tweens they create accumulate across navigations and the page slowly leaks
 // until the browser starts dropping frames.
 const mmRefs = useRef<gsap.MatchMedia[]>([]);

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
 // Revert every matchMedia instance this component created. .revert() is
 // gsap's official "tear down everything this matchMedia produced"
 // (listeners + tweens + ScrollTriggers), so without this those leak
 // across navigations.
 mmRefs.current.forEach((mm) => mm.revert());
 mmRefs.current = [];
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

 // The matchMedia instance is registered in mmRefs so the cleanup effect
 // can revert() it on unmount or before the next fold animation runs.
 const mm = gsap.matchMedia();
 mmRefs.current.push(mm);

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
 // Revert any leftover matchMedia before re-enabling the fan so the next
 // fold animation starts from a clean slate.
 mmRefs.current.forEach((mm) => mm.revert());
 mmRefs.current = [];
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
 <SEO
 title="Events | MohanaMantra 2K26 | MBU"
 description="Explore the diverse events at MohanaMantra 2K26 — Kalakshetra, Technoholic, Band Night, DJ Night, and Spot Events across dance, drama, tech, and more."
 canonicalUrl="https://mm-template.vercel.app/events"
 />
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
 frameSrc={isMobile && img.mobileSrc ? img.mobileSrc : img.src}
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
