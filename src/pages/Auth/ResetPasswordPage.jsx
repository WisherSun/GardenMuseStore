import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { authErrorMessage, updatePassword } from "../../api/auth.js";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "./AuthLayout.jsx";
import { FormAlert, PasswordField } from "./AuthFields.jsx";
import { MIN_PASSWORD_LENGTH, validatePassword } from "./validation.js";
import styles from "./Auth.module.css";

// The link from the "reset password" email opens this page.
// Supabase reads the link and signs the user in, so they can set a new password.
export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <AuthLayout title="Reset password" subtitle="Checking your link…" />;
  }

  if (!user) {
    return (
      <AuthLayout
        eyebrow="Account help"
        title="Link expired"
        footer={<Link to="/forgot-password">Send a new reset link</Link>}
      >
        <FormAlert>This reset link is invalid or has expired. Please request a new one.</FormAlert>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(password);
    setError(passwordError ?? "");
    setFormError("");
    if (passwordError) return;

    setSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/account", { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      setFormError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account help"
      title="Choose a new password"
      subtitle={`For ${user.email}`}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          placeholder="Create a new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <button type="submit" className={`btn btn--ink ${styles.submit}`} disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthLayout>
  );
}
