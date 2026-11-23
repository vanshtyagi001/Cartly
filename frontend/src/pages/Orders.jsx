import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Mock data representing sample orders if database has no records yet
const fallbackMockOrders = [
  {
    id: "EQ-84729",
    date: "October 12, 2026",
    total: "₹2,400.00",
    status: "Delivered",
    paymentMethod: "Cash on Delivery",
    shippingAddress: { hostelBlock: "Block B", roomNumber: "201", campus: "North Campus" },
    items: [
      { id: 1, name: "Noise Cancelling Headphones", category: "Electronics", quantity: 1, price: "₹1,900.00", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop" },
      { id: 2, name: "Scientific Calculator", category: "Electronics", quantity: 1, price: "₹500.00", img: "https://images.unsplash.com/photo-1574607407408-1e681c46041d?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  {
    id: "EQ-73911",
    date: "September 04, 2026",
    total: "₹1,100.00",
    status: "Processing",
    paymentMethod: "Cash on Delivery",
    shippingAddress: { hostelBlock: "Tagore Hostel", roomNumber: "304", campus: "Main Campus" },
    items: [
      { id: 3, name: "Mattress Topper", category: "Hostel Essentials", quantity: 1, price: "₹1,100.00", img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=600&auto=format&fit=crop" }
    ]
  }
];

export default function Orders() {
  const { user, token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        let url = `${API_URL}/api/orders/`;
        if (!token && user?.email) {
          url += `?email=${encodeURIComponent(user.email)}`;
        }

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
          } else {
            // If user has no orders yet in DB, show fallback mock data
            setOrders(fallbackMockOrders);
          }
        } else {
          setOrders(fallbackMockOrders);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setOrders(fallbackMockOrders);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [API_URL, token, user]);

  return (
    <main className="flex-1 w-full bg-white border-t border-stone-200 min-h-[calc(100vh-88px)] py-16 lg:py-24">
      <div className="max-w-[1000px] mx-auto px-8 md:px-12">
        
        {/* Page Header */}
        <div className="border-b border-stone-200 pb-8 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tighter mb-4">
              {isAuthenticated && user?.name ? `${user.name.split(' ')[0]}'s Orders.` : 'Your Orders.'}
            </h1>
            <p className="text-stone-500 font-sans text-sm tracking-wide max-w-md">
              {isAuthenticated && user?.email 
                ? `Live tracking for verified student account ${user.email}` 
                : 'Review your past campus purchases and track delivery to your hostel.'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {!isAuthenticated && (
              <Link
                to="/login"
                state={{ from: { pathname: '/orders' } }}
                className="text-[10px] uppercase tracking-widest text-stone-900 font-medium hover:text-stone-600 transition-colors border-b border-stone-900 pb-1"
              >
                Sign In to Sync
              </Link>
            )}
            <Link 
              to="/shop" 
              className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors border-b border-stone-300 hover:border-stone-900 pb-1 w-fit"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-24 text-center">
            <span className="text-stone-400 font-serif italic text-lg block mb-2">
              Retrieving your campus orders...
            </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center">
            <span className="text-stone-400 font-serif italic text-xl block mb-6">
              You haven't placed any orders yet.
            </span>
            <Link 
              to="/shop" 
              className="inline-block bg-stone-900 text-white py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors duration-300"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="flex flex-col space-y-16">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col border border-stone-200/80 p-6 md:p-8 bg-[#FAF9F6]/30">
                
                {/* Order Meta Header - Architectural Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-stone-200 mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold">Order Number</span>
                    <span className="text-sm font-sans font-medium text-stone-900">{order.id}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold">Date Placed</span>
                    <span className="text-sm font-sans text-stone-900">{order.date}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold">Total Amount</span>
                    <span className="text-sm font-sans text-stone-900">{order.total}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold">Status & Payment</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-sans flex items-center gap-1.5 ${
                        order.status === 'Delivered' ? 'text-stone-900' : 'text-emerald-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        {order.status || 'Confirmed'}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        {order.paymentMethod || 'Cash on Delivery'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Location Snapshot */}
                {order.shippingAddress && (order.shippingAddress.hostelBlock || order.shippingAddress.roomNumber) && (
                  <div className="mb-6 p-3 bg-stone-50 border border-stone-200/60 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-semibold text-stone-500">Hostel Destination:</span>
                      <span className="text-stone-900 font-medium">
                        {order.shippingAddress.hostelBlock}, Room {order.shippingAddress.roomNumber} ({order.shippingAddress.campus})
                      </span>
                    </div>
                    {order.shippingAddress.phone && (
                      <span className="text-stone-500 text-[11px]">Phone: {order.shippingAddress.phone}</span>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="flex flex-col gap-6">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex gap-6 items-center group">
                      
                      {/* Item Image */}
                      <div className="w-20 h-24 shrink-0 bg-white border border-stone-200 overflow-hidden">
                        {item.img ? (
                          <img 
                            src={item.img} 
                            alt={item.name} 
                            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-serif">
                            Item
                          </div>
                        )}
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-stone-400 mb-1">
                            {item.category || 'Essentials'}
                          </span>
                          <span className="text-base font-serif text-stone-900 leading-tight">
                            {item.name}
                          </span>
                          <span className="text-xs font-sans text-stone-500 mt-2 sm:hidden">
                            Qty: {item.quantity} • {item.price}
                          </span>
                        </div>
                        
                        <div className="hidden sm:flex items-center gap-12 text-sm font-sans text-stone-900">
                          <span className="text-stone-500 text-xs tracking-wide">Qty: {item.quantity}</span>
                          <span className="font-medium">{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
