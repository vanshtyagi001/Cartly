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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);
  const [returnForm, setReturnForm] = useState({ type: 'Return', reason: '' });
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleReturnSubmit = async (e, orderId) => {
    e.preventDefault();
    if (!returnForm.reason.trim()) return;
    setCancelError('');
    setCancelSuccess('');
    setIsSubmittingReturn(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(returnForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit return request.');
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setSelectedOrder(data.order);
      }
      setIsRequestingReturn(false);
      setReturnForm({ type: 'Return', reason: '' });
      setCancelSuccess(data.message || 'Return request submitted.');
    } catch (err) {
      setCancelError(err.message || 'Failed to submit return request.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancelError('');
    setCancelSuccess('');
    setIsCancellingOrder(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not cancel order.');
      }

      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setSelectedOrder(data.order);
      }
      setConfirmingCancelId(null);
      setCancelSuccess(data.message || 'Order cancelled successfully.');
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const getFulfillmentStage = (status) => {
    switch (status) {
      case 'Delivered':
        return 3;
      case 'Out for Delivery':
        return 2;
      case 'Preparing':
        return 1;
      case 'Cancelled':
        return -1;
      case 'Confirmed':
      default:
        return 0;
    }
  };

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
    <main className="flex-1 w-full bg-white border-t border-stone-200 min-h-[calc(100vh-88px)] py-16 lg:py-24 relative">
      {/* Detailed Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-stone-200 p-6 sm:p-10 shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-6 mb-8 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold">
                    Campus Delivery Manifest
                  </span>
                  <span className="text-[9px] uppercase tracking-wider bg-stone-100 text-stone-800 px-2 py-0.5 font-medium border border-stone-200">
                    {selectedOrder.status || 'Confirmed'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                  Order #{selectedOrder.id}
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-1">
                  Placed on {selectedOrder.date}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-900 text-sm p-2 hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                ✕ Close
              </button>
            </div>

            {/* Tracking Progress Stepper */}
            <div className="mb-10 bg-[#FAF9F6] border border-stone-200 p-6">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-6">
                Live Fulfillment Progress
              </span>

              {selectedOrder.status === 'Cancelled' ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
                  This order has been cancelled. If you believe this is an error, please reach out to campus logistics.
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-3 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
                  <div
                    className="absolute top-3 left-6 h-0.5 bg-stone-900 transition-all duration-500 -z-0"
                    style={{
                      width: `${Math.min(100, Math.max(0, (getFulfillmentStage(selectedOrder.status) / 3) * 100))}%`,
                    }}
                  />

                  {/* 4 Checkpoint Dots */}
                  <div className="relative z-10 flex justify-between items-start text-center">
                    {[
                      { label: 'Confirmed', sub: 'Order Logged' },
                      { label: 'Preparing', sub: 'Packed at Hub' },
                      { label: 'Out for Delivery', sub: 'En Route' },
                      { label: 'Delivered', sub: 'Room Doorstep' },
                    ].map((step, idx) => {
                      const stageIdx = getFulfillmentStage(selectedOrder.status);
                      const isComplete = stageIdx >= idx;
                      const isCurrent = stageIdx === idx;

                      return (
                        <div key={idx} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors mb-2 ${
                              isCurrent
                                ? 'bg-stone-900 text-white ring-4 ring-stone-200'
                                : isComplete
                                ? 'bg-stone-900 text-white'
                                : 'bg-white border-2 border-stone-300 text-stone-400'
                            }`}
                          >
                            {isComplete && !isCurrent ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[11px] font-medium leading-tight ${isComplete ? 'text-stone-900' : 'text-stone-400'}`}>
                            {step.label}
                          </span>
                          <span className="text-[9px] text-stone-400 hidden sm:block mt-0.5">
                            {step.sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Destination & Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
              <div className="border border-stone-200 p-5 bg-[#FAF9F6]/40">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-3">
                  Hostel Drop-off Point
                </span>
                <p className="font-serif text-stone-900 text-base mb-1">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.userName || user?.name || 'Student Resident'}
                </p>
                <p className="text-stone-600 leading-relaxed">
                  {selectedOrder.shippingAddress?.hostelBlock || 'Hostel Block'}, Room {selectedOrder.shippingAddress?.roomNumber || '—'}
                </p>
                <p className="text-stone-500">
                  {selectedOrder.shippingAddress?.campus || 'Campus Grounds'}
                </p>
                {selectedOrder.shippingAddress?.phone && (
                  <p className="text-stone-700 font-mono mt-2 pt-2 border-t border-stone-200/60">
                    Contact: {selectedOrder.shippingAddress.phone}
                  </p>
                )}
              </div>

              <div className="border border-stone-200 p-5 bg-[#FAF9F6]/40">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-3">
                  Delivery Logistics & Schedule
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Delivery Window:</span>
                    <span className="text-stone-900 font-medium">
                      {selectedOrder.shippingAddress?.deliverySlot || 'Standard Delivery (within 2 hours)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase">Payment Mode:</span>
                    <span className="text-stone-900 font-medium">
                      {selectedOrder.paymentMethod || 'Cash on Delivery (Pay at Doorstep)'}
                    </span>
                  </div>
                  {selectedOrder.shippingAddress?.deliveryNotes && (
                    <div className="pt-2 border-t border-stone-200/60">
                      <span className="text-stone-400 block text-[10px] uppercase">Resident Notes:</span>
                      <p className="text-stone-600 italic">
                        "{selectedOrder.shippingAddress.deliveryNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Order Products */}
            <div className="mb-8">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-4">
                Purchased Items ({selectedOrder.items?.length || 0})
              </span>

              <div className="border border-stone-200 divide-y divide-stone-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-white border border-stone-200 overflow-hidden shrink-0">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Photo</div>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                          {item.category || 'Essential'}
                        </span>
                        <p className="font-serif text-sm text-stone-900 font-medium">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Qty: {item.quantity} × {item.price}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-sans font-medium text-stone-900">
                        {item.price}
                      </span>
                      {item.id && (
                        <Link
                          to={`/product/${item.id}`}
                          onClick={() => setSelectedOrder(null)}
                          className="block text-[10px] text-stone-500 hover:text-stone-900 underline mt-1"
                        >
                          View item
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-stone-200 pt-6 mb-8 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Items Subtotal</span>
                  <span>{selectedOrder.subtotal ? `₹${Number(selectedOrder.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : selectedOrder.total}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Campus Delivery</span>
                  <span className="text-emerald-700 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Logistics & Handling</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-stone-900 font-medium text-sm pt-2 border-t border-stone-200">
                  <span>Total Payable</span>
                  <span className="font-serif text-base">{selectedOrder.total}</span>
                </div>
                <p className="text-[10px] text-stone-400 pt-1 text-right">
                  Payment collected in cash or QR at room handover.
                </p>
              </div>
            </div>

            {/* Cancellation Feedback / Inline Confirmation */}
            {cancelError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs">
                {cancelError}
              </div>
            )}
            {cancelSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {cancelSuccess}
              </div>
            )}

            {confirmingCancelId === selectedOrder.id && (
              <div className="mb-6 p-4 bg-[#FAF9F6] border border-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-stone-700">
                  <strong className="text-stone-900 block mb-0.5">Confirm Order Cancellation</strong>
                  <span>This will cancel Order #{selectedOrder.id} and release the reserved stock.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isCancellingOrder}
                    onClick={() => setConfirmingCancelId(null)}
                    className="px-4 py-2 text-[10px] uppercase tracking-widest text-stone-600 border border-stone-300 bg-white hover:text-stone-900"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={isCancellingOrder}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="px-4 py-2 text-[10px] uppercase tracking-widest bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    {isCancellingOrder ? 'Cancelling...' : 'Yes, Cancel Order'}
                  </button>
                </div>
              </div>
            )}

            {selectedOrder.returnRequest && (
              <div className="mb-6 p-4 bg-[#FAF9F6] border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-700">
                    {selectedOrder.returnRequest.type} Request
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-white border border-stone-300 text-stone-800">
                    {selectedOrder.returnRequest.status}
                  </span>
                </div>
                <p className="text-stone-600">{selectedOrder.returnRequest.reason}</p>
              </div>
            )}

            {isRequestingReturn && selectedOrder.status === 'Delivered' && !selectedOrder.returnRequest && (
              <form
                onSubmit={(e) => handleReturnSubmit(e, selectedOrder.id)}
                className="mb-6 p-5 bg-[#FAF9F6] border border-stone-300 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-800">
                    7-Day Return / Replacement Request
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRequestingReturn(false)}
                    className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={returnForm.type}
                    onChange={(e) => setReturnForm((p) => ({ ...p, type: e.target.value }))}
                    className="bg-white border border-stone-200 px-3 py-2 text-xs focus:border-stone-900 focus:outline-none"
                  >
                    <option value="Return">Return &amp; Refund</option>
                    <option value="Replacement">Replacement</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Reason (e.g., damaged item, wrong size)"
                    className="sm:col-span-2 bg-white border border-stone-200 px-3 py-2 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="bg-stone-900 text-white text-[10px] uppercase tracking-widest px-5 py-2.5 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-stone-200">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900 border border-stone-200 px-4 py-2.5 bg-[#FAF9F6] transition-colors"
                >
                  Print Manifest / Receipt
                </button>

                {isAuthenticated && selectedOrder.status === 'Confirmed' && confirmingCancelId !== selectedOrder.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError('');
                      setCancelSuccess('');
                      setConfirmingCancelId(selectedOrder.id);
                    }}
                    className="text-[10px] uppercase tracking-widest text-red-700 hover:text-red-900 border border-red-200 px-4 py-2.5 bg-red-50/60 hover:bg-red-50 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}

                {isAuthenticated && selectedOrder.status === 'Delivered' && !selectedOrder.returnRequest && !isRequestingReturn && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelError('');
                      setCancelSuccess('');
                      setIsRequestingReturn(true);
                    }}
                    className="text-[10px] uppercase tracking-widest text-stone-800 hover:text-black border border-stone-300 px-4 py-2.5 bg-white transition-colors"
                  >
                    Request Return / Replacement
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setConfirmingCancelId(null);
                  setCancelError('');
                  setCancelSuccess('');
                }}
                className="bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium px-8 py-2.5 hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

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
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm font-sans font-medium text-stone-900 hover:text-amber-900 text-left underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
                      title="View complete delivery manifest"
                    >
                      {order.id}
                    </button>
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

                {/* Order Card Footer Action */}
                <div className="pt-6 mt-6 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-[11px] text-stone-500 font-mono">
                    {order.items?.length || 0} {order.items?.length === 1 ? 'essential item' : 'essential items'} • Campus Doorstep Delivery
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-2 bg-stone-900 text-white hover:bg-black text-[10px] uppercase tracking-widest font-medium py-2.5 px-6 transition-colors shadow-sm"
                  >
                    <span>View Order Details & Tracking</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
