import { useId, useState } from "react";
import "./QuantityPicker.css";

// Quantity box with − / + buttons. The number can also be typed in.
// `max` = the most the customer may take (stock, at most 99 per order).
// If they type more, the number stays as typed (so they see what went wrong) and a warning
// offers to change it to the maximum. The parent should not allow ordering until then
// (while value > max). The database checks the stock again when the order is placed.
export default function QuantityPicker({ value, onChange, max, small = false }) {
  const inputId = useId();
  const warningId = useId();
  // What is in the box while typing; null = show `value`.
  // Kept separately so the box can be empty for a moment while the customer types.
  const [draft, setDraft] = useState(null);
  const tooMany = value > max;

  const set = (n) => {
    setDraft(null);
    onChange(n);
  };

  const handleType = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setDraft(digits);
    if (digits !== "" && Number(digits) > 0) onChange(Number(digits));
  };

  // Leaving the box empty or with 0 means 1
  const handleBlur = () => {
    if (draft === null) return;
    if (draft === "" || Number(draft) < 1) onChange(1);
    setDraft(null);
  };

  return (
    <div className={`qty ${small ? "qty--small" : ""}`}>
      <label htmlFor={inputId} className={small ? "visually-hidden" : "qty__label"}>
        Quantity
      </label>
      <div className={`qty__box ${tooMany ? "is-invalid" : ""}`}>
        <button
          type="button"
          onClick={() => set(Math.min(value - 1, max))}
          disabled={value <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric" // number keyboard on phones
          pattern="[0-9]*"
          autoComplete="off"
          value={draft ?? String(value)}
          onChange={handleType}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          aria-invalid={tooMany}
          aria-describedby={tooMany ? warningId : undefined}
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {tooMany && (
        <p id={warningId} className="qty__warning" role="alert">
          Sorry, that’s more than we can offer. You can order up to {max}.{" "}
          <button type="button" className="qty__fix" onClick={() => set(max)}>
            Take {max}
          </button>
        </p>
      )}
    </div>
  );
}
