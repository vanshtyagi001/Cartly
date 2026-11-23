import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16 px-6 border-t border-stone-800 mt-auto">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold tracking-tight text-white">Cartly<span className="text-amber-500">.</span></h3>
          <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
            Curated survival gear and stationery essentials for campus life. Engineered with tactile minimalism.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-stone-200 font-semibold mb-4">Catalog</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/shop" className="hover:text-white transition-colors">Hostel Essentials</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Stationery & Study</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Electronics & Power</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Trekking & Outdoor</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-stone-200 font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#care" className="hover:text-white transition-colors">Customer Care</a></li>
            <li><a href="#delivery" className="hover:text-white transition-colors">Campus Delivery</a></li>
            <li><a href="#refund" className="hover:text-white transition-colors">Refund Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-stone-200 font-semibold mb-4">Campus</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Direct-to-hostel delivery within 2 hours of dispatch. Handled by fellow students.
          </p>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto border-t border-stone-800 mt-12 pt-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-stone-500">
        <div>&copy; {new Date().getFullYear()} Cartly. Built for students.</div>
        <div className="flex gap-6">
          <a href="#terms" className="hover:text-stone-300">Terms</a>
          <a href="#privacy" className="hover:text-stone-300">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
