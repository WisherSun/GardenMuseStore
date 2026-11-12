import { supabase } from "../lib/supabase.js";

// Admin-only requests. The database checks is_admin() on every one of them
// (see supabase/admin-setup.sql), so these fail for anyone else.

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured");
}

export async function checkIsAdmin() {
  requireSupabase();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

// ---------- Products ----------

// Raw rows (with discount/newPrice as stored), for editing.
export async function fetchFlowersForAdmin() {
  requireSupabase();
  const { data, error } = await supabase.from("Flowers").select("*").order("id");
  if (error) throw error;
  return data;
}

// With RLS a blocked update/delete returns no error, just no rows,
// so we ask for the rows back and treat "none" as "not allowed".
function expectRow(data) {
  if (!data || data.length === 0) throw new Error("Not allowed, or the product no longer exists.");
  return data[0];
}

export async function createFlower(fields) {
  requireSupabase();
  const { data, error } = await supabase.from("Flowers").insert(fields).select();
  if (error) throw error;
  return expectRow(data);
}

export async function updateFlower(id, fields) {
  requireSupabase();
  const { data, error } = await supabase.from("Flowers").update(fields).eq("id", id).select();
  if (error) throw error;
  return expectRow(data);
}

export async function deleteFlower(id) {
  requireSupabase();
  const { data, error } = await supabase.from("Flowers").delete().eq("id", id).select("id");
  if (error) throw error;
  expectRow(data);
}

// ---------- Orders ----------

export const ORDER_STATUSES = ["new", "confirmed", "delivered", "cancelled"];

export async function fetchOrdersForAdmin() {
  requireSupabase();
  const { data, error } = await supabase.rpc("admin_list_orders");
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status) {
  requireSupabase();
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("id, status");
  if (error) throw error;
  return expectRow(data);
}
