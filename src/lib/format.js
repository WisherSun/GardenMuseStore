// Always with cents: $45 becomes "$45.00", $45.5 becomes "$45.50", $1250 becomes "$1,250.00"
export function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
