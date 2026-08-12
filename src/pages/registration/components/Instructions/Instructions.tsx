import { forwardRef } from "react";
import styles from "./Instructions.module.scss";

type PropsType = {
  onGoogleSignIn: () => void;
};

const Instructions = forwardRef<HTMLDivElement, PropsType>(
  ({ onGoogleSignIn: _onGoogleSignIn }, ref) => {
    return (
      <>
        <div className={styles.content} ref={ref}>
          
        </div>
      </>
    );
  }
);

export default Instructions;
