import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  checkRegistrationAvailability,
  CheckoutConfirmationError,
  clearPendingCheckout,
  createRegistrationOrder,
  openRegistrationCheckout,
  readPendingCheckout,
  savePendingCheckout,
  verifyRegistrationPayment,
  type ConfirmedRegistration,
  type PaymentOrder,
  type PaymentProof,
  type RegistrationDetails,
} from "../../../../utils/registrationApi";
import styles from "./Register.module.scss";

type Availability = "checking" | "ready" | "unavailable";
type Phase = "idle" | "creating" | "checkout" | "verifying";
const initialDetails: RegistrationDetails = { name: "", email: "", phone: "", college: "", roll_no: "" };

function Register() {
  const [recovery] = useState(readPendingCheckout);
  const [details, setDetails] = useState(initialDetails);
  const [availability, setAvailability] = useState<Availability>("checking");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [proof, setProof] = useState<PaymentProof | null>(recovery?.proof || null);
  const [uncertainOrderId, setUncertainOrderId] = useState(recovery && !recovery.proof ? recovery.orderId : "");
  const [registration, setRegistration] = useState<ConfirmedRegistration | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const requestSignal = useRef<AbortSignal | undefined>(undefined);
  const previousOrder = useRef<{ details: string; order: PaymentOrder } | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);

  const checkAvailability = useCallback(async () => {
    if (!mounted.current) return;
    setAvailability("checking");
    try {
      const ready = await checkRegistrationAvailability(requestSignal.current);
      if (mounted.current) setAvailability(ready ? "ready" : "unavailable");
    } catch {
      if (mounted.current) setAvailability("unavailable");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    mounted.current = true;
    requestSignal.current = controller.signal;
    void checkAvailability();
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [checkAvailability]);

  useEffect(() => {
    if (registration?.ticketId) successHeading.current?.focus();
  }, [registration?.ticketId]);

  async function confirmPayment(paymentProof: PaymentProof, poll: boolean) {
    setPhase("verifying");
    const attempts = poll ? 6 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = await verifyRegistrationPayment(paymentProof, requestSignal.current);
      if (!mounted.current) return;
      if (result.success) {
        setRegistration(result.registration);
        return;
      }
      if (attempt < attempts - 1) await new Promise(resolve => window.setTimeout(resolve, 2000));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || phase !== "idle" || availability !== "ready" || proof || uncertainOrderId) return;
    const clean = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()])) as unknown as RegistrationDetails;
    if (Object.values(clean).some(value => !value)) {
      setError("Please complete all five student fields.");
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(clean.phone.replace(/[\s\-()]/g, ""))) {
      setError("Please enter a valid mobile number, including a country code if needed.");
      return;
    }
    clean.email = clean.email.toLowerCase();
    clean.phone = clean.phone.replace(/[\s\-()]/g, "");
    clean.roll_no = clean.roll_no.toUpperCase();
    busy.current = true;
    setError("");
    setPhase("creating");
    let receivedProof = false;
    try {
      const key = JSON.stringify(clean);
      const order = previousOrder.current?.details === key
        ? previousOrder.current.order
        : await createRegistrationOrder(clean, requestSignal.current);
      previousOrder.current = { details: key, order };
      if (!mounted.current) return;
      setPhase("checkout");
      savePendingCheckout(order.order_id);
      const paymentProof = await openRegistrationCheckout(order, clean, requestSignal.current);
      if (!mounted.current) return;
      if (paymentProof) {
        receivedProof = true;
        savePendingCheckout(order.order_id, paymentProof);
        setProof(paymentProof);
        await confirmPayment(paymentProof, true);
      } else {
        clearPendingCheckout();
        setError("Checkout was closed. Your payment has not been confirmed.");
      }
    } catch (failure) {
      if (mounted.current) {
        if (failure instanceof CheckoutConfirmationError) setUncertainOrderId(previousOrder.current?.order.order_id || "");
        else if (!receivedProof) clearPendingCheckout();
        setError(failure instanceof Error ? failure.message : "Payment could not be completed. Please try again.");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPhase("idle");
    }
  }

  async function checkPayment() {
    if (!proof || busy.current) return;
    busy.current = true;
    setError("");
    try {
      await confirmPayment(proof, false);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "Payment confirmation is unavailable. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setPhase("idle");
    }
  }

  function change(field: keyof RegistrationDetails, value: string) {
    setDetails(current => ({ ...current, [field]: value }));
  }

  function registerAnotherStudent() {
    clearPendingCheckout();
    previousOrder.current = null;
    setProof(null);
    setUncertainOrderId("");
    setRegistration(null);
    setDetails(initialDetails);
    setError("");
    void checkAvailability();
  }

  const isBusy = phase !== "idle";
  const payLabel = phase === "creating" ? "CREATING PAYMENT…"
    : phase === "checkout" ? "COMPLETE PAYMENT ON RAZORPAY"
      : availability === "checking" ? "CHECKING PAYMENTS…"
        : availability === "unavailable" ? "PAYMENTS UNAVAILABLE"
          : "PAY ₹1,000 & REGISTER";

  if (registration) {
    const emailSent = registration.emailStatus === "Sent";
    return (
      <section className={styles.registerContainer} aria-labelledby="registration-confirmed">
        <div className={styles.content}>
          <h1 className={styles.heading} id="registration-confirmed" ref={successHeading} tabIndex={-1}>
            Registration confirmed
          </h1>
          <p className={styles.description}>Your payment is verified and your MohanaMantra registration is saved.</p>
          <dl className={styles.receipt}>
            <dt>Ticket ID</dt><dd>{registration.ticketId}</dd>
            <dt>Name</dt><dd>{registration.name}</dd>
            <dt>Paid</dt><dd>₹1,000</dd>
            <dt>Payment ID</dt><dd>{registration.paymentId}</dd>
          </dl>
          <p className={styles.note} role="status">
            {emailSent
              ? <>Your entry pass and QR code have been emailed to <strong>{registration.email}</strong>. Check your inbox and spam folder.</>
              : <>Your entry pass email to <strong>{registration.email}</strong> is pending. Keep your ticket ID and check its status below.</>}
          </p>
          {!emailSent && <button className={styles.confirmButton} type="button" disabled={isBusy} onClick={() => void checkPayment()}>
            {isBusy ? "CHECKING EMAIL…" : "CHECK ENTRY PASS EMAIL"}
          </button>}
          {emailSent && <button className={styles.retryButton} type="button" onClick={registerAnotherStudent}>Register another student</button>}
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.registerContainer} aria-labelledby="registration-heading">
      <div className={styles.content}>
        <h1 id="registration-heading" className={styles.heading}>
          Register for MohanaMantra
        </h1>
        <p className={styles.description}>
          Fill in your student details and pay securely through Razorpay.
        </p>
        <form className={styles.registrationForm} onSubmit={event => void submit(event)}>
          <fieldset className={styles.fields} disabled={isBusy || Boolean(proof) || Boolean(uncertainOrderId)}>
            <legend className={styles.screenReaderOnly}>Student details — all fields required</legend>
            <div className={styles.field}>
              <label htmlFor="reg-name">Full name</label>
              <input id="reg-name" name="name" autoComplete="name" maxLength={100} required
                placeholder="Your full name" value={details.name} onChange={event => change("name", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-email">Email address</label>
              <input id="reg-email" name="email" type="email" autoComplete="email" maxLength={120} required
                placeholder="you@example.com" aria-describedby="reg-email-hint" value={details.email} onChange={event => change("email", event.target.value)} />
              <p className={styles.fieldHint} id="reg-email-hint">We’ll send your entry pass here.</p>
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-phone">Mobile number (WhatsApp)</label>
              <input id="reg-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength={10} maxLength={20} required
                placeholder="10-digit mobile number" value={details.phone} onChange={event => change("phone", event.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-rollno">Roll number</label>
              <input id="reg-rollno" name="roll_no" autoComplete="off" maxLength={50} required
                placeholder="Your student roll number" value={details.roll_no} onChange={event => change("roll_no", event.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="reg-college">College name</label>
              <input id="reg-college" name="college" autoComplete="organization" maxLength={150} required
                placeholder="Your college or university" value={details.college} onChange={event => change("college", event.target.value)} />
            </div>
          </fieldset>
          <p className={styles.fee}>Registration fee <strong>₹1,000</strong></p>
          {proof ? (
            <>
              <p className={styles.note} role="status">
                {isBusy ? "Confirming your payment and registration…" : "Your payment is awaiting confirmation. Keep your Razorpay receipt and check its status here. Please do not pay again."}
              </p>
              <button className={styles.confirmButton} type="button" disabled={isBusy} onClick={() => void checkPayment()}>
                {isBusy ? "CONFIRMING PAYMENT…" : "CHECK PAYMENT STATUS"}
              </button>
            </>
          ) : uncertainOrderId ? (
            <p className={styles.note} role="status">
              We couldn’t recover your payment confirmation. Keep your Razorpay receipt and order ID <strong>{uncertainOrderId}</strong>,
              and <a href="/contact" className={styles.retryButton}>contact the registration team</a> before paying again.
            </p>
          ) : (
            <>
              <button className={styles.confirmButton} id="proceed-pay-btn" type="submit"
                disabled={isBusy || availability !== "ready"} aria-describedby="registration-next-step">
                {payLabel}
              </button>
              <p className={styles.note} id="registration-next-step" role="status">
                {availability === "checking" ? "Connecting to payments. This may take a moment."
                  : availability === "unavailable" ? "Registration payments are temporarily unavailable. Please try again shortly."
                    : "All fields are required. Your entry pass is issued after payment is verified."}
              </p>
              {availability === "unavailable" && <button className={styles.retryButton} type="button" onClick={() => void checkAvailability()}>Try again</button>}
            </>
          )}
          {error && <p className={styles.error} role="alert">{error}</p>}
        </form>
      </div>
    </section>
  );
}

export default Register;
