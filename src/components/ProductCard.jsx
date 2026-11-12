import { useEffect, useState } from "react";
import { useCart } from "../hooks/useCart.js";
import { formatPrice } from "../lib/format.js";
import { CheckIcon, PlusIcon } from "./Icons.jsx";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const onSale = product.salePrice != null;

  // Show "Added" for a moment after clicking, then go back to "Add".
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
    <article className="product-card">
      <div className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {onSale && <span className="product-card__badge product-card__badge--sale">Sale</span>}
        <button
          className={`product-card__quick-add ${added ? "is-added" : ""}`}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          {added ? <CheckIcon /> : <PlusIcon />}
        </button>
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
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
          <button className="product-card__add" onClick={handleAdd} aria-live="polite">
            {added ? "Added" : "Add"}
          </button>
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
