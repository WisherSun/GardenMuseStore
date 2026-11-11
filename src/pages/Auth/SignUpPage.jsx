import { useState } from "react";
import { Link, Navigate } from "react-router";
import { authErrorMessage, signUp } from "../../api/auth.js";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "./AuthLayout.jsx";
import { FormAlert, PasswordField, TextField } from "./AuthFields.jsx";
import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword } from "./validation.js";
import styles from "./Auth.module.css";

export default function SignUpPage() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(""); // email the confirmation link was sent to

  if (user) return <Navigate to="/account" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      name: name.trim() ? null : "Please enter your name.",
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    setFormError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const data = await signUp(name.trim(), email.trim(), password);
      // Supabase doesn't return an error for an email that's already registered
      // (for privacy). It returns a user with no identities instead.
      if (data.user && data.user.identities?.length === 0) {
        setFormError("An account with this email already exists. Try signing in instead.");
      } else {
        setSentTo(email.trim());
      }
    } catch (error) {
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        eyebrow="Almost there"
        title="Check your inbox"
        footer={
          <>
            Already confirmed? <Link to="/login">Sign in</Link>
          </>
        }
      >
        <FormAlert type="success">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your
          account. If you can’t find it, check your spam folder.
        </FormAlert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Join the atelier"
      title="Create account"
      subtitle="Save your favourite arrangements, track orders and get 10% off your first bouquet."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}

        <TextField
          label="Name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <button type="submit" className={`btn btn--ink ${styles.submit}`} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
