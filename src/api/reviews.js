import { supabase } from "../lib/supabase.js";

// Reviews of flowers (see supabase/reviews.sql). Everyone can read them;
// writing goes through save_review() in the database, which checks who may review.

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured");
}

const COLUMNS = "id, user_id, product_id, mark, review_text, author_name, photos, created_at, updated_at";

// Photo files are in Supabase Storage (see supabase/review-photos.sql); the review keeps their paths.
const PHOTO_BUCKET = "review-photos";
const photoUrl = (path) => supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;

function toReview(row) {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    mark: row.mark,
    text: row.review_text,
    author: row.author_name,
    createdAt: row.created_at,
    edited: row.updated_at !== row.created_at,
    // [{ path, url }]: `path` is what the database keeps, `url` is for <img>
    photos: (row.photos ?? []).map((path) => ({ path, url: photoUrl(path) })),
  };
}

// All reviews of a flower: `productIds` = the ids of all its colours (or just its own id). Newest first.
export async function fetchReviews(productIds) {
  requireSupabase();
  const { data, error } = await supabase
    .from("Reviews")
    .select(COLUMNS)
    .in("product_id", productIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toReview);
}

// Whether the signed-in customer has a delivered order with this flower (any colour).
export async function checkCanReview(productId) {
  requireSupabase();
  const { data, error } = await supabase.rpc("can_review", { p_flower_id: productId });
  if (error) throw error;
  return data === true;
}

// Writes the customer's review, or changes it if they already wrote one. Returns its id.
// `photoPaths` = all photos the review should have (already uploaded with uploadReviewPhoto).
export async function saveReview(productId, mark, text, photoPaths = []) {
  requireSupabase();
  const { data, error } = await supabase.rpc("save_review", {
    p_flower_id: productId,
    p_mark: mark,
    p_text: text,
    p_photos: photoPaths,
  });
  if (error) throw error;
  return data;
}

// Uploads one (already shrunk) photo into the customer's own folder and returns its path.
// A random name, so two photos never overwrite each other.
export async function uploadReviewPhoto(userId, blob) {
  requireSupabase();
  const ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

// Removes photo files that no review uses any more. Failing here is not shown to anyone:
// the review itself is already fine, the file just stays in Storage unused.
export async function deleteReviewPhotos(paths) {
  if (!supabase || paths.length === 0) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("Could not delete review photos:", error);
}

// Customers can delete their own review, admins any review. Its photo files are removed too.
// With RLS a blocked delete returns no error, just no rows, so we ask for the row back.
export async function deleteReview(id, photos = []) {
  requireSupabase();
  const { data, error } = await supabase.from("Reviews").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Not allowed, or the review no longer exists.");
  await deleteReviewPhotos(photos.map((p) => p.path));
}

// For the admin panel: every review with the flower's name and colour, newest first.
export async function fetchReviewsForAdmin() {
  requireSupabase();
  const { data, error } = await supabase
    .from("Reviews")
    .select(`${COLUMNS}, Flowers(name, color)`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    ...toReview(row),
    flowerName: row.Flowers?.name ?? "Deleted flower",
    flowerColor: row.Flowers?.color ?? null,
  }));
}
