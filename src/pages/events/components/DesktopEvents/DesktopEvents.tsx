import { motion, AnimatePresence } from "framer-motion";
import styles from "../Eventspage.module.scss";
import EventImage from "../ImagePreloader/ImagePreloader";
import Location from "/svgs/events/location.svg";
import Right from "/svgs/events/Next1.svg";

interface DesktopEventsProps {
  events: any[];
  currentIndex: number;
  handleNext: () => void;
  handlePrev: () => void;
  category: string;
}

const DesktopEvents: React.FC<DesktopEventsProps> = ({
  events,
  currentIndex,
  handleNext,
  handlePrev,
  category,
}) => (
  <AnimatePresence mode="wait">
    {events.length > 0 ? (
      <div className={styles.eventdesktop}>
        <motion.div
          className={styles.eventContentWrapperSingle}
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <div className={styles.titleContainer}>
            <h4>{events[currentIndex].name}</h4>
          </div>

          <div className={styles.imageholderFull}>
            <EventImage
              imageUrl={events[currentIndex]?.image_url}
              alt={events[currentIndex]?.name}
              className={styles.imagenewFull}
              previewClass={styles.imagenewpreviewFull}
            />
          </div>

          <div className={styles.bottomControls}>
            <div className={styles.venue}>
              <img src={Location} alt="" />
              <p>{events[currentIndex].venue}</p>
            </div>

            <div className={styles.controlsBelow}>
              <div className={styles.leftBtn} onClick={handlePrev}>
                <img src={Right} alt="Prev" className={styles.prevBtn} />
              </div>
              <div className={styles.rightBtn} onClick={handleNext}>
                <img src={Right} alt="Next" className={styles.nextBtn} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ) : (
      <p className={styles.centerText}>
        {`No events found in "${category}"`}
      </p>
    )}
  </AnimatePresence>
);

export default DesktopEvents;
