import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { FormAlert, TextAreaField, TextField } from "../Auth/AuthFields.jsx";
import { validateEmail } from "../Auth/validation.js";
import formStyles from "../Auth/Auth.module.css";
import "./Faq.css";

// The question form is handled by Netlify Forms, like the bespoke form:
// Netlify saves every question and emails it to the address set in the Netlify dashboard
// (Forms -> Form notifications). The email address is NOT in the code, so it isn't public.
// The same form name and fields are also listed in index.html, so Netlify can find the form.
const FORM_NAME = "question";
const MAX_QUESTION = 2000;

// Answers only use facts already shown elsewhere on the site (Promises, Bespoke, Flower care).
const faqs = [
  {
    q: "Do you deliver on the same day?",
    a: "Yes. Order by 2pm and a courier will hand-deliver your bouquet the same day in London & NYC.",
  },
  {
    q: "Can I order a bouquet made just for me?",
    a: (
      <>
        Of course. Tell us the occasion, colours and budget on the{" "}
        <Link to="/bespoke">bespoke bouquet page</Link> and our florists will design it for you.
      </>
    ),
  },
  {
    q: "Where do your flowers come from?",
    a: "We work with seasonal stems from local growers, and every bouquet is hand-tied in our studio.",
  },
  {
    q: "Is the packaging plastic-free?",
    a: "Yes. Our bouquets are wrapped without plastic.",
  },
  {
    q: "How do I keep my flowers fresh for longer?",
    a: (
      <>
        Trim the stems, change the water every two days and keep the vase cool. See all our{" "}
        <Link to="/care">flower care tips</Link>.
      </>
    ),
  },
];

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = "Please enter your name.";
  const emailError = validateEmail(v.email);
  if (emailError) errors.email = emailError;
  if (v.question.trim().length < 10) errors.question = "Please write your question (at least 10 characters).";
  else if (v.question.length > MAX_QUESTION) errors.question = `Please keep it under ${MAX_QUESTION} characters.`;
  return errors;
}

function QuestionForm() {
  const { user } = useAuth();
  const emptyForm = () => ({
    name: "",
    email: user?.email ?? "",
    question: "",
    "bot-field": "", // hidden trap for spam bots; people never see or fill it
  });
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");

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
      setSentTo(fields.email);
      setValues(emptyForm());
    } catch (err) {
      console.error("Could not send the question:", err);
      setFormError(
        import.meta.env.DEV
          ? "Dev server: this form can only be sent on the live Netlify site (Netlify Forms receives it there)."
          : "We couldn’t send your question. Please try again in a moment.",
      );
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="faq-form">
        <h3 className="faq-form__title">Thank you!</h3>
        <FormAlert type="success">
          We’ve received your question and will reply to <strong>{sentTo}</strong> soon.
        </FormAlert>
        <button type="button" className="btn btn--light faq-form__again" onClick={() => setSentTo("")}>
          Ask another question
        </button>
      </div>
    );
  }

  return (
    <div className="faq-form">
      <h3 className="faq-form__title">Still have a question?</h3>
      <p className="faq-form__desc">Write to us and a florist will answer by email.</p>

      <form
        className={formStyles.form}
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
        <TextAreaField
          label="Your question *"
          name="question"
          rows={5}
          maxLength={MAX_QUESTION}
          value={values.question}
          onChange={change("question")}
          error={errors.question}
        />

        <button type="submit" className={`btn btn--rust ${formStyles.submit}`} disabled={sending}>
          {sending ? "Sending…" : "Send question"}
        </button>
      </form>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="section faq-section" id="faq" aria-labelledby="faq-title">
      <div className="container faq">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 id="faq-title" className="faq__title">
            Questions &amp; Answers
          </h2>

          {/* <details> opens and closes by itself, works with keyboard and screen readers, no JS needed */}
          <div className="faq__list">
            {faqs.map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary className="faq-item__q">{q}</summary>
                <p className="faq-item__a">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <QuestionForm />
      </div>
    </section>
  );
}
