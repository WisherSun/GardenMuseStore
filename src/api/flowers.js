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
    // Main photo first, then the extra ones that are filled in (empty ones are skipped).
    images: [row.image, row.image2, row.image3, row.image4].filter(Boolean),
    details: row.details ?? "",
    price,
    salePrice: onSale ? Number(row.newPrice) : null,
  };
}

// Loads one flower for its own page. Returns null if there is no flower with this id.
export async function fetchFlowerById(id) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.from("Flowers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
}

export async function fetchFlowers({ limit } = {}) {
  if (!supabase) throw new Error("Supabase is not configured");

  let query = supabase.from("Flowers").select("*").order("id");
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toProduct);
}

// Loads only the given flowers (used by the basket page).
export async function fetchFlowersByIds(ids) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (ids.length === 0) return [];

  const { data, error } = await supabase.from("Flowers").select("*").in("id", ids);
  if (error) throw error;
  return data.map(toProduct);
}
