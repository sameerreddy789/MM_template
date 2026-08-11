import React from "react";
import styles from "./FloatingCloud.module.scss";

/**
 * 2% faster than the tuned durations. Applied here rather than by editing every
 * call site, so the numbers passed in stay the values that were art-directed and
 * the speed trim is a single place to adjust.
 */
const SPEED_MULTIPLIER = 1.02;

interface FloatingCloudProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: number | string;
  opacity?: number;
  /** Seconds for one full horizontal cycle, before the speed multiplier. */
  duration?: number;
  delay?: number;
  direction?: "normal" | "reverse";
  /** Horizontal travel either side of centre, e.g. "7vw". */
  driftX?: string;
  /** Vertical travel either side of centre, e.g. "14px". */
  driftY?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  cloudId?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function FloatingCloud({
  top,
  left,
  right,
  bottom,
  width = 200,
  opacity = 0.5,
  duration = 40,
  delay = 0,
  direction = "normal",
  driftX,
  driftY,
  hideOnMobile = false,
  hideOnTablet = false,
  cloudId = 1,
  className = "",
}: FloatingCloudProps) {
  const imgSrc = `/images/landing/cloud_${cloudId}.png`;

  // Shorter duration over the same distance = faster.
  const cycle = duration / SPEED_MULTIPLIER;

  return (
    <div
      className={`${styles.cloudWrapper} ${
        direction === "reverse" ? styles.reverse : ""
      } ${hideOnMobile ? styles.hideOnMobile : ""} ${
        hideOnTablet ? styles.hideOnTablet : ""
      } ${className}`}
      style={
        {
          top,
          left,
          right,
          bottom,
          width,
          opacity,
          // Rounded to keep the generated CSS readable; sub-ms precision is
          // irrelevant over a ~40s cycle.
          "--duration": `${cycle.toFixed(2)}s`,
          "--delay": `${delay}s`,
          ...(driftX ? { "--drift-x": driftX } : {}),
          ...(driftY ? { "--drift-y": driftY } : {}),
        } as React.CSSProperties
      }
    >
      <img
        src={imgSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={styles.cloudImage}
      />
    </div>
  );
}
