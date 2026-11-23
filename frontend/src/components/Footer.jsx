import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [isGridVisible, setIsGridVisible] = useState(false);
  const lastScrollY = useRef(0);

  // Track scroll direction to show/hide the grid
  useEffect(() => {
    // Set initial scroll position safely
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsGridVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsGridVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="bg-stone-950 text-stone-400 py-24 px-8 md:px-12 mt-auto shrink-0 w-full overflow-hidden relative">
      
      {/* 
        Interactive Scroll Grid 
        Appears on scroll down, fades on scroll up. Positioning remains perfectly centered.
      */}
      <div 
        className={`hidden lg:grid absolute top-1/2 left-[55%] xl:left-[52%] -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-4 w-[30rem] h-[30rem] xl:w-[40rem] xl:h-[40rem] transition-all duration-[1000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] z-0 pointer-events-none ${
          isGridVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Hostel */}
        <div className="bg-stone-900 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop" alt="Hostel Essentials" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
          <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white font-medium">Hostel</span>
        </div>
        {/* Trekking */}
        <div className="bg-stone-900 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=600&auto=format&fit=crop" alt="Trekking Essentials" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
          <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white font-medium">Trekking</span>
        </div>
        {/* Stationery */}
        <div className="bg-stone-900 overflow-hidden relative">
          <img src="https://www.study-horizon.com/static/images/blog/features/essay-exams.webp?q=80&w=600&auto=format&fit=crop" alt="Stationery" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
          <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white font-medium">Stationery</span>
        </div>
        {/* Electronics */}
        <div className="bg-stone-900 overflow-hidden relative">
          <img src="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=600&auto=format&fit=crop" alt="Electronics" className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
          <span className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white font-medium">Electronics</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between gap-20 relative z-10">
        
        {/* Left Side (70%): Branding & Newsletter */}
        <div className="lg:w-[70%] flex flex-col justify-between">
          <div className="mb-20 inline-block w-fit">
            <h2 className="text-[12vw] lg:text-[8rem] xl:text-[10rem] font-serif text-stone-100 leading-none tracking-tighter -ml-2 transition-colors duration-500 hover:text-white relative z-20">
              Cartly.
            </h2>
            <p className="text-stone-500 text-sm md:text-base font-sans mt-6 max-w-md leading-relaxed pointer-events-none relative z-20">
              Curated essentials for the modern campus experience. Thoughtfully selected, beautifully delivered.
            </p>
          </div>

          {/* Minimalist Newsletter */}
          <div className="max-w-md w-full relative z-20 mt-12">
            <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-500 mb-4 block">
              Subscribe to the dispatch
            </label>
            <div className="flex border-b border-stone-700 pb-2 transition-colors focus-within:border-stone-300">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-transparent border-none outline-none text-stone-100 placeholder:text-stone-600 font-sans text-sm"
              />
              <button className="text-[10px] uppercase tracking-[0.2em] text-stone-100 hover:text-stone-400 transition-colors shrink-0">
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* Right Side (30%): Clustered Navigation with Real Routes */}
        <div className="lg:w-[30%] flex flex-col lg:items-end text-left lg:text-right gap-12 lg:gap-16 relative z-20">
          
          <div className="flex flex-col gap-3">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-600 font-semibold mb-2">Shop</h4>
            <Link to="/shop" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">All Products</Link>
            <Link to="/shop?category=Hostel%20Essentials" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Hostel Essentials</Link>
            <Link to="/shop?category=Electronics" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Electronics</Link>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-600 font-semibold mb-2">Explore</h4>
            <Link to="/shop?category=Stationery" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Stationery</Link>
            <Link to="/shop?category=Trekking%20Essentials" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Trekking Essentials</Link>
            <Link to="/seller" className="text-sm font-sans tracking-wide text-amber-200/90 hover:text-white transition-colors duration-300">Sell on Cartly</Link>
            <Link to="/about" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">About Cartly</Link>
          </div>

          {/* Support remains anchor tags */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[9px] uppercase tracking-[0.25em] text-stone-600 font-semibold mb-2">Support</h4>
            <a href="#contact" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Contact Us</a>
            <a href="#care" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Customer Care</a>
            <a href="#delivery" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Delivery Info</a>
            <a href="#refund" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Refund Policy</a>
            <a href="#privacy" className="text-sm font-sans tracking-wide text-stone-300 hover:text-white transition-colors duration-300">Privacy Policy</a>
          </div>

        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="max-w-[1600px] mx-auto border-t border-stone-800/50 mt-20 pt-8 flex flex-col md:flex-row items-start lg:items-center justify-between gap-6 relative z-20">
        <div className="text-[10px] uppercase tracking-[0.1em] text-stone-600 font-medium">
          &copy; {new Date().getFullYear()} Cartly.
        </div>
        <div className="flex gap-8 text-[10px] uppercase tracking-[0.1em] text-stone-600 font-medium">
          <a href="#terms" className="hover:text-stone-300 transition-colors duration-300">Terms of Service</a>
          <a href="#privacy" className="hover:text-stone-300 transition-colors duration-300">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}