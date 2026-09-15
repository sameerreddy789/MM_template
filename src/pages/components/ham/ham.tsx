import { cdn } from "../../../utils/cdn";
import styles from "./ham.module.scss";
const hamX = cdn("/svgs/landing/hamX.svg");
const phone = cdn("/svgs/landing/phone.svg");
const homeIcon = cdn("/svgs/landing/homeIcon.svg");
const aboutusIcon = cdn("/svgs/landing/aboutusIcon.svg");
const eventIcon = cdn("/svgs/landing/eventsIcon.svg");
const mmLogo = cdn("/images/logo.webp");
import { useHamStore } from "../../../utils/store";

const navItems = [
  { label: "Home", links: "/", icon: homeIcon },
  { label: "About Us", links: "/aboutus", icon: aboutusIcon },
  { label: "Contact", links: "/contact", icon: phone },
  { label: "Events", links: "/events", icon: eventIcon },
];
export default function Ham({
  goToPage,
}: {
  goToPage: (path: string) => void;
}) {
  const setHamOpen = useHamStore((state) => state.setHamOpen);
  return (
    <div className={styles.ham}>
      <div className={styles.closeBtn} onClick={() => setHamOpen(false)}>
        <img src={hamX} alt="Close" className={styles.closeIcon} />
      </div>
      <div className={styles.logoContainer}>
        <img src={mmLogo} alt="MohanaMantra Logo" className={styles.logo} />
      </div>
      <div className={styles.linkContainer}>
        {navItems.map((item, index) => (
          <>
            <div
              key={item.label}
              className={styles.navItem}
              onClick={() => {
                goToPage(item.links);
                setHamOpen(false);
              }}
            >
              <img src={item.icon} alt={item.label} className={styles.icon} />
              <span className={styles.label}>{item.label}</span>
            </div>
            {index < navItems.length - 1 && <div className={styles.line}></div>}
          </>
        ))}
      </div>
      <div className={styles.mwd}>
        Made with ❤️
      </div>
    </div>
  );
}
