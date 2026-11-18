import { supabase } from "../lib/supabase.js";

// Turns the signed-in user's basket into an order with the shipping address
// (see supabase/orders-shipping-address.sql). Everything happens in the database in one step;
// returns the new order id. `flat` and `phone` may be empty.
// The delivery date and time slot are optional (see supabase/orders-delivery-time.sql).
export async function placeOrder({ fullName, city, street, building, flat, phone, deliveryDate, deliverySlot }) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("place_order", {
    p_full_name: fullName,
    p_city: city,
    p_street: street,
    p_building: building,
    p_flat: flat || null,
    p_phone: phone || null,
    p_delivery_date: deliveryDate || null,
    p_delivery_slot: deliverySlot || null,
  });
  if (error) throw error;
  return data;
}

// "Buy now": orders one flower straight away, the basket is left as it is
// (see supabase/buy-now.sql). The price is taken from the database. Returns the new order id.
export async function placeSingleOrder(
  flowerId,
  quantity,
  { fullName, city, street, building, flat, phone, deliveryDate, deliverySlot },
) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("place_single_order", {
    p_flower_id: flowerId,
    p_quantity: quantity,
    p_full_name: fullName,
    p_city: city,
    p_street: street,
    p_building: building,
    p_flat: flat || null,
    p_phone: phone || null,
    p_delivery_date: deliveryDate || null,
    p_delivery_slot: deliverySlot || null,
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
    .select("id, created_at, status, address, delivery_date, delivery_slot")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (orders.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, flower_id, name, quantity, unit_price")
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
