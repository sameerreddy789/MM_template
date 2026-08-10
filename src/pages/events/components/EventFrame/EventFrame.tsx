import React, { forwardRef } from 'react';
import styles from './EventFrame.module.scss';

export interface EventFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  shape: "quizzes" | "music" | "photography" | "dance" | "misc";
  frameSrc: string;
  innerImageSrc?: string;
  alt: string;
  className?: string;
  objectPosition?: string;
  objectFit?: "cover" | "contain" | "fill";
  scale?: number;
  isFolded?: boolean;
  "data-nosnippet"?: boolean;
}

const EventFrame = forwardRef<HTMLDivElement, EventFrameProps>(
  (
    {
      shape,
      frameSrc,
      innerImageSrc,
      alt,
      className,
      objectPosition = "center",
      objectFit = "cover",
      scale = 1,
      isFolded = false,
      "data-nosnippet": dataNoSnippet,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`${styles.eventFrameWrapper} ${className || ""}`}
        data-nosnippet={dataNoSnippet}
        {...props}
      >
        {/* Inner Masked Image */}
        {innerImageSrc && (
          <div className={`${styles.innerImageContainer} ${styles[`shape-${shape}`]}`}>
            <img
              src={innerImageSrc}
              alt={`${alt} content`}
              className={styles.innerImage}
              style={{
                objectPosition,
                objectFit,
                transform: `scale(${scale})`,
              }}
            />
          </div>
        )}

        {/* Outer Frame (the decorative asset) */}
        <img src={frameSrc} alt={alt} className={styles.outerFrame} />
      </div>
    );
  }
);

EventFrame.displayName = "EventFrame";

export default EventFrame;
