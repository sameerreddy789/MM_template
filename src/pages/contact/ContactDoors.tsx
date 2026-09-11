import styles from "./Contact.module.scss";
import { useEffect, useRef, useState } from "react";
import door1 from "/images/contact/Door1.webp";
import door2 from "/images/contact/Door2.webp";
import door1mobile from "/images/contact/Door1Mobile.png";
import door2mobile from "/images/contact/Door2Mobile.png";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import contactBanner from "/images/contact/contact-banner.webp";
import { contactRows } from "./components/contactGallery/contacts";
import ContactCardBody from "./components/contactGallery/ContactCardBody";
import debouncedHandler from "../../utils/debounce";
import { useNavVisibilityStore } from "../../utils/store";

interface ContactDoorsProps {
  pinElemRef: React.RefObject<HTMLDivElement | null>;
  triggerElemRef: React.RefObject<HTMLDivElement | null>;
}

interface HoriBarDetails {
  numOfBars: number;
  firstBarPos: number;
  barGap: number;
}

/**
 * Finds the top offset of the first tag that sits on a row below the first one.
 *
 * The previous version indexed a fixed slot (`items[3]` on desktop), which only
 * held while there were eight tags laid out two-by-two in each door. With five
 * sections that index lands on a first-row tag in the other door, so the measured
 * row gap collapsed to zero and the lattice bars stopped being generated.
 * Scanning for the first genuinely lower tag works for any tag count.
 */
const findSecondRowTop = (items: HTMLCollection, firstRowTop: number) => {
  for (let i = 1; i < items.length; i++) {
    const top = items[i].getBoundingClientRect().top;
    // 1px of slack absorbs sub-pixel rounding between siblings on a row.
    if (top - firstRowTop > 1) return top;
  }
  return null;
};

export default function ContactDoors({
  pinElemRef,
  triggerElemRef,
}: ContactDoorsProps) {
  const setNavbarBlocked = useNavVisibilityStore((state) => state.setNavbarBlocked);
  const door1Ref = useRef<HTMLDivElement>(null);
  const door2Ref = useRef<HTMLDivElement>(null);
  const contactBannerRef = useRef<HTMLImageElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const contactTagsRef = useRef<HTMLDivElement>(null);
  const horiBarDetailsRef = useRef<HoriBarDetails | null>(null);

  // Drives the door artwork swap and the scrub mode. The former `isTab` flag went
  // with the per-door split: the tag layout is now CSS-driven, so no JS breakpoint
  // is needed to decide how many tags sit on a row.
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 900);

  const calculateHoriBarPos = (contactItems: HTMLCollection) => {
    // const contactItems = document.getElementsByClassName(styles.contactItem);
    const firstRowItem = contactItems[0];
    if (!firstRowItem) return;
    const firstRowRelPos = firstRowItem.getBoundingClientRect().top;

    const secondRowRelPos = findSecondRowTop(contactItems, firstRowRelPos);
    if (secondRowRelPos === null) return;

    // const barGapThreshold = 100;
    let barGap = Math.round(secondRowRelPos - firstRowRelPos);
    // if (barGap > barGapThreshold)
    barGap = barGap / 2; //Math.round(barGap / 100);
    if (barGap <= 0) return; // Guards Array(numOfBars) against an invalid length

    const firstRowAbsPos =
      firstRowRelPos - (door1Ref.current?.getBoundingClientRect().top || 0);

    const firstBarPos = Math.round(firstRowAbsPos % barGap);
    const numOfBars = Math.round(
      (door1Ref.current?.clientHeight || 0 - firstBarPos || 0) / barGap
    );

    // if (setHoriBarDetails) setHoriBarDetails({numOfBars, firstBarPos, barGap})
    horiBarDetailsRef.current = { numOfBars, firstBarPos, barGap };
  };

  const { contextSafe } = useGSAP();
  /**
   * Swings the tags by their string in response to scroll velocity.
   *
   * This used to rotate two groups in opposite directions, one per door, which
   * suited tags that slid in from opposite sides. They now all hang from the same
   * lattice on a single overlay, so they swing together - opposing rotations would
   * read as two separate objects rather than one row of tags on one rail.
   */
  const animateContactItems = contextSafe((angle: number) => {
    const angleLimit = 30;
    if (Math.abs(angle) >= angleLimit) return;

    gsap.to(`.${styles.contactItem}`, { rotateZ: angle });
  });

  useGSAP(() => {
    if (!triggerElemRef.current || !pinElemRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const animateContactBanner = (animation: gsap.TimelineVars) =>
      gsap.to(contactBannerRef.current, { ...animation, duration: 0.3 });

    const doorTimeLine = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElemRef.current,
        start: "bottom bottom",
        end: () => `+=${window.innerHeight}`,
        scrub: isMobile ? true : 0.5,
        pin: pinElemRef.current,
        pinSpacing: false,
        invalidateOnRefresh: true,
        onEnter: () => {
          setNavbarBlocked(true);
        },
        onLeave: () => {
          setNavbarBlocked(true);
          animateContactBanner({ y: "0%", autoAlpha: 1 });
          animateContactItems(0);
          gsap.set(`.${styles.contactSection}`, { pointerEvents: "all" });
        },
        onEnterBack: () => {
          setNavbarBlocked(true);
          animateContactBanner({ y: "-100%", autoAlpha: 0 });
          gsap.set(`.${styles.contactSection}`, { pointerEvents: "none" });
        },
        onLeaveBack: () => {
          setNavbarBlocked(false);
        },
        onUpdate: (self) => {
          const scrollVelocity = self.getVelocity();
          const swingSensitivity = 0.003;

          animateContactItems(scrollVelocity * swingSensitivity);
        },
      },
    });

    doorTimeLine
      .from(door1Ref.current, { x: "-120%" }, 0)
      .from(door2Ref.current, { x: "120%" }, 0)
      .from(contactTagsRef.current, { autoAlpha: 0, duration: 0.45 }, 0.55);

    return () => {
      setNavbarBlocked(false);
    };
  }, { dependencies: [pinElemRef, triggerElemRef], revertOnUpdate: true });

  // The door trigger is measured off the about section. If that section is still
  // pulling in images when this mounts, start/end land on a stale scroll
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    const handleLoad = () => ScrollTrigger.refresh();

    if (document.readyState !== "complete") {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    const contactItems = document.getElementsByClassName(styles.contactItem);

    const handleResize = () => {
      // location.reload()
      const newIsMobile = window.innerWidth <= 900;
      if (newIsMobile !== isMobile) setIsMobile(newIsMobile);
      calculateHoriBarPos(contactItems);
      // ScrollTrigger.update();
      ScrollTrigger.refresh();
      animateContactItems(0);
      // if (windowWidth.current !== window.innerWidth) location.reload();
    };

    const debouncedHandleResize = debouncedHandler(handleResize, 1000);

    calculateHoriBarPos(contactItems);

    (window.visualViewport || window).addEventListener(
      "resize",
      debouncedHandleResize
    );
    
    return () =>
      (window.visualViewport || window).removeEventListener(
        "resize",
        debouncedHandleResize
      );
  }, []);

  // useEffect(() => {
  //     ScrollTrigger.refresh();
  //     // ScrollTrigger.update();
  // }, [isMobile, isTab])

  // useEffect(() => console.log("ContactDoors just unmounted"), []);

  /** The lattice bars, repeated identically behind each door panel. */
  const latticeBars = (
    <div className={styles.horiBarContainer}>
      {Array(horiBarDetailsRef.current?.numOfBars)
        .fill(null)
        .map((_, i) => (
          <div
            className={styles.horiBar}
            key={i}
            style={{
              top: `${
                i * (horiBarDetailsRef.current?.barGap || 0) +
                (horiBarDetailsRef.current?.firstBarPos || 0)
              }px`,
            }}
          >
            {Array(2)
              .fill(null)
              .map((_, barIndex) => (
                <div key={barIndex} />
              ))}
          </div>
        ))}
    </div>
  );

  return (
    <div className={styles.contactSection} ref={contactSectionRef}>
      <div className={styles.contactSectionContent}>
        <div className={styles.contactHeading}>
          <img
            className={styles.contactBanner}
            alt="contactBanner"
            src={contactBanner}
            ref={contactBannerRef}
          ></img>
        </div>
        <div className={styles.contactDoors}>
          <div
            className={styles.contactDoor}
            ref={door1Ref}
            style={{
              backgroundImage: `url('${isMobile ? door1mobile : door1}')`,
            }}
          >
            {latticeBars}
          </div>
          <div
            className={styles.contactDoor}
            ref={door2Ref}
            style={{
              backgroundImage: `url('${isMobile ? door2mobile : door2}')`,
            }}
          >
            {latticeBars}
          </div>

          {/*
            Sits above both doors rather than inside them, so the middle row of
            three can be centred on the page instead of being split at the seam.
            Same rows, same tag styling as the /contact page - both read from
            contactRows.
          */}
          <div className={styles.contactTags} ref={contactTagsRef}>
            <div className={styles.contactRows}>
              {contactRows.map((row, rowIndex) => (
                <div className={styles.contactRow} key={rowIndex}>
                  {row.map((contact) => (
                    <div className={styles.contactItem} key={contact.section}>
                      <ContactCardBody contact={contact} styles={styles} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
