import styles from "./mainHam.module.scss";
import { useMainHamStore } from "../../../utils/store";
import mmLogo from "/images/logo.webp";
import insta from "/svgs/landing/insta.svg";
import instaLamp from "/svgs/landing/instaLamp.svg";
import youtube from "/svgs/landing/youtube.svg";
import youtubeLamp from "/svgs/landing/youtubeLamp.svg";

interface MainHamProps {
  goToPage: (path: string) => void;
}

export default function MainHam({ goToPage }: MainHamProps) {
  const setMainHamOpen = useMainHamStore((state) => state.setMainHamOpen);

  // Web navbar contents featured prominently as core festival destinations
  const primaryNavItems = [
    {
      title: "EVENTS",
      subtitle: "Competitions & Shows",
      url: "/events",
      iconType: "flame",
    },
    {
      title: "BROCHURE",
      subtitle: "Festival Guide & Schedule",
      url: "/brochure",
      iconType: "scroll",
    },
    {
      title: "SPONSORS",
      subtitle: "Our Esteemed Partners",
      url: "/sponsors",
      iconType: "shield",
    },
    {
      title: "GALLERY",
      subtitle: "Glimpses of MM Heritage",
      url: "/gallery",
      iconType: "lotus",
    },
  ];

  const secondaryNavItems = [
    { title: "Home", url: "/" },
    { title: "Register", url: "/register" },
    { title: "About Us", url: "/aboutus" },
    { title: "Contact", url: "/contact" },
    { title: "Rocktaves", url: "https://rocktaves.mohanamantra.com/", external: true },
    { title: "Media Partners", url: "/mediaPartners" },
  ];

  const socialLinks = [
    {
      name: "YouTube",
      icon: youtube,
      lamp: youtubeLamp,
      url: "https://www.youtube.com/c/MohanaMantra",
    },
    {
      name: "Instagram",
      icon: insta,
      lamp: instaLamp,
      url: "https://www.instagram.com/mohana_mantra/",
    },
  ];

  const handleNavClick = (url: string, external?: boolean) => {
    if (external || url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      goToPage(url);
      setMainHamOpen(false);
    }
  };

  return (
    <div className={styles.mainHam} role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
      {/* Indian Royal Arch Background Watermark */}
      <div className={styles.mandalaWatermark} aria-hidden="true">
        <svg viewBox="0 0 600 600" className={styles.mandalaSvg}>
          <circle cx="300" cy="300" r="280" stroke="#c0b063" strokeWidth="1" fill="none" opacity="0.12" />
          <circle cx="300" cy="300" r="240" stroke="#c0b063" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.18" />
          <circle cx="300" cy="300" r="180" stroke="#c0b063" strokeWidth="1" fill="none" opacity="0.15" />
          <circle cx="300" cy="300" r="120" stroke="#c0b063" strokeWidth="1.5" fill="none" opacity="0.2" />
          {Array.from({ length: 16 }).map((_, i) => {
            const rot = i * 22.5;
            return (
              <g key={i} transform={`rotate(${rot} 300 300)`}>
                <path
                  d="M300 60 C320 140, 320 200, 300 240 C280 200, 280 140, 300 60 Z"
                  fill="none"
                  stroke="#c0b063"
                  strokeWidth="1.2"
                  opacity="0.16"
                />
                <circle cx="300" cy="80" r="4" fill="#c0b063" opacity="0.25" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top Traditional Indian Toran / Arch Border */}
      <div className={styles.topToran} aria-hidden="true">
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className={styles.toranSvg}>
          <path
            d="M0,0 L800,0 L800,20 Q700,55 600,20 Q500,55 400,20 Q300,55 200,20 Q100,55 0,20 Z"
            fill="url(#goldGradientToran)"
            opacity="0.4"
          />
          <path
            d="M0,0 L800,0 L800,12 Q700,42 600,12 Q500,42 400,12 Q300,42 200,12 Q100,42 0,12 Z"
            fill="#c0b063"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="goldGradientToran" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c0b063" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c0b063" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Close Button with Indian Gold Mandala Ring */}
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => setMainHamOpen(false)}
        aria-label="Close Menu"
      >
        <div className={styles.closeCircle}>
          <svg viewBox="0 0 40 40" className={styles.closeIconSvg}>
            <circle cx="20" cy="20" r="18" stroke="#c0b063" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
            <line x1="13" y1="13" x2="27" y2="27" stroke="#f2dd7c" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="27" y1="13" x2="13" y2="27" stroke="#f2dd7c" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Main Content Area */}
      <div className={styles.menuContent}>
        {/* Festival Header / Brand */}
        <div className={styles.brandHeader} onClick={() => handleNavClick("/")}>
          <div className={styles.logoFrame}>
            <img src={mmLogo} alt="MohanaMantra Logo" className={styles.brandLogo} />
          </div>
          <div className={styles.brandTitles}>
            <span className={styles.festName}>MOHANA MANTRA</span>
            <span className={styles.festYear}>2K26 • MBU</span>
          </div>
          <div className={styles.ornamentalDivider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLotus}>✦ ❖ ✦</span>
            <span className={styles.dividerLine} />
          </div>
        </div>

        {/* Primary Navigation Cards (Web Navbar Contents) */}
        <div className={styles.primaryNavGrid}>
          {primaryNavItems.map((item) => (
            <div
              key={item.title}
              className={styles.navCard}
              onClick={() => handleNavClick(item.url)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleNavClick(item.url);
                }
              }}
            >
              <div className={styles.cardBorderAccent} />
              <div className={styles.cardCornerTL} />
              <div className={styles.cardCornerBR} />

              <div className={styles.cardIconWrapper}>
                {item.iconType === "flame" && (
                  <svg viewBox="0 0 24 24" className={styles.cardIcon} fill="currentColor">
                    <path d="M12 2C8.5 7 6 10.5 6 14.5C6 18.1 8.7 21 12 21C15.3 21 18 18.1 18 14.5C18 10.5 15.5 7 12 2ZM12 19C10.1 19 8.5 17.4 8.5 15.2C8.5 12.8 10.2 10.2 12 7.5C13.8 10.2 15.5 12.8 15.5 15.2C15.5 17.4 13.9 19 12 19Z" />
                  </svg>
                )}
                {item.iconType === "scroll" && (
                  <svg viewBox="0 0 24 24" className={styles.cardIcon} fill="currentColor">
                    <path d="M19 3H7C5.3 3 4 4.3 4 6V18C4 19.7 5.3 21 7 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM7 5H19V15H7C5.9 15 5 15.9 5 17C5 16.4 5.4 16 6 16H19V19H7C6.4 19 6 18.6 6 18V6C6 5.4 6.4 5 7 5Z" />
                  </svg>
                )}
                {item.iconType === "shield" && (
                  <svg viewBox="0 0 24 24" className={styles.cardIcon} fill="currentColor">
                    <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" />
                  </svg>
                )}
                {item.iconType === "lotus" && (
                  <svg viewBox="0 0 24 24" className={styles.cardIcon} fill="currentColor">
                    <path d="M12 3C10.5 7 7 11 3 12C7 13 10.5 17 12 21C13.5 17 17 13 21 12C17 11 13.5 7 12 3ZM12 8C13 10.5 15.5 12 17.5 12C15.5 12 13 13.5 12 16C11 13.5 8.5 12 6.5 12C8.5 12 11 10.5 12 8Z" />
                  </svg>
                )}
              </div>

              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardSubtitle}>{item.subtitle}</span>
              </div>

              <div className={styles.cardArrow}>
                <svg viewBox="0 0 24 24" className={styles.arrowSvg} fill="currentColor">
                  <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Quick Links */}
        <div className={styles.secondarySection}>
          <div className={styles.secondaryHeader}>
            <span className={styles.secLine} />
            <span className={styles.secTitle}>EXPLORE MORE</span>
            <span className={styles.secLine} />
          </div>
          <div className={styles.secondaryLinksList}>
            {secondaryNavItems.map((sec) => (
              <button
                key={sec.title}
                type="button"
                className={styles.secLinkBtn}
                onClick={() => handleNavClick(sec.url, sec.external)}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Social Links & Traditional Footer */}
        <div className={styles.menuFooter}>
          <div className={styles.socialRow}>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialPill}
                aria-label={`Follow MohanaMantra on ${social.name}`}
              >
                <img src={social.lamp} alt="" className={styles.socialLamp} />
                <img src={social.icon} alt={social.name} className={styles.socialIcon} />
                <span className={styles.socialName}>{social.name}</span>
              </a>
            ))}
          </div>

          <div className={styles.footerAuspicious}>
            <span className={styles.traditionalTagline}>
              Celebrating Creativity, Culture & Excellence
            </span>
            <span className={styles.mbuTag}>Mohan Babu University, Tirupati</span>
          </div>
        </div>
      </div>
    </div>
  );
}
