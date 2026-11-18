import { useEffect, useState } from "react";
import { Link } from "react-router";
import { deleteReview, fetchReviewsForAdmin } from "../../api/reviews.js";
import { SearchIcon, StarIcon } from "../../components/Icons.jsx";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// All customer reviews, newest first. The admin can only delete them, not change them:
// a review should stay in the customer's own words. (The database allows admins to delete,
// see supabase/reviews.sql.)
export default function AdminReviews() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    let ignore = false;
    fetchReviewsForAdmin()
      .then((data) => {
        if (ignore) return;
        setRows(data);
        setStatus("success");
      })
      .catch((error) => {
        console.error("Could not load reviews:", error);
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

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete the review by ${review.author} of “${review.flowerName}”? This cannot be undone.`)) return;
    setMessage(null);
    try {
      await deleteReview(review.id, review.photos); // its photo files are deleted too
      setRows((current) => current.filter((r) => r.id !== review.id));
      setMessage({ type: "success", text: `The review by ${review.author} was deleted.` });
    } catch (error) {
      console.error("Could not delete review:", error);
      setMessage({ type: "error", text: error?.message || "Could not delete the review." });
    }
  };

  const query = search.trim().toLowerCase();
  const visible = rows.filter(
    (r) =>
      !query ||
      r.flowerName.toLowerCase().includes(query) ||
      r.author.toLowerCase().includes(query) ||
      r.text.toLowerCase().includes(query),
  );

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <label className="admin-search">
          <SearchIcon className="admin-search__icon" />
          <span className="visually-hidden">Search reviews</span>
          <input
            type="search"
            placeholder="Search by flower, name or text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {message && (
        <p className={`admin-message admin-message--${message.type}`} role={message.type === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      {status === "loading" && <p className="admin-empty">Loading reviews…</p>}

      {status === "error" && (
        <div className="product-message" role="alert">
          <p>Could not load reviews. Has supabase/reviews.sql been run?</p>
          <button className="btn btn--ink" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {status === "success" && (
        <>
          <p className="admin-count">
            {visible.length} of {rows.length} reviews
          </p>
          {visible.length === 0 ? (
            <p className="admin-empty">No reviews found.</p>
          ) : (
            <ul className="admin-reviews">
              {visible.map((review) => (
                <li key={review.id} className="admin-review">
                  <div className="admin-review__top">
                    <span className="admin-review__stars" role="img" aria-label={`${review.mark} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} className={n <= review.mark ? "is-filled" : undefined} />
                      ))}
                    </span>
                    <Link to={`/shop/${review.productId}`} className="admin-review__flower">
                      {review.flowerName}
                      {review.flowerColor && ` (${review.flowerColor})`}
                    </Link>
                  </div>
                  <p className="admin-review__meta">
                    {review.author} · {formatDate(review.createdAt)}
                    {review.edited && " · edited"}
                  </p>
                  <p className="admin-review__text">{review.text}</p>
                  {review.photos.length > 0 && (
                    <div className="admin-review__photos">
                      {review.photos.map((photo, i) => (
                        <a key={photo.path} href={photo.url} target="_blank" rel="noreferrer" aria-label={`Open photo ${i + 1} in a new tab`}>
                          <img src={photo.url} alt="" loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}
                  <button className="admin-action admin-action--danger admin-review__delete" onClick={() => handleDelete(review)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
