import React from "react";
import styles from "./FloatingCloud.module.scss";

interface FloatingCloudProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: number | string;
  opacity?: number;
  duration?: number;
  delay?: number;
  direction?: "normal" | "reverse";
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
  hideOnMobile = false,
  hideOnTablet = false,
  cloudId = 1,
  className = "",
}: FloatingCloudProps) {
  const imgSrc = `/images/landing/cloud_${cloudId}.png`;

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
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      <img src={imgSrc} alt={`Cloud ${cloudId}`} className={styles.cloudImage} />
    </div>
  );
}
