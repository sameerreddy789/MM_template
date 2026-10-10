import { cdn } from "../../../../utils/cdn";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../Eventspage.module.scss";
import EventImage from "../ImagePreloader/ImagePreloader";
const Right = cdn("/svgs/events/Next1.svg");
const Location = cdn("/svgs/events/location.svg");

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
    <div className={styles.mobileCard}>
      <AnimatePresence mode="wait">
        {events.length > 0 ? (
          <motion.div
            className={styles.eventContentWrapperSingleMobile}
            key={currentIndex}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            {events[currentIndex].isDj ? (
              <div className={styles.djSplitContainerMobile}>
                <div className={styles.djLeftMobile}>
                  <EventImage
                    imageUrl={events[currentIndex]?.image_url}
                    alt={events[currentIndex]?.name}
                    className={styles.imagenewFullMobile}
                    previewClass={styles.imagenewpreviewFullMobile}
                    style={{
                      objectPosition: "center top",
                      objectFit: "cover",
                      transform: "scale(1.8)",
                    }}
                  />
                </div>
                <div className={styles.djRightMobile}>
                  {events[currentIndex].logo && <img src={events[currentIndex].logo} alt="Logo" className={styles.djLogoMobile} />}
                  <p>{events[currentIndex].description}</p>
                  <div className={styles.djSocialsMobile}>
                    <a href={events[currentIndex].instagram} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <img src={cdn("/svgs/landing/insta.svg")} alt="Instagram" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.titleContainerMobile}>
                  <h4>{events[currentIndex].name}</h4>
                </div>

                <div className={styles.imageholderFullMobile}>
                  <EventImage
                    imageUrl={events[currentIndex]?.image_url}
                    alt={events[currentIndex]?.name}
                    className={styles.imagenewFullMobile}
                    previewClass={styles.imagenewpreviewFullMobile}
                    style={{
                      objectPosition: events[currentIndex]?.object_position,
                      objectFit: events[currentIndex]?.object_fit,
                      transform: events[currentIndex]?.scale ? `scale(${events[currentIndex].scale})` : undefined,
                    }}
                  />
                </div>
              </>
            )}

            <div className={styles.bottomControlsMobile}>
              <div className={styles.venue}>
                <img src={Location} alt="" />
                <p>{events[currentIndex].venue}</p>
              </div>

              <div className={styles.controlsBelowMobile}>
                <div className={styles.leftBtnMobile} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                  <img src={Right} alt="Prev" className={styles.prevBtnMobile} />
                </div>
                <div className={styles.rightBtnMobile} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                  <img src={Right} alt="Next" className={styles.nextBtnMobile} />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.p 
            key="no-events-mob"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.centerText}
          >
            {`No events found in "${category}"`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  </div>
);

export default MobileEvents;
