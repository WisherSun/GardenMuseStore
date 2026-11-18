import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { placeSingleOrder } from "../../api/orders.js";
import { formatPrice } from "../../lib/format.js";
import { CheckCircleIcon, CloseIcon } from "../../components/Icons.jsx";
import ShippingForm from "../../components/ShippingForm.jsx";
import QuantityPicker from "../../components/QuantityPicker.jsx";

const MAX_QUANTITY = 99;

// "Buy now" pop-up: order this one flower straight away.
// The basket is not used and not changed.
// `initialQuantity` = the quantity chosen on the page; it can still be changed here.
// `onOrdered` runs once the order is placed (the page then loads the new stock).
export default function BuyNowDialog({ flower, initialQuantity = 1, onClose, onOrdered }) {
  const dialogRef = useRef(null);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [orderId, setOrderId] = useState(null);

  const unitPrice = flower.salePrice ?? flower.price;
  // Can't order more than there are in stock (the database checks this too)
  const max = Math.max(1, Math.min(flower.stock, MAX_QUANTITY));
  const valid = quantity >= 1 && quantity <= max;

  // <dialog> gives us a focus trap and closing with Escape for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const handleOrder = async (address) => {
    setOrderId(await placeSingleOrder(flower.id, quantity, address));
    onOrdered?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className="buy-dialog"
      aria-labelledby="buy-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="buy-dialog__inner">
        <div className="buy-dialog__head">
          <h2 id="buy-dialog-title" className="buy-dialog__title">
            {orderId ? "Order placed" : "Buy now"}
          </h2>
          <button type="button" className="buy-dialog__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {orderId ? (
          <div className="buy-dialog__done" role="status">
            <CheckCircleIcon className="buy-dialog__done-icon" />
            <p className="buy-dialog__done-title">Thank you for your order!</p>
            <p>
              Your order <strong>#{orderId}</strong> has been placed. We’ll be in touch about delivery.
            </p>
            <div className="buy-dialog__done-actions">
              <Link to="/shop" className="btn btn--ink">
                Continue shopping
              </Link>
              <Link to="/account" className="btn btn--light">
                My orders
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="buy-dialog__item">
              <img className="buy-dialog__image" src={flower.image} alt="" />
              <div className="buy-dialog__item-info">
                <p className="buy-dialog__name">{flower.name}</p>
                {flower.color && <p className="buy-dialog__unit">Colour: {flower.color}</p>}
                <p className="buy-dialog__unit">{formatPrice(unitPrice)} each</p>
                <QuantityPicker value={quantity} onChange={setQuantity} max={max} small />
              </div>
              <p className="buy-dialog__total">{formatPrice(unitPrice * quantity)}</p>
            </div>

            <ShippingForm
              onSubmit={handleOrder}
              disabled={!valid}
              submitLabel={`Place order · ${formatPrice(unitPrice * quantity)}`}
            />
          </>
        )}
      </div>
    </dialog>
  );
}
