import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import CartDrawer from './components/CartDrawer';

export default function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen w-full flex flex-col bg-white relative">
          <Navbar />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
          </Routes>
          
          <Footer />
          <CartDrawer />
        </div>
      </Router>
    </CartProvider>
  );
}
