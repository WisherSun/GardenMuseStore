import bouquetImage from "../../assets/placeholders/bouquet.jpg";
import styles from "./Auth.module.css";

// Shared frame for login, sign up and password pages:
// photo + quote on the left (desktop only), form card on the right.
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.visual}>
            <img src={bouquetImage} alt="" />
            <div>
              <p className={styles.visualQuote}>
                “Flowers are the poetry of the earth, written in petals and light.”
              </p>
              <p className={styles.visualCaption}>Garden Muse Atelier</p>
            </div>
          </div>

          <div className={styles.card}>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            {children}
            {footer && <p className={styles.switchText}>{footer}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
