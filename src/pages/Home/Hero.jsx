import { Link } from "react-router";
import heroImage from "../../assets/placeholders/hero.jpg";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero-section" id="top">
      <div className="container">
        <div className="hero">
          <img
            className="hero__image"
            src={heroImage}
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
