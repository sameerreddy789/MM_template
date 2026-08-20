import ReactDOM from "react-dom";
import styles from "./PaymentSuccessModal.module.scss";
import { FaWhatsapp, FaCheck } from "react-icons/fa";
import ConfettiCanvas from "./ConfettiCanvas";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export interface PaymentSuccessData {
  name: string;
  email_id: string;
  phone: string;
  college_id: string;
  roll_no: string;
  payment_id: string;
  amount: number;
}

interface Props {
  paymentData: PaymentSuccessData;
  onClose: () => void;
  goToHome: () => void;
}

const Backdrop = ({ onClick }: { onClick: () => void }) => {
  return <div className={styles.backdrop} onClick={onClick} />;
};

const SuccessCard = ({ paymentData, goToHome }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });

      // Animate badge popup with punchy elastic scale
      tl.from(badgeRef.current, {
        scale: 0,
        rotate: -180,
        duration: 0.8,
        delay: 0.1,
      })
        .from(
          `.${styles.heading}`,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          `.${styles.detailsCard}`,
          {
            y: 25,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.3"
        )
        .from(
          `.${styles.whatsappButton}`,
          {
            scale: 0.85,
            opacity: 0,
            duration: 0.5,
          },
          "-=0.2"
        );
    },
    { scope: cardRef }
  );

  const whatsappMessage = encodeURIComponent(
    `Hello MohanaMantra Team! I have registered and paid ₹1000 for MohanaMantra 2K26.\n\n` +
      `📌 Name: ${paymentData.name}\n` +
      `🎓 Roll No: ${paymentData.roll_no}\n` +
      `🏛️ College: ${paymentData.college_id}\n` +
      `📧 Email: ${paymentData.email_id}\n` +
      `📱 Phone: ${paymentData.phone}\n` +
      `💳 Payment ID: ${paymentData.payment_id}\n\n` +
      `Please assist me with event selection.`
  );
  const whatsappDirectChat = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <>
      <ConfettiCanvas />
      <div className={styles.successModal} ref={cardRef}>
        <div className={styles.celebrationBadge} ref={badgeRef}>
          <FaCheck color="#ffffff" />
        </div>

        <h2 className={styles.heading}>Registration Successful! 🎉</h2>
        <p className={styles.subheading}>
          We have received your payment of ₹1,000 for MohanaMantra 2K26. An
          automated confirmation email has been sent to{" "}
          <strong>{paymentData.email_id}</strong>.
        </p>

        <div className={styles.detailsCard}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Student Name</span>
            <span className={styles.value}>{paymentData.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Roll Number</span>
            <span className={styles.value}>{paymentData.roll_no}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>College</span>
            <span className={styles.value}>{paymentData.college_id}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>WhatsApp Phone</span>
            <span className={styles.value}>{paymentData.phone}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Payment ID</span>
            <span className={styles.paymentId}>{paymentData.payment_id}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <a
            href={whatsappDirectChat}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <FaWhatsapp size={22} />
            Join MohanaMantra WhatsApp / Select Events
          </a>

          <button className={styles.homeButton} onClick={goToHome}>
            Return to Home
          </button>
        </div>
      </div>
    </>
  );
};

export default function PaymentSuccessModal(props: Props) {
  const modalRoot = document.getElementById("modal-root") || document.body;
  const backdropRoot = document.getElementById("backdrop-root") || document.body;

  return (
    <>
      {ReactDOM.createPortal(<Backdrop onClick={props.onClose} />, backdropRoot)}
      {ReactDOM.createPortal(<SuccessCard {...props} />, modalRoot)}
    </>
  );
}
