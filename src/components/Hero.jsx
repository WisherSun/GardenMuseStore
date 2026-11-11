import heroImage from "../assets/placeholders/hero.jpg";
import { LeafIcon, TruckIcon } from "./Icons.jsx";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="container">
        <div className="hero">
          <img
            className="hero__image"
            src={heroImage}
            alt="Garden roses, ranunculus and hellebores arranged in a stone vase by a sunlit window"
            fetchPriority="high"
          />
          <div className="hero__content">
            <span className="hero__label">Poetic Flora &amp; Living Art</span>
            <h1 className="hero__title">
              Arranged with intention, <br className="hero__break" />
              harvested with care
            </h1>
            <div className="hero__actions">
              <a href="#botanicals" className="btn btn--green">
                Explore Spring Atelier
              </a>
              <a href="#subscription" className="btn btn--light">
                Order Bespoke
              </a>
            </div>
          </div>
        </div>

        <ul className="highlights no-scrollbar" aria-label="Why Garden Muse">
          <li className="highlight">
            <TruckIcon className="highlight__icon highlight__icon--rust" />
            Same-day Courier in London &amp; NYC
          </li>
          <li className="highlight">
            <LeafIcon className="highlight__icon highlight__icon--green" />
            100% Sustainable Sourcing
          </li>
        </ul>
      </div>
    </section>
  );
}
