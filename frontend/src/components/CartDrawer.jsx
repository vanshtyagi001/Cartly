import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  // cartTotal is likely returning NaN from the context, so we'll ignore it and calculate safely here
  const { cartItems, updateQuantity, removeItem, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    setIsCartOpen(false); // Close the drawer
    navigate('/checkout'); // Route to the checkout page
  };

  // Safely parse string prices (e.g., "$85.00", "₹7,000.00") into raw numbers and sum them
  const safeSubtotal = cartItems.reduce((total, item) => {
    const numericPrice = parseFloat(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
    return total + (numericPrice * item.quantity);
  }, 0);

  return (
    <>
      {/* Dark overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ease-out ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sliding Drawer panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-[#FAF9F6] shadow-2xl z-[70] transform transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-stone-200 bg-white">
          <h2 className="text-2xl font-serif text-stone-900 tracking-tight">Your Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors group"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <span className="text-stone-400 font-serif italic text-lg">Your cart is beautifully empty.</span>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 group">
                {/* Product Image - Taller, editorial proportion */}
                <div className="w-24 h-32 bg-stone-100 shrink-0 border border-stone-200">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                
                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-serif text-lg leading-snug text-stone-900 line-clamp-2">{item.name}</h3>
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors mt-1"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between mt-4">
                    <span className="font-sans text-sm tracking-wide text-stone-600">{item.price}</span>
                    
                    {/* Minimalist Quantity Selector */}
                    <div className="flex items-center border border-stone-200 bg-white">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        <span className="text-lg leading-none mb-1">-</span>
                      </button>
                      <span className="w-8 text-center text-xs font-medium text-stone-900">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        <span className="text-lg leading-none mb-0.5">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="border-t border-stone-200 p-8 bg-white">
          <div className="flex justify-between items-end mb-8">
            <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">Subtotal</span>
            {/* Hardcoded $ is left here from original code, you can change to ₹ if needed */}
            <span className="text-2xl font-serif text-stone-900">₹{safeSubtotal.toFixed(2)}</span>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={handleCheckoutClick}
              disabled={cartItems.length === 0}
              className={`w-full py-4 text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                cartItems.length === 0 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-black hover:shadow-xl'
              }`}
            >
              Proceed to Checkout
            </button>
            <button 
              onClick={() => setIsCartOpen(false)} 
              className="w-full py-4 text-xs uppercase tracking-[0.15em] font-medium text-stone-600 bg-transparent border border-stone-300 hover:border-stone-900 hover:text-stone-900 transition-colors duration-300"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
}