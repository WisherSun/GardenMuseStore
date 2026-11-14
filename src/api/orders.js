import { supabase } from "../lib/supabase.js";

// Turns the signed-in user's basket into an order with the shipping address
// (see supabase/orders-shipping-address.sql). Everything happens in the database in one step;
// returns the new order id. `flat` and `phone` may be empty.
export async function placeOrder({ fullName, city, street, building, flat, phone }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("place_order", {
    p_full_name: fullName,
    p_city: city,
    p_street: street,
    p_building: building,
    p_flat: flat || null,
    p_phone: phone || null,
  });
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
