import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useFlowers } from "../../hooks/useFlowers.js";
import { ArrowRightIcon } from "../../components/Icons.jsx";
import ProductCard, {
  ProductCardSkeleton,
} from "../../components/ProductCard.jsx";
import "./Products.css";

const HOME_PRODUCT_COUNT = 10;

function ProductGrid() {
  const { status, flowers, retry } = useFlowers({ limit: HOME_PRODUCT_COUNT });

  if (status === "loading") {
    return (
      <div
        className="product-slider__track no-scrollbar"
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: HOME_PRODUCT_COUNT }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="product-message" role="alert">
        <p>We couldn’t load our flowers right now.</p>
        <button className="btn btn--ink" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  if (flowers.length === 0) {
    return (
      <div className="product-message">
        <p>New arrangements are on their way. Please check back soon.</p>
      </div>
    );
  }

  return <ProductSlider flowers={flowers} />;
}

// Cards in one row that scroll sideways (swipe on touch screens, trackpad or
// Shift + mouse wheel on computers). The browser does the sliding itself with
// CSS "scroll-snap"; this code only works out the dots and which one is active.
function ProductSlider({ flowers }) {
  const trackRef = useRef(null);
  const [stops, setStops] = useState([]); // scroll positions a dot can jump to
  const [active, setActive] = useState(0);

  // Each card's left edge is a stop. Cards near the end can't reach the left
  // edge (the row ends first), so they share the last stop: no useless dots.
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const first = track.children[0]?.offsetLeft ?? 0;
    const points = [];
    for (const card of track.children) {
      const point = Math.min(card.offsetLeft - first, maxScroll);
      if (points.length === 0 || point - points[points.length - 1] > 2)
        points.push(point);
    }
    setStops(points);
  }, []);

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track || stops.length === 0) return;
    let closest = 0;
    stops.forEach((point, i) => {
      if (
        Math.abs(point - track.scrollLeft) <
        Math.abs(stops[closest] - track.scrollLeft)
      )
        closest = i;
    });
    setActive(closest);
  }, [stops]);

  // Measure again whenever the slider changes size (screen rotated, window resized)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure, flowers]);

  useEffect(updateActive, [updateActive]);

  const goTo = (i) => {
    trackRef.current?.scrollTo({ left: stops[i], behavior: "smooth" });
  };

  return (
    <div className="product-slider">
      <ul
        ref={trackRef}
        className="product-slider__track no-scrollbar"
        onScroll={updateActive}
        aria-label="Flowers we love"
      >
        {flowers.map((product) => (
          <li key={product.id} className="product-slider__slide">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      {/* Dots only appear when there is something to slide to */}
      {stops.length > 1 && (
        <div className="product-slider__dots">
          {stops.map((point, i) => (
            <button
              key={point}
              type="button"
              className="product-slider__dot"
              aria-label={`Show slide ${i + 1} of ${stops.length}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Products() {
  return (
    <>
      {/* Our Shop: a few products from Supabase, with a link to the full shop */}
      <section className="arrangements" id="arrangements">
        <div className="container">
          <div className="arrangements__head">
            <div>
              <span className="eyebrow">Our Shop</span>
              <h2 className="arrangements__title">Blooms We Love</h2>
            </div>
            {/* Next to the title on tablet/desktop */}
            <Link to="/shop" className="view-all view-all--top">
              View all <ArrowRightIcon />
            </Link>
          </div>

          <ProductGrid />

          {/* Under the cards on phones */}
          <div className="arrangements__more">
            <Link to="/shop" className="view-all">
              View all <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
