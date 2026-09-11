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

interface ContactDoorsProps {
  pinElemRef?: React.RefObject<HTMLDivElement | null>;
  triggerElemRef?: React.RefObject<HTMLDivElement | null>;
  pinElem?: HTMLDivElement | null;
  triggerElem?: HTMLDivElement | null;
}

interface HoriBarDetails {
  numOfBars: number;
  firstBarPos: number;
  barGap: number;
}

/**
 * Finds the top offset of the first tag that sits on a row below the first one.
 */
const findSecondRowTop = (items: HTMLCollection, firstRowTop: number) => {
  for (let i = 1; i < items.length; i++) {
    const top = items[i].getBoundingClientRect().top;
    if (top - firstRowTop > 1) return top;
  }
  return null;
};

export default function ContactDoors({
  pinElemRef,
  triggerElemRef,
  pinElem,
  triggerElem,
}: ContactDoorsProps) {
  const targetPin = pinElem || pinElemRef?.current;
  const targetTrigger = triggerElem || triggerElemRef?.current;

  const door1Ref = useRef<HTMLDivElement>(null);
  const door2Ref = useRef<HTMLDivElement>(null);
  const contactBannerRef = useRef<HTMLImageElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const contactTagsRef = useRef<HTMLDivElement>(null);
  const horiBarDetailsRef = useRef<HoriBarDetails | null>(null);

  // Drives the door artwork swap and the scrub mode.
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 900);

  const calculateHoriBarPos = (contactItems: HTMLCollection) => {
    const firstRowItem = contactItems[0];
    if (!firstRowItem) return;
    const firstRowRelPos = firstRowItem.getBoundingClientRect().top;

    const secondRowRelPos = findSecondRowTop(contactItems, firstRowRelPos);
    if (secondRowRelPos === null) return;

    let barGap = Math.round(secondRowRelPos - firstRowRelPos);
    barGap = barGap / 2;
    if (barGap <= 0) return;

    const firstRowAbsPos =
      firstRowRelPos - (door1Ref.current?.getBoundingClientRect().top || 0);

    const firstBarPos = Math.round(firstRowAbsPos % barGap);
    const numOfBars = Math.round(
      (door1Ref.current?.clientHeight || 0 - firstBarPos || 0) / barGap
    );

    horiBarDetailsRef.current = { numOfBars, firstBarPos, barGap };
  };

  const { contextSafe } = useGSAP();

  const animateContactItems = contextSafe((angle: number) => {
    const angleLimit = 30;
    if (Math.abs(angle) >= angleLimit) return;

    gsap.to(`.${styles.contactItem}`, { rotateZ: angle });
  });

  useGSAP(() => {
    if (!targetTrigger || !targetPin) return;
    gsap.registerPlugin(ScrollTrigger);

    const animateContactBanner = (animation: gsap.TimelineVars) =>
      gsap.to(contactBannerRef.current, { ...animation, duration: 0.3 });

    const doorTimeLine = gsap.timeline({
      scrollTrigger: {
        trigger: targetTrigger,
        start: "bottom bottom",
        end: () => `+=${window.innerHeight}`,
        scrub: isMobile ? true : 0.5,
        pin: targetPin,
        pinSpacing: false,
        invalidateOnRefresh: true,
        onEnter: () => {
          document.body.classList.add("in-contact-section");
        },
        onLeave: () => {
          document.body.classList.add("in-contact-section");
          animateContactBanner({ y: "0%", autoAlpha: 1 });
          animateContactItems(0);
          gsap.set(`.${styles.contactSection}`, { pointerEvents: "all" });
        },
        onEnterBack: () => {
          document.body.classList.add("in-contact-section");
          animateContactBanner({ y: "-100%", autoAlpha: 0 });
          gsap.set(`.${styles.contactSection}`, { pointerEvents: "none" });
        },
        onLeaveBack: () => {
          document.body.classList.remove("in-contact-section");
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
      document.body.classList.remove("in-contact-section");
    };
  }, [targetPin, targetTrigger]);

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
              transform: "translateX(-120%)",
            }}
          >
            {latticeBars}
          </div>
          <div
            className={styles.contactDoor}
            ref={door2Ref}
            style={{
              backgroundImage: `url('${isMobile ? door2mobile : door2}')`,
              transform: "translateX(120%)",
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
