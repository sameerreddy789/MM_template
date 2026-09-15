const Back = cdn("/images/events/backg1.webp");
import { cdn } from "../../../utils/cdn";
import styles from "./Eventspage.module.scss";
const cl1 = cdn("/svgs/events/cl1.svg");
const cl2 = cdn("/svgs/events/cl2.svg");
const topright = cdn("/svgs/events/topright.svg");
import BackButton from "../../components/backButton/BackButton";
import { useEffect, useState } from "react";
const Star = cdn("/svgs/events/star.svg");
const Star2 = cdn("/svgs/events/star.svg");
import { useFetchEvents } from "./UseFetchEvents/UseFetchEvents";
import FlyingIcons from "./FlyingIcons/FlyingIcons";
import MobileEvents from "./MobileEvents/MobileEvents";
import DesktopEvents from "./DesktopEvents/DesktopEvents";
interface EventspageProps {
  category: string;
  onBack?: () => void;
}

const Eventspage: React.FC<EventspageProps> = ({ category, onBack }) => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1200px) and (max-aspect-ratio: 1.45)")
      .matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 1200px) and (max-aspect-ratio: 1.45)"
    );

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  const [currentIndex, setCurrentIndex] = useState(0);

const events = useFetchEvents(category);
  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      events.length > 0 ? (prevIndex + 1) % events.length : 0
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      events.length > 0 ? (prevIndex - 1 + events.length) % events.length : 0
    );
  };
  return (
    <div>
      <div
        className={styles.page}
        style={{
          backgroundImage: `url("${Back}")`,
        }}
      >
        <img src={cl1} alt="Clouds" className={styles.cl1} />
        <img src={cl2} alt="Clouds" className={styles.cl2} />
        <img src={topright} alt="Borders" className={styles.bar1} />
        <img src={topright} alt="Borders" className={styles.bar2} />
        <BackButton
          className={styles.aboutBB}
          onClick={onBack}
        />
         <FlyingIcons icons={[Star, Star2]} /> 

        <div className={styles.evntcontainer}>
          {isMobile ? (
            
            <MobileEvents
            events={events}
            currentIndex={currentIndex}
            handleNext={handleNext}
            handlePrev={handlePrev}
            category={category}
          />
          ) : (
            <DesktopEvents
            events={events}
            currentIndex={currentIndex}
            handleNext={handleNext}
            handlePrev={handlePrev}
            category={category}
          />
          )}
        </div>
      </div>
    </div>
  );
};

export default Eventspage;
