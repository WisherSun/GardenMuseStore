import { supabase } from "../lib/supabase.js";

// The "cart" table has one row per (user, flower) with a quantity.
// In the app a cart line looks like { flowerId, quantity }.

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured");
}

export async function fetchCartLines(userId) {
  requireSupabase();
  const { data, error } = await supabase
    .from("cart")
    .select("flower_id, quantity")
    .eq("user_id", userId)
    .order("id");
  if (error) throw error;
  return data.map((row) => ({ flowerId: row.flower_id, quantity: row.quantity }));
}

// Inserts new lines or overwrites the quantity of existing ones.
export async function saveCartLines(userId, lines) {
  if (lines.length === 0) return;
  requireSupabase();
  const rows = lines.map((line) => ({
    user_id: userId,
    flower_id: line.flowerId,
    quantity: line.quantity,
  }));
  const { error } = await supabase.from("cart").upsert(rows, { onConflict: "user_id,flower_id" });
  if (error) throw error;
}

export async function deleteCartLine(userId, flowerId) {
  requireSupabase();
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("user_id", userId)
    .eq("flower_id", flowerId);
  if (error) throw error;
}

export async function clearCartLines(userId) {
  requireSupabase();
  const { error } = await supabase.from("cart").delete().eq("user_id", userId);
  if (error) throw error;
}
