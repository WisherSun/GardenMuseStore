import { supabase } from "../lib/supabase.js";

// Turns the signed-in user's basket into an order with delivery details
// (see supabase/orders-delivery.sql). Everything happens in the database in one step;
// returns the new order id.
export async function placeOrder({ phone, address }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("place_order", { p_phone: phone, p_address: address });
  if (error) throw error;
  return data;
}

// The signed-in customer's own orders, newest first, each with its items and total.
// Filtered by user_id on purpose: an admin may read every order, but here we only want theirs.
export async function fetchMyOrders(userId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, status, address")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (orders.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, name, quantity, unit_price")
    .in(
      "order_id",
      orders.map((o) => o.id),
    )
    .order("id");
  if (itemsError) throw itemsError;

  return orders.map((order) => {
    const own = items.filter((item) => item.order_id === order.id);
    return {
      ...order,
      items: own,
      total: own.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0),
    };
  });
}
