import { Link } from "react-router";
import "../info-page.css";

// "Flower Care" page. These are general flower-care tips (true for any florist's
// flowers), not promises about Garden Muse, so nothing here is a placeholder.
// Feel free to add your own favourite tips.

const basics = [
  {
    title: "Trim the stems",
    text: "Cut 2 cm off each stem at an angle before placing them in water, and again every few days. A fresh, slanted cut drinks more water.",
  },
  {
    title: "Fresh water every two days",
    text: "Change the water and rinse the vase to keep bacteria away. Cloudy water is a sign it’s time.",
  },
  {
    title: "Remove low leaves",
    text: "No leaves below the waterline; they rot and shorten vase life. Pull off any that would sit in the water.",
  },
  {
    title: "Keep them cool",
    text: "Away from direct sun, radiators and ripening fruit. Fruit gives off a gas that makes flowers fade faster.",
  },
];

const arrival = [
  "Unwrap the bouquet and fill a clean vase with cool water.",
  "Trim each stem at an angle and remove leaves that would sit under water.",
  "Add flower food if you have some, and place the vase somewhere cool.",
];

const flowers = [
  {
    name: "Roses",
    text: "If a head droops, recut the stem and stand it in deep water for a few hours. The outer “guard” petals can be gently removed.",
  },
  {
    name: "Tulips",
    text: "Tulips keep growing in the vase and bend towards the light. Use a tall vase and turn it every day to keep them straight.",
  },
  {
    name: "Peonies",
    text: "Tight buds open in a day or two in warm water. Once open, keep them cool to slow them down.",
  },
  {
    name: "Lilies",
    text: "Pull off the orange pollen tips as the flowers open, to avoid stains on petals, clothes and tablecloths.",
  },
  {
    name: "Hydrangeas",
    text: "They drink through their petals too. If they wilt, soak the whole head in cool water for 30 minutes.",
  },
  {
    name: "Potted plants",
    text: "Water when the top of the soil feels dry, and keep them in bright light but out of strong midday sun.",
  },
];

export default function CarePage() {
  return (
    <div className="info-page">
      <div className="container">
        <header className="info-hero">
          <span className="eyebrow">Flower care</span>
          <h1 className="info-hero__title">Make Your Bouquet Last</h1>
          <p className="info-hero__lead">
            A little care goes a long way. Follow these simple steps and your flowers will stay
            fresh and beautiful for days longer.
          </p>
        </header>

        <section aria-labelledby="care-arrival">
          <div className="info-section__head">
            <span className="eyebrow">First 10 minutes</span>
            <h2 id="care-arrival" className="info-section__title">
              When your bouquet arrives
            </h2>
          </div>
          <ol className="info-grid info-grid--3">
            {arrival.map((text, i) => (
              <li key={text} className="info-card">
                <span className="info-card__number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="info-card__text">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="info-section" aria-labelledby="care-basics">
          <div className="info-section__head">
            <span className="eyebrow">Every day</span>
            <h2 id="care-basics" className="info-section__title">
              The four basics
            </h2>
          </div>
          <ul className="info-grid info-grid--4">
            {basics.map((tip) => (
              <li key={tip.title} className="info-card">
                <h3 className="info-card__title">{tip.title}</h3>
                <p className="info-card__text">{tip.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="info-section" aria-labelledby="care-flowers">
          <div className="info-section__head">
            <span className="eyebrow">Flower by flower</span>
            <h2 id="care-flowers" className="info-section__title">
              Tips for favourite blooms
            </h2>
          </div>
          <ul className="info-grid info-grid--3">
            {flowers.map((f) => (
              <li key={f.name} className="info-card">
                <h3 className="info-card__title">{f.name}</h3>
                <p className="info-card__text">{f.text}</p>
              </li>
            ))}
          </ul>

          <p className="info-note">
            <strong>Pets:</strong> lilies are very toxic to cats, even the pollen or the vase water.
            If you have a cat, keep lilies out of the house or choose another flower.
          </p>
        </section>

        <section className="info-cta">
          <h2 className="info-cta__title">Still have a question?</h2>
          <p className="info-cta__text">
            Ask us anything about your flowers and a florist will answer by email.
          </p>
          <div className="info-hero__actions">
            <Link to="/#faq" className="btn btn--light">
              Ask a florist
            </Link>
            <Link to="/shop" className="btn btn--rust">
              Visit the shop
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
