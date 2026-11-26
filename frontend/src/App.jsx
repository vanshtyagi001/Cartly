import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SellerStudio from './pages/SellerStudio';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Support from './pages/Support';
import CartDrawer from './components/CartDrawer';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen w-full flex flex-col bg-white relative">
            <Navbar />
            
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/seller" element={<SellerStudio />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Support defaultSection="contact" />} />
              <Route path="/customer-care" element={<Support defaultSection="care" />} />
              <Route path="/delivery-info" element={<Support defaultSection="delivery" />} />
              <Route path="/refund-policy" element={<Support defaultSection="refund" />} />
              <Route path="/privacy-policy" element={<Support defaultSection="privacy" />} />
              <Route path="/terms" element={<Support defaultSection="terms" />} />
            </Routes>
            
            <Footer />
            <CartDrawer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
