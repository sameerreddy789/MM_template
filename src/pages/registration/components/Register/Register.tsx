import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Field from "/svgs/registration/field2.svg";
import styles from "./Register.module.scss";
import { useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import Left from "/svgs/registration/leftarr.svg";
import Right from "/svgs/registration/rightarr.svg";

// Four fields. The MBU student question and the city field are gone, and with
// them roll_no: that was only ever asked when the answer to MBU was Yes, so
// without the question there is nothing to gate it on and college_id is simply
// required for everyone.
//
// Note all three are still sent in the submit payload - see onSubmit.
const registrationSchema = yup.object({
  name: yup.string().required("Name is required"),
  // Required, not just email-shaped. It was optional, and since nothing could
  // ever put a value in the field, every submission passed validation with an
  // empty address.
  email_id: yup
    .string()
    .email("Invalid email")
    .required("Email is required"),
  college_id: yup.string().required("College Name is required"),
  phone: yup
    .string()
    .matches(/^[1-9]\d{9}$/, "Invalid number")
    .required("Mobile number is required"),
});

type FormData = yup.InferType<typeof registrationSchema>;

type PropsType = {
  onClickNext: () => void;
  userEmail: string;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
};

const Register = forwardRef<HTMLDivElement, PropsType>(  
  function RegisterComponent(props, ref) {
    const { onClickNext, userEmail, setUserData } = props;

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
        phone: "",
        college_id: "",
      },
    });

    useEffect(() => {
      const savedData = localStorage.getItem("registrationFormData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          reset({
            ...parsedData,
            // Only fall back to the prop. This used to overwrite unconditionally,
            // which threw away a restored email the same way the disabled input
            // threw away a typed one.
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

    const onSubmit = (data: any) => {
      setUserData({
        ...data,
        // email_id deliberately not overridden here any more. It used to be reset
        // to the userEmail prop, which is hardcoded empty in Registration.tsx, so
        // whatever the field held was discarded on the way out.
        //
        // is_mbu, roll_no and city are no longer asked for, but they are still
        // sent. ConfirmModal spreads the whole of userData straight into the body
        // of the POST to /registrations/register/, so dropping the fields from
        // this form would also drop these keys out of that request. Empty rather
        // than invented values, because they genuinely are not collected any
        // more - if the API rejects blanks for these, it needs a change there.
        is_mbu: "",
        roll_no: "",
        city: "",
      });
      onClickNext();

      localStorage.removeItem("registrationFormData");
    };

    return (
      <div className={styles.registerContainer} ref={ref}>
        <form
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
          className={styles.registrationForm}
        >
          <div className={styles.formColumns}>
            {/* A 2x2 grid, filling across then down:
                  NAME          EMAIL
                  COLLEGE NAME  MOBILE NUMBER */}
            <div className={styles.fields}>
              <div className={styles.name}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>NAME</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input {...register("name")} />
                </div>
                <p className={styles.error}>{errors.name?.message}</p>
              </div>

              <div className={styles.email}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>EMAIL </label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  {/* Was `value={userEmail} disabled`, so it could neither be
                      typed into nor tracked by the form. Registered like every
                      other field now. */}
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email_id")}
                  />
                </div>
                <p className={styles.error}>{errors.email_id?.message}</p>
              </div>

              <div className={styles.college}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>COLLEGE NAME </label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input {...register("college_id")} />
                </div>
                <p className={styles.error}>{errors.college_id?.message}</p>
              </div>

              <div className={styles.mobile}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>MOBILE NUMBER </label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input {...register("phone")} />
                </div>
                <p className={styles.error}>{errors.phone?.message}</p>
              </div>
            </div>
          </div>
        </form>

        <button
          className={styles.confirmButton}
          type="submit"
          onClick={handleSubmit(onSubmit)}
        >
          <svg
            width="98"
            height="8"
            viewBox="0 0 98 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.confirmIcon}
            aria-label="Next"
          >
            <path
              d="M-0.000976562 4.07317C2.77052 4.07317 73.6558 6.02439 91.9262 7L96.999 4.07317L91.9262 1L-0.000976562 4.07317Z"
              fill="white"
              stroke="white"
              strokeWidth="0.16"
            />
          </svg>
          NEXT
          <svg
            width="98"
            height="8"
            viewBox="0 0 98 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.confirmIcon}
            aria-label="Next"
          >
            <path
              d="M-0.000976562 4.07317C2.77052 4.07317 73.6558 6.02439 91.9262 7L96.999 4.07317L91.9262 1L-0.000976562 4.07317Z"
              fill="white"
              stroke="white"
              strokeWidth="0.16"
            />
          </svg>
        </button>
      </div>
    );
  }
);

export default Register;
