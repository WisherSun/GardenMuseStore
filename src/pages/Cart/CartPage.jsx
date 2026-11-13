import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useCart } from "../../hooks/useCart.js";
import { fetchFlowersByIds } from "../../api/flowers.js";
import { formatPrice } from "../../lib/format.js";
import { BagIcon, CheckCircleIcon, CloseIcon } from "../../components/Icons.jsx";
import { TextField } from "../Auth/AuthFields.jsx";
import authStyles from "../Auth/Auth.module.css";
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

// Same rule as in the database: digits, spaces, ( ) - and an optional + at the start
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

function validateDelivery({ phone, address }) {
  const errors = {};
  if (!PHONE_PATTERN.test(phone.trim())) errors.phone = "Enter a phone number, e.g. +1 555 123 4567.";
  const length = address.trim().length;
  if (length < 5) errors.address = "Enter the full delivery address.";
  else if (length > 300) errors.address = "The address is too long (300 characters max).";
  return errors;
}

// Turns the database error into something a customer can read.
function orderErrorMessage(err) {
  const message = err?.message ?? "";
  if (message.includes("basket is empty")) return "Your basket is empty.";
  if (message.includes("sign in")) return "Please sign in to place an order.";
  if (message.includes("phone number")) return "Please enter a valid phone number.";
  if (message.includes("delivery address")) return "Please enter the delivery address.";
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
  const [delivery, setDelivery] = useState({ phone: "", address: "" });
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
      setPlacedOrderId(
        await checkout({ phone: delivery.phone.trim(), address: delivery.address.trim() }),
      );
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
                  <h3 className="checkout-form__title">Delivery details</h3>
                  <TextField
                    label="Phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 123 4567"
                    value={delivery.phone}
                    onChange={changeDelivery("phone")}
                    error={deliveryErrors.phone}
                  />
                  <div className={authStyles.field}>
                    <label htmlFor="delivery-address" className={authStyles.label}>
                      Delivery address
                    </label>
                    <textarea
                      id="delivery-address"
                      className={`${authStyles.input} checkout-form__address`}
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Street, house, apartment, city"
                      value={delivery.address}
                      onChange={changeDelivery("address")}
                      aria-invalid={Boolean(deliveryErrors.address)}
                      aria-describedby={deliveryErrors.address ? "delivery-address-error" : undefined}
                    />
                    {deliveryErrors.address && (
                      <p id="delivery-address-error" className={authStyles.fieldError}>
                        {deliveryErrors.address}
                      </p>
                    )}
                  </div>

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
