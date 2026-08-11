import { motion, AnimatePresence } from "framer-motion";
import styles from "../Eventspage.module.scss";
import EventImage from "../ImagePreloader/ImagePreloader";
import Right from "/svgs/events/Next1.svg";
import Location from "/svgs/events/location.svg";

interface MobileEventsProps {
  events: any[];
  currentIndex: number;
  handleNext: () => void;
  handlePrev: () => void;
  category: string;
}

const MobileEvents: React.FC<MobileEventsProps> = ({
  events,
  currentIndex,
  handleNext,
  handlePrev,
  category,
}) => (
  <div className={styles.mobileEvents}>
    <AnimatePresence mode="wait">
      {events.length > 0 ? (
        <div className={styles.mobileCard}>
          <motion.div
            className={styles.eventContentWrapperSingleMobile}
            key={currentIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.titleContainerMobile}>
              <h4>{events[currentIndex].name}</h4>
            </div>

            <div className={styles.imageholderFullMobile}>
              <EventImage
                imageUrl={events[currentIndex]?.image_url}
                alt={events[currentIndex]?.name}
                className={styles.imagenewFullMobile}
                previewClass={styles.imagenewpreviewFullMobile}
              />
            </div>

            <div className={styles.bottomControlsMobile}>
              <div className={styles.venue}>
                <img src={Location} alt="" />
                <p>{events[currentIndex].venue}</p>
              </div>

              <div className={styles.controlsBelowMobile}>
                <div className={styles.leftBtnMobile} onClick={handlePrev}>
                  <img src={Right} alt="Prev" className={styles.prevBtnMobile} />
                </div>
                <div className={styles.rightBtnMobile} onClick={handleNext}>
                  <img src={Right} alt="Next" className={styles.nextBtnMobile} />
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
  </div>
);

export default MobileEvents;
