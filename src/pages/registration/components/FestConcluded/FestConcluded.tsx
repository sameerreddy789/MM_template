import styles from "./FestConcluded.module.scss";

interface FestConcludedProps {
  goToPage: (path: string) => void;
}

/**
 * Shown in place of the registration form now that MohanaMantra 2K26 is over.
 *
 * The one piece of motion is the year: the last digit of "2K26" rolls up and
 * "2K27" settles in its place. It waits long enough for the door transition to
 * finish opening, and reduced-motion users get the final state straight away.
 * Screen readers get the final text only; the rolling reel is aria-hidden.
 */
export default function FestConcluded({ goToPage }: FestConcludedProps) {
  return (
    <section className={styles.concluded} aria-labelledby="fest-concluded-heading">
      <div className={styles.content}>
        <h1 id="fest-concluded-heading" className={styles.heading}>
          Thank you for showing interest!
        </h1>
        <p className={styles.lead}>
          Unfortunately, Mohana Mantra 2K26 has come to an end.
        </p>

        <Flourish />

        <p className={styles.seeYou}>
          <span className={styles.seeYouLead}>See you guys at</span>
          <span className={styles.srOnly}>Mohana Mantra 2K27</span>
          <span className={styles.nextFest} aria-hidden="true">
            Mohana Mantra 2K2
            <span className={styles.digitSlot}>
              <span className={styles.digitReel}>
                <span>6</span>
                <span>7</span>
              </span>
            </span>
          </span>
        </p>

        <p className={styles.support}>
          Thanks for the great support. Mohana Mantra 2K26 was a Grand Success!
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.homeButton}
            onClick={() => goToPage("/")}
          >
            Back to home
          </button>
          <button
            type="button"
            className={styles.galleryLink}
            onClick={() => goToPage("/gallery")}
          >
            Relive the moments in the gallery
          </button>
        </div>
      </div>
    </section>
  );
}

/** The tapered spear-and-diamond rule used on the registration field labels. */
function Flourish() {
  return (
    <svg
      className={styles.flourish}
      viewBox="0 0 240 14"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="2,7 98,5.6 106,7 98,8.4" fill="#fff6dd" />
      <polygon points="238,7 142,5.6 134,7 142,8.4" fill="#fff6dd" />
      <polygon points="120,1 126,7 120,13 114,7" fill="#e5c384" />
      <polygon points="120,4.5 122.5,7 120,9.5 117.5,7" fill="#160c08" />
      <circle cx="109" cy="7" r="1.3" fill="#e5c384" />
      <circle cx="131" cy="7" r="1.3" fill="#e5c384" />
    </svg>
  );
}
