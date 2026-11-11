import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "../Auth/AuthLayout.jsx";
import { FormAlert } from "../Auth/AuthFields.jsx";
import styles from "../Auth/Auth.module.css";

// Simple account page. Only for logged-in users; others are sent to /login.
export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <AuthLayout title="My account" subtitle="Loading…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: "/account" }} />;

  const name = user.user_metadata?.full_name;
  const memberSince = new Date(user.created_at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      eyebrow="My account"
      title={name ? `Hello, ${name.split(" ")[0]}` : "Hello"}
      subtitle="Order history and saved arrangements are coming soon."
    >
      {location.state?.passwordChanged && (
        <div style={{ marginBottom: 20 }}>
          <FormAlert type="success">Your password has been updated.</FormAlert>
        </div>
      )}

      {name && (
        <div className={styles.accountRow}>
          <span className={styles.label}>Name</span>
          <span className={styles.accountValue}>{name}</span>
        </div>
      )}
      <div className={styles.accountRow}>
        <span className={styles.label}>Email</span>
        <span className={styles.accountValue}>{user.email}</span>
      </div>
      <div className={styles.accountRow}>
        <span className={styles.label}>Member since</span>
        <span className={styles.accountValue}>{memberSince}</span>
      </div>

      <div className={styles.actions}>
        <Link to="/" className="btn btn--ink">
          Continue shopping
        </Link>
        <button className="btn btn--light" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}
