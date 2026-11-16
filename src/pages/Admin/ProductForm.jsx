import { useEffect, useId, useRef, useState } from "react";
import { createFlower, updateFlower } from "../../api/admin.js";
import { TextField, TextAreaField, FormAlert } from "../Auth/AuthFields.jsx";
import { CloseIcon } from "../../components/Icons.jsx";
import authStyles from "../Auth/Auth.module.css";

// Extra photos for the flower page gallery. Optional.
const EXTRA_IMAGES = ["image2", "image3", "image4"];

const isLink = (value) => /^https?:\/\/\S+$/i.test(value.trim());

function toForm(product) {
  return {
    name: product?.name ?? "",
    color: product?.color ?? "",
    description: product?.description ?? "",
    price: product?.price != null ? String(product.price) : "",
    discount: Boolean(product?.discount),
    newPrice: product?.newPrice != null ? String(product.newPrice) : "",
    image: product?.image ?? "",
    image2: product?.image2 ?? "",
    image3: product?.image3 ?? "",
    image4: product?.image4 ?? "",
    details: product?.details ?? "",
  };
}

// Link + small preview of the photo once the link looks valid
function ImageField({ label, value, onChange, error, hint }) {
  return (
    <div className="admin-form__image">
      <TextField
        label={label}
        type="url"
        placeholder="https://images.unsplash.com/…"
        value={value}
        onChange={onChange}
        error={error}
        hint={hint}
      />
      {isLink(value) && <img className="admin-form__preview" src={value.trim()} alt="Preview" />}
    </div>
  );
}

function validate(form) {
  const errors = {};
  const price = Number(form.price);
  const newPrice = Number(form.newPrice);

  if (!form.name.trim()) errors.name = "Enter a name.";
  if (form.color.trim().length > 40) errors.color = "Too long (40 characters max).";
  if (!form.price.trim() || !(price > 0)) errors.price = "Enter a price above 0.";
  if (form.discount) {
    if (!form.newPrice.trim() || !(newPrice > 0)) errors.newPrice = "Enter the sale price.";
    else if (price > 0 && newPrice >= price) errors.newPrice = "Sale price must be lower than the price.";
  }
  if (!isLink(form.image)) errors.image = "Enter an image link starting with https://";
  for (const field of EXTRA_IMAGES) {
    if (form[field].trim() && !isLink(form[field])) errors[field] = "Link must start with https:// (or leave it empty).";
  }
  return errors;
}

// Add / edit product form in a pop-up window.
// `product` = the row to edit, or null to add a new one.
export default function ProductForm({ product, onCancel, onSaved }) {
  const isNew = !product;
  const dialogRef = useRef(null);
  const descriptionId = useId();
  const [form, setForm] = useState(() => toForm(product));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // <dialog> gives us a focus trap and closing with Escape for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const fields = {
      name: form.name.trim(),
      color: form.color.trim() || null, // empty = sold in one colour only
      description: form.description.trim(),
      price: Number(form.price),
      discount: form.discount,
      newPrice: form.discount ? Number(form.newPrice) : null,
      image: form.image.trim(),
      // Empty boxes are saved as null, so the flower page simply skips them.
      image2: form.image2.trim() || null,
      image3: form.image3.trim() || null,
      image4: form.image4.trim() || null,
      details: form.details.trim() || null,
    };

    setSaving(true);
    setSaveError(null);
    try {
      const saved = isNew ? await createFlower(fields) : await updateFlower(product.id, fields);
      onSaved(saved, isNew);
    } catch (error) {
      console.error("Could not save product:", error);
      setSaveError(error?.message || "Could not save the product.");
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="product-form-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-form__head">
          <h2 id="product-form-title" className="admin-form__title">
            {isNew ? "Add product" : `Edit “${product.name}”`}
          </h2>
          <button type="button" className="admin-dialog__close" onClick={onCancel} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {saveError && <FormAlert>{saveError}</FormAlert>}

        <TextField label="Name" value={form.name} onChange={set("name")} error={errors.name} autoFocus />

        <TextField
          label="Colour (optional)"
          placeholder="e.g. Pink"
          maxLength={40}
          value={form.color}
          onChange={set("color")}
          error={errors.color}
          hint="Only for flowers sold in several colours: add each colour as its own product with exactly the same name, and give every one of them a colour (the first one too)."
        />

        <div className={authStyles.field}>
          <label htmlFor={descriptionId} className={authStyles.label}>
            Description
          </label>
          <textarea
            id={descriptionId}
            className={`${authStyles.input} admin-form__textarea`}
            rows={3}
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <div className="admin-form__row">
          <TextField
            label="Price ($)"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.price}
            onChange={set("price")}
            error={errors.price}
          />
          <TextField
            label="Sale price ($)"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.newPrice}
            onChange={set("newPrice")}
            error={errors.newPrice}
            disabled={!form.discount}
            hint={form.discount ? undefined : "Tick “On sale” to set it"}
          />
        </div>

        <label className="admin-checkbox">
          <input type="checkbox" checked={form.discount} onChange={set("discount")} />
          On sale
        </label>

        <ImageField
          label="Main image link"
          value={form.image}
          onChange={set("image")}
          error={errors.image}
          hint="Shown on the product card and first on the flower page."
        />

        <fieldset className="admin-form__group">
          <legend className="admin-form__legend">Extra photos for the flower page (optional)</legend>
          {EXTRA_IMAGES.map((field, i) => (
            <ImageField
              key={field}
              label={`Photo ${i + 2}`}
              value={form[field]}
              onChange={set(field)}
              error={errors[field]}
            />
          ))}
        </fieldset>

        <TextAreaField
          label="Details"
          rows={5}
          value={form.details}
          onChange={set("details")}
          hint="Longer text for the flower page. Start the care advice with “Care:” to show it in its own box."
        />

        <div className="admin-form__actions">
          <button type="button" className="btn btn--light" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--ink" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Add product" : "Save changes"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
