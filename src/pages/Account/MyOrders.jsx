import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchMyOrders } from "../../api/orders.js";
import { fetchFlowersByIds } from "../../api/flowers.js";
import { useCart } from "../../hooks/useCart.js";
import { CheckIcon } from "../../components/Icons.jsx";
import { formatPrice } from "../../lib/format.js";
import { formatDelivery } from "../../lib/delivery.js";
import "./MyOrders.css";

// Wording for customers (the admin panel says "New" instead of "Received")
const statusLabels = {
  new: "Received",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const MAX_QUANTITY = 99;

// "Buy again" under a flower in an old order: puts the same quantity into the basket again.
// `flower` = the flower as it is in the shop now: null if it was deleted,
// undefined if the shop's flowers couldn't be loaded (then the basket page checks the stock).
// Never adds more than is in stock; the database checks the stock again at checkout anyway.
function BuyAgain({ item, flower }) {
  const { add, lines } = useCart();
  const [added, setAdded] = useState(false);
  const inBasket =
    lines.find((line) => line.flowerId === item.flower_id)?.quantity ?? 0;

  if (!item.flower_id || flower === null) {
    return (
      <span className="buy-again buy-again--off">No longer available</span>
    );
  }
  if (flower && flower.stock === 0) {
    return <span className="buy-again buy-again--off">Sold out</span>;
  }

  if (added) {
    return (
      <span className="buy-again buy-again--done" role="status">
        <CheckIcon className="buy-again__icon" /> Added to basket ·{" "}
        <Link to="/cart" className="buy-again__link">
          View basket
        </Link>
      </span>
    );
  }

  const limit = Math.min(flower?.stock ?? MAX_QUANTITY, MAX_QUANTITY);
  const amount = Math.min(item.quantity, limit - inBasket);

  if (amount <= 0) {
    return (
      <Link to="/cart" className="buy-again buy-again__link">
        In your basket
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="buy-again buy-again__button"
      onClick={() => {
        add(item.flower_id, amount);
        setAdded(true);
      }}
      aria-label={`Buy ${item.name} again`}
    >
      Buy again
    </button>
  );
}

// "My orders" list on the Account page
export default function MyOrders({ userId }) {
  const [orders, setOrders] = useState([]);
  const [flowers, setFlowers] = useState(null); // flower id -> flower now in the shop; null = not loaded
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchMyOrders(userId)
      .then(async (data) => {
        // The ordered flowers as they are now (still sold? in stock?), for "Buy again".
        // If this fails, the orders are still shown.
        const ids = [
          ...new Set(
            data
              .flatMap((o) => o.items.map((i) => i.flower_id))
              .filter(Boolean),
          ),
        ];
        let byId = null;
        try {
          const found = await fetchFlowersByIds(ids);
          byId = Object.fromEntries(found.map((f) => [f.id, f]));
        } catch (err) {
          console.error("Could not load the ordered flowers:", err);
        }
        if (ignore) return;
        setOrders(data);
        setFlowers(byId);
        setStatus("success");
      })
      .catch((err) => {
        console.error("Could not load orders:", err);
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [userId, attempt]);

  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  return (
    <section className="my-orders" aria-labelledby="my-orders-title">
      <h2 id="my-orders-title" className="my-orders__title">
        My orders
      </h2>

      {status === "loading" && (
        <p className="my-orders__note">Loading your orders…</p>
      )}

      {status === "error" && (
        <p className="my-orders__note" role="alert">
          Could not load your orders.{" "}
          <button className="my-orders__retry" onClick={retry}>
            Try again
          </button>
        </p>
      )}

      {status === "success" && orders.length === 0 && (
        <p className="my-orders__note">
          You haven't ordered anything yet.{" "}
          <Link to="/shop">Visit the shop</Link>
        </p>
      )}

      {status === "success" && orders.length > 0 && (
        <ul className="my-orders__list">
          {orders.map((order) => (
            <li key={order.id} className={`my-order my-order--${order.status}`}>
              <div className="my-order__head">
                <div>
                  <h3 className="my-order__id">Order #{order.id}</h3>
                  <p className="my-order__date">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className="my-order__status">
                  {statusLabels[order.status] ?? order.status}
                </span>
              </div>

              <ul className="my-order__items">
                {order.items.map((item) => {
                  const flower = flowers
                    ? (flowers[item.flower_id] ?? null)
                    : undefined;
                  // Opens the flower's page; a flower that was deleted from the shop has no page
                  const hasPage = Boolean(item.flower_id) && flower !== null;
                  return (
                    <li key={item.id}>
                      <span>
                        {hasPage ? (
                          <Link
                            to={`/shop/${item.flower_id}`}
                            className="my-order__name"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}{" "}
                        <span className="my-order__qty">× {item.quantity}</span>
                      </span>
                      <span>
                        {formatPrice(Number(item.unit_price) * item.quantity)}
                      </span>
                      <div className="my-order__again">
                        <BuyAgain item={item} flower={flower} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              {order.address && (
                <p className="my-order__address">
                  Delivery to: {order.address}
                </p>
              )}

              <p className="my-order__total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </p>

              {/* Once the shop confirms the order, the customer sees when it will arrive.
                  No date chosen = soonest delivery, so we just say it's on its way. */}
              {order.status === "confirmed" && (
                <p className="my-order__delivery-time">
                  {order.delivery_date
                    ? `Delivery: ${formatDelivery(order.delivery_date, order.delivery_slot)}`
                    : "Your flowers are already on their way."}
                </p>
              )}
              {order.status === "delivered" && (
                <p className="my-order__delivery-time">
                  Your flowers have been delivered. Enjoy!
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
