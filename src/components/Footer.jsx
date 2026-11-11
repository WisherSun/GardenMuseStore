import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <a href="#top" className="footer__logo">
              Garden Muse
            </a>
            <p className="footer__about">
              Artisanal floral design atelier &amp; botanical studio. Cultivating natural elegance,
              wild arrangements, and botanical sculptures.
            </p>
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
          <nav className="footer__legal" aria-label="Legal">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#delivery">Delivery</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
