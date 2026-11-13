import { Link } from "react-router";
import { useFlowers } from "../../hooks/useFlowers.js";
import { ArrowRightIcon } from "../../components/Icons.jsx";
import ProductCard, {
  ProductCardSkeleton,
} from "../../components/ProductCard.jsx";
import "./Products.css";

const HOME_PRODUCT_COUNT = 4;

function ProductGrid() {
  const { status, flowers, retry } = useFlowers({ limit: HOME_PRODUCT_COUNT });

  if (status === "loading") {
    return (
      <div
        className="product-grid"
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

  return (
    <div className="product-grid">
      {flowers.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
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
