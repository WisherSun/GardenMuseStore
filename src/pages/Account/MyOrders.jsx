import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchMyOrders } from "../../api/orders.js";
import { formatPrice } from "../../lib/format.js";
import "./MyOrders.css";

// Wording for customers (the admin panel says "New" instead of "Received")
const statusLabels = {
  new: "Received",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// "My orders" list on the Account page
export default function MyOrders({ userId }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchMyOrders(userId)
      .then((data) => {
        if (ignore) return;
        setOrders(data);
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

      {status === "loading" && <p className="my-orders__note">Loading your orders…</p>}

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
          You haven't ordered anything yet. <Link to="/shop">Visit the shop</Link>
        </p>
      )}

      {status === "success" && orders.length > 0 && (
        <ul className="my-orders__list">
          {orders.map((order) => (
            <li key={order.id} className={`my-order my-order--${order.status}`}>
              <div className="my-order__head">
                <div>
                  <h3 className="my-order__id">Order #{order.id}</h3>
                  <p className="my-order__date">{formatDate(order.created_at)}</p>
                </div>
                <span className="my-order__status">{statusLabels[order.status] ?? order.status}</span>
              </div>

              <ul className="my-order__items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.name} <span className="my-order__qty">× {item.quantity}</span>
                    </span>
                    <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              {order.address && <p className="my-order__address">Delivery to: {order.address}</p>}

              <p className="my-order__total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
