import { Helmet } from "react-helmet-async";
import styles from "./Registration.module.scss";

import Instructions from "../../pages/registration/components/Instructions/Instructions";
import Register from "../../pages/registration/components/Register/Register";
import PaymentSuccessModal, {
  type PaymentSuccessData,
} from "./components/PaymentSuccessModal/PaymentSuccessModal";

import bgExtend from "/images/registration/bg-extended.webp";
import banner from "/images/registration/reg-banner.webp";
import bgMobile from "/svgs/registration/bg-mobile.svg";
import BackButton from "../components/backButton/BackButton";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState, useEffect } from "react";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import Countdown from "../components/countdown/Countdown";

interface RegistrationProps {
  startAnimation: boolean;
  goToPage: (path: string) => void;
}

const Registration = ({ goToPage }: RegistrationProps) => {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.mohanamantra.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Registration",
        item: "https://www.mohanamantra.com/register",
      },
    ],
  };

  const { contextSafe } = useGSAP();
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail] = useState("");
  const [isAnim, setIsAnim] = useState(false);
  const [, setUserData] = useState<any>(null);
  const [paymentSuccessData, setPaymentSuccessData] =
    useState<PaymentSuccessData | null>(null);

  const bgRef = useRef<HTMLImageElement>(null);
  const elemRef1 = useRef<HTMLDivElement>(null);
  const elemRef2 = useRef<HTMLDivElement>(null);

  const toFirstPage = () => {
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 1200px) or (aspect-ratio > 1.45)",
      contextSafe(() => {
        gsap.to(bgRef.current, {
          left: "0",
          duration: 1.5,
          onStart: () => setIsAnim(true),
          onComplete: () => setIsAnim(false),
        });
        const tl = gsap.timeline();
        tl.to(elemRef2.current, {
          opacity: 0,
          duration: 1,
          ease: "power1.out",
        })
          .set(elemRef2.current, {
            display: "none",
            ease: "power1.out",
          })
          .set(elemRef1.current, {
            display: "flex",
            ease: "power1.out",
          })
          .to(elemRef1.current, {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
            onComplete: () => setCurrentPage(1),
          });
      })
    );
    mm.add(
      "(max-width: 1200px) and (aspect-ratio < 1.45)",
      contextSafe(() => {
        const tl = gsap.timeline({
          onStart: () => setIsAnim(true),
        });
        tl.to(elemRef2.current, {
          opacity: 0,
          duration: 1,
          ease: "power1.out",
        })
          .set(elemRef2.current, {
            display: "none",
            ease: "power1.out",
          })
          .set(elemRef1.current, {
            display: "flex",
            ease: "power1.out",
          })
          .to(elemRef1.current, {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
            onComplete: () => {
              setCurrentPage(1);
              setIsAnim(false);
            },
          });
      })
    );
  };

  const toRegPage = () => {
    const mm = gsap.matchMedia();
    contextSafe(() => {
      mm.add("(min-width: 1200px) or (aspect-ratio > 1.45)", () => {
        gsap.to(bgRef.current, {
          left: "50%",
          duration: 1.5,
          onStart: () => setIsAnim(true),
          onComplete: () => setIsAnim(false),
        });
        const tl = gsap.timeline();
        tl.to(elemRef1.current, {
          opacity: 0,
          duration: 1,
          ease: "power1.out",
        })
          .set(elemRef1.current, {
            display: "none",
            ease: "power1.out",
          })
          .set(elemRef2.current, {
            display: "flex",
            ease: "power1.out",
          })
          .to(elemRef2.current, {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
            onComplete: () => setCurrentPage(2),
          });
      });
      mm.add("(max-width: 1200px) and (aspect-ratio < 1.45)", () => {
        const tl = gsap.timeline({
          onStart: () => setIsAnim(true),
        });
        tl.to(elemRef1.current, {
          opacity: 0,
          duration: 1,
          ease: "power1.out",
        })
          .set(elemRef1.current, {
            display: "none",
            ease: "power1.out",
          })
          .set(elemRef2.current, {
            display: "flex",
            ease: "power1.out",
          })
          .to(elemRef2.current, {
            opacity: 1,
            duration: 1,
            ease: "power1.out",
            onComplete: () => {
              setCurrentPage(2);
              setIsAnim(false);
            },
          });
      });
    })();
  };

  useEffect(() => {
    document.body.style.position = "static";
  }, []);

  const backButtonHandler = () => {
    if (isAnim) return;
    switch (currentPage) {
      case 1:
        goToPage("/");
        break;
      case 2:
        toFirstPage();
        break;
    }
  };

  const onGoogleSignIn = () => {
    toRegPage();
  };

  return (
    <div className={styles.instrback}>
      <Helmet>
        <title>Registration | MohanaMantra 2K26 | MBU</title>
        <meta
          name="description"
          content="Register for MohanaMantra 2K26, the annual cultural festival of MBU. Fill your details and complete registration."
        />
        <link rel="canonical" href="https://www.mohanamantra.com/register" />
        <meta
          property="og:title"
          content="Registration | MohanaMantra 2K26 | MBU"
        />
        <meta
          property="og:description"
          content="Register for MohanaMantra 2K26, the annual cultural festival of MBU."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mohanamantra.com/register" />
        <meta
          property="og:image"
          content="https://www.mohanamantra.com/logo2.png"
        />
        <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Registration | MohanaMantra 2K26 | MBU"
        />
        <meta
          name="twitter:description"
          content="Register for MohanaMantra 2K26, the annual cultural festival of MBU."
        />
        <meta
          name="twitter:image"
          content="https://www.mohanamantra.com/logo2.png"
        />
      </Helmet>
      <BreadCrumb data={breadcrumbJsonLd} />
      <img
        src={
          window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 1.45) ")
            .matches
            ? bgMobile
            : bgExtend
        }
        alt="background"
        className={styles.backgroundImage}
        ref={bgRef}
      />
      <div className={styles.birds}>
        <img src={banner} alt="banner" className={styles.bannerImage} />
      </div>
      <Countdown className={styles.regCountdown} />
      <BackButton onClick={backButtonHandler} />

      <Instructions onGoogleSignIn={onGoogleSignIn} ref={elemRef1} />
      <Register
        ref={elemRef2}
        userEmail={userEmail}
        setUserData={setUserData}
        onPaymentSuccess={(data) => setPaymentSuccessData(data)}
      />

      {paymentSuccessData && (
        <PaymentSuccessModal
          paymentData={paymentSuccessData}
          onClose={() => setPaymentSuccessData(null)}
          goToHome={() => goToPage("/")}
        />
      )}
    </div>
  );
};

export default Registration;
