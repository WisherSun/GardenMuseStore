import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCart } from "../../hooks/useCart.js";
import { fetchFlowersByIds } from "../../api/flowers.js";
import { formatPrice } from "../../lib/format.js";
import { BagIcon, CheckCircleIcon, CloseIcon } from "../../components/Icons.jsx";
import { TextField } from "../Auth/AuthFields.jsx";
import "./Cart.css";

const MAX_QUANTITY = 99;

// The price the customer actually pays (sale price if there is one)
const unitPrice = (product) => product.salePrice ?? product.price;

// Loads name/price/image for every flower in the basket.
// Already loaded flowers are kept, so changing a quantity or removing a line doesn't reload anything.
function useBasketProducts(lines, remove) {
  const [products, setProducts] = useState({}); // flower id -> product, or null if it is no longer sold
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const missingKey = lines
    .map((line) => line.flowerId)
    .filter((id) => !(id in products))
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (!missingKey) return;
    let ignore = false;
    const ids = missingKey.split(",").map(Number);

    fetchFlowersByIds(ids)
      .then((found) => {
        if (ignore) return;
        setProducts((prev) => {
          const next = { ...prev };
          for (const id of ids) next[id] = null;
          for (const product of found) next[product.id] = product;
          return next;
        });
        setFailed(false);
      })
      .catch((err) => {
        console.error("Could not load basket products:", err);
        if (!ignore) setFailed(true);
      });

    return () => {
      ignore = true;
    };
  }, [missingKey, attempt]);

  // Flowers that were deleted from the shop are taken out of the basket.
  useEffect(() => {
    for (const line of lines) {
      if (products[line.flowerId] === null) remove(line.flowerId);
    }
  }, [lines, products, remove]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  return { products, loading: Boolean(missingKey) && !failed, failed, retry };
}

function CartItem({ product, quantity, onChange, onRemove }) {
  const onSale = product.salePrice != null;

  return (
    <li className="cart-item">
      <img className="cart-item__image" src={product.image} alt="" />

      <div className="cart-item__info">
        <h3 className="cart-item__name">{product.name}</h3>
        <p className="cart-item__price">
          {onSale ? (
            <>
              <span className="cart-item__price--sale">{formatPrice(product.salePrice)}</span>{" "}
              <s className="cart-item__price--old">
                <span className="visually-hidden">was </span>
                {formatPrice(product.price)}
              </s>
            </>
          ) : (
            formatPrice(product.price)
          )}
        </p>

        <div className="cart-item__controls">
          <div className="stepper" role="group" aria-label={`Quantity of ${product.name}`}>
            <button
              className="stepper__btn"
              onClick={() => onChange(quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="stepper__value" aria-live="polite">
              {quantity}
            </span>
            <button
              className="stepper__btn"
              onClick={() => onChange(quantity + 1)}
              disabled={quantity >= MAX_QUANTITY}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button className="cart-item__remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <span className="cart-item__total">{formatPrice(unitPrice(product) * quantity)}</span>
    </li>
  );
}

function CartItemSkeleton() {
  return (
    <li className="cart-item" aria-hidden="true">
      <div className="cart-item__image skeleton" />
      <div className="cart-item__info">
        <div className="skeleton skeleton--line" style={{ width: "60%" }} />
        <div className="skeleton skeleton--line skeleton--thin" style={{ width: "30%" }} />
      </div>
    </li>
  );
}

// Same rules as in the database (supabase/orders-shipping-address.sql)
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

const EMPTY_DELIVERY = { fullName: "", city: "", street: "", building: "", flat: "", phone: "" };

function validateDelivery(d) {
  const errors = {};
  const length = (value) => value.trim().length;

  if (length(d.fullName) < 2) errors.fullName = "Enter the recipient’s name.";
  else if (length(d.fullName) > 100) errors.fullName = "The name is too long (100 characters max).";

  if (length(d.city) < 2) errors.city = "Enter the city.";
  else if (length(d.city) > 100) errors.city = "The city is too long (100 characters max).";

  if (length(d.street) < 2) errors.street = "Enter the street.";
  else if (length(d.street) > 150) errors.street = "The street is too long (150 characters max).";

  if (length(d.building) < 1) errors.building = "Enter the building number or name.";
  else if (length(d.building) > 50) errors.building = "Too long (50 characters max).";

  if (length(d.flat) > 20) errors.flat = "Too long (20 characters max).";

  // Phone is optional, but if it's filled in it must look like a phone number
  if (d.phone.trim() && !PHONE_PATTERN.test(d.phone.trim()))
    errors.phone = "Enter a phone number, e.g. +1 555 123 4567.";

  return errors;
}

// Turns the database error into something a customer can read.
function orderErrorMessage(err) {
  const message = err?.message ?? "";
  if (message.includes("basket is empty")) return "Your basket is empty.";
  if (message.includes("sign in")) return "Please sign in to place an order.";
  if (message.includes("phone number")) return "Please enter a valid phone number.";
  if (message.includes("recipient name")) return "Please enter the recipient’s name.";
  if (message.includes("city")) return "Please enter the city.";
  if (message.includes("street")) return "Please enter the street.";
  if (message.includes("building")) return "Please enter the building number or name.";
  if (message.includes("flat")) return "Please enter a shorter flat number.";
  return "We couldn’t place your order. Please try again.";
}

function OrderPlaced({ orderId }) {
  return (
    <div className="cart-empty order-placed" role="status">
      <span className="cart-empty__icon order-placed__icon">
        <CheckCircleIcon />
      </span>
      <h2 className="cart-empty__title">Thank you for your order!</h2>
      <p>
        Your order <strong>#{orderId}</strong> has been placed. We’ll be in touch about delivery.
      </p>
      <Link to="/shop" className="btn btn--ink">
        Continue shopping
      </Link>
    </div>
  );
}

export default function CartPage() {
  const { lines, status, error, isGuest, setQuantity, remove, clear, checkout, dismissError } = useCart();
  const { products, loading, failed, retry } = useBasketProducts(lines, remove);

  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [delivery, setDelivery] = useState(EMPTY_DELIVERY);
  const [deliveryErrors, setDeliveryErrors] = useState({});

  const changeDelivery = (field) => (e) => {
    setDelivery((d) => ({ ...d, [field]: e.target.value }));
    setDeliveryErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const errors = validateDelivery(delivery);
    setDeliveryErrors(errors);
    if (Object.keys(errors).length) return;

    setPlacing(true);
    setOrderError(null);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(delivery).map(([field, value]) => [field, value.trim()]),
      );
      setPlacedOrderId(await checkout(trimmed));
    } catch (err) {
      console.error("Could not place the order:", err);
      setOrderError(orderErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const items = lines
    .map((line) => ({ ...line, product: products[line.flowerId] }))
    .filter((item) => item.product);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + unitPrice(item.product) * item.quantity, 0);
  const savings = items.reduce(
    (sum, item) => sum + (item.product.price - unitPrice(item.product)) * item.quantity,
    0,
  );

  const showSkeleton = status === "loading" || (loading && items.length === 0);

  return (
    <section className="cart-page">
      <div className="container">
        <header className="cart-page__head">
          <span className="eyebrow">Your selection</span>
          <h1 className="cart-page__title">Basket</h1>
        </header>

        {error && (
          <div className="cart-alert" role="alert">
            <span>{error}</span>
            <button className="cart-alert__close" onClick={dismissError} aria-label="Dismiss">
              <CloseIcon />
            </button>
          </div>
        )}

        {placedOrderId ? (
          <OrderPlaced orderId={placedOrderId} />
        ) : showSkeleton ? (
          <ul className="cart-list" aria-busy="true" aria-label="Loading basket">
            {Array.from({ length: Math.max(lines.length, 2) }, (_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </ul>
        ) : lines.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty__icon">
              <BagIcon />
            </span>
            <h2 className="cart-empty__title">Your basket is empty</h2>
            <p>Find something beautiful in our collection.</p>
            <Link to="/shop" className="btn btn--ink">
              Browse the shop
            </Link>
          </div>
        ) : failed && items.length === 0 ? (
          <div className="product-message" role="alert">
            <p>We couldn’t load your basket right now.</p>
            <button className="btn btn--ink" onClick={retry}>
              Try again
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              <ul className="cart-list">
                {items.map((item) => (
                  <CartItem
                    key={item.flowerId}
                    product={item.product}
                    quantity={item.quantity}
                    onChange={(qty) => setQuantity(item.flowerId, qty)}
                    onRemove={() => remove(item.flowerId)}
                  />
                ))}
              </ul>
              <div className="cart-list__footer">
                <Link to="/shop" className="cart-link">
                  ← Continue shopping
                </Link>
                <button className="cart-link cart-link--muted" onClick={clear}>
                  Clear basket
                </button>
              </div>
            </div>

            <aside className="cart-summary" aria-label="Order summary">
              <h2 className="cart-summary__title">Order summary</h2>
              <dl className="cart-summary__rows">
                <div>
                  <dt>Items</dt>
                  <dd>{itemCount}</dd>
                </div>
                {savings > 0 && (
                  <div className="cart-summary__savings">
                    <dt>You save</dt>
                    <dd>−{formatPrice(savings)}</dd>
                  </div>
                )}
                <div className="cart-summary__total">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
              </dl>

              {isGuest ? (
                <>
                  <Link to="/login" state={{ from: "/cart" }} className="btn btn--rust btn--block">
                    Sign in to order
                  </Link>
                  <p className="cart-summary__note">
                    Your basket is kept and moves to your account when you sign in.
                  </p>
                </>
              ) : (
                <form className="checkout-form" onSubmit={handlePlaceOrder} noValidate>
                  <h3 className="checkout-form__title">Shipping address</h3>
                  <TextField
                    label="Name *"
                    autoComplete="shipping name"
                    placeholder="First and last name"
                    value={delivery.fullName}
                    onChange={changeDelivery("fullName")}
                    error={deliveryErrors.fullName}
                  />
                  <TextField
                    label="City *"
                    autoComplete="shipping address-level2"
                    placeholder="London"
                    value={delivery.city}
                    onChange={changeDelivery("city")}
                    error={deliveryErrors.city}
                  />
                  <TextField
                    label="Street *"
                    autoComplete="shipping address-line1"
                    placeholder="Baker Street"
                    value={delivery.street}
                    onChange={changeDelivery("street")}
                    error={deliveryErrors.street}
                  />
                  <TextField
                    label="Building *"
                    placeholder="221B or Rose Court"
                    maxLength={50}
                    value={delivery.building}
                    onChange={changeDelivery("building")}
                    error={deliveryErrors.building}
                  />
                  <TextField
                    label="Flat"
                    autoComplete="shipping address-line2"
                    placeholder="e.g. 4"
                    hint="Leave empty if it’s a house."
                    maxLength={20}
                    value={delivery.flat}
                    onChange={changeDelivery("flat")}
                    error={deliveryErrors.flat}
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    autoComplete="shipping tel"
                    placeholder="+44 20 7946 0000"
                    hint="Optional — the courier calls only if they can’t find you."
                    value={delivery.phone}
                    onChange={changeDelivery("phone")}
                    error={deliveryErrors.phone}
                  />

                  <button
                    type="submit"
                    className="btn btn--rust btn--block"
                    disabled={placing || loading}
                    aria-busy={placing}
                  >
                    {placing ? "Placing order…" : "Place order"}
                  </button>
                  {orderError && (
                    <p className="cart-summary__error" role="alert">
                      {orderError}
                    </p>
                  )}
                  <p className="cart-summary__note">Payment on delivery.</p>
                </form>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
