import { BagIcon, FlowerIcon, HeartIcon, SearchIcon } from "./Icons.jsx";
import "./BottomNav.css";

// Phone/tablet-only navigation bar fixed to the bottom of the screen.
export default function BottomNav({ cartCount }) {
  const items = [
    { label: "Atelier", href: "#top", Icon: FlowerIcon, active: true },
    { label: "Botanicals", href: "#botanicals", Icon: SearchIcon },
    { label: "Saved", href: "#saved", Icon: HeartIcon },
    { label: "Cart", href: "#cart", Icon: BagIcon, count: cartCount },
  ];

  return (
    <nav className="bottom-nav" aria-label="Quick navigation">
      {items.map(({ label, href, Icon, active, count }) => (
        <a
          key={label}
          href={href}
          className={`bottom-nav__item ${active ? "is-active" : ""}`}
          aria-current={active ? "page" : undefined}
        >
          <span className="bottom-nav__icon">
            <Icon />
            {count > 0 && <span className="bottom-nav__badge">{count}</span>}
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}
