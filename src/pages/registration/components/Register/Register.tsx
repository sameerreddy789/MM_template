import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Select from "react-select";
import Field from "/svgs/registration/field2.svg";
import styles from "./Register.module.scss";
import { useEffect, useState, forwardRef, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import statesData from "./cities.json";
import Left from "/svgs/registration/leftarr.svg";
import Right from "/svgs/registration/rightarr.svg";
import DropDown from "/svgs/registration/dropdown.svg";

const stateOptions = statesData.map((item) => ({
  value: item.state,
  label: item.state,
}));

const registrationSchema = yup.object({
  name: yup.string().required("Name is required"),
  email_id: yup.string().email("Invalid email"),
  is_mbu: yup.string().required("Select an option"),
  roll_no: yup.string().when("is_mbu", {
    is: "Yes",
    then: () => yup.string().required("Roll No is required"),
    otherwise: () => yup.string(),
  }),
  college_id: yup.string().when("is_mbu", {
    is: "No",
    then: () => yup.string().required("College Name is required"),
    otherwise: () => yup.string(),
  }),
  phone: yup
    .string()
    .matches(/^[1-9]\d{9}$/, "Invalid number")
    .required("Mobile number is required"),
  city: yup.string().required("City is required"),
});

type FormData = yup.InferType<typeof registrationSchema>;

type PropsType = {
  onClickNext: () => void;
  userEmail: string;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
};

type GenderOption = {
  value: "M" | "F" | "O";
  label: string;
};

const genderOptions: GenderOption[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

const Register = forwardRef<HTMLDivElement, PropsType>(  
  function RegisterComponent(props, ref) {
    const { onClickNext, userEmail, setUserData } = props;

    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
      watch,
      reset,
    } = useForm<FormData>({
      resolver: yupResolver(registrationSchema as any),
      defaultValues: {
        name: "",
        email_id: userEmail,
        is_mbu: "",
        roll_no: "",
        phone: "",
        college_id: "",
        city: "",
      },
    });

    const isMbu = watch("is_mbu") === "Yes";

    useEffect(() => {
      const savedData = localStorage.getItem("registrationFormData");
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          reset({
            ...parsedData,
            email_id: userEmail,
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

    const isTablet = window.matchMedia(
      "(max-width: 1200px) and (max-aspect-ratio: 1.45) "
    ).matches;
    const isMobile = window.matchMedia(
      "(max-width: 1200px) and (max-aspect-ratio: 0.75) "
    ).matches;
    const customStyle = {
      control: (provided: any) => ({
        ...provided,
        outline: "none",
        border: "none",
        height: "100%",
        width: "100%",
        textAlign: "center",
        borderRadius: "0",
        boxShadow: "none",
        cursor: "pointer",
      }),
      noOptionsMessage: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#FFF9E9" : "#131313CC",
        color: state.isFocused ? "#1E1E1E" : "#FFF9E9",
        textAlign: "center",
        cursor: "pointer",
        padding: "0.5vw 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `100 ${
          isMobile ? 4.2 : isTablet ? 3.2 : 1.5
        }vw Abhaya Libre Extrabold`,
        "&:hover": {
          backgroundColor: state.isFocused ? "#FFF9E9" : "#1E1E1E",
        },
      }),
      dropdownIndicator: () => ({
        display: "none",
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      placeholder: (provided: any, state: any) => ({
        ...provided,
        width: "100%",
        height: "100%",
        color: "#e2dccb",
        font: `100 ${
          isMobile ? 4.2 : isTablet ? 3.2 : 1.5
        }vw Abhaya Libre Extrabold`,
        display: state.hasValue || state.isFocused ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
      }),
      input: (provided: any) => ({
        ...provided,
        position: "absolute",
        top: "50%",
        left: "50%",
        maxWidth: "65%",
        overflow: "hidden",
        transform: "translate(-50%, -50%)",
      }),
      singleValue: (provided: any) => ({
        ...provided,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "65%",
      }),
      valueContainer: () => ({
        width: "100%",
        height: "100%",
        color: "#e2dccb",
        font: `100 ${
          isMobile ? 4.2 : isTablet ? 3.2 : 1.5
        }vw Abhaya Libre Extrabold`,
      }),
      menuPortal: (provided: any) => ({
        ...provided,
        zIndex: 9999,
      }),
      menu: (provided: any) => ({
        ...provided,
        zIndex: 4,
        backgroundColor: "#1E1E1E",
        maxHeight: `${isMobile ? 40 : isTablet ? 30 : 10}vw`,
        overflow: "hidden",
        scrollbarWidth: "none",
        "::-webkit-scrollbar": {
          display: "none",
        },
        border: "1px solid #FFF9E9",
        borderRadius: "5px",
      }),
      menuList: (provided: any) => ({
        ...provided,
        zIndex: 10,
        maxHeight: `${isMobile ? 40 : isTablet ? 30 : 10}vw`,
        scrollbarWidth: "none",
        "::-webkit-scrollbar": {
          display: "none",
        },
      }),
      option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#FFF9E9" : "#131313CC",
        color: state.isFocused ? "#1E1E1E" : "#FFF9E9",
        textAlign: "center",
        cursor: "pointer",
        padding: "0.5vw 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `100 ${
          isMobile ? 4.4 : isTablet ? 3.2 : 1.5
        }vw Abhaya Libre Extrabold`,
        "&:hover": {
          backgroundColor: state.isFocused ? "#FFF9E9" : "#1E1E1E",
        },
      }),
    };

    const onSubmit = (data: any) => {
      console.log("Form Data:", data);
      setUserData({
        ...data,
        email_id: userEmail,
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
            <div className={styles.left}>
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
                  <input value={userEmail} disabled placeholder={userEmail} />
                </div>
                <p className={styles.error}>{errors.email_id?.message}</p>
              </div>

              <div className={styles.gender}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>MBU STUDENT?</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <fieldset
                    className={styles.radioGroup}
                    aria-label="MBU Student"
                  >
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className={styles.radioLabel}>
                        <input
                          type="radio"
                          value={opt}
                          {...register("is_mbu")}
                          className={styles.radioInput}
                          onChange={(e) => {
                             setValue("is_mbu", e.target.value);
                             setValue("college_id", e.target.value === "Yes" ? "Mohan Babu University" : "");
                          }}
                        />
                        <span className={styles.yearNumber}>{opt}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
                <p className={styles.error}>{errors.is_mbu?.message}</p>
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

            <div className={styles.right}>
              {isMbu ? (
                <div className={styles.college}>
                  <div className={styles.sameline}>
                    <img src={Left} alt="Glow" />
                    <label>ROLL NUMBER</label>
                    <img src={Right} alt="Glow" />
                  </div>
                  <div className={styles.clouds}>
                    <img src={Field} alt="Field" className={styles.fieldImg} />
                    <input {...register("roll_no")} />
                  </div>
                  <p className={styles.error}>{errors.roll_no?.message}</p>
                </div>
              ) : (
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
              )}

              <div className={styles.year}>
                <div className={styles.sameline}>
                  <img src={Left} alt="Glow" />
                  <label>CITY</label>
                  <img src={Right} alt="Glow" />
                </div>
                <div className={styles.clouds}>
                  <img src={Field} alt="Field" className={styles.fieldImg} />
                  <input {...register("city")} />
                </div>
                <p className={styles.error}>{errors.city?.message}</p>
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
