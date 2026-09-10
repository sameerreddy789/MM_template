import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Field from "/svgs/registration/field2.svg";
import styles from "./Register.module.scss";
import { useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import Left from "/svgs/registration/leftarr.svg";
import Right from "/svgs/registration/rightarr.svg";
import type { PaymentSuccessData } from "../PaymentSuccessModal/PaymentSuccessModal";

const registrationSchema = yup.object({
  name: yup
    .string()
    .min(3, "Name must be at least 3 characters")
    .required("Full Name is required"),
  email_id: yup
    .string()
    .email("Enter a valid email address")
    .matches(
      /@gmail\.com$/i,
      "Only Gmail addresses are accepted (e.g. yourname@gmail.com)"
    )
    .required("Email address is required"),
  roll_no: yup
    .string()
    .min(2, "Roll Number must be at least 2 characters")
    .required("Roll Number is required"),
  college_id: yup.string().required("College Name is required"),
  phone: yup
    .string()
    .transform((value) => {
      // Strip +91 or 91 prefix if the student types it
      if (!value) return value;
      let cleaned = value.replace(/[\s\-()]/g, "");
      if (cleaned.startsWith("+91")) cleaned = cleaned.slice(3);
      else if (cleaned.startsWith("91") && cleaned.length === 12)
        cleaned = cleaned.slice(2);
      return cleaned;
    })
    .matches(
      /^[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number (no +91 needed)"
    )
    .required("WhatsApp phone number is required"),
});

type FormData = yup.InferType<typeof registrationSchema>;

type PropsType = {
  userEmail: string;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  onPaymentSuccess: (data: PaymentSuccessData) => void;
};

const Register = forwardRef<HTMLDivElement, PropsType>(
  function RegisterComponent(props, ref) {
    const { userEmail, setUserData, onPaymentSuccess } = props;

    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      reset,
    } = useForm<FormData>({
      resolver: yupResolver(registrationSchema as any),
      defaultValues: {
        name: "",
        email_id: userEmail,
        roll_no: "",
        college_id: "",
        phone: "",
      },
    });

    useEffect(() => {
      const savedData = localStorage.getItem("registrationFormData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          reset({
            ...parsedData,
            email_id: parsedData.email_id || userEmail,
          });
        } catch (err) {
          console.error("Failed to parse local storage data:", err);
          localStorage.removeItem("registrationFormData");
        }
      }
    }, [reset, userEmail]);

    useEffect(() => {
      const subscription = watch((value) => {
        localStorage.setItem("registrationFormData", JSON.stringify(value));
      });

      return () => subscription.unsubscribe();
    }, [watch]);

    const loadRazorpayScript = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (typeof (window as any).Razorpay !== "undefined") {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

     const onSubmit = async (data: FormData) => {
    const registrationPayload = {
    ...data,
     is_mbu: "",
    city: "",
    };
    setUserData(registrationPayload);
    localStorage.removeItem("registrationFormData");

    const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID as
    | string
    | undefined;
    if (!keyId) {
     console.error(
    "VITE_RAZORPAY_KEY_ID is not configured. Registration is disabled."
     );
    alert(
    "Payment is not configured on this build. Please contact the organizers."
    );
    return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || typeof (window as any).Razorpay === "undefined") {
    console.error("Razorpay SDK failed to load. Aborting registration.");
    alert(
    "Could not load the payment SDK. Please check your network connection and try again."
    );
    return;
    }

    const options: any = {
    key: keyId,
    amount: 1000 * 100, // ₹1,000 in paise
    currency: "INR",
    name: "MohanaMantra 2K26",
    description: "Festival Pass & Registration Fee",
    image: "https://www.mohanamantra.com/images/logo.webp",
    prefill: {
    name: data.name,
     email: data.email_id,
    contact: data.phone,
    },
    notes: {
    student_name: data.name,
    student_email: data.email_id,
    roll_no: data.roll_no,
    college_name: data.college_id,
    student_phone: data.phone,
     fest: "MohanaMantra 2K26",
    },
    theme: {
    color: "#8B2635",
    },
    handler: async function (response: any) {
    // The Razorpay handler only fires for confirmed payments. We do NOT
    // create the Firestore record here — the verified webhook on the
    // backend is the single source of truth, and it issues the ticket
    // id + secure token. Showing the success modal is fine: it confirms
    // to the student that payment went through, and the email arrives
    // a few seconds later from the backend pipeline.
    const paymentId =
    response.razorpay_payment_id || `pay_${Date.now()}`;
    const successData: PaymentSuccessData = {
    name: data.name,
    email_id: data.email_id,
     roll_no: data.roll_no,
    college_id: data.college_id,
    phone: data.phone,
    payment_id: paymentId,
    amount: 1000,
    };
    onPaymentSuccess(successData);
     },
    modal: {
    ondismiss: function () {
    // User closed the checkout without paying. No record is written
    // to Firestore — the webhook is the only thing that creates
    // confirmed registrations, so abandoning checkout is safe.
    console.info("Razorpay checkout closed by user");
    },
    },
    };

     try {
    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
    alert(
    `Payment Failed: ${
    response.error?.description || "Please try again."
    }`
    );
    });
    rzp.open();
    } catch (err) {
    // We deliberately do NOT write a registration record on error —
    // only the verified Razorpay webhook creates confirmed records
    // in Firestore.
    console.error("Failed to open Razorpay checkout:", err);
    alert(
    "Could not open the payment window. Please check your network and try again."
    );
    }
    };

    return (
      <div className={styles.registerContainer} ref={ref}>
        <form
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
          className={styles.registrationForm}
        >
          <div className={styles.formColumns}>
            <div className={styles.fields}>
              {/* Full Name */}
              <div className={styles.name}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label htmlFor="reg-name">Full Name</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input
                    id="reg-name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    {...register("name")}
                  />
                </div>
                <p className={styles.error}>{errors.name?.message}</p>
              </div>

              {/* Email Address */}
              <div className={styles.email}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label htmlFor="reg-email">Email Address</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    {...register("email_id")}
                  />
                </div>
                <p className={styles.error}>{errors.email_id?.message}</p>
              </div>

              {/* Roll Number */}
              <div className={styles.rollNo}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label htmlFor="reg-rollno">Roll Number</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input
                    id="reg-rollno"
                    autoComplete="off"
                    placeholder="Enter your roll number"
                    {...register("roll_no")}
                  />
                </div>
                <p className={styles.error}>{errors.roll_no?.message}</p>
              </div>

              {/* College Name */}
              <div className={styles.college}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label htmlFor="reg-college">College Name</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input
                    id="reg-college"
                    autoComplete="organization"
                    placeholder="Enter your college name"
                    {...register("college_id")}
                  />
                </div>
                <p className={styles.error}>{errors.college_id?.message}</p>
              </div>

              {/* Phone Number (WhatsApp) */}
              <div className={styles.mobile}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label htmlFor="reg-phone">Phone Number (WhatsApp)</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="10-digit WhatsApp number"
                    {...register("phone")}
                  />
                </div>
                <p className={styles.error}>{errors.phone?.message}</p>
              </div>
            </div>
          </div>
        </form>

        <button
          className={styles.confirmButton}
          type="button"
          onClick={handleSubmit(onSubmit)}
          id="proceed-pay-btn"
        >
          <svg
            width="50"
            height="8"
            viewBox="0 0 98 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.confirmIcon}
            aria-label="Arrow"
          >
            <path
              d="M-0.000976562 4.07317C2.77052 4.07317 73.6558 6.02439 91.9262 7L96.999 4.07317L91.9262 1L-0.000976562 4.07317Z"
              fill="#e5c384"
              stroke="#e5c384"
              strokeWidth="0.16"
            />
          </svg>
          <span>PROCEED TO PAY ₹1000</span>
          <svg
            width="50"
            height="8"
            viewBox="0 0 98 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.confirmIcon}
            aria-label="Arrow"
          >
            <path
              d="M-0.000976562 4.07317C2.77052 4.07317 73.6558 6.02439 91.9262 7L96.999 4.07317L91.9262 1L-0.000976562 4.07317Z"
              fill="#e5c384"
              stroke="#e5c384"
              strokeWidth="0.16"
            />
          </svg>
        </button>
      </div>
    );
  }
);

export default Register;
