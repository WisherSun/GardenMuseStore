import { Link } from "react-router";
import "./Hero.css";

// The photo comes in 4 sizes (public/hero/); the browser picks the smallest one that
// looks sharp on the screen. The same list is preloaded in index.html, so the download
// starts straight away instead of waiting for the JavaScript. Keep both in sync.
const HERO_SRCSET = [640, 960, 1400, 2000].map((w) => `/hero/hero-${w}.webp ${w}w`).join(", ");
// The photo box is 145% of the hero width (see Hero.css); the hero is at most ~1232px wide.
const HERO_SIZES = "(min-width: 1280px) 1790px, 145vw";

export default function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="container">
        <div className="hero">
          <img
            className="hero__image"
            src="/hero/hero-1400.webp"
            srcSet={HERO_SRCSET}
            sizes={HERO_SIZES}
            width="2000"
            height="1000"
            alt="Pink and white roses in a silver vase on a sunlit window sill"
            fetchPriority="high"
          />
          <div className="hero__content">
            <span className="hero__label">Poetic Flora &amp; Living Art</span>
            <h1 className="hero__title">
              Arranged with intention, <br className="hero__break" />
              harvested with care
            </h1>
            <div className="hero__actions">
              <Link to="/shop" className="btn btn--green">
                Our shop
              </Link>
              <a href="mailto:lenafcdk@gmail.com" className="btn btn--light">
                Order Bespoke
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
