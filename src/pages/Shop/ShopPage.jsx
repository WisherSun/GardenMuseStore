import { useMemo, useState } from "react";
import { useFlowers } from "../../hooks/useFlowers.js";
import { SearchIcon } from "../../components/Icons.jsx";
import ProductCard, { ProductCardSkeleton } from "../../components/ProductCard.jsx";
import "./Shop.css";

const PAGE_SIZE = 10;

const saleFilters = [
  { id: "all", label: "All" },
  { id: "sale", label: "On sale" },
  { id: "regular", label: "Full price" },
];

const sortOptions = [
  { id: "name-asc", label: "Name: A to Z" },
  { id: "name-desc", label: "Name: Z to A" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

// The price the customer actually pays (sale price if there is one)
const finalPrice = (product) => product.salePrice ?? product.price;

const sorters = {
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "price-asc": (a, b) => finalPrice(a) - finalPrice(b),
  "price-desc": (a, b) => finalPrice(b) - finalPrice(a),
};

export default function ShopPage() {
  // The catalog is small, so we load it once and filter/sort in the browser.
  const { status, flowers, retry } = useFlowers();

  const [search, setSearch] = useState("");
  const [saleFilter, setSaleFilter] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return flowers
      .filter((p) => !query || p.name.toLowerCase().includes(query))
      .filter((p) => {
        if (saleFilter === "sale") return p.salePrice != null;
        if (saleFilter === "regular") return p.salePrice == null;
        return true;
      })
      .sort(sorters[sort]);
  }, [flowers, search, saleFilter, sort]);

  const visible = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Any change to search/filter/sort starts again from the first 10 cards.
  const update = (setter) => (value) => {
    setter(value);
    setVisibleCount(PAGE_SIZE);
  };
  const changeSearch = update(setSearch);
  const changeSaleFilter = update(setSaleFilter);
  const changeSort = update(setSort);

  const clearFilters = () => {
    setSearch("");
    setSaleFilter("all");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section className="shop">
      <div className="container">
        <header className="shop__head">
          <span className="eyebrow">The Collection</span>
          <h1 className="shop__title">All Flowers</h1>
          <p className="shop__subtitle">
            Every stem in our atelier, picked fresh each morning.
          </p>
        </header>

        <div className="shop__toolbar">
          <label className="shop__search">
            <SearchIcon className="shop__search-icon" />
            <span className="visually-hidden">Search by name</span>
            <input
              type="search"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </label>

          <div className="tabs no-scrollbar shop__filters" aria-label="Filter by price">
            {saleFilters.map((f) => (
              <button
                key={f.id}
                aria-pressed={saleFilter === f.id}
                className={`tab ${saleFilter === f.id ? "is-active" : ""}`}
                onClick={() => changeSaleFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <label className="shop__sort">
            <span className="shop__sort-label">Sort by</span>
            <select value={sort} onChange={(e) => changeSort(e.target.value)}>
              {sortOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === "loading" && (
          <div className="product-grid shop__grid" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="product-message" role="alert">
            <p>We couldn’t load our flowers right now.</p>
            <button className="btn btn--ink" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {status === "success" && results.length === 0 && (
          <div className="product-message">
            <p>No flowers match your search.</p>
            <button className="btn btn--light" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}

        {status === "success" && results.length > 0 && (
          <>
            <p className="shop__count" aria-live="polite">
              Showing {visible.length} of {results.length}
            </p>

            <div className="product-grid shop__grid">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasMore && (
              <div className="shop__more">
                <button
                  className="btn btn--ink"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
