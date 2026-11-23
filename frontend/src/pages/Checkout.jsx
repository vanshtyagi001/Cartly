import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Shipping Address State
  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('cartly_shipping_address');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      fullName: user?.name || '',
      phone: '',
      campus: 'North Campus',
      hostelBlock: '',
      roomNumber: '',
      city: 'Delhi',
      pincode: '110007',
    };
  });

  // Sync user name and saved profile address if available
  useEffect(() => {
    if (user) {
      const def = user.defaultAddress;
      if (def && (def.hostelBlock || def.roomNumber || def.phone)) {
        setAddress(prev => ({
          fullName: def.fullName || user.name || prev.fullName,
          phone: def.phone || prev.phone,
          campus: def.campus || prev.campus,
          hostelBlock: def.hostelBlock || prev.hostelBlock,
          roomNumber: def.roomNumber || prev.roomNumber,
          city: def.city || prev.city,
          pincode: def.pincode || prev.pincode,
        }));
      } else if (user.name && !address.fullName) {
        setAddress(prev => ({ ...prev, fullName: user.name }));
      }
    }
  }, [user]);

  // Selected Payment Method: only COD is active
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [saveAddress, setSaveAddress] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Safely calculate the cart total
  const safeCartTotal = cartItems.reduce((total, item) => {
    const numericPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) || 0;
    return total + (numericPrice * item.quantity);
  }, 0);

  const shipping = 0;
  const tax = safeCartTotal * 0.08;
  const grandTotal = safeCartTotal + shipping + tax;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAddress = () => {
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = 'Full name is required';
    if (!address.phone.trim()) {
      errors.phone = 'Phone number is required for hostel delivery';
    } else if (!/^\d{10}$/.test(address.phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!address.hostelBlock.trim()) errors.hostelBlock = 'Hostel / Building name is required';
    if (!address.roomNumber.trim()) errors.roomNumber = 'Room / Door number is required';
    if (!address.campus.trim()) errors.campus = 'Campus name is required';
    return errors;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const errors = validateAddress();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to address form
      const el = document.getElementById('address-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    if (saveAddress) {
      try {
        localStorage.setItem('cartly_shipping_address', JSON.stringify(address));
      } catch {
        // ignore
      }
    }

    setIsSubmitting(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          img: item.img,
        })),
        shippingAddress: {
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          campus: address.campus.trim(),
          hostelBlock: address.hostelBlock.trim(),
          roomNumber: address.roomNumber.trim(),
          city: address.city.trim() || 'Campus City',
          pincode: address.pincode.trim() || '',
          email: user?.email || '',
        },
        paymentMethod: 'Cash on Delivery (COD)',
      };

      const response = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      // Success: clear cart and store placed order details
      clearCart();
      setPlacedOrder(data.order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order placement error:', err);
      setSubmitError(err.message || 'An error occurred while confirming your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (placedOrder) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-16 lg:py-24 px-6 md:px-12">
        <div className="max-w-[760px] mx-auto bg-white border border-stone-200 p-8 sm:p-14 shadow-sm">
          
          {/* Header */}
          <div className="text-center pb-10 border-b border-stone-200">
            <div className="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-2">
              Campus Order Confirmed
            </span>
            <h1 className="text-4xl font-serif text-stone-900 tracking-tight mb-3">
              Order #{placedOrder.id}
            </h1>
            <p className="text-stone-500 font-sans text-sm max-w-md mx-auto">
              Your campus essentials order has been placed successfully via <strong className="text-stone-900">Cash on Delivery</strong>.
            </p>
          </div>

          {/* Delivery & Payment Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-b border-stone-200 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                Hostel Delivery Destination
              </span>
              <p className="font-medium text-stone-900">{placedOrder.shippingAddress?.fullName}</p>
              <p className="text-stone-600 mt-1">
                {placedOrder.shippingAddress?.hostelBlock}, Room {placedOrder.shippingAddress?.roomNumber}
              </p>
              <p className="text-stone-500">{placedOrder.shippingAddress?.campus}</p>
              <p className="text-stone-500 mt-1">Phone: {placedOrder.shippingAddress?.phone}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                Payment & Fulfillment
              </span>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-stone-100 text-stone-900 rounded-none text-[11px] font-medium mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Cash on Delivery (COD)
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                Please keep <strong className="text-stone-900">{placedOrder.total}</strong> ready upon parcel handover at your hostel gate.
              </p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="py-8 border-b border-stone-200">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-4">
              Ordered Essentials ({placedOrder.items?.length || 0})
            </span>
            <div className="divide-y divide-stone-100">
              {placedOrder.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {item.img && (
                      <div className="w-10 h-12 bg-stone-100 border border-stone-200 shrink-0">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                    )}
                    <div>
                      <p className="font-serif text-stone-900 text-sm">{item.name}</p>
                      <p className="text-stone-400 text-[11px]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-sans font-medium text-stone-900">{item.price}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center text-sm font-sans">
              <span className="text-stone-500">Total Paid on Delivery</span>
              <span className="font-serif text-xl text-stone-900 font-medium">{placedOrder.total}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/orders"
              className="flex-1 bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 text-center hover:bg-black transition-colors"
            >
              View In Your Orders
            </Link>
            <Link
              to="/shop"
              className="flex-1 bg-[#FAF9F6] border border-stone-200 text-stone-800 text-xs uppercase tracking-[0.15em] font-medium py-4 text-center hover:bg-stone-200/60 transition-colors"
            >
              Continue Exploring
            </Link>
          </div>

        </div>
      </main>
    );
  }

  // EMPTY CART VIEW
  if (cartItems.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6]">
        <div className="text-center max-w-lg w-full flex flex-col items-center">
          <span className="text-stone-400 font-serif italic text-xl mb-8">
            Your cart is beautifully empty.
          </span>
          <Link 
            to="/shop" 
            className="inline-block bg-stone-900 text-white py-4 px-10 text-xs uppercase tracking-[0.15em] font-medium hover:bg-black transition-colors duration-300"
          >
            Discover Essentials
          </Link>
        </div>
      </main>
    );
  }

  // MAIN CHECKOUT WORKFLOW VIEW
  return (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 md:px-12 py-12 lg:py-16 bg-[#FAF9F6] min-h-screen">
      
      {/* Page Title & Breadcrumb */}
      <div className="mb-10 pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-stone-400 block mb-2">
            Campus Checkout Flow
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight">
            Checkout.
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-stone-400">
          <span className="text-stone-900 font-semibold">1. Address</span>
          <span>→</span>
          <span className="text-stone-900 font-semibold">2. Payment (COD)</span>
          <span>→</span>
          <span>3. Confirmation</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Left Column: Delivery Address & Payment Options */}
        <div className="w-full lg:w-[65%] flex flex-col space-y-12">

          {/* Section 1: Hostel Delivery Address */}
          <section id="address-section" className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-serif">
                  1
                </span>
                <h2 className="text-xl font-serif text-stone-900 tracking-tight">
                  Campus Delivery Address
                </h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                Hostel Handover
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={address.fullName}
                  onChange={handleAddressChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full bg-[#FAF9F6] border px-4 py-3 text-stone-900 text-sm focus:bg-white focus:outline-none transition-all ${
                    formErrors.fullName ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-red-600 text-[11px] mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Mobile Number (For Gate Call) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleAddressChange}
                  placeholder="10-digit mobile number"
                  className={`w-full bg-[#FAF9F6] border px-4 py-3 text-stone-900 text-sm focus:bg-white focus:outline-none transition-all ${
                    formErrors.phone ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-red-600 text-[11px] mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Campus / University */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Campus / College Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="campus"
                  value={address.campus}
                  onChange={handleAddressChange}
                  placeholder="e.g. North Campus / University Main"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Hostel / Hall / Block */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Hostel / Block / Building <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hostelBlock"
                  value={address.hostelBlock}
                  onChange={handleAddressChange}
                  placeholder="e.g. Tagore Hostel, Block B"
                  className={`w-full bg-[#FAF9F6] border px-4 py-3 text-stone-900 text-sm focus:bg-white focus:outline-none transition-all ${
                    formErrors.hostelBlock ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                {formErrors.hostelBlock && (
                  <p className="text-red-600 text-[11px] mt-1">{formErrors.hostelBlock}</p>
                )}
              </div>

              {/* Room Number */}
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Room / Door Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={address.roomNumber}
                  onChange={handleAddressChange}
                  placeholder="e.g. Room 304 / Wing A"
                  className={`w-full bg-[#FAF9F6] border px-4 py-3 text-stone-900 text-sm focus:bg-white focus:outline-none transition-all ${
                    formErrors.roomNumber ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-stone-900'
                  }`}
                />
                {formErrors.roomNumber && (
                  <p className="text-red-600 text-[11px] mt-1">{formErrors.roomNumber}</p>
                )}
              </div>

              {/* City & Pincode */}
              <div className="sm:col-span-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleAddressChange}
                    className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

            </div>

            {/* Save Address Toggle */}
            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-4 h-4 text-stone-900 border-stone-300 rounded-none focus:ring-stone-900"
                />
                <span>Save this hostel address for future campus orders</span>
              </label>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  state={{ from: { pathname: '/checkout' } }}
                  className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-900 underline"
                >
                  Sign in to use saved address
                </Link>
              )}
            </div>
          </section>

          {/* Section 2: Payment Method Selection */}
          <section className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-serif">
                  2
                </span>
                <h2 className="text-xl font-serif text-stone-900 tracking-tight">
                  Payment Method
                </h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200/60 font-medium">
                COD Enabled
              </span>
            </div>

            <div className="space-y-4">
              
              {/* Option 1: Cash on Delivery (ACTIVE) */}
              <div
                onClick={() => setSelectedPayment('cod')}
                className={`p-6 border transition-all cursor-pointer relative ${
                  selectedPayment === 'cod'
                    ? 'border-stone-900 bg-white ring-1 ring-stone-900'
                    : 'border-stone-200 bg-[#FAF9F6] hover:border-stone-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      id="payment-cod"
                      name="paymentMethod"
                      value="cod"
                      checked={selectedPayment === 'cod'}
                      onChange={() => setSelectedPayment('cod')}
                      className="mt-1 w-4 h-4 text-stone-900 focus:ring-stone-900"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <label htmlFor="payment-cod" className="font-serif text-stone-900 text-base cursor-pointer">
                          Cash on Delivery (COD)
                        </label>
                        <span className="text-[9px] uppercase tracking-widest bg-stone-900 text-white px-2 py-0.5 font-medium">
                          Active
                        </span>
                      </div>
                      <p className="text-stone-500 font-sans text-xs leading-relaxed max-w-lg">
                        Pay in cash or scan the delivery agent's UPI QR code upon parcel arrival at your hostel gate or room. Zero advance charges.
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-serif text-stone-900 font-medium">₹0 Advance</span>
                </div>
              </div>

              {/* Option 2: Instant UPI */}
              <div className="p-6 border border-stone-200 bg-[#FAF9F6]/50 opacity-60 relative cursor-not-allowed">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      id="payment-upi"
                      name="paymentMethod"
                      value="upi"
                      disabled
                      className="mt-1 w-4 h-4 text-stone-400 cursor-not-allowed"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <label htmlFor="payment-upi" className="font-serif text-stone-700 text-base cursor-not-allowed">
                          Instant UPI & QR
                        </label>
                      </div>
                      <p className="text-stone-400 font-sans text-xs">
                        Google Pay, PhonePe, Paytm, BHIM.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                    <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
                  </div>
                </div>
              </div>

              {/* Option 3: Credit / Debit Card */}
              <div className="p-6 border border-stone-200 bg-[#FAF9F6]/50 opacity-60 relative cursor-not-allowed">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      id="payment-card"
                      name="paymentMethod"
                      value="card"
                      disabled
                      className="mt-1 w-4 h-4 text-stone-400 cursor-not-allowed"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <label htmlFor="payment-card" className="font-serif text-stone-700 text-base cursor-not-allowed">
                          Credit / Debit Card
                        </label>
                      </div>
                      <p className="text-stone-400 font-sans text-xs">
                        Visa, Mastercard, RuPay.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400">Card</span>
                </div>
              </div>

              {/* Option 4: Campus Meal Card / Wallet */}
              <div className="p-6 border border-stone-200 bg-[#FAF9F6]/50 opacity-60 relative cursor-not-allowed">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      id="payment-wallet"
                      name="paymentMethod"
                      value="wallet"
                      disabled
                      className="mt-1 w-4 h-4 text-stone-400 cursor-not-allowed"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <label htmlFor="payment-wallet" className="font-serif text-stone-700 text-base cursor-not-allowed">
                          University Campus ID / Student Wallet
                        </label>
                      </div>
                      <p className="text-stone-400 font-sans text-xs">
                        Deductions directly via student registration account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Item Review Table */}
          <section className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
            <h2 className="text-xl font-serif text-stone-900 tracking-tight pb-6 mb-6 border-b border-stone-200">
              Review Cart Items ({cartItems.length})
            </h2>

            <div className="divide-y divide-stone-200">
              {cartItems.map((item) => {
                const numericPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) || 0;
                const rowTotal = numericPrice * item.quantity;
                return (
                  <div key={item.id} className="py-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-stone-100 shrink-0 border border-stone-200 overflow-hidden">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">{item.category}</span>
                        <h4 className="font-serif text-stone-900 text-base leading-snug">{item.name}</h4>
                        <span className="text-stone-500 font-sans text-xs">Qty: {item.quantity} × {item.price}</span>
                      </div>
                    </div>
                    <span className="text-base font-sans tracking-wide text-stone-900 font-medium">
                      ₹{rowTotal.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Column: Sticky Summary & Confirmation Button */}
        <div className="w-full lg:w-[35%] shrink-0">
          <div className="bg-white border border-stone-200 p-8 md:p-10 sticky top-28 shadow-sm">
            <h2 className="text-sm font-sans uppercase tracking-widest text-stone-900 mb-6">
              Order Summary
            </h2>
            
            <div className="space-y-4 mb-8 text-sm font-sans tracking-wide text-stone-600">
              <div className="flex justify-between items-center">
                <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                <span className="text-stone-900">₹{safeCartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimated Tax (8%)</span>
                <span className="text-stone-900">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Campus Delivery</span>
                <span className="text-emerald-700 font-medium">Free</span>
              </div>
            </div>
            
            <div className="border-t border-stone-200 pt-6 mb-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-stone-500 font-medium block mb-1">
                    Grand Total
                  </span>
                  <span className="text-[10px] text-stone-400">Payable at Hostel Gate</span>
                </div>
                <span className="text-3xl font-serif text-stone-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Destination Snapshot */}
            <div className="mb-6 p-4 bg-[#FAF9F6] border border-stone-200 text-xs text-stone-600 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                Selected Method & Delivery
              </span>
              <p className="text-stone-900 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Cash on Delivery (COD)
              </p>
              {address.hostelBlock && address.roomNumber ? (
                <p className="text-stone-500 text-[11px] truncate">
                  Deliver to: {address.hostelBlock}, Room {address.roomNumber}
                </p>
              ) : (
                <p className="text-stone-400 italic text-[11px]">
                  Fill address on the left to verify delivery spot
                </p>
              )}
            </div>

            {/* Submit Error Message */}
            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
                {submitError}
              </div>
            )}

            {/* Place Order CTA Button */}
            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full bg-stone-900 text-white py-4 text-xs uppercase tracking-[0.15em] font-medium hover:bg-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Confirming Order...</span>
                </>
              ) : (
                <span>Confirm & Place Order (COD)</span>
              )}
            </button>
            
            <p className="text-[10px] uppercase tracking-widest text-stone-400 text-center mt-6 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Verified Campus Logistics • COD Protected
            </p>
          </div>
        </div>
        
      </div>

    </main>
  );
}
