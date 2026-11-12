import { Link, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart.js";
import { BagIcon, FlowerIcon, HeartIcon, UserIcon } from "./Icons.jsx";
import "./BottomNav.css";

// Phone/tablet-only navigation bar fixed to the bottom of the screen.
export default function BottomNav() {
  const { count: cartCount } = useCart();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const accountPaths = ["/login", "/signup", "/account", "/forgot-password", "/reset-password"];

  const items = [
    { label: "Atelier", to: "/", Icon: FlowerIcon, active: pathname === "/" },
    { label: "Saved", to: "/#saved", Icon: HeartIcon },
    {
      label: user ? "Account" : "Sign in",
      to: user ? "/account" : "/login",
      Icon: UserIcon,
      active: accountPaths.includes(pathname),
    },
    { label: "Cart", to: "/cart", Icon: BagIcon, count: cartCount, active: pathname === "/cart" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {items.map(({ label, to, Icon, active, count }) => (
        <Link
          key={label}
          to={to}
          className={`bottom-nav__item ${active ? "is-active" : ""}`}
          aria-current={active ? "page" : undefined}
        >
          <span className="bottom-nav__icon">
            <Icon />
            {count > 0 && <span className="bottom-nav__badge">{count}</span>}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
