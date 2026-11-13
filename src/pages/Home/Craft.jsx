import studioImage from "../../assets/placeholders/studio.jpg";
import bouquetImage from "../../assets/placeholders/bouquet.jpg";
import { StarIcon } from "../../components/Icons.jsx";
import "./Craft.css";

export default function Craft() {
  return (
    <>
      <section className="craft" id="craft">
        <div className="container craft__inner">
          <div className="craft__text">
            <span className="eyebrow">Slow Floral Craft</span>
            <h2 className="craft__title">From Soil to Vase</h2>
            <p className="craft__desc">
              Crafted daily in our sunlit botanical studio. We honor seasonal shifts and natural
              stem movements rather than forced perfection.
            </p>
          </div>
          <div className="craft__images">
            <img
              src={studioImage}
              alt="A florist arranging peonies, hydrangea and roses at the studio table"
              loading="lazy"
            />
            <img
              src={bouquetImage}
              alt="A hand-tied bouquet wrapped in peach paper and a silk ribbon"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
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
            <figcaption className="testimonial__source">
              — Verdant Interiors Magazine
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
