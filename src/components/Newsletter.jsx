import { useState } from "react";
import "./Newsletter.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "error" | "success"

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!isValid) {
      setStatus("error");
      return;
    }
    // TODO: send the email to the backend once the newsletter API exists.
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="section newsletter-section" id="journal">
      <div className="container">
        <div className="newsletter">
          <div className="newsletter__text">
            <span className="eyebrow">The Journal</span>
            <h2 className="newsletter__title">Enter the Greenhouse</h2>
            <p className="newsletter__desc">
              Receive 10% off your inaugural bouquet, private invitations to secret floral
              harvests, and seasonal botanical notes.
            </p>
          </div>

          {status === "success" ? (
            <p className="newsletter__success" role="status">
              Welcome to the circle. Your 10% code is on its way to your inbox.
            </p>
          ) : (
            <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="newsletter-email" className="visually-hidden">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "newsletter-error" : undefined}
                className="newsletter__input"
              />
              <button type="submit" className="btn btn--ink">
                Join the Circle
              </button>
              {status === "error" && (
                <p id="newsletter-error" className="newsletter__error" role="alert">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
