import { supabase } from "../lib/supabase.js";

// Reviews of flowers (see supabase/reviews.sql). Everyone can read them;
// writing goes through save_review() in the database, which checks who may review.

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured");
}

const COLUMNS = "id, user_id, product_id, mark, review_text, author_name, created_at, updated_at";

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
export async function saveReview(productId, mark, text) {
  requireSupabase();
  const { data, error } = await supabase.rpc("save_review", {
    p_flower_id: productId,
    p_mark: mark,
    p_text: text,
  });
  if (error) throw error;
  return data;
}

// Customers can delete their own review, admins any review.
// With RLS a blocked delete returns no error, just no rows, so we ask for the row back.
export async function deleteReview(id) {
  requireSupabase();
  const { data, error } = await supabase.from("Reviews").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Not allowed, or the review no longer exists.");
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
