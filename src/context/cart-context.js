import { createContext } from "react";

// Shared basket state: { lines, count, status, error, add, setQuantity, remove, clear, checkout, dismissError }.
// Filled in by CartProvider.
export const CartContext = createContext(null);
