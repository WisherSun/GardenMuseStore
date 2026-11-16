import { useRef } from "react";
import { useRevealOnScroll } from "../../hooks/useRevealOnScroll.js";
import Hero from "./Hero.jsx";
import Promises from "./Promises.jsx";
import Products from "./Products.jsx";
import Subscription from "./Subscription.jsx";
import Craft from "./Craft.jsx";
import Newsletter from "./Newsletter.jsx";
import Faq from "./Faq.jsx";

export default function HomePage() {
  // Every section fades in slowly the first time it scrolls into view
  const pageRef = useRef(null);
  useRevealOnScroll(pageRef);

  return (
    <div ref={pageRef}>
      <Hero />
      <Promises />
      <Products />
      <Subscription />
      <Craft />
      <Newsletter />
      <Faq />
    </div>
  );
}
