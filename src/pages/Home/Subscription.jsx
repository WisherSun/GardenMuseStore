import { Link } from "react-router";
import { CheckCircleIcon, FlowerIcon } from "../../components/Icons.jsx";
import "./Subscription.css";

export default function Subscription() {
  return (
    <section className="section" id="bespoke">
      <div className="container">
        <div className="subscription">
          <div className="subscription__text">
            <span className="subscription__label">
              <FlowerIcon />
              Bespoke Floristry
            </span>
            <h2 className="subscription__title">Arranged Around Your Moment</h2>
            <p className="subscription__desc">
              Weddings, celebrations or a single heartfelt gift. Tell us the
              occasion, colours and budget, and our florists will design an
              arrangement made only for you.
            </p>
          </div>

          <div className="subscription__aside">
            <ul className="subscription__features">
              <li>
                <CheckCircleIcon />
                Free design consultation with a florist
              </li>
              <li>
                <CheckCircleIcon />
                Handwritten card with every order
              </li>
            </ul>
            <Link to="/bespoke" className="btn btn--rust btn--block">
              Customise your bouquet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
