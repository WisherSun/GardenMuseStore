import { useState } from "react";
import { Link } from "react-router";
import { authErrorMessage, sendPasswordReset } from "../../api/auth.js";
import AuthLayout from "./AuthLayout.jsx";
import { FormAlert, TextField } from "./AuthFields.jsx";
import { validateEmail } from "./validation.js";
import styles from "./Auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError ?? "");
    setFormError("");
    if (emailError) return;

    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account help"
      title="Reset password"
      subtitle={sent ? null : "Enter your email and we’ll send you a link to choose a new password."}
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        // Same message whether or not the email exists, so nobody can check who has an account
        <FormAlert type="success">
          If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way.
          Check your inbox and spam folder.
        </FormAlert>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <button type="submit" className={`btn btn--ink ${styles.submit}`} disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
