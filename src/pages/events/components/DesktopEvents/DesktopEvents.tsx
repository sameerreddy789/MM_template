import { cdn } from "../../../../utils/cdn";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../Eventspage.module.scss";
import EventImage from "../ImagePreloader/ImagePreloader";
const Location = cdn("/svgs/events/location.svg");
const Right = cdn("/svgs/events/Next1.svg");

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
  <div className={styles.eventdesktop}>
    <AnimatePresence mode="wait">
      {events.length > 0 ? (
        <motion.div
          className={styles.eventContentWrapperSingle}
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {events[currentIndex].isDj ? (
            <div className={styles.djSplitContainer}>
              <div className={styles.djLeft}>
                <EventImage
                  imageUrl={events[currentIndex]?.image_url}
                  alt={events[currentIndex]?.name}
                  className={styles.imagenewFull}
                  previewClass={styles.imagenewpreviewFull}
                  style={{
                    objectPosition: events[currentIndex]?.name === "DJ OnEDGE" ? "center top" : "center",
                    objectFit: "cover",
                    transform: events[currentIndex]?.name === "DJ OnEDGE" ? "scale(1.8)" : "scale(1.1)",
                  }}
                />
              </div>
              <div className={styles.djRight}>
                {events[currentIndex].logo && (
                  <img 
                    src={events[currentIndex].logo} 
                    alt="Logo" 
                    className={styles.djLogo} 
                    style={{ height: events[currentIndex].name === "Lera NOVA" ? "200px" : "120px" }}
                  />
                )}
                <p>{events[currentIndex].description}</p>
                <div className={styles.djSocials}>
                  <a href={events[currentIndex].instagram} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <img src={cdn("/svgs/landing/insta.svg")} alt="Instagram" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.titleContainer}>
                <h4>{events[currentIndex].name}</h4>
              </div>

              <div className={styles.imageholderFull}>
                <EventImage
                  imageUrl={events[currentIndex]?.image_url}
                  alt={events[currentIndex]?.name}
                  className={styles.imagenewFull}
                  previewClass={styles.imagenewpreviewFull}
                  style={{
                    objectPosition: events[currentIndex]?.object_position,
                    objectFit: events[currentIndex]?.object_fit,
                    transform: events[currentIndex]?.scale ? `scale(${events[currentIndex].scale})` : undefined,
                  }}
                />
              </div>
            </>
          )}

          <div className={styles.bottomControls}>
            <div className={styles.venue}>
              <img src={Location} alt="" />
              <p>{events[currentIndex].venue}</p>
            </div>

            <div className={styles.controlsBelow}>
              <div className={styles.leftBtn} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                <img src={Right} alt="Prev" className={styles.prevBtn} />
              </div>
              <div className={styles.rightBtn} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                <img src={Right} alt="Next" className={styles.nextBtn} />
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.p 
          key="no-events"
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
);

export default DesktopEvents;
