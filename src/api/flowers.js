import { supabase } from "../lib/supabase.js";

// Turns a row from the "Flowers" table into the shape the components use.
function toProduct(row) {
  const price = Number(row.price);
  const onSale = Boolean(row.discount) && row.newPrice != null;

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    image: row.image,
    price,
    salePrice: onSale ? Number(row.newPrice) : null,
  };
}

export async function fetchFlowers({ limit } = {}) {
  if (!supabase) throw new Error("Supabase is not configured");

  let query = supabase.from("Flowers").select("*").order("id");
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toProduct);
}
