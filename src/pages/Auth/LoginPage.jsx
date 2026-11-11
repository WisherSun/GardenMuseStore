import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { authErrorMessage, signIn } from "../../api/auth.js";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "./AuthLayout.jsx";
import { FormAlert, PasswordField, TextField } from "./AuthFields.jsx";
import { validateEmail } from "./validation.js";
import styles from "./Auth.module.css";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // If the user was sent here from a protected page, go back there after login
  const redirectTo = location.state?.from ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: password ? null : "Please enter your password.",
    };
    setErrors(nextErrors);
    setFormError("");
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Sign in to track your orders, manage your subscription and save favourite arrangements."
      footer={
        <>
          New to Garden Muse? <Link to="/signup">Create an account</Link>
        </>
      }
    >
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
          error={errors.email}
        />

        <PasswordField
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelExtra={
            <Link to="/forgot-password" className={styles.smallLink}>
              Forgot password?
            </Link>
          }
        />

        <button type="submit" className={`btn btn--ink ${styles.submit}`} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
