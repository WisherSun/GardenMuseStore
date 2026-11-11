import { useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Products from "./components/Products.jsx";
import Subscription from "./components/Subscription.jsx";
import Craft from "./components/Craft.jsx";
import Newsletter from "./components/Newsletter.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";

function App() {
  // Simple cart counter for now. Later this can become a real cart (list of items, totals).
  const [cartCount, setCartCount] = useState(0);
  const addToCart = () => setCartCount((count) => count + 1);

  return (
    <>
      <Header cartCount={cartCount} />
      <main>
        <Hero />
        <Products onAddToCart={addToCart} />
        <Subscription />
        <Craft />
        <Newsletter />
      </main>
      <Footer />
      <BottomNav cartCount={cartCount} />
    </>
  );
}

export default App;
