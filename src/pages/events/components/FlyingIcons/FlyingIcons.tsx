import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "./FlyingIcons.module.scss";

interface Props {
  icons: string[];
}

const MAX_PARTICLES = 12;

const FlyingIcons: React.FC<Props> = ({ icons }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !icons.length) return;

    // Use a GSAP context so all created tweens are cleanly killed on unmount
    const ctx = gsap.context(() => {}, container);

    const spawnFromCorner = (corner: "top-right" | "bottom-left") => {
      // Don't spawn if tab is in the background or if we already have too many particles
      if (document.visibilityState === "hidden") return;
      if (container.childElementCount >= MAX_PARTICLES) return;

      const iconSrc = icons[Math.floor(Math.random() * icons.length)];
      const img = document.createElement("img");
      img.src = iconSrc;
      img.className = styles.flyingIcon;
      img.alt = "Stars";

      const padding = 10;
      const startX = corner === "top-right" ? container.clientWidth - padding : padding;
      const startY = corner === "top-right" ? padding : container.clientHeight - padding;

      img.style.left = `${startX}px`;
      img.style.top = `${startY}px`;
      container.appendChild(img);

      const dx = ((container.clientWidth / 2 - startX) * Math.random()) / 1.25;
      const dy = ((container.clientHeight / 2 - startY) * Math.random()) / 2;

      ctx.add(() => {
        gsap.fromTo(
          img,
          { opacity: 1, scale: 1, x: 0, y: 0 },
          {
            opacity: 0,
            scale: Math.random() * 1.5,
            x: dx,
            y: dy,
            duration: 4,
            ease: "linear",
            onComplete: () => {
              img.remove();
            },
          }
        );
      });
    };

    const spawnLoop = setInterval(() => {
      spawnFromCorner("top-right");
      spawnFromCorner("bottom-left");
    }, 400);

    const handleVisibilityChange = () => {
      // If user switched away and came back, clear any leftover elements so there is zero spike
      if (document.visibilityState === "hidden") {
        ctx.revert();
        container.replaceChildren();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(spawnLoop);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      ctx.revert(); // Instantly stops and kills all active GSAP animations
      container.replaceChildren(); // Removes all spawned image elements from the DOM
    };
  }, [icons]);

  return <div ref={containerRef} className={styles.container} />;
};

export default FlyingIcons;
