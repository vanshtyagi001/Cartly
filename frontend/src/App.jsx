import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CartDrawer from './components/CartDrawer';

const Shop = lazy(() => import('./pages/Shop'));
const Product = lazy(() => import('./pages/Product'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const SellerStudio = lazy(() => import('./pages/SellerStudio'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const About = lazy(() => import('./pages/About'));
const Support = lazy(() => import('./pages/Support'));

function RouteLoader() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6] border-t border-stone-200 w-full min-h-[calc(100vh-88px)]">
      <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-4" />
      <span className="text-stone-400 font-serif italic text-lg">Loading...</span>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen w-full flex flex-col bg-white relative">
            <Navbar />
            
            <Suspense fallback={<RouteLoader />}>
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
            </Suspense>
            
            <Footer />
            <CartDrawer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
