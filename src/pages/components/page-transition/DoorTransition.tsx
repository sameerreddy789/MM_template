import { useEffect, useRef, type RefObject } from "react";
import { motion, useAnimation } from "framer-motion";
import styles from "./style.module.scss";
import Door1Image from "/images/doors/Door1.png";
import Door2Image from "/images/doors/Door2.png";
import Door3Image from "/images/doors/Door3.png";
import Door4Image from "/images/doors/Door4.png";
import Aud from "/sounds/door-close.mp3";
// import Preloader from "../../registration/components/Preloader/Preloader";
import assetList from "../../../assetList";

type Phase = "idle" | "closing" | "waiting" | "opening";

interface Props {
  phase: Phase;
  onClosed?: () => void;
  onOpened?: () => void;
  percentageLoaded: number;
  targetPageRef: RefObject<string | null>;
}

export default function DoorTransition({
  phase,
  onClosed,
  onOpened,
  percentageLoaded,
  targetPageRef,
}: Props) {
  const c1 = useAnimation();
  const c2 = useAnimation();
  const c3 = useAnimation();
  const c4 = useAnimation();
  const closeSoundRef = useRef<HTMLAudioElement | null>(null);
  const openSoundRef = useRef<HTMLAudioElement | null>(null);
  const START = {
    outerLeft: "-200%",
    innerLeft: "-300%",
    innerRight: "300%",
    outerRight: "200%",
  };
  const isLoading =
    targetPageRef.current &&
    Object.keys(assetList).includes(targetPageRef?.current.replace("/", ""));

  useEffect(() => {
    const closeAudio = new Audio(Aud);
    closeAudio.load();
    closeAudio.onerror = (e) => console.warn("Error loading close sound", e);
    closeSoundRef.current = closeAudio;

    const openAudio = new Audio(Aud);
    openAudio.load();
    openAudio.onerror = (e) => console.warn("Error loading open sound", e);
    openSoundRef.current = openAudio;
  }, []);

  const onClosedRef = useRef(onClosed);
  const onOpenedRef = useRef(onOpened);
  const prevPhaseRef = useRef<Phase>(phase);

  useEffect(() => {
    onClosedRef.current = onClosed;
    onOpenedRef.current = onOpened;
  }, [onClosed, onOpened]);

  useEffect(() => {
    let cancelled = false;

    // A genuine opening is always preceded by a closing. Anything arriving here
    // straight from "idle" is a page that loaded with the doors already
    // off-screen, so the opening tween has nowhere to travel and moves nothing -
    // it must not play the transition sound. App avoids queueing those, and this
    // keeps the sound tied to real door movement whatever calls in.
    const previousPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    const followsAClosing =
      previousPhase === "closing" || previousPhase === "waiting";

    const runClosing = async () => {
      closeSoundRef.current?.play();
      await Promise.all([
        c1.set({ "--dx": START.outerLeft }),
        c2.set({ "--dx": START.innerLeft }),
        c3.set({ "--dx": START.innerRight }),
        c4.set({ "--dx": START.outerRight }),
      ]);
      if (cancelled) return;

      await Promise.all([
        c1.start({
          "--dx": "0%",
          transition: { duration: 0.7, ease: "easeInOut" },
        }),
        c4.start({
          "--dx": "0%",
          transition: { duration: 0.7, ease: "easeInOut" },
        }),

        c2.start({
          "--dx": "0%",
          transition: { duration: 0.9, ease: "easeInOut" },
        }),
        c3.start({
          "--dx": "0%",
          transition: { duration: 0.9, ease: "easeInOut" },
        }),
      ]);

      if (!cancelled) onClosedRef.current?.();
    };

    const runOpening = async () => {
      setTimeout(async () => {
        if (followsAClosing) openSoundRef.current?.play();
        await Promise.all([
          c2.start({
            "--dx": START.innerLeft,
            transition: { duration: 0.7, ease: "easeInOut" },
          }),
          c3.start({
            "--dx": START.innerRight,
            transition: { duration: 0.7, ease: "easeInOut" },
          }),

          c1.start({
            "--dx": START.outerLeft,
            transition: { duration: 0.9, ease: "easeInOut" },
          }),
          c4.start({
            "--dx": START.outerRight,
            transition: { duration: 0.9, ease: "easeInOut" },
          }),
        ]);

        if (!cancelled) onOpenedRef.current?.();
      }, 500);
    };

    if (phase === "closing") runClosing();
    if (phase === "opening") runOpening();

    return () => {
      cancelled = true;
    };
  }, [phase, c1, c2, c3, c4]);

  if (phase === "idle") return null;

  return (
    <div className={styles.cont} aria-hidden>
      <motion.img
        src={Door1Image}
        alt="Door1"
        className={`${styles.door} ${styles.door1}`}
        style={{ "--dx": START.outerLeft } as any}
        animate={c1}
      />
      <motion.img
        src={Door2Image}
        alt="Door2"
        className={`${styles.door} ${styles.door2}`}
        style={{ "--dx": START.innerLeft } as any}
        animate={c2}
      />
      <motion.img
        src={Door3Image}
        alt="Door3"
        className={`${styles.door} ${styles.door3}`}
        style={{ "--dx": START.innerRight } as any}
        animate={c3}
      />
      <motion.img
        src={Door4Image}
        alt="Door4"
        className={`${styles.door} ${styles.door4}`}
        style={{ "--dx": START.outerRight } as any}
        animate={c4}
      />
      {
        <div
          className={`${styles.loadingText} ${
            phase === "waiting" && styles.loadingShow
          } ${isLoading && styles.percentageShow}`}
        >
          Loading{isLoading && `: ${Math.round(percentageLoaded)}%`}
        </div>
      }
    </div>
  );
}
