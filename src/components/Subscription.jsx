import { CalendarIcon, CheckCircleIcon } from "./Icons.jsx";
import "./Subscription.css";

export default function Subscription() {
  return (
    <section className="section" id="subscription">
      <div className="container">
        <div className="subscription">
          <div className="subscription__text">
            <span className="subscription__label">
              <CalendarIcon />
              Bespoke Subscription
            </span>
            <h2 className="subscription__title">Living Poetry, Every Fortnight</h2>
            <p className="subscription__desc">
              Hand-gathered seasonal flora delivered directly to your doorstep. Includes bespoke
              studio ceramic matching and bespoke care guides.
            </p>
          </div>

          <div className="subscription__aside">
            <ul className="subscription__features">
              <li>
                <CheckCircleIcon />
                Weekly or monthly flexible cadence
              </li>
              <li>
                <CheckCircleIcon />
                Complimentary artisan vessels
              </li>
            </ul>
            <a href="#join" className="btn btn--rust btn--block">
              Join the Club
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
