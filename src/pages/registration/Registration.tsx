import { useEffect, useState } from "react";
import { cdn } from "../../utils/cdn";
import SEO from "../../components/SEO";
import BackButton from "../components/backButton/BackButton";
import BreadCrumb from "../components/breadCrumb/BreadCrumb";
import Countdown from "../components/countdown/Countdown";
import Register from "./components/Register/Register";
import styles from "./Registration.module.scss";

const bgExtend = cdn("/images/registration/bg-extended.webp");
const banner = cdn("/images/registration/reg-banner.webp");
const bgMobile = cdn("/svgs/registration/bg-mobile.svg");
const mobileBackgroundQuery = "(max-width: 1200px) and (max-aspect-ratio: 1.45)";

interface RegistrationProps {
  startAnimation: boolean;
  goToPage: (path: string) => void;
}

const Registration = ({ goToPage }: RegistrationProps) => {
  const [isMobileBg, setIsMobileBg] = useState(
    () => window.matchMedia(mobileBackgroundQuery).matches
  );

  useEffect(() => {
    document.body.style.position = "static";
    document.body.style.overflow = "";
    document.body.style.height = "";

    const mediaQuery = window.matchMedia(mobileBackgroundQuery);
    const handleChange = (event: MediaQueryListEvent) => setIsMobileBg(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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

  return (
    <div className={styles.instrback}>
      <SEO
        title="Registration | MohanaMantra 2K26 | MBU"
        description="Register for MohanaMantra 2K26. Enter your student details, pay securely through Razorpay, and receive your entry pass after payment verification."
        canonicalUrl="https://www.mohanamantra.com/register"
      />
      <BreadCrumb data={breadcrumbJsonLd} />
      <img
        src={isMobileBg ? bgMobile : bgExtend}
        alt=""
        aria-hidden="true"
        className={styles.backgroundImage}
      />
      <div className={styles.birds}>
        <img src={banner} alt="MohanaMantra registration" className={styles.bannerImage} />
      </div>
      <Countdown className={styles.regCountdown} />
      <BackButton onClick={() => goToPage("/")} />
      <Register />
    </div>
  );
};

export default Registration;
