import { useContext } from "react";
import { CartContext } from "../context/cart-context.js";

// Use in any component: const { lines, count, add, setQuantity, remove } = useCart();
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
