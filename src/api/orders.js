import { supabase } from "../lib/supabase.js";

// Turns the signed-in user's basket into an order (see supabase/orders-setup.sql).
// Everything happens in the database in one step; returns the new order id.
export async function placeOrder() {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("place_order");
  if (error) throw error;
  return data;
}
