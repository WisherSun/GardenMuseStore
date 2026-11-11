import { useEffect, useState } from "react";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from "./Icons.jsx";
import "./Header.css";

const navLinks = [
  { label: "Shop", href: "#botanicals" },
  { label: "Arrangements", href: "#arrangements" },
  { label: "Subscriptions", href: "#subscription" },
  { label: "Our Craft", href: "#craft" },
  { label: "Journal", href: "#journal" },
];

export default function Header({ cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // While the mobile menu is open: lock page scroll and close it with Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
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

        <a href="#top" className="header__logo">
          Garden Muse
        </a>

        <nav className="header__nav" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header__actions">
          <button className="header__icon-btn" aria-label="Search">
            <SearchIcon />
          </button>
          <a href="#saved" className="header__icon-btn header__saved" aria-label="Saved items">
            <HeartIcon />
          </a>
          <a
            href="#cart"
            className="header__icon-btn header__cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            <BagIcon />
            {cartCount > 0 && <span className="header__badge">{cartCount}</span>}
          </a>
        </div>
      </div>

      {/* Mobile slide-out menu */}
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
              <a key={link.href} href={link.href} onClick={closeMenu} className="mobile-menu__link">
                {link.label}
              </a>
            ))}
          </nav>
          <p className="mobile-menu__note">Same-day courier in London &amp; NYC</p>
        </div>
      </div>
    </header>
  );
}
