import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { clearCartLines, deleteCartLine, fetchCartLines, saveCartLines } from "../api/cart.js";
import { placeOrder } from "../api/orders.js";
import { CartContext } from "./cart-context.js";

// Where a guest's basket is kept until they sign in.
const GUEST_CART_KEY = "garden-muse-guest-cart";
const MAX_QUANTITY = 99;

function readGuestCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_CART_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (line) => Number.isInteger(line?.flowerId) && Number.isInteger(line?.quantity) && line.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeGuestCart(lines) {
  try {
    if (lines.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
    else localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Storage can be blocked (private mode); the basket still works for this visit.
  }
}

// Loads a signed-in user's basket. Anything the user added as a guest is moved
// into their saved basket (quantities are added together) and removed from the browser.
async function loadUserCart(userId) {
  const guestLines = readGuestCart();
  const saved = await fetchCartLines(userId);
  if (guestLines.length === 0) return saved;

  const merged = new Map(saved.map((line) => [line.flowerId, line.quantity]));
  for (const { flowerId, quantity } of guestLines) {
    merged.set(flowerId, Math.min((merged.get(flowerId) ?? 0) + quantity, MAX_QUANTITY));
  }
  const changed = guestLines.map(({ flowerId }) => ({ flowerId, quantity: merged.get(flowerId) }));
  await saveCartLines(userId, changed);
  writeGuestCart([]);

  return [...merged].map(([flowerId, quantity]) => ({ flowerId, quantity }));
}

// Keeps the basket for the whole app.
// Guests: saved in this browser. Signed-in users: saved in the Supabase "cart" table.
export default function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [lines, setLines] = useState(readGuestCart);
  const [loadedFor, setLoadedFor] = useState(null); // user id whose saved basket is shown
  const [error, setError] = useState(null);

  // Latest lines, so quick repeated clicks build on each other instead of on a stale render.
  const linesRef = useRef(lines);
  // The basket request in progress, so React's double effect run in dev doesn't merge twice.
  const loadingRef = useRef(null);
  // Basket saves still on their way to the database (checkout waits for them).
  const pendingRef = useRef(new Set());

  const track = useCallback((request) => {
    pendingRef.current.add(request);
    request.finally(() => pendingRef.current.delete(request)).catch(() => {});
    return request;
  }, []);

  const show = useCallback((next) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  // When the user signs in or out, switch to their saved basket or back to the guest basket.
  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      loadingRef.current = null;
      // after sign-out: show the (empty) guest basket; done in a microtask, not during the effect
      Promise.resolve().then(() => {
        show(readGuestCart());
        setLoadedFor(null);
      });
      return;
    }

    if (loadingRef.current?.userId !== userId) {
      loadingRef.current = { userId, promise: loadUserCart(userId) };
    }

    let ignore = false;
    loadingRef.current.promise
      .then((saved) => {
        if (ignore) return;
        show(saved);
        setLoadedFor(userId);
        setError(null);
      })
      .catch((err) => {
        console.error("Could not load the basket:", err);
        if (ignore) return;
        loadingRef.current = null; // allow another try on the next sign-in
        setLoadedFor(userId);
        setError("We couldn’t load your saved basket. Please refresh the page.");
      });

    return () => {
      ignore = true;
    };
  }, [userId, authLoading, show]);

  const setQuantity = useCallback(
    (flowerId, quantity) => {
      const qty = Math.max(0, Math.min(Math.floor(quantity), MAX_QUANTITY));
      const current = linesRef.current;
      const exists = current.some((line) => line.flowerId === flowerId);

      let next;
      if (qty === 0) next = current.filter((line) => line.flowerId !== flowerId);
      else if (exists) next = current.map((line) => (line.flowerId === flowerId ? { ...line, quantity: qty } : line));
      else next = [...current, { flowerId, quantity: qty }];

      show(next);

      if (!userId) {
        writeGuestCart(next);
        return;
      }

      const request = track(
        qty === 0 ? deleteCartLine(userId, flowerId) : saveCartLines(userId, [{ flowerId, quantity: qty }]),
      );
      request.catch((err) => {
        console.error("Could not save the basket:", err);
        setError("We couldn’t save your basket. Please try again.");
        // Show what is really saved so the page doesn't lie.
        fetchCartLines(userId).then(show).catch(() => {});
      });
    },
    [userId, show, track],
  );

  const add = useCallback(
    (flowerId, amount = 1) => {
      const line = linesRef.current.find((l) => l.flowerId === flowerId);
      setQuantity(flowerId, (line?.quantity ?? 0) + amount);
    },
    [setQuantity],
  );

  const remove = useCallback((flowerId) => setQuantity(flowerId, 0), [setQuantity]);

  const clear = useCallback(() => {
    show([]);
    if (!userId) {
      writeGuestCart([]);
      return;
    }
    track(clearCartLines(userId)).catch((err) => {
      console.error("Could not clear the basket:", err);
      setError("We couldn’t clear your basket. Please try again.");
      fetchCartLines(userId).then(show).catch(() => {});
    });
  }, [userId, show, track]);

  // Turns the saved basket into an order. `delivery` = { phone, address }.
  // Returns the new order id; throws if it fails (the basket is then left as it was).
  const checkout = useCallback(async (delivery) => {
    if (!userId) throw new Error("Please sign in to place an order");
    await Promise.allSettled([...pendingRef.current]);
    const orderId = await placeOrder(delivery);
    show([]); // the database emptied the basket
    return orderId;
  }, [userId, show]);

  // "loading" while a signed-in user's saved basket is on its way
  const status = authLoading || (userId && loadedFor !== userId) ? "loading" : "ready";

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      status,
      error,
      isGuest: !userId,
      add,
      setQuantity,
      remove,
      clear,
      checkout,
      dismissError: () => setError(null),
    }),
    [lines, status, error, userId, add, setQuantity, remove, clear, checkout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
