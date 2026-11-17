import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCart } from "../hooks/useCart.js";
import { formatPrice } from "../lib/format.js";
import { CheckIcon, PlusIcon } from "./Icons.jsx";
import "./ProductCard.css";

const MAX_QUANTITY = 99;

// Two controls with different jobs:
// - "+" on the photo: quick add, one more each click (shows a tick for a moment)
// - bottom of the card: "Add" until the flower is in the basket, then a − 2 + quantity control
// Clicking anywhere else on the card opens the flower's own page: the link on the name
// is stretched over the whole card (see .product-card__link in the CSS).
export default function ProductCard({ product }) {
  const { add, lines, setQuantity } = useCart();
  const [added, setAdded] = useState(false);
  const onSale = product.salePrice != null;
  const quantity = lines.find((line) => line.flowerId === product.id)?.quantity ?? 0;
  const soldOut = product.stock === 0;
  // Can't put more in the basket than there are in stock
  const max = Math.min(product.stock, MAX_QUANTITY);

  // Show a tick on the "+" for a moment after clicking.
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  const handleAdd = () => {
    add(product.id);
    setAdded(true);
  };

  return (
    <article className={`product-card ${soldOut ? "product-card--soldout" : ""}`}>
      <div className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {soldOut ? (
          <span className="product-card__badge product-card__badge--soldout">Sold out</span>
        ) : (
          onSale && <span className="product-card__badge product-card__badge--sale">Sale</span>
        )}
        {!soldOut && (
          <button
            className={`product-card__quick-add ${added ? "is-added" : ""}`}
            onClick={handleAdd}
            disabled={quantity >= max}
            aria-label={quantity >= max ? `No more ${product.name} in stock` : `Add ${product.name} to cart`}
          >
            {added ? <CheckIcon /> : <PlusIcon />}
          </button>
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link to={`/shop/${product.id}`} className="product-card__link">
            {product.name}
          </Link>
        </h3>
        <p className="product-card__desc">{product.description}</p>
        <div className="product-card__footer">
          {onSale ? (
            <span className="product-card__price">
              <span className="product-card__price--sale">{formatPrice(product.salePrice)}</span>
              <s className="product-card__price--old">
                <span className="visually-hidden">was </span>
                {formatPrice(product.price)}
              </s>
            </span>
          ) : (
            <span className="product-card__price">{formatPrice(product.price)}</span>
          )}
          {soldOut ? (
            <span className="product-card__soldout">Not available</span>
          ) : quantity === 0 ? (
            <button className="product-card__add" onClick={handleAdd}>
              Add
            </button>
          ) : (
            <div className="product-card__stepper" role="group" aria-label={`${product.name} in basket`}>
              <button
                onClick={() => setQuantity(product.id, quantity - 1)}
                aria-label={quantity === 1 ? `Remove ${product.name} from basket` : "Decrease quantity"}
              >
                −
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                onClick={() => setQuantity(product.id, quantity + 1)}
                disabled={quantity >= max}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Grey placeholder card shown while products load
export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <div className="product-card__media skeleton" />
      <div className="product-card__body">
        <div className="skeleton skeleton--line" style={{ width: "75%" }} />
        <div className="skeleton skeleton--line skeleton--thin" style={{ width: "55%" }} />
        <div className="product-card__footer">
          <div className="skeleton skeleton--line skeleton--thin" style={{ width: "30%" }} />
        </div>
      </div>
    </div>
  );
}
