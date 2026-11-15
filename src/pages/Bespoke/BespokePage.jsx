import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import AuthLayout from "../Auth/AuthLayout.jsx";
import { FormAlert, SelectField, TextAreaField, TextField } from "../Auth/AuthFields.jsx";
import { validateEmail } from "../Auth/validation.js";
import { CalendarIcon, FlowerIcon, HeartIcon } from "../../components/Icons.jsx";
import styles from "../Auth/Auth.module.css";
import "../info-page.css";

// The form is handled by Netlify Forms: Netlify saves every request and emails it
// to the address set in the Netlify dashboard (Forms -> Form notifications).
// The email address is NOT in the code on purpose, so it isn't public on GitHub.
// The same form name and fields are also listed in index.html, so Netlify can find the form.
const FORM_NAME = "bespoke";

const OCCASIONS = ["Birthday", "Wedding", "Anniversary", "Thank you", "Sympathy", "Just because", "Other"];
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;
const MAX_WISHES = 2000;

// What we make. PLACEHOLDER: check these match the work you take on.
const SERVICES = [
  {
    Icon: FlowerIcon,
    title: "Weddings",
    text: "Bridal bouquets, buttonholes and table flowers, designed around your colours and venue.",
  },
  {
    Icon: CalendarIcon,
    title: "Celebrations & events",
    text: "Birthdays, anniversaries, dinners and launches — arrangements sized for the space.",
  },
  {
    Icon: HeartIcon,
    title: "Heartfelt gifts",
    text: "A single bouquet made for one person: their favourite flowers, colours and style.",
  },
];

// How it works. Steps 2 and 3 repeat what the home page already promises.
const STEPS = [
  { title: "Tell us your wishes", text: "Fill in the form below: occasion, date, colours, budget." },
  { title: "Talk to a florist", text: "A free design consultation to shape the idea together." },
  { title: "Made & delivered", text: "Hand-tied in our studio, with a handwritten card." },
];

// Intro above the form: what we make and how it works
function BespokeIntro() {
  return (
    <div className="info-page info-page--intro">
      <div className="container">
        <header className="info-hero">
          <span className="eyebrow">Bespoke floristry</span>
          <h1 className="info-hero__title">Arranged Around Your Moment</h1>
          <p className="info-hero__lead">
            Weddings, celebrations or a single heartfelt gift. Tell us the occasion, colours and
            budget, and our florists will design an arrangement made only for you.
          </p>
          <div className="info-hero__actions">
            <a href="#request" className="btn btn--rust">
              Start your request
            </a>
          </div>
        </header>

        <section aria-labelledby="bespoke-services">
          <h2 id="bespoke-services" className="visually-hidden">
            What we make
          </h2>
          <ul className="info-grid info-grid--3">
            {SERVICES.map(({ Icon, title, text }) => (
              <li key={title} className="info-card">
                <span className="info-card__icon">
                  <Icon />
                </span>
                <h3 className="info-card__title">{title}</h3>
                <p className="info-card__text">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="info-section" aria-labelledby="bespoke-steps">
          <div className="info-section__head">
            <span className="eyebrow">How it works</span>
            <h2 id="bespoke-steps" className="info-section__title">
              Three simple steps
            </h2>
          </div>
          <ol className="info-grid info-grid--3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="info-card">
                <span className="info-card__number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="info-card__title">{step.title}</h3>
                <p className="info-card__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

// Today as YYYY-MM-DD in the customer's own time zone (so the date picker can't go into the past)
function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = "Please enter your name.";
  const emailError = validateEmail(v.email);
  if (emailError) errors.email = emailError;
  if (v.phone.trim() && !PHONE_PATTERN.test(v.phone.trim()))
    errors.phone = "Enter a phone number, e.g. +44 20 7946 0000.";
  if (v.date && v.date < today()) errors.date = "Please choose a date from today onwards.";
  if (v.wishes.trim().length < 10) errors.wishes = "Tell us a little about the bouquet you’d like.";
  else if (v.wishes.length > MAX_WISHES) errors.wishes = `Please keep it under ${MAX_WISHES} characters.`;
  return errors;
}

export default function BespokePage() {
  const { user } = useAuth();
  const [values, setValues] = useState(() => ({
    name: "",
    email: user?.email ?? "",
    phone: "",
    occasion: "",
    date: "",
    budget: "",
    wishes: "",
    "bot-field": "", // hidden trap for spam bots; people never see or fill it
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      const fields = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": FORM_NAME, ...fields }).toString(),
      });
      if (!response.ok) throw new Error(`Form request failed: ${response.status}`);
      setSent(true);
    } catch (err) {
      console.error("Could not send the bespoke request:", err);
      setFormError(
        import.meta.env.DEV
          ? "Dev server: this form can only be sent on the live Netlify site (Netlify Forms receives it there)."
          : "We couldn’t send your request. Please try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  };

  // After sending, the intro disappears and only "Thank you" is left: show it from the top
  useEffect(() => {
    if (sent) window.scrollTo(0, 0);
  }, [sent]);

  if (sent) {
    return (
      <AuthLayout eyebrow="Bespoke floristry" title="Thank you!">
        <FormAlert type="success">
          We’ve received your wishes. A florist will contact you at <strong>{values.email.trim()}</strong>{" "}
          to talk through the design.
        </FormAlert>
        <Link to="/shop" className={`btn btn--ink ${styles.submit}`}>
          Browse the shop
        </Link>
      </AuthLayout>
    );
  }

  return (
    <>
      <BespokeIntro />
      <AuthLayout
        id="request"
        titleAs="h2"
        eyebrow="Your request"
        title="Customise your bouquet"
        subtitle="Tell us the occasion, colours, flowers and budget. Our florists will design an arrangement made only for you."
      >
        <form
          className={styles.form}
          name={FORM_NAME}
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          onSubmit={handleSubmit}
          noValidate
        >
          {formError && <FormAlert>{formError}</FormAlert>}

          <p hidden>
            <label>
              Don’t fill this in: <input name="bot-field" value={values["bot-field"]} onChange={change("bot-field")} />
            </label>
          </p>

          <TextField
            label="Name *"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={change("name")}
            error={errors.name}
          />
          <TextField
            label="Email *"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={change("email")}
            error={errors.email}
          />
          <TextField
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+44 20 7946 0000"
            hint="Optional — if you’d rather talk it through."
            value={values.phone}
            onChange={change("phone")}
            error={errors.phone}
          />
          <SelectField label="Occasion" name="occasion" value={values.occasion} onChange={change("occasion")}>
            <option value="">Choose an occasion</option>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Date needed"
            name="date"
            type="date"
            min={today()}
            value={values.date}
            onChange={change("date")}
            error={errors.date}
          />
          <TextField
            label="Budget"
            name="budget"
            placeholder="e.g. around $100"
            maxLength={50}
            value={values.budget}
            onChange={change("budget")}
          />
          <TextAreaField
            label="Your wishes *"
            name="wishes"
            rows={6}
            maxLength={MAX_WISHES}
            placeholder="Colours, favourite flowers, style, who it’s for…"
            value={values.wishes}
            onChange={change("wishes")}
            error={errors.wishes}
          />

          <button type="submit" className={`btn btn--rust ${styles.submit}`} disabled={sending}>
            {sending ? "Sending…" : "Send my request"}
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
