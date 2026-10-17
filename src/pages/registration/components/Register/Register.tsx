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
  type PaymentMode,
  type RegistrationDetails,
} from "../../../../utils/registrationApi";
import styles from "./Register.module.scss";

type Availability = "checking" | "ready" | "unavailable" | "closed";
type Phase = "idle" | "creating" | "checkout" | "verifying";
const initialDetails: RegistrationDetails = { name: "", email: "", phone: "", college: "", roll_no: "" };

function formatRupees(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: amountPaise % 100 === 0 ? 0 : 2, maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function Register() {
  return <RegistrationForm />;
}

function RegistrationForm() {
  const [details, setDetails] = useState(initialDetails);
  const [availability, setAvailability] = useState<Availability>("checking");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [uncertainOrderId, setUncertainOrderId] = useState("");
  const [registration, setRegistration] = useState<ConfirmedRegistration | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const requestSignal = useRef<AbortSignal | undefined>(undefined);
  const previousOrder = useRef<{ details: string; order: PaymentOrder } | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const loadedMode = useRef<PaymentMode | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!mounted.current) return;
    setAvailability("checking");
    try {
      const status = await checkRegistrationAvailability(requestSignal.current);
      if (mounted.current) {
        setPaymentMode(status.paymentMode);
        if (loadedMode.current !== status.paymentMode) {
          const recovery = readPendingCheckout(status.paymentMode);
          setProof(recovery?.proof || null);
          setUncertainOrderId(recovery && !recovery.proof ? recovery.orderId : "");
          previousOrder.current = null;
          loadedMode.current = status.paymentMode;
        }
        setAvailability(status.ready ? "ready" : status.registrationsOpen ? "unavailable" : "closed");
      }
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
    if (!paymentMode) throw new Error("The payment environment could not be verified.");
    setPhase("verifying");
    const attempts = poll ? 6 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = await verifyRegistrationPayment(paymentProof, paymentMode, requestSignal.current);
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
    if (busy.current || phase !== "idle" || availability !== "ready" || !paymentMode || proof || uncertainOrderId) return;
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
      if (order.paymentMode !== paymentMode) {
        throw new Error("The payment environment changed. Refresh the page before opening checkout.");
      }
      if (!mounted.current) return;
      setPhase("checkout");
      savePendingCheckout(paymentMode, order.order_id);
      const paymentProof = await openRegistrationCheckout(order, clean, requestSignal.current);
      if (!mounted.current) return;
      if (paymentProof) {
        receivedProof = true;
        savePendingCheckout(paymentMode, order.order_id, paymentProof);
        setProof(paymentProof);
        await confirmPayment(paymentProof, true);
      } else {
        clearPendingCheckout(paymentMode);
        setError("Checkout was closed. Your payment has not been confirmed.");
      }
    } catch (failure) {
      if (mounted.current) {
        if (failure instanceof CheckoutConfirmationError) setUncertainOrderId(previousOrder.current?.order.order_id || "");
        else if (!receivedProof) clearPendingCheckout(paymentMode);
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
    if (paymentMode) clearPendingCheckout(paymentMode);
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
          : paymentMode === "test" ? "TRY TEST PAYMENT — ₹0 CHARGED" : "PAY ₹1,000 & REGISTER";

  if (registration) {
    const emailSent = registration.emailStatus === "Sent";
    return (
      <section className={styles.registerContainer} aria-labelledby="registration-confirmed">
        <div className={styles.content}>
          <h1 className={styles.heading} id="registration-confirmed" ref={successHeading} tabIndex={-1}>
            {registration.paymentMode === "test" ? "Test registration confirmed" : "Registration confirmed"}
          </h1>
          <p className={styles.description}>{registration.paymentMode === "test"
            ? "Your simulated payment is verified and your test registration is saved. No real money was charged."
            : "Your payment is verified and your MohanaMantra registration is saved."}</p>
          <dl className={styles.receipt}>
            <dt>Ticket ID</dt><dd>{registration.ticketId}</dd>
            <dt>Name</dt><dd>{registration.name}</dd>
            <dt>{registration.paymentMode === "test" ? "Test registration fee" : "Registration fee"}</dt><dd>₹1,000</dd>
            {registration.checkoutFeePaise > 0 && <>
              <dt>Razorpay checkout fee</dt><dd>{formatRupees(registration.checkoutFeePaise)}</dd>
              <dt>{registration.paymentMode === "test" ? "Test total" : "Total paid"}</dt><dd>{formatRupees(registration.paymentAmountPaise)}</dd>
            </>}
            <dt>Payment ID</dt><dd>{registration.paymentId}</dd>
          </dl>
          {registration.paymentMode === "test" && <p className={styles.testNotice}>Test pass only — not valid for event entry.</p>}
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

  if (!proof && !uncertainOrderId && availability !== "ready") {
    return (
      <section className={styles.registerContainer} aria-labelledby="registration-heading">
        <div className={styles.content}>
          <h1 id="registration-heading" className={styles.heading}>
            {availability === "checking" ? "Checking registration availability"
              : availability === "closed" ? "Registrations temporarily closed" : "Registration temporarily unavailable"}
          </h1>
          <p className={styles.description} role="status">
            {availability === "checking" ? "Connecting to registration. This may take a moment."
              : availability === "closed" ? "We’re updating the registration system. Please check back for updates."
                : "We couldn’t confirm registration availability. Please try again shortly."}
          </p>
          {availability !== "checking" && <button className={styles.retryButton} type="button" onClick={() => void checkAvailability()}>Check again</button>}
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
        {paymentMode === "test" && <p className={styles.testNotice} role="status">
          <strong>Razorpay Test Mode</strong> — checkout simulates ₹1,000. No real money is charged.
          Enter an email you can check to test delivery. The test pass is not valid for event entry.
        </p>}
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
          <p className={styles.fee}>{paymentMode === "test" ? "Simulated registration fee" : "Registration fee"} <strong>₹1,000</strong></p>
          <p className={styles.note}>Razorpay shows any additional checkout fee before you pay.</p>
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
