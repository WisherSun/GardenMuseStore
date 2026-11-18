import { useEffect, useRef, useState } from "react";
import { FaqList, QuestionForm } from "../Home/Faq.jsx";
import { CloseIcon } from "../../components/Icons.jsx";

// Pop-up with the question form (same form as on the home page, sent with Netlify Forms).
// <dialog> gives a focus trap and closing with Escape for free.
function QuestionDialog({ onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="buy-dialog"
      aria-labelledby="question-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="buy-dialog__inner">
        <div className="buy-dialog__head">
          <h2 id="question-dialog-title" className="buy-dialog__title">
            Ask us a question
          </h2>
          <button type="button" className="buy-dialog__close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <QuestionForm heading={false} />
      </div>
    </dialog>
  );
}

// FAQ under the reviews on every flower page: the same questions as on the home page.
// Instead of the form there is a link that opens it in a pop-up.
export default function ProductFaq() {
  const [asking, setAsking] = useState(false);

  return (
    <section className="product-faq" aria-labelledby="product-faq-title">
      <div className="faq">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 id="product-faq-title" className="faq__title product-faq__title">
            Questions &amp; Answers
          </h2>
          <FaqList />
        </div>

        <div className="product-faq__ask">
          <p className="product-faq__ask-title">Do you have more questions?</p>
          <p className="product-faq__ask-text">Write to us and a florist will answer by email.</p>
          <button type="button" className="product-faq__ask-link" onClick={() => setAsking(true)}>
            Ask us a question
          </button>
        </div>
      </div>

      {asking && <QuestionDialog onClose={() => setAsking(false)} />}
    </section>
  );
}
