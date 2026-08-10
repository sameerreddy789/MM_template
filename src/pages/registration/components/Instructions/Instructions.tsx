import { forwardRef } from "react";
import styles from "./Instructions.module.scss";

import Left from "/svgs/registration/leftarr.svg";
import Right from "/svgs/registration/rightarr.svg";

type PropsType = {
  onGoogleSignIn: () => void;
};

const Instructions = forwardRef<HTMLDivElement, PropsType>(
  ({ onGoogleSignIn }, ref) => {
    return (
      <>
        <div className={styles.content} ref={ref}>
          <div className={styles.headingCont}>
            <img src={Left} alt="left" />
            <h3 className={styles.heading}>INSTRUCTIONS</h3>
            <img src={Right} alt="right" />
          </div>


          <button className={styles.googleButton} onClick={onGoogleSignIn}>
            Sign in with Google
          </button>
        </div>
      </>
    );
  }
);

export default Instructions;
