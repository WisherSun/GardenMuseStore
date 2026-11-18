import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import {
  checkCanReview,
  deleteReview,
  deleteReviewPhotos,
  saveReview,
  uploadReviewPhoto,
} from "../../api/reviews.js";
import { CloseIcon, PlusIcon, StarIcon } from "../../components/Icons.jsx";
import Stars from "../../components/Stars.jsx";
import { shrinkImage } from "../../lib/shrinkImage.js";
import ImageViewer from "./ImageViewer.jsx";
import "./Reviews.css";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;
const MAX_PHOTOS = 3; // same limit as in supabase/review-photos.sql
const MAX_PICKED_SIZE = 25 * 1024 * 1024; // 25 MB: bigger files are refused before shrinking

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// The database messages are already written for customers; anything else gets a general one.
function reviewErrorMessage(error) {
  const message = error?.message ?? "";
  if (/sign in|rating|characters|delivered|photo/i.test(message)) return message;
  return "We couldn’t save your review. Please try again.";
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

// Up to 3 photos: the ones already saved with the review and new ones picked now.
// New photos are made smaller straight away (shrinkImage) and only uploaded on "Post review".
// Each photo: { key, url, path } (saved) or { key, url, blob } (new, `url` = a local preview).
function PhotoPicker({ photos, onChange, onWorking }) {
  const inputId = useId();
  const [note, setNote] = useState(null);

  const handlePick = async (e) => {
    const files = [...e.target.files];
    e.target.value = ""; // so picking the same file again works
    const free = MAX_PHOTOS - photos.length;
    if (files.length === 0 || free <= 0) return;

    setNote(
      files.length > free
        ? `You can add up to ${MAX_PHOTOS} photos, so only the first ${free} ${free === 1 ? "was" : "were"} added.`
        : null,
    );
    onWorking(true);
    const added = [];
    for (const file of files.slice(0, free)) {
      if (!file.type.startsWith("image/") || file.size > MAX_PICKED_SIZE) {
        setNote(`“${file.name}” can’t be used. Please choose a JPG, PNG or WebP picture under 25 MB.`);
        continue;
      }
      try {
        const blob = await shrinkImage(file);
        added.push({ key: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) });
      } catch (error) {
        console.error("Could not read the photo:", error);
        setNote(`We couldn’t read “${file.name}”. Please choose a JPG, PNG or WebP picture.`);
      }
    }
    onWorking(false);
    if (added.length) onChange((current) => [...current, ...added].slice(0, MAX_PHOTOS));
  };

  const remove = (photo) => {
    setNote(null);
    if (photo.blob) URL.revokeObjectURL(photo.url);
    onChange((current) => current.filter((p) => p.key !== photo.key));
  };

  return (
    <div>
      <p className="review-form__label" id={`${inputId}-label`}>
        Photos <span className="review-form__optional">(optional)</span>
      </p>
      <ul className="photo-picker" aria-labelledby={`${inputId}-label`}>
        {photos.map((photo, i) => (
          <li key={photo.key} className="photo-picker__item">
            <img src={photo.url} alt={`Your photo ${i + 1}`} />
            <button
              type="button"
              className="photo-picker__remove"
              onClick={() => remove(photo)}
              aria-label={`Remove photo ${i + 1}`}
            >
              <CloseIcon />
            </button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS && (
          <li>
            <label htmlFor={inputId} className="photo-picker__add">
              <PlusIcon className="photo-picker__add-icon" />
              Add photo
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="visually-hidden"
              onChange={handlePick}
            />
          </li>
        )}
      </ul>
      <p className="review-form__hint">Up to {MAX_PHOTOS} photos of the flowers you received.</p>
      {note && (
        <p className="review-form__error" role="alert">
          {note}
        </p>
      )}
    </div>
  );
}

function ReviewForm({ productId, userId, existing, onCancel, onSaved, onDeleted }) {
  const textId = useId();
  const [mark, setMark] = useState(existing?.mark ?? 0);
  const [text, setText] = useState(existing?.text ?? "");
  const [photos, setPhotos] = useState(() =>
    (existing?.photos ?? []).map((p) => ({ key: p.path, path: p.path, url: p.url })),
  );
  const [preparing, setPreparing] = useState(false); // new photos are being made smaller
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Local previews take memory until they are released; release them when the form closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      for (const photo of photosRef.current) if (photo.blob) URL.revokeObjectURL(photo.url);
    },
    [],
  );

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
    const uploaded = []; // new files; deleted again if saving fails
    let uploading = true;
    try {
      // 1. Upload the new photos
      const paths = [];
      for (const photo of photos) {
        if (photo.path) {
          paths.push(photo.path);
        } else {
          const path = await uploadReviewPhoto(userId, photo.blob);
          uploaded.push(path);
          paths.push(path);
        }
      }
      uploading = false;
      // 2. Save the review together with all its photo paths (one step in the database)
      await saveReview(productId, mark, text.trim(), paths);
      // 3. Photos the customer took out of the review: delete their files
      const removed = (existing?.photos ?? []).map((p) => p.path).filter((path) => !paths.includes(path));
      await deleteReviewPhotos(removed);
      onSaved();
    } catch (error) {
      console.error("Could not save review:", error);
      await deleteReviewPhotos(uploaded);
      setSaveError(
        uploading
          ? "We couldn’t upload your photos. Please try again, or remove them and post without photos."
          : reviewErrorMessage(error),
      );
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setBusy(true);
    setSaveError(null);
    try {
      await deleteReview(existing.id, existing.photos);
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

      <PhotoPicker photos={photos} onChange={setPhotos} onWorking={setPreparing} />

      <div className="review-form__actions">
        {existing && (
          <button type="button" className="review-form__delete" onClick={handleDelete} disabled={busy}>
            Delete review
          </button>
        )}
        <button type="button" className="btn btn--light" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn--ink" disabled={busy || preparing}>
          {busy ? "Saving…" : preparing ? "Preparing photos…" : existing ? "Save changes" : "Post review"}
        </button>
      </div>
    </form>
  );
}

// Reviews section under the flower. All colours of a flower share one set of reviews;
// each review says which colour the customer received.
// The reviews come from useReviews() in ProductPage (shared with the rating next to the name).
export default function ProductReviews({ flower, status, reviews, count, average, reload }) {
  const { user, loading: authLoading } = useAuth();
  const { pathname } = useLocation();
  const colors = flower.colors?.length ? flower.colors : null;
  const canReview = useCanReview(flower.id, user?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [viewer, setViewer] = useState(null); // { review, index } while a photo is open full screen

  const mine = user ? reviews.find((r) => r.userId === user.id) : null;
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
              <Stars mark={average} />
              <strong>{average.toFixed(1)}</strong> out of 5 · {count} {count === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>
        {action}
      </div>

      {editing && (
        <ReviewForm
          productId={flower.id}
          userId={user?.id}
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
                {review.photos.length > 0 && (
                  <ul className="review__photos" aria-label={`Photos from ${review.author}`}>
                    {review.photos.map((photo, i) => (
                      <li key={photo.path}>
                        <button
                          type="button"
                          className="review__photo"
                          onClick={() => setViewer({ review, index: i })}
                          aria-label={`Open photo ${i + 1} of ${review.photos.length} from ${review.author}`}
                        >
                          <img src={photo.url} alt="" loading="lazy" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {viewer && (
        <ImageViewer
          images={viewer.review.photos.map((p) => p.url)}
          name={`Photo from ${viewer.review.author}`}
          startIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
