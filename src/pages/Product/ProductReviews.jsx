import { useCallback, useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { checkCanReview, deleteReview, fetchReviews, saveReview } from "../../api/reviews.js";
import { StarIcon } from "../../components/Icons.jsx";
import "./Reviews.css";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Five stars, the first `mark` of them filled. Read out as "4 out of 5 stars".
function Stars({ mark, className = "" }) {
  const filled = Math.round(mark);
  return (
    <span className={`stars ${className}`} role="img" aria-label={`${mark} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={n <= filled ? "stars__star is-filled" : "stars__star"} />
      ))}
    </span>
  );
}

// The database messages are already written for customers; anything else gets a general one.
function reviewErrorMessage(error) {
  const message = error?.message ?? "";
  if (/sign in|rating|characters|delivered/i.test(message)) return message;
  return "We couldn’t save your review. Please try again.";
}

// Loads the reviews of all colours of this flower. reload() fetches them again.
function useReviews(idsKey) {
  const [state, setState] = useState({ status: "loading", reviews: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchReviews(idsKey.split(",").map(Number))
      .then((reviews) => {
        if (!ignore) setState({ status: "success", reviews });
      })
      .catch((error) => {
        console.error("Could not load reviews:", error);
        if (!ignore) setState({ status: "error", reviews: [] });
      });
    return () => {
      ignore = true;
    };
  }, [idsKey, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}

// Whether the signed-in customer may review this flower (the database decides).
// null while checking; always false for guests.
function useCanReview(productId, userId) {
  const [result, setResult] = useState({ key: null, can: false });
  const key = userId ? `${userId}:${productId}` : null;

  useEffect(() => {
    if (!key) return;
    let ignore = false;
    checkCanReview(productId)
      .then((can) => {
        if (!ignore) setResult({ key, can });
      })
      .catch((error) => {
        console.error("Could not check if you can review:", error);
        if (!ignore) setResult({ key, can: false });
      });
    return () => {
      ignore = true;
    };
  }, [key, productId]);

  if (!key) return false;
  return result.key === key ? result.can : null;
}

// Star picker made of real radio buttons, so it works with the keyboard and screen readers.
function StarPicker({ value, onChange, error }) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset className="review-form__stars">
      <legend className="review-form__label">Your rating</legend>
      <div className="star-picker" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="star-picker__option" onMouseEnter={() => setHover(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="visually-hidden"
            />
            <StarIcon className={n <= shown ? "star-picker__star is-filled" : "star-picker__star"} />
            <span className="visually-hidden">
              {n} {n === 1 ? "star" : "stars"}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="review-form__error">{error}</p>}
    </fieldset>
  );
}

function ReviewForm({ productId, existing, onCancel, onSaved, onDeleted }) {
  const textId = useId();
  const [mark, setMark] = useState(existing?.mark ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!mark) found.mark = "Please choose 1 to 5 stars.";
    const length = text.trim().length;
    if (length < MIN_LENGTH) found.text = `Please write at least ${MIN_LENGTH} characters.`;
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setSaveError(null);
    try {
      await saveReview(productId, mark, text.trim());
      onSaved();
    } catch (error) {
      console.error("Could not save review:", error);
      setSaveError(reviewErrorMessage(error));
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setBusy(true);
    setSaveError(null);
    try {
      await deleteReview(existing.id);
      onDeleted();
    } catch (error) {
      console.error("Could not delete review:", error);
      setSaveError("We couldn’t delete your review. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <h3 className="review-form__title">{existing ? "Edit your review" : "Write a review"}</h3>

      {saveError && (
        <p className="review-form__alert" role="alert">
          {saveError}
        </p>
      )}

      <StarPicker
        value={mark}
        onChange={(n) => {
          setMark(n);
          setErrors((errs) => ({ ...errs, mark: undefined }));
        }}
        error={errors.mark}
      />

      <div>
        <label htmlFor={textId} className="review-form__label">
          Your review
        </label>
        <textarea
          id={textId}
          className="review-form__text"
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder="How did the flowers look when they arrived? How long did they last?"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setErrors((errs) => ({ ...errs, text: undefined }));
          }}
          aria-invalid={Boolean(errors.text)}
        />
        <div className="review-form__meta">
          {errors.text ? <p className="review-form__error">{errors.text}</p> : <span />}
          <span className="review-form__count">
            {text.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="review-form__actions">
        {existing && (
          <button type="button" className="review-form__delete" onClick={handleDelete} disabled={busy}>
            Delete review
          </button>
        )}
        <button type="button" className="btn btn--light" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--ink" disabled={busy}>
          {busy ? "Saving…" : existing ? "Save changes" : "Post review"}
        </button>
      </div>
    </form>
  );
}

// Reviews section under the flower. All colours of a flower share one set of reviews;
// each review says which colour the customer received.
export default function ProductReviews({ flower }) {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const colors = flower.colors?.length ? flower.colors : null;
  const idsKey = colors ? colors.map((c) => c.id).join(",") : String(flower.id);
  const { status, reviews, reload } = useReviews(idsKey);
  const canReview = useCanReview(flower.id, user?.id ?? null);
  const [editing, setEditing] = useState(false);

  const mine = user ? reviews.find((r) => r.userId === user.id) : null;
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.mark, 0) / count : 0;
  const colorOf = (productId) => colors?.find((c) => c.id === productId)?.color ?? null;

  const done = () => {
    setEditing(false);
    reload();
  };

  let action = null;
  if (!authLoading && !editing) {
    if (!user) {
      action = (
        <p className="reviews__note">
          Bought this flower?{" "}
          <Link to="/login" state={{ from: pathname }} className="reviews__link">
            Sign in to write a review
          </Link>
        </p>
      );
    } else if (mine) {
      action = (
        <button className="btn btn--light" onClick={() => setEditing(true)}>
          Edit your review
        </button>
      );
    } else if (canReview) {
      action = (
        <button className="btn btn--ink" onClick={() => setEditing(true)}>
          Write a review
        </button>
      );
    } else if (canReview === false) {
      action = (
        <p className="reviews__note">You can review this flower once your order of it has been delivered.</p>
      );
    }
  }

  return (
    <section className="reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="reviews__head">
        <div>
          <h2 id="reviews-title" className="reviews__title">
            Reviews
          </h2>
          {count > 0 && (
            <p className="reviews__summary">
              <Stars mark={Math.round(average * 10) / 10} />
              <strong>{average.toFixed(1)}</strong> out of 5 · {count} {count === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>
        {action}
      </div>

      {editing && (
        <ReviewForm
          productId={flower.id}
          existing={mine}
          onCancel={() => setEditing(false)}
          onSaved={done}
          onDeleted={done}
        />
      )}

      {status === "loading" && <p className="reviews__empty">Loading reviews…</p>}

      {status === "error" && (
        <p className="reviews__empty" role="alert">
          We couldn’t load the reviews.{" "}
          <button className="reviews__link" onClick={reload}>
            Try again
          </button>
        </p>
      )}

      {status === "success" && count === 0 && (
        <p className="reviews__empty">No reviews yet.</p>
      )}

      {count > 0 && (
        <ul className="reviews__list">
          {reviews.map((review) => {
            const color = colorOf(review.productId);
            return (
              <li key={review.id} className="review">
                <div className="review__top">
                  <Stars mark={review.mark} className="review__stars" />
                  <span className="review__author">
                    {review.author}
                    {review.userId === user?.id && <span className="review__you">You</span>}
                  </span>
                </div>
                <p className="review__meta">
                  {formatDate(review.createdAt)}
                  {review.edited && " · edited"}
                  {color && ` · Colour: ${color}`}
                </p>
                <p className="review__text">{review.text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
