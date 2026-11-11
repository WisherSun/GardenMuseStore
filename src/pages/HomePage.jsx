import Hero from "../components/Hero.jsx";
import Products from "../components/Products.jsx";
import Subscription from "../components/Subscription.jsx";
import Craft from "../components/Craft.jsx";
import Newsletter from "../components/Newsletter.jsx";

export default function HomePage({ onAddToCart }) {
  return (
    <>
      <Hero />
      <Products onAddToCart={onAddToCart} />
      <Subscription />
      <Craft />
      <Newsletter />
    </>
  );
}
