import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart.js";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "./Icons.jsx";
import "./Header.css";

// "/#section" links work from any page: they open Home and scroll to that section.
const navLinks = [
  { label: "Shop", to: "/shop" },
  { label: "Arrangements", to: "/#arrangements" },
  { label: "Bespoke", to: "/#bespoke" },
  { label: "Our Craft", to: "/#craft" },
  { label: "Flower Care", to: "/#care" },
];

export default function Header() {
  const { count: cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const accountLink = user ? "/account" : "/login";

  // While the mobile menu is open: lock page scroll and close it with Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // The menu is only for small screens: close it if the window is widened to desktop size.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = (e) => e.matches && setMenuOpen(false);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="container header__inner">
        <button
          className="header__icon-btn header__menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </button>

        <Link to="/" className="header__logo">
          Garden Muse
        </Link>

        <nav className="header__nav" aria-label="Main">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="header__actions">
          <button className="header__icon-btn" aria-label="Search">
            <SearchIcon />
          </button>
          <Link to="/#saved" className="header__icon-btn header__desktop-only" aria-label="Saved items">
            <HeartIcon />
          </Link>
          <Link
            to={accountLink}
            className="header__icon-btn header__desktop-only"
            aria-label={user ? "My account" : "Sign in"}
          >
            <UserIcon />
            {user && <span className="header__dot" aria-hidden="true" />}
          </Link>
          <Link
            to="/cart"
            className="header__icon-btn header__cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            <BagIcon />
            {cartCount > 0 && <span className="header__badge">{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Mobile slide-out menu.
          Rendered straight into <body>: the header's blur (backdrop-filter) would otherwise
          make "position: fixed" measure from the header instead of the whole screen. */}
      {createPortal(
        <div
          className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
          id="mobile-menu"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="mobile-menu__backdrop" onClick={closeMenu} />
          <div className="mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="mobile-menu__top">
              <span className="header__logo">Garden Muse</span>
              <button className="header__icon-btn" aria-label="Close menu" onClick={closeMenu}>
                <CloseIcon />
              </button>
            </div>
            <nav aria-label="Mobile">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={closeMenu} className="mobile-menu__link">
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="mobile-menu__link">
                  Admin
                </Link>
              )}
            </nav>
            <Link to={accountLink} onClick={closeMenu} className="mobile-menu__account">
              <UserIcon />
              {user ? "My account" : "Sign in / Create account"}
            </Link>
            <p className="mobile-menu__note">Same-day courier in London &amp; NYC</p>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
