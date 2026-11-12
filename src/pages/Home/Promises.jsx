import {
  FlowerIcon,
  LeafIcon,
  TruckIcon,
} from "../../components/Icons.jsx";
import "./Promises.css";

const promises = [
  {
    Icon: TruckIcon,
    title: "Same-day courier",
    text: "Order by 2pm for hand delivery the same day in London & NYC.",
  },
  {
    Icon: LeafIcon,
    title: "100% sustainable",
    text: "Seasonal stems from local growers, wrapped without plastic.",
  },
  {
    Icon: FlowerIcon,
    title: "Hand-tied by florists",
    text: "Every bouquet is arranged by hand in our studio, never on a line.",
  },
];

export default function Promises() {
  return (
    <section className="promises" aria-labelledby="promises-title">
      <div className="container">
        <h2 id="promises-title" className="visually-hidden">
          Why Garden Muse
        </h2>
        <ul className="promises__list">
          {promises.map(({ Icon, title, text }) => (
            <li key={title} className="promise">
              <span className="promise__icon">
                <Icon />
              </span>
              <h3 className="promise__title">{title}</h3>
              <p className="promise__text">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
