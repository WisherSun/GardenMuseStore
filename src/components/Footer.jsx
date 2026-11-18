import { Link } from "react-router";
import { FacebookIcon, InstagramIcon, PinterestIcon, TikTokIcon } from "./Icons.jsx";
import "./Footer.css";

// PLACEHOLDER links: they open the networks' home pages until the shop's own
// profile addresses are filled in here (e.g. "https://www.instagram.com/gardenmuse").
const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/", Icon: InstagramIcon },
  { name: "Pinterest", href: "https://www.pinterest.com/", Icon: PinterestIcon },
  { name: "Facebook", href: "https://www.facebook.com/", Icon: FacebookIcon },
  { name: "TikTok", href: "https://www.tiktok.com/", Icon: TikTokIcon },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              Garden Muse
            </Link>
            <p className="footer__about">
              Artisanal floral design atelier &amp; botanical studio. Cultivating natural elegance,
              wild arrangements, and botanical sculptures.
            </p>
            <ul className="footer__social" aria-label="Garden Muse on social media">
              {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    className="footer__social-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${name} (opens in a new tab)`}
                    title={name}
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h3 className="footer__heading">Atelier &amp; Studio</h3>
            <address className="footer__address">
              42 Marylebone High St
              <br />
              London, W1U 5HD
            </address>
            <p className="footer__hours">
              Tue–Sat: 09:00 – 18:30
              <br />
              Sun: 10:00 – 16:00
            </p>
          </div>

          <div className="footer__col">
            <h3 className="footer__heading">Private Commissions</h3>
            <a href="mailto:bespoke@gardenmuse.com" className="footer__link">
              bespoke<wbr />@gardenmuse.com
            </a>
            <a href="tel:+442079460912" className="footer__link">
              +44 (0) 20 7946 0912
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {year} Garden Muse Ltd.</p>
        </div>
      </div>
    </footer>
  );
}
