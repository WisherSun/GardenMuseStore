import { useEffect, useState } from "react";
import { categories } from "./categories.js";
import { useFlowers } from "../../hooks/useFlowers.js";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "../../components/Icons.jsx";
import "./Products.css";

const HOME_PRODUCT_COUNT = 4;

// $45 stays "$45", $45.5 becomes "$45.50"
function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const onSale = product.salePrice != null;

  // Show "Added" for a moment after clicking, then go back to "Add".
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  const handleAdd = () => {
    onAdd(product);
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

// Grey placeholder cards shown while products load
function ProductCardSkeleton() {
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

function ProductGrid({ onAddToCart }) {
  const { status, flowers, retry } = useFlowers({ limit: HOME_PRODUCT_COUNT });

  if (status === "loading") {
    return (
      <div className="product-grid" aria-busy="true" aria-label="Loading products">
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

  return (
    <div className="product-grid">
      {flowers.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
      ))}
    </div>
  );
}

export default function Products({ onAddToCart }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  return (
    <>
      {/* Curated Botanicals: category tabs */}
      <section className="botanicals" id="botanicals">
        <div className="container">
          <div className="botanicals__head">
            <h2 className="botanicals__title">Curated Botanicals</h2>
            <span className="botanicals__note">Seasonal drops</span>
          </div>
          {/* For now this only highlights the chosen category.
              Once catalog pages exist, each button can link to its category. */}
          <div className="tabs no-scrollbar" aria-label="Categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                aria-pressed={activeCategory === cat.id}
                className={`tab ${activeCategory === cat.id ? "is-active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Flora of the week: product grid loaded from Supabase */}
      <section className="arrangements" id="arrangements">
        <div className="container">
          <div className="arrangements__head">
            <div>
              <span className="eyebrow">Flora of the Week</span>
              <h2 className="arrangements__title">Sculpted Arrangements</h2>
            </div>
            <a href="#shop" className="view-all">
              View all <ArrowRightIcon />
            </a>
          </div>

          <ProductGrid onAddToCart={onAddToCart} />
        </div>
      </section>
    </>
  );
}
