import { useEffect, useState } from "react";
import { Link } from "react-router";
import "./Hero.css";

// How long each slide stays before fading to the next one (the fade itself is in Hero.css)
const SLIDE_MS = 3000;

// Our own photo comes in 4 sizes (public/hero/); the browser picks the smallest one that
// looks sharp on the screen. The same list is preloaded in index.html, so the download
// starts straight away instead of waiting for the JavaScript. Keep both in sync.
const localSrcSet = [640, 960, 1400, 2000].map((w) => `/hero/hero-${w}.webp ${w}w`).join(", ");

// Unsplash photos: Unsplash makes each size on request (w = width, h = half of it, cropped).
const unsplash = (id) => ({
  src: `https://images.unsplash.com/photo-${id}?w=1400&h=700&fit=crop&q=80&auto=format`,
  srcSet: [640, 960, 1400, 2000]
    .map((w) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${w / 2}&fit=crop&q=80&auto=format ${w}w`)
    .join(", "),
});

// The three slides. PLACEHOLDER: the texts of slides 2 and 3 and their photos were picked
// by the developer; replace them with the team's own when ready.
const SLIDES = [
  {
    label: "Poetic Flora & Living Art",
    title: ["Arranged with intention,", "harvested with care"],
    image: { src: "/hero/hero-1400.webp", srcSet: localSrcSet },
    alt: "Pink and white roses in a silver vase on a sunlit window sill",
  },
  {
    label: "Seasonal Collection",
    title: ["Blooms of the season,", "gathered at their best"],
    image: unsplash("1575178094668-132dc931ad35"),
    alt: "Close-up of soft pink peonies",
  },
  {
    label: "Bespoke Arrangements",
    title: ["Made for your moments,", "shaped by your story"],
    image: unsplash("1651592279151-f84dea81a03d"),
    alt: "Cream, peach and pink ranunculus",
  },
];

// The photo box is 145% of the hero width (see Hero.css); the hero is at most ~1232px wide.
const HERO_SIZES = "(min-width: 1280px) 1790px, 145vw";

// People who ask their device for less motion get no automatic slideshow (they see slide 1).
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Home page hero: a slideshow. Every 3 seconds the photo, label and title fade into the next
// slide. The buttons stay the same. It pauses while a button in it has keyboard focus,
// so keyboard users aren't rushed.
export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused] = useState(prefersReducedMotion);
  const [focused, setFocused] = useState(false);

  // A new 3-second timer for every slide
  useEffect(() => {
    if (paused || focused) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [active, paused, focused]);

  return (
    <section
      className="hero-section"
      id="top"
      aria-roledescription="carousel"
      aria-label="Garden Muse highlights"
    >
      <div className="container">
        <div
          className="hero"
          // :focus-visible = focus from the keyboard, not from a mouse click
          onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
          }}
        >
          {/* All photos lie on top of each other; only the active one is visible.
              Changing the active one fades it in and the old one out (CSS transition). */}
          {SLIDES.map((slide, i) => (
            <img
              key={slide.image.src}
              className={`hero__image ${i === active ? "is-active" : ""}`}
              src={slide.image.src}
              srcSet={slide.image.srcSet}
              sizes={HERO_SIZES}
              width="2000"
              height="1000"
              alt={i === active ? slide.alt : ""}
              aria-hidden={i === active ? undefined : true}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          ))}

          <div className="hero__content">
            {/* The texts also lie on top of each other, so the hero never jumps in height.
                Screen readers always get the first slide (with the page's main heading);
                the others are only a visual change. */}
            <div className="hero__slides">
              {SLIDES.map((slide, i) => {
                const Title = i === 0 ? "h1" : "p";
                return (
                  <div
                    key={slide.label}
                    className={`hero__slide ${i === active ? "is-active" : ""}`}
                    aria-hidden={i === 0 ? undefined : true}
                  >
                    <span className="hero__label">{slide.label}</span>
                    <Title className="hero__title">
                      {slide.title[0]} <br className="hero__break" />
                      {slide.title[1]}
                    </Title>
                  </div>
                );
              })}
            </div>

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
