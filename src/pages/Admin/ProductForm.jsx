import { useEffect, useId, useRef, useState } from "react";
import { createFlower, updateFlower } from "../../api/admin.js";
import { TextField, FormAlert } from "../Auth/AuthFields.jsx";
import { CloseIcon } from "../../components/Icons.jsx";
import authStyles from "../Auth/Auth.module.css";

function toForm(product) {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price != null ? String(product.price) : "",
    discount: Boolean(product?.discount),
    newPrice: product?.newPrice != null ? String(product.newPrice) : "",
    image: product?.image ?? "",
  };
}

function validate(form) {
  const errors = {};
  const price = Number(form.price);
  const newPrice = Number(form.newPrice);

  if (!form.name.trim()) errors.name = "Enter a name.";
  if (!form.price.trim() || !(price > 0)) errors.price = "Enter a price above 0.";
  if (form.discount) {
    if (!form.newPrice.trim() || !(newPrice > 0)) errors.newPrice = "Enter the sale price.";
    else if (price > 0 && newPrice >= price) errors.newPrice = "Sale price must be lower than the price.";
  }
  if (!/^https?:\/\/\S+$/i.test(form.image.trim())) errors.image = "Enter an image link starting with https://";
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
      description: form.description.trim(),
      price: Number(form.price),
      discount: form.discount,
      newPrice: form.discount ? Number(form.newPrice) : null,
      image: form.image.trim(),
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

  const showPreview = /^https?:\/\/\S+$/i.test(form.image.trim());

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

        <div className="admin-form__image">
          <TextField
            label="Image link"
            type="url"
            placeholder="https://images.unsplash.com/…"
            value={form.image}
            onChange={set("image")}
            error={errors.image}
          />
          {showPreview && <img className="admin-form__preview" src={form.image.trim()} alt="Preview" />}
        </div>

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
