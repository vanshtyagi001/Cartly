import { useState } from 'react';
import heroImage from '../assets/hero.jpg';

export default function Hero() {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="relative w-full h-[calc(100vh-88px)] bg-[#FAF9F6] overflow-hidden flex items-end px-8 md:px-12 pb-16">
      
      {/* 
        The Expanding Image 
        Transitions from a 4:5 portrait box on the right, to full viewport 
      */}
      <div
        className={`absolute z-0 transition-all duration-[1.2s] ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden ${
          isRevealed 
            ? 'inset-0 w-full h-full' 
            : 'bottom-16 right-8 md:right-16 w-3/4 md:w-[400px] xl:w-[480px] aspect-[4/5] xl:aspect-[3/4] shadow-2xl shadow-stone-900/10'
        }`}
      >
        <img 
          src={heroImage}
          alt="Campus Essentials"
          className={`w-full h-full object-cover transition-transform duration-[2s] ease-out ${
            isRevealed ? 'scale-105' : 'scale-100'
          }`}
        />
        {/* Dark overlay for full-screen mode to ensure text contrast */}
        <div className={`absolute inset-0 bg-stone-950/40 transition-opacity duration-1000 ${
          isRevealed ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Foreground Typography */}
      <div className={`relative z-10 max-w-4xl transition-colors duration-700 ${
        isRevealed ? 'text-white' : 'text-stone-900'
      }`}>
        <span className={`block text-[10px] uppercase tracking-[0.25em] font-semibold mb-6 transition-opacity duration-500 ${
          isRevealed ? 'opacity-70' : 'text-stone-400'
        }`}>
          Essentials
        </span>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-tighter leading-[1.05]">
          Everything you need <br />
          <span className="italic font-light">to stay in the loop.</span>
        </h1>
        
        <p className={`mt-8 text-sm md:text-base font-sans max-w-md leading-relaxed transition-opacity duration-500 ${
          isRevealed ? 'opacity-80' : 'text-stone-500'
        }`}>
          Curated campus essentials, carefully selected for the modern student experience.
        </p>
      </div>

      {/* Interactive Switch - Brutalist Crosshair */}
      <div className="absolute bottom-16 right-8 md:right-16 z-20 flex items-center">
        <button
          onMouseEnter={() => setIsRevealed(true)}
          onMouseLeave={() => setIsRevealed(false)}
          onFocus={() => setIsRevealed(true)}
          onBlur={() => setIsRevealed(false)}
          className={`w-12 h-12 flex items-center justify-center transition-all duration-500 cursor-pointer group ${
            isRevealed 
              ? 'bg-transparent border border-white/30 backdrop-blur-sm' 
              : 'bg-white border border-stone-300 hover:border-stone-900'
          }`}
          aria-label="Reveal immersive view"
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
              isRevealed ? 'rotate-[135deg] text-white' : 'text-stone-900 group-hover:rotate-90'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
    </div>
  );
}