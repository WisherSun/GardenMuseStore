import { supabase } from "../lib/supabase.js";

// ---------- Colours ----------
// A flower sold in several colours is several rows in "Flowers": one per colour, all with
// the same name and each with its own "color" (see supabase/flower-colors.sql).
// Rows with a colour are grouped by name; capital letters and extra spaces don't matter,
// so "Crimson Tulip" and "crimson  tulip " are the same flower.
// Rows without a colour are never grouped, even if two happen to share a name.
const normaliseName = (name) => (name ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const groupKey = (row) => (row.color ? `name:${normaliseName(row.name)}` : `id:${row.id}`);

// Turns a row from the "Flowers" table into the shape the components use.
function toProduct(row) {
  const price = Number(row.price);
  const onSale = Boolean(row.discount) && row.newPrice != null;

  return {
    id: row.id,
    name: row.name,
    color: row.color?.trim() || null,
    description: row.description ?? "",
    image: row.image,
    // Main photo first, then the extra ones that are filled in (empty ones are skipped).
    images: [row.image, row.image2, row.image3, row.image4].filter(Boolean),
    details: row.details ?? "",
    price,
    salePrice: onSale ? Number(row.newPrice) : null,
    // How many can still be ordered ("amount" column). 0 = sold out.
    stock: Math.max(0, Number(row.amount) || 0),
  };
}

// Loads one flower for its own page. Returns null if there is no flower with this id.
// A flower with a colour also gets `colors`: all its colours (itself included) in id order,
// each a full product, so the page can switch colour without waiting for the database.
export async function fetchFlowerById(id) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.from("Flowers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const product = toProduct(data);
  if (!product.color) return { ...product, colors: [] };

  // The other colours: rows that have a colour and the same name
  const { data: coloured, error: colorsError } = await supabase
    .from("Flowers")
    .select("*")
    .not("color", "is", null)
    .order("id");
  if (colorsError) throw colorsError;

  const key = groupKey(data);
  const colors = coloured.filter((row) => groupKey(row) === key).map(toProduct);
  return { ...product, colors };
}

// For the shop and home page: one card per flower. Of a flower in several colours only
// the first colour (lowest id) gets a card; the others are chosen on the flower page.
export async function fetchFlowers({ limit } = {}) {
  if (!supabase) throw new Error("Supabase is not configured");

  // All rows, not just `limit`: some of them are extra colours that get no card of their own
  const { data, error } = await supabase.from("Flowers").select("*").order("id");
  if (error) throw error;

  const seen = new Set();
  const cards = data.filter((row) => {
    const key = groupKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (limit ? cards.slice(0, limit) : cards).map(toProduct);
}

// Loads only the given flowers (used by the basket page).
export async function fetchFlowersByIds(ids) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (ids.length === 0) return [];

  const { data, error } = await supabase.from("Flowers").select("*").in("id", ids);
  if (error) throw error;
  return data.map(toProduct);
}
