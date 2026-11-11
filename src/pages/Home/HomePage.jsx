import Hero from "./Hero.jsx";
import Products from "./Products.jsx";
import Subscription from "./Subscription.jsx";
import Craft from "./Craft.jsx";
import Newsletter from "./Newsletter.jsx";

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
