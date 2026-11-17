import { Navigate, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "../Auth/AuthLayout.jsx";
import AdminProducts from "./AdminProducts.jsx";
import AdminOrders from "./AdminOrders.jsx";
import AdminReviews from "./AdminReviews.jsx";
import "./Admin.css";

const tabs = [
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "reviews", label: "Reviews" },
];

const panels = { products: AdminProducts, orders: AdminOrders, reviews: AdminReviews };

// Only admins get here. This page just hides the tools from others;
// the real protection is in the database (supabase/admin-setup.sql).
export default function AdminPage() {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some((t) => t.id === params.get("tab")) ? params.get("tab") : "products";
  const Panel = panels[tab];

  if (loading || adminLoading) return <AuthLayout title="Admin" subtitle="Checking access…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (!isAdmin) {
    return (
      <AuthLayout
        eyebrow="Admin"
        title="No access"
        subtitle="This page is only for Garden Muse administrators."
      />
    );
  }

  return (
    <section className="admin">
      <div className="container">
        <header className="admin__head">
          <span className="eyebrow">Atelier back office</span>
          <h1 className="admin__title">Admin</h1>
        </header>

        <div className="tabs no-scrollbar admin__tabs" role="tablist" aria-label="Admin sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setParams(t.id === "products" ? {} : { tab: t.id }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          <Panel />
        </div>
      </div>
    </section>
  );
}
