import React from "react";
import "./TirumalaHills.css";
import hillsImage from "./tirumala_hills_4k.webp";

type TirumalaHillsProps = {
  className?: string;
  opacity?: number;
  animated?: boolean;
};

export default function TirumalaHills({
  className = "",
  opacity = 1,
  animated = false,
}: TirumalaHillsProps) {
  return (
    <div
      className={`tirumala-hills ${animated ? "tirumala-hills--animated" : ""} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <img src={hillsImage} alt="" draggable={false} />
    </div>
  );
}
