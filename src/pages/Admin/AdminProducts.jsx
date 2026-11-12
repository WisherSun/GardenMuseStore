import { useEffect, useState } from "react";
import { deleteFlower, fetchFlowersForAdmin } from "../../api/admin.js";
import { formatPrice } from "../../lib/format.js";
import { PlusIcon, SearchIcon } from "../../components/Icons.jsx";
import ProductForm from "./ProductForm.jsx";

function deleteErrorMessage(error) {
  if (error?.code === "23503") {
    return "This product is still linked to baskets or orders. Run supabase/admin-setup.sql in Supabase, then try again.";
  }
  return error?.message || "Could not delete the product.";
}

export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null = form closed, {} = new product, row = edit
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    let ignore = false;
    fetchFlowersForAdmin()
      .then((data) => {
        if (ignore) return;
        setRows(data);
        setStatus("success");
      })
      .catch((error) => {
        console.error("Could not load products:", error);
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const handleSaved = (saved, isNew) => {
    setRows((current) =>
      isNew ? [...current, saved] : current.map((row) => (row.id === saved.id ? saved : row)),
    );
    setEditing(null);
    setMessage({ type: "success", text: `“${saved.name}” was ${isNew ? "added" : "saved"}.` });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete “${row.name}”? This cannot be undone.`)) return;
    setMessage(null);
    try {
      await deleteFlower(row.id);
      setRows((current) => current.filter((r) => r.id !== row.id));
      setMessage({ type: "success", text: `“${row.name}” was deleted.` });
    } catch (error) {
      console.error("Could not delete product:", error);
      setMessage({ type: "error", text: deleteErrorMessage(error) });
    }
  };

  const query = search.trim().toLowerCase();
  const visible = rows.filter((row) => !query || row.name.toLowerCase().includes(query));

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <label className="admin-search">
          <SearchIcon className="admin-search__icon" />
          <span className="visually-hidden">Search products</span>
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="btn btn--ink" onClick={() => setEditing({})}>
          <PlusIcon className="admin-btn-icon" /> Add product
        </button>
      </div>

      {message && (
        <p className={`admin-message admin-message--${message.type}`} role={message.type === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      {status === "loading" && <p className="admin-empty">Loading products…</p>}

      {status === "error" && (
        <div className="product-message" role="alert">
          <p>Could not load products.</p>
          <button className="btn btn--ink" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <p className="admin-count">
            {visible.length} of {rows.length} products
          </p>
          {visible.length === 0 ? (
            <p className="admin-empty">No products found.</p>
          ) : (
            <ul className="admin-products">
              {visible.map((row) => {
                const onSale = row.discount && row.newPrice != null;
                return (
                  <li key={row.id} className="admin-product">
                    <img className="admin-product__image" src={row.image} alt="" loading="lazy" />
                    <div className="admin-product__info">
                      <h3 className="admin-product__name">
                        {row.name}
                        {onSale && <span className="admin-badge admin-badge--sale">Sale</span>}
                      </h3>
                      <p className="admin-product__desc">{row.description}</p>
                      <p className="admin-product__price">
                        {onSale ? (
                          <>
                            <span className="admin-product__sale">{formatPrice(Number(row.newPrice))}</span>{" "}
                            <s>{formatPrice(Number(row.price))}</s>
                          </>
                        ) : (
                          formatPrice(Number(row.price))
                        )}
                        <span className="admin-product__id">ID {row.id}</span>
                      </p>
                    </div>
                    <div className="admin-product__actions">
                      <button className="admin-action" onClick={() => setEditing(row)}>
                        Edit
                      </button>
                      <button className="admin-action admin-action--danger" onClick={() => handleDelete(row)}>
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {editing && (
        <ProductForm
          key={editing.id ?? "new"}
          product={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
