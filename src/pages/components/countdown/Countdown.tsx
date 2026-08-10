import { useEffect, useState } from "react";
import styles from "./Countdown.module.scss";

const TARGET_DATE = new Date("2026-10-30T00:00:00+05:30");

const pad = (value: number) => (value >= 10 ? `${value}` : `0${value}`);

interface CountdownProps {
  /** Lets the host page position the block without owning its internal styling. */
  className?: string;
}

/**
 * Days / hours / minutes until the fest. Self-contained so it can be dropped onto
 * any page: it carries its own font sizing variables rather than relying on the
 * ones the landing page declares on `html`.
 */
export default function Countdown({ className }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = TARGET_DATE.getTime() - Date.now();

      const next =
        difference <= 0
          ? { days: 0, hours: 0, minutes: 0 }
          : {
              days: Math.floor(difference / (1000 * 60 * 60 * 24)),
              hours: Math.floor(
                (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              ),
              minutes: Math.floor(
                (difference % (1000 * 60 * 60)) / (1000 * 60)
              ),
            };

      // Ticks every second so the display never lags a minute rollover, but only
      // commits when a shown value actually changed. Returning the previous object
      // keeps the reference stable and skips the re-render.
      setTimeLeft((prev) =>
        prev.days === next.days &&
        prev.hours === next.hours &&
        prev.minutes === next.minutes
          ? prev
          : next
      );
    };

    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div
      className={
        className ? `${styles.dateCountdown} ${className}` : styles.dateCountdown
      }
    >
      <div className={`${styles.daysLeft} ${styles.timeLeft}`}>
        <div className={styles.days}>
          <span>{pad(timeLeft.days)}</span>
        </div>
        DAYS
      </div>
      <div>:</div>
      <div className={`${styles.hoursLeft} ${styles.timeLeft}`}>
        <div className={styles.hours}>
          <span>{pad(timeLeft.hours)}</span>
        </div>
        HOURS
      </div>
      <div>:</div>
      <div className={`${styles.minutesLeft} ${styles.timeLeft}`}>
        <div className={styles.minutes}>
          <span>{pad(timeLeft.minutes)}</span>
        </div>
        MINUTES
      </div>
    </div>
  );
}
