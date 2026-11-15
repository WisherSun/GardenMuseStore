import { Link } from "react-router";
import studioImage from "../../assets/placeholders/studio.jpg";
import bouquetImage from "../../assets/placeholders/bouquet.jpg";
import { StarIcon } from "../../components/Icons.jsx";
import "../info-page.css";
import "../Home/Craft.css"; // testimonial card styles

// "Our Craft" page: the studio's story and how a bouquet is made.
// Texts marked PLACEHOLDER were written as examples — please replace them with
// your real story. Everything else repeats facts already shown on the site.

const steps = [
  {
    title: "Seasonal stems",
    text: "We work with what the season gives: stems from local growers, picked at their best.",
  },
  {
    // PLACEHOLDER: describe how you really prepare flowers
    title: "Rested & conditioned",
    text: "Every stem is trimmed and rested in fresh water, so it opens slowly and lasts longer in your vase.",
  },
  {
    title: "Hand-tied in the studio",
    text: "Each bouquet is arranged by hand by our florists, never on a production line.",
  },
  {
    title: "Wrapped & delivered",
    text: "Wrapped without plastic and hand-delivered the same day in London & NYC when you order by 2pm.",
  },
];

export default function CraftPage() {
  return (
    <div className="info-page">
      <div className="container">
        <header className="info-hero">
          <span className="eyebrow">Slow Floral Craft</span>
          <h1 className="info-hero__title">From Soil to Vase</h1>
          <p className="info-hero__lead">
            Crafted daily in our sunlit botanical studio. We honor seasonal shifts and natural
            stem movements rather than forced perfection.
          </p>
        </header>

        <section className="info-split" aria-labelledby="craft-story">
          <div className="info-split__images">
            <img src={studioImage} alt="A florist arranging peonies, hydrangea and roses at the studio table" />
            <img src={bouquetImage} alt="A hand-tied bouquet wrapped in peach paper and a silk ribbon" />
          </div>
          <div className="info-split__text">
            <span className="eyebrow">Our story</span>
            <h2 id="craft-story" className="info-section__title">
              A studio led by the seasons
            </h2>
            {/* PLACEHOLDER: replace these two paragraphs with your real story */}
            <p>
              Garden Muse began with a simple idea: flowers should look like they were just
              gathered from a garden, not assembled in a factory. Every arrangement follows the
              natural shape of its stems.
            </p>
            <p>
              We choose flowers for their character — a curving stem, a bloom just about to open —
              and let each bouquet change with the season, so no two are ever quite the same.
            </p>
          </div>
        </section>

        <section className="info-section" aria-labelledby="craft-process">
          <div className="info-section__head">
            <span className="eyebrow">The process</span>
            <h2 id="craft-process" className="info-section__title">
              How a bouquet is made
            </h2>
          </div>
          <ol className="info-grid info-grid--4">
            {steps.map((step, i) => (
              <li key={step.title} className="info-card">
                <span className="info-card__number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="info-card__title">{step.title}</h3>
                <p className="info-card__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="info-section">
          <figure className="testimonial">
            <div className="testimonial__stars" role="img" aria-label="5 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} />
              ))}
            </div>
            <blockquote className="testimonial__quote">
              “Garden Muse is redefining botanical styling into sculptural modern art. Their
              arrangements transformed our gallery space.”
            </blockquote>
            <figcaption className="testimonial__source">— Verdant Interiors Magazine</figcaption>
          </figure>
        </section>

        <section className="info-cta">
          <h2 className="info-cta__title">See our craft in your vase</h2>
          <p className="info-cta__text">
            Choose a bouquet from this week’s collection, or ask our florists to design one just for you.
          </p>
          <div className="info-hero__actions">
            <Link to="/shop" className="btn btn--light">
              Visit the shop
            </Link>
            <Link to="/bespoke" className="btn btn--rust">
              Bespoke bouquet
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
