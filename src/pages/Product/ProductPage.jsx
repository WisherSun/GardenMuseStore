import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { fetchFlowerById } from "../../api/flowers.js";
import { useCart } from "../../hooks/useCart.js";
import { formatPrice } from "../../lib/format.js";
import { formatShortDate, productDeliveryWindow } from "../../lib/delivery.js";
import {
  ArrowRightIcon,
  CheckIcon,
  LeafIcon,
  SearchIcon,
  TruckIcon,
} from "../../components/Icons.jsx";
import BuyNowDialog from "./BuyNowDialog.jsx";
import ImageViewer from "./ImageViewer.jsx";
import ProductReviews from "./ProductReviews.jsx";
import Stars from "../../components/Stars.jsx";
import { useReviews } from "../../hooks/useReviews.js";
import "./Product.css";

const MAX_QUANTITY = 99;

// Loads one flower by the id in the address (/shop/7).
// status: "loading" | "success" | "notfound" | "error"
function useFlower(id) {
  const validId = /^\d+$/.test(id); // "/shop/abc" can't be a flower, no need to ask the database
  const [state, setState] = useState({ status: "loading", flower: null, id });
  const [attempt, setAttempt] = useState(0);

  // Going from one flower page to another: show "loading" again instead of the old flower.
  // Switching to another colour of the same flower: its data is already here, show it at once.
  if (state.id !== id) {
    const sameFlowerColor = state.flower?.colors?.find((c) => String(c.id) === id);
    setState(
      sameFlowerColor
        ? { status: "success", flower: { ...sameFlowerColor, colors: state.flower.colors }, id }
        : { status: "loading", flower: null, id },
    );
  }

  useEffect(() => {
    if (!validId) return;
    let ignore = false;

    fetchFlowerById(Number(id))
      .then((flower) => {
        if (!ignore)
          setState({ status: flower ? "success" : "notfound", flower, id });
      })
      .catch((error) => {
        console.error("Could not load flower:", error);
        if (!ignore) setState({ status: "error", flower: null, id });
      });

    return () => {
      ignore = true;
    };
  }, [id, validId, attempt]);

  const retry = () => {
    setState({ status: "loading", flower: null, id });
    setAttempt((n) => n + 1);
  };

  // Loads the flower again in the background (the page stays as it is meanwhile),
  // e.g. to show the new stock after an order.
  const refresh = () => setAttempt((n) => n + 1);

  if (!validId) return { status: "notfound", flower: null, retry, refresh };
  return { ...state, retry, refresh };
}

// The details text ends with care advice that starts with "Care:".
// We show that part separately; if there is no "Care:", all text goes to "About".
function splitDetails(details) {
  const at = details.search(/\bCare:/);
  if (at === -1) return { about: details.trim(), care: "" };
  return {
    about: details.slice(0, at).trim(),
    care: details.slice(at + "Care:".length).trim(),
  };
}

// Big photo you can swipe (phones), scroll with a trackpad, or move with the
// arrows (computers with a mouse). The small photos below still work too.
// The browser does the sliding itself with CSS "scroll-snap"; this code only
// keeps the big photo and the highlighted small photo in step.
// A click / tap on the big photo (or the magnifier button) opens it full screen to zoom.
function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(null); // null = full-screen viewer closed
  const trackRef = useRef(null);
  const many = images.length > 1;

  // Hover zoom (mouse only): the photo is shown 2x bigger and the zoomed spot follows
  // the cursor. The position goes straight into CSS variables instead of React state,
  // so moving the mouse doesn't re-render the page dozens of times a second.
  // The zoom itself only happens on computers with a mouse (see Product.css).
  const hoverZoom = (e) => {
    if (e.pointerType !== "mouse") return;
    const slide = e.currentTarget;
    const box = slide.getBoundingClientRect();
    slide.style.setProperty("--zoom-x", `${((e.clientX - box.left) / box.width) * 100}%`);
    slide.style.setProperty("--zoom-y", `${((e.clientY - box.top) / box.height) * 100}%`);
    slide.classList.add("is-hover-zoom");
  };

  const stopHoverZoom = (e) => e.currentTarget.classList.remove("is-hover-zoom");

  // Back from full screen: show the photo the customer was last looking at there
  const closeViewer = (index) => {
    setViewerIndex(null);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth });
  };

  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.max(0, Math.min(i, images.length - 1));
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  };

  // Which photo is showing, worked out from how far the row is scrolled
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  };

  // Left/right arrow keys when the big photo has keyboard focus
  const handleKey = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <div
          ref={trackRef}
          className="product-gallery__track no-scrollbar"
          onScroll={many ? handleScroll : undefined}
          onKeyDown={many ? handleKey : undefined}
          tabIndex={many ? 0 : undefined}
          role={many ? "region" : undefined}
          aria-label={
            many ? `${name} photos, use arrow keys to browse` : undefined
          }
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="product-gallery__slide"
              onPointerMove={hoverZoom}
              onPointerLeave={stopHoverZoom}
            >
              <img
                src={src}
                alt={`${name}, photo ${i + 1} of ${images.length}`}
                loading={i === 0 ? "eager" : "lazy"}
                draggable="false"
                onClick={() => setViewerIndex(i)}
              />
            </div>
          ))}
        </div>

        {/* Same as clicking the photo, but reachable with the keyboard too */}
        <button
          type="button"
          className="product-gallery__zoom"
          aria-label="Open photo full screen to zoom"
          onClick={() => setViewerIndex(active)}
        >
          <SearchIcon />
        </button>

        {many && (
          <>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--prev"
              aria-label="Previous photo"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
            >
              <ArrowRightIcon />
            </button>
            <button
              type="button"
              className="product-gallery__arrow product-gallery__arrow--next"
              aria-label="Next photo"
              onClick={() => goTo(active + 1)}
              disabled={active === images.length - 1}
            >
              <ArrowRightIcon />
            </button>
            <span className="product-gallery__count" aria-hidden="true">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {many && (
        <div
          className="product-gallery__thumbs"
          role="group"
          aria-label="Choose a photo"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-gallery__thumb ${i === active ? "is-active" : ""}`}
              aria-pressed={i === active}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => goTo(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <ImageViewer images={images} name={name} startIndex={viewerIndex} onClose={closeViewer} />
      )}
    </div>
  );
}

// Shown instead of the basket buttons when the flower is sold out.
// The number in stock itself is not shown on this page (team decision);
// the "+" buttons simply stop at it.
function SoldOutNote() {
  return (
    <p className="product-stock product-stock--soldout" role="status">
      <strong>Sold out.</strong> This flower isn’t available right now.
    </p>
  );
}

// "Add to basket" (or the quantity in the basket) + "Buy now".
// Guests are sent to sign in first for "Buy now", then come back to this page.
// `onOrdered` runs after a "Buy now" order, to load the new stock.
function BuyBox({ flower, onOrdered }) {
  const { isGuest, lines } = useCart();
  const { pathname } = useLocation();
  const [buying, setBuying] = useState(false);
  const inBasket = lines.find((line) => line.flowerId === flower.id)?.quantity ?? 0;

  if (flower.stock === 0 && !buying) {
    return (
      <div className="product-actions">
        <SoldOutNote />
        <button className="btn btn--ink btn--block" disabled>
          Not available
        </button>
      </div>
    );
  }

  return (
    <div className="product-actions">
      <BasketControl flower={flower} quantity={inBasket} />

      {isGuest ? (
        <>
          <Link
            to="/login"
            state={{ from: pathname }}
            className="btn btn--rust btn--block"
          >
            Buy now
          </Link>
          <p className="product-actions__note">
            You’ll be asked to sign in first.
          </p>
        </>
      ) : (
        <button
          className="btn btn--rust btn--block"
          onClick={() => setBuying(true)}
        >
          Buy now
        </button>
      )}

      {buying && (
        <BuyNowDialog flower={flower} onClose={() => setBuying(false)} onOrdered={onOrdered} />
      )}
    </div>
  );
}

function BasketControl({ flower, quantity }) {
  const { add, setQuantity } = useCart();
  // Can't put more in the basket than there are in stock
  const max = Math.min(flower.stock, MAX_QUANTITY);

  if (quantity === 0) {
    return (
      <button
        className="btn btn--ink btn--block"
        onClick={() => add(flower.id)}
        disabled={max === 0}
      >
        Add to basket
      </button>
    );
  }

  return (
    <div className="product-buy">
      <div
        className="product-buy__stepper"
        role="group"
        aria-label={`${flower.name} in basket`}
      >
        <button
          onClick={() => setQuantity(flower.id, quantity - 1)}
          aria-label={
            quantity === 1
              ? `Remove ${flower.name} from basket`
              : "Decrease quantity"
          }
        >
          −
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          onClick={() => setQuantity(flower.id, quantity + 1)}
          disabled={quantity >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <Link to="/cart" className="btn btn--light product-buy__cart">
        <CheckIcon className="product-buy__icon" /> In basket · View
      </Link>
    </div>
  );
}

// When this flower can be delivered: from today if it's before 1 pm (London time),
// otherwise from tomorrow, and for one more week after that.
function DeliveryNote() {
  const { sameDay, from, to } = productDeliveryWindow();

  return (
    <div className="product-delivery">
      <span className="product-delivery__badge">
        <TruckIcon className="product-delivery__icon" />
      </span>
      <div>
        <p className="product-delivery__text">
          We can deliver these flowers from <br />
          <strong>{sameDay ? "today" : "tomorrow"}</strong>,{" "}
          <strong>{formatShortDate(from)}</strong>, until{" "}
          <strong>{formatShortDate(to)}</strong>.
        </p>
        <p className="product-delivery__hint">
          {sameDay
            ? "Order before 1 pm for delivery today."
            : "Orders after 1 pm are delivered from tomorrow."}
        </p>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div
      className="product-layout"
      aria-busy="true"
      aria-label="Loading flower"
    >
      <div className="product-gallery__main skeleton" />
      <div className="product-info">
        <div className="skeleton skeleton--line" style={{ width: "30%" }} />
        <div
          className="skeleton skeleton--line"
          style={{ width: "80%", height: 40 }}
        />
        <div className="skeleton skeleton--line" style={{ width: "25%" }} />
        <div
          className="skeleton skeleton--line skeleton--thin"
          style={{ width: "90%" }}
        />
        <div
          className="skeleton skeleton--line skeleton--thin"
          style={{ width: "70%" }}
        />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { status, flower, retry, refresh } = useFlower(id);

  // Browser tab shows the flower name while you're on its page.
  useEffect(() => {
    if (!flower) return;
    const previous = document.title;
    document.title = `${flower.name} — Garden Muse`;
    return () => {
      document.title = previous;
    };
  }, [flower]);

  return (
    <section className="product-page">
      <div className="container">
        <Link to="/shop" className="product-page__back">
          <ArrowRightIcon className="product-page__back-icon" /> Back to shop
        </Link>

        {status === "loading" && <ProductSkeleton />}

        {status === "error" && (
          <div className="product-message" role="alert">
            <p>We couldn’t load this flower right now.</p>
            <button className="btn btn--ink" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {status === "notfound" && (
          <div className="product-message">
            <p>This flower isn’t in our collection any more.</p>
            <Link to="/shop" className="btn btn--ink">
              See all flowers
            </Link>
          </div>
        )}

        {status === "success" && (
          // Keyed by all its colours: switching colour keeps the same reviews, another flower loads new ones
          <FlowerWithReviews
            key={reviewsKey(flower)}
            flower={flower}
            onOrdered={refresh}
          />
        )}
      </div>
    </section>
  );
}

// All colours of a flower share one set of reviews, so they are loaded by all its ids.
const reviewsKey = (flower) =>
  flower.colors?.length ? flower.colors.map((c) => c.id).join(",") : String(flower.id);

// The flower and its reviews. The reviews are loaded once here and used twice:
// for the rating next to the name and for the reviews section below.
function FlowerWithReviews({ flower, onOrdered }) {
  const reviews = useReviews(reviewsKey(flower));

  return (
    <>
      <ProductDetails key={flower.id} flower={flower} onOrdered={onOrdered} rating={reviews} />
      <ProductReviews flower={flower} {...reviews} />
    </>
  );
}

// Average rating under the flower name, e.g. ★★★★½ 4.5 · 2 reviews.
// Only shown once the flower has reviews; clicking it scrolls down to them.
function RatingSummary({ count, average }) {
  if (!count) return null;

  const goToReviews = (e) => {
    e.preventDefault();
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <a href="#reviews" className="product-info__rating" onClick={goToReviews}>
      <Stars mark={average} />
      <span className="product-info__rating-value">{average.toFixed(1)}</span>
      <span className="product-info__rating-count">
        {count} {count === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}

// Colour choice for flowers sold in several colours. Each colour is its own flower row
// with its own page, so choosing a colour opens that page (/shop/11 -> /shop/21):
// photos, price and "Add to basket" all switch to that colour.
// `keepScroll` tells ScrollManager not to jump to the top of the page.
function ColorPicker({ flower }) {
  const navigate = useNavigate();
  if (!flower.colors || flower.colors.length < 2) return null;

  return (
    <fieldset className="color-picker">
      <legend className="color-picker__legend">
        Colour: <span>{flower.color}</span>
      </legend>
      <div className="color-picker__options">
        {flower.colors.map((option) => (
          <label key={option.id} className="color-picker__option">
            <input
              type="radio"
              name="flower-color"
              value={option.id}
              checked={option.id === flower.id}
              onChange={() =>
                navigate(`/shop/${option.id}`, { replace: true, state: { keepScroll: true } })
              }
            />
            <span className={option.stock === 0 ? "is-soldout" : undefined}>
              {option.color}
              {option.stock === 0 && <span className="visually-hidden"> (sold out)</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProductDetails({ flower, onOrdered, rating }) {
  const onSale = flower.salePrice != null;
  const { about, care } = splitDetails(flower.details);

  return (
    <div className="product-layout">
      <Gallery key={flower.id} images={flower.images} name={flower.name} />

      <div className="product-info">
        {flower.stock === 0 ? (
          <span className="product-info__badge product-info__badge--soldout">Sold out</span>
        ) : (
          onSale && <span className="product-info__badge">Sale</span>
        )}
        <h1 className="product-info__name">{flower.name}</h1>
        <RatingSummary count={rating.count} average={rating.average} />

        <p className="product-info__price">
          {onSale ? (
            <>
              <span className="product-info__price--sale">
                {formatPrice(flower.salePrice)}
              </span>
              <s className="product-info__price--old">
                <span className="visually-hidden">was </span>
                {formatPrice(flower.price)}
              </s>
            </>
          ) : (
            formatPrice(flower.price)
          )}
        </p>

        {flower.description && (
          <p className="product-info__lead">{flower.description}</p>
        )}

        <ColorPicker flower={flower} />

        <BuyBox flower={flower} onOrdered={onOrdered} />

        <DeliveryNote />

        {about && (
          <div className="product-info__section">
            <h2 className="product-info__heading">About this flower</h2>
            <p>{about}</p>
          </div>
        )}

        {care && (
          <div className="product-info__care">
            <LeafIcon className="product-info__care-icon" />
            <div>
              <h2 className="product-info__heading">Care tips</h2>
              <p>{care}</p>
            </div>
          </div>
        )}

        <Link to="/shop" className="btn btn--light product-info__continue">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
