import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../../components/Icons.jsx";
import styles from "./Auth.module.css";

// Text input with a visible label and an error message under it.
// `labelExtra` lets you put something next to the label (e.g. "Forgot password?").
export function TextField({ label, error, hint, labelExtra, ...inputProps }) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelExtra}
      </div>
      <input
        id={id}
        className={styles.input}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={messageId} className={styles.fieldError}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

// Password input with a show/hide button
export function PasswordField({ label = "Password", error, hint, labelExtra, ...inputProps }) {
  const id = useId();
  const messageId = `${id}-message`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelExtra}
      </div>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${styles.input} ${styles.inputWithToggle}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <p id={messageId} className={styles.fieldError}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function FormAlert({ type = "error", children }) {
  const className = `${styles.alert} ${type === "error" ? styles.alertError : styles.alertSuccess}`;
  return (
    <div className={className} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
