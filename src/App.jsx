import { Route, Routes } from "react-router";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ScrollManager from "./components/ScrollManager.jsx";
import GardenBackground from "./components/GardenBackground.jsx";
import HomePage from "./pages/Home/HomePage.jsx";
import ShopPage from "./pages/Shop/ShopPage.jsx";
import ProductPage from "./pages/Product/ProductPage.jsx";
import CartPage from "./pages/Cart/CartPage.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import SignUpPage from "./pages/Auth/SignUpPage.jsx";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage.jsx";
import AccountPage from "./pages/Account/AccountPage.jsx";
import AdminPage from "./pages/Admin/AdminPage.jsx";
import BespokePage from "./pages/Bespoke/BespokePage.jsx";
import CraftPage from "./pages/Craft/CraftPage.jsx";
import CarePage from "./pages/Care/CarePage.jsx";
import NotFoundPage from "./pages/NotFound/NotFoundPage.jsx";

function App() {
  return (
    <>
      <ScrollManager />
      <GardenBackground />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/bespoke" element={<BespokePage />} />
          <Route path="/craft" element={<CraftPage />} />
          <Route path="/care" element={<CarePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
