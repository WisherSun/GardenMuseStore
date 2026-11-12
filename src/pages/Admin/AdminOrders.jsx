import { useEffect, useState } from "react";
import { ORDER_STATUSES, fetchOrdersForAdmin, updateOrderStatus } from "../../api/admin.js";
import { formatPrice } from "../../lib/format.js";

const statusLabels = {
  new: "New",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const formatDate = (value) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchOrdersForAdmin()
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
  }, [attempt]);

  const reload = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const changeStatus = async (order, next) => {
    const previous = order.status;
    setError(null);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    try {
      await updateOrderStatus(order.id, next);
    } catch (err) {
      console.error("Could not update order:", err);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: previous } : o)));
      setError(`Could not update order #${order.id}. Please try again.`);
    }
  };

  const counts = orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {});
  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="admin-panel">
      <div className="admin-toolbar">
        <div className="tabs no-scrollbar admin-filters" aria-label="Filter orders by status">
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              aria-pressed={filter === s}
              className={`tab ${filter === s ? "is-active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : statusLabels[s]}
              <span className="admin-filters__count">{s === "all" ? orders.length : counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <button className="btn btn--light" onClick={reload} disabled={status === "loading"}>
          Refresh
        </button>
      </div>

      {error && (
        <p className="admin-message admin-message--error" role="alert">
          {error}
        </p>
      )}

      {status === "loading" && <p className="admin-empty">Loading orders…</p>}

      {status === "error" && (
        <div className="product-message" role="alert">
          <p>Could not load orders.</p>
          <button className="btn btn--ink" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {status === "success" && visible.length === 0 && (
        <p className="admin-empty">{orders.length === 0 ? "No orders yet." : "No orders with this status."}</p>
      )}

      {status === "success" && visible.length > 0 && (
        <ul className="admin-orders">
          {visible.map((order) => (
            <li key={order.id} className={`admin-order admin-order--${order.status}`}>
              <div className="admin-order__head">
                <div>
                  <h3 className="admin-order__id">Order #{order.id}</h3>
                  <p className="admin-order__meta">
                    {formatDate(order.created_at)} · {order.customer_email ?? "Deleted user"}
                  </p>
                </div>
                <label className="admin-order__status">
                  <span className="visually-hidden">Status of order #{order.id}</span>
                  <select value={order.status} onChange={(e) => changeStatus(order, e.target.value)}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <ul className="admin-order__items">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <span>
                      {item.name} <span className="admin-order__qty">× {item.quantity}</span>
                    </span>
                    <span>{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <p className="admin-order__total">
                <span>Total</span>
                <span>{formatPrice(Number(order.total))}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
