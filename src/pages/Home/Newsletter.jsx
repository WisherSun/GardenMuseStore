import "./Newsletter.css";

const tips = [
  {
    title: "Trim the stems",
    text: "Cut 2 cm off each stem at an angle before placing them in water.",
  },
  {
    title: "Fresh water every two days",
    text: "Change the water and rinse the vase to keep bacteria away.",
  },
  {
    title: "Remove low leaves",
    text: "No leaves below the waterline; they rot and shorten vase life.",
  },
  {
    title: "Keep them cool",
    text: "Away from direct sun, radiators and ripening fruit.",
  },
];

// Flower care tips. Information only, no form or button.
// (File keeps its old name; the section used to be a newsletter sign-up.)
export default function Newsletter() {
  return (
    <section className="section newsletter-section" id="care" aria-labelledby="care-title">
      <div className="container">
        <div className="newsletter">
          <div className="newsletter__text">
            <span className="eyebrow">Flower care</span>
            <h2 id="care-title" className="newsletter__title">
              Make Your Bouquet Last
            </h2>
            <p className="newsletter__desc">
              A little care goes a long way. Follow these simple steps and your flowers will
              stay fresh and beautiful for days longer.
            </p>
          </div>

          <ol className="care-tips">
            {tips.map((tip, i) => (
              <li key={tip.title} className="care-tip">
                <span className="care-tip__number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="care-tip__title">{tip.title}</h3>
                  <p className="care-tip__text">{tip.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
