import { useState } from "react";
import { TextField } from "../pages/Auth/AuthFields.jsx";
import "./ShippingForm.css";

// Shipping address form used by the basket and by "Buy now" on the flower page.
// `onSubmit(address)` gets the trimmed address and must return a promise:
// if it fails, the error is shown under the button.

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
  if (message.includes("no longer available")) return "Sorry, this flower is no longer available.";
  if (message.includes("quantity")) return "Please choose a quantity from 1 to 99.";
  if (message.includes("place_single_order")) return "“Buy now” isn’t set up yet. Please use the basket for now.";
  if (message.includes("phone number")) return "Please enter a valid phone number.";
  if (message.includes("recipient name")) return "Please enter the recipient’s name.";
  if (message.includes("city")) return "Please enter the city.";
  if (message.includes("street")) return "Please enter the street.";
  if (message.includes("building")) return "Please enter the building number or name.";
  if (message.includes("flat")) return "Please enter a shorter flat number.";
  return "We couldn’t place your order. Please try again.";
}

export default function ShippingForm({ onSubmit, disabled = false, submitLabel = "Place order" }) {
  const [delivery, setDelivery] = useState(EMPTY_DELIVERY);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const change = (field) => (e) => {
    setDelivery((d) => ({ ...d, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validateDelivery(delivery);
    setErrors(found);
    if (Object.keys(found).length) return;

    setPlacing(true);
    setOrderError(null);
    try {
      const trimmed = Object.fromEntries(
        Object.entries(delivery).map(([field, value]) => [field, value.trim()]),
      );
      await onSubmit(trimmed);
    } catch (err) {
      console.error("Could not place the order:", err);
      setOrderError(orderErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit} noValidate>
      <h3 className="checkout-form__title">Shipping address</h3>
      <TextField
        label="Name *"
        autoComplete="shipping name"
        placeholder="First and last name"
        value={delivery.fullName}
        onChange={change("fullName")}
        error={errors.fullName}
      />
      <TextField
        label="City *"
        autoComplete="shipping address-level2"
        placeholder="London"
        value={delivery.city}
        onChange={change("city")}
        error={errors.city}
      />
      <TextField
        label="Street *"
        autoComplete="shipping address-line1"
        placeholder="Baker Street"
        value={delivery.street}
        onChange={change("street")}
        error={errors.street}
      />
      <TextField
        label="Building *"
        placeholder="221B or Rose Court"
        maxLength={50}
        value={delivery.building}
        onChange={change("building")}
        error={errors.building}
      />
      <TextField
        label="Flat"
        autoComplete="shipping address-line2"
        placeholder="e.g. 4"
        hint="Leave empty if it’s a house."
        maxLength={20}
        value={delivery.flat}
        onChange={change("flat")}
        error={errors.flat}
      />
      <TextField
        label="Phone"
        type="tel"
        autoComplete="shipping tel"
        placeholder="+44 20 7946 0000"
        hint="Optional — the courier calls only if they can’t find you."
        value={delivery.phone}
        onChange={change("phone")}
        error={errors.phone}
      />

      <button
        type="submit"
        className="btn btn--rust btn--block"
        disabled={placing || disabled}
        aria-busy={placing}
      >
        {placing ? "Placing order…" : submitLabel}
      </button>
      {orderError && (
        <p className="checkout-form__error" role="alert">
          {orderError}
        </p>
      )}
      <p className="checkout-form__note">Payment on delivery.</p>
    </form>
  );
}
