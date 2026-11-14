import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { fetchFlowerById } from "../../api/flowers.js";
import { useCart } from "../../hooks/useCart.js";
import { formatPrice } from "../../lib/format.js";
import { ArrowRightIcon, CheckIcon, LeafIcon } from "../../components/Icons.jsx";
import BuyNowDialog from "./BuyNowDialog.jsx";
import "./Product.css";

const MAX_QUANTITY = 99;

// Loads one flower by the id in the address (/shop/7).
// status: "loading" | "success" | "notfound" | "error"
function useFlower(id) {
  const validId = /^\d+$/.test(id); // "/shop/abc" can't be a flower, no need to ask the database
  const [state, setState] = useState({ status: "loading", flower: null, id });
  const [attempt, setAttempt] = useState(0);

  // Going from one flower page to another: show "loading" again instead of the old flower.
  if (state.id !== id) setState({ status: "loading", flower: null, id });

  useEffect(() => {
    if (!validId) return;
    let ignore = false;

    fetchFlowerById(Number(id))
      .then((flower) => {
        if (!ignore) setState({ status: flower ? "success" : "notfound", flower, id });
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

  if (!validId) return { status: "notfound", flower: null, retry };
  return { ...state, retry };
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

function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        <img src={current} alt={`${name}, photo ${active + 1} of ${images.length}`} />
      </div>

      {images.length > 1 && (
        <div className="product-gallery__thumbs" role="group" aria-label="Choose a photo">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-gallery__thumb ${i === active ? "is-active" : ""}`}
              aria-pressed={i === active}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "Add to basket" (or the quantity in the basket) + "Buy now".
// Guests are sent to sign in first for "Buy now", then come back to this page.
function BuyBox({ flower }) {
  const { isGuest } = useCart();
  const { pathname } = useLocation();
  const [buying, setBuying] = useState(false);

  return (
    <div className="product-actions">
      <BasketControl flower={flower} />

      {isGuest ? (
        <>
          <Link to="/login" state={{ from: pathname }} className="btn btn--rust btn--block">
            Buy now
          </Link>
          <p className="product-actions__note">You’ll be asked to sign in first.</p>
        </>
      ) : (
        <button className="btn btn--rust btn--block" onClick={() => setBuying(true)}>
          Buy now
        </button>
      )}

      {buying && <BuyNowDialog flower={flower} onClose={() => setBuying(false)} />}
    </div>
  );
}

function BasketControl({ flower }) {
  const { add, lines, setQuantity } = useCart();
  const quantity = lines.find((line) => line.flowerId === flower.id)?.quantity ?? 0;

  if (quantity === 0) {
    return (
      <button className="btn btn--ink btn--block" onClick={() => add(flower.id)}>
        Add to basket
      </button>
    );
  }

  return (
    <div className="product-buy">
      <div className="product-buy__stepper" role="group" aria-label={`${flower.name} in basket`}>
        <button
          onClick={() => setQuantity(flower.id, quantity - 1)}
          aria-label={quantity === 1 ? `Remove ${flower.name} from basket` : "Decrease quantity"}
        >
          −
        </button>
        <span aria-live="polite">{quantity}</span>
        <button
          onClick={() => setQuantity(flower.id, quantity + 1)}
          disabled={quantity >= MAX_QUANTITY}
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

function ProductSkeleton() {
  return (
    <div className="product-layout" aria-busy="true" aria-label="Loading flower">
      <div className="product-gallery__main skeleton" />
      <div className="product-info">
        <div className="skeleton skeleton--line" style={{ width: "30%" }} />
        <div className="skeleton skeleton--line" style={{ width: "80%", height: 40 }} />
        <div className="skeleton skeleton--line" style={{ width: "25%" }} />
        <div className="skeleton skeleton--line skeleton--thin" style={{ width: "90%" }} />
        <div className="skeleton skeleton--line skeleton--thin" style={{ width: "70%" }} />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { status, flower, retry } = useFlower(id);

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

        {status === "success" && <ProductDetails key={flower.id} flower={flower} />}
      </div>
    </section>
  );
}

function ProductDetails({ flower }) {
  const onSale = flower.salePrice != null;
  const { about, care } = splitDetails(flower.details);

  return (
    <div className="product-layout">
      <Gallery images={flower.images} name={flower.name} />

      <div className="product-info">
        {onSale && <span className="product-info__badge">Sale</span>}
        <h1 className="product-info__name">{flower.name}</h1>

        <p className="product-info__price">
          {onSale ? (
            <>
              <span className="product-info__price--sale">{formatPrice(flower.salePrice)}</span>
              <s className="product-info__price--old">
                <span className="visually-hidden">was </span>
                {formatPrice(flower.price)}
              </s>
            </>
          ) : (
            formatPrice(flower.price)
          )}
        </p>

        {flower.description && <p className="product-info__lead">{flower.description}</p>}

        <BuyBox flower={flower} />

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
