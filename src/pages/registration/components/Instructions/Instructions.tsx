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
          
        </div>
      </>
    );
  }
);

export default Instructions;
