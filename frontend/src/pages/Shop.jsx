import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef(null);
  
  // State to hold products and categories from backend
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    "All Products", "Hostel Essentials", "Electronics", "Stationery", "Trekking Essentials"
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products and categories from backend on component mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    Promise.all([
      fetch(`${apiUrl}/api/products`).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/categories`).then(r => r.json()).catch(() => ({ categories: [] }))
    ])
      .then(([prods, catData]) => {
        setProducts(Array.isArray(prods) ? prods : []);
        if (catData?.categories && Array.isArray(catData.categories)) {
          setCategories(["All Products", ...catData.categories]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching shop data:", error);
        setIsLoading(false);
      });
  }, []);
  
  // Read current states from the URL, defaulting to Name: A to Z
  const activeCategory = searchParams.get("category") || "All Products";
  const activeSort = searchParams.get("sort") || "name-asc";

  const sortOptions = [
    { id: 'name-asc', label: 'Name: A to Z' },
    { id: 'name-desc', label: 'Name: Z to A' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' }
  ];

  // 1. Filter by Category
  let displayedProducts = activeCategory === "All Products" 
    ? [...products] 
    : products.filter(product => product.category === activeCategory);

  // 2. Sort the Filtered Products
  displayedProducts.sort((a, b) => {
    // Safety check: if price is missing while loading, skip sorting
    if (a.price === undefined || b.price === undefined) return 0; 

    // This handles BOTH strings ("$45") and raw numbers (45) safely without crashing
    const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : a.price;
    const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : b.price;

    if (activeSort === 'price-asc') return priceA - priceB;
    if (activeSort === 'price-desc') return priceB - priceA;
    if (activeSort === 'name-desc') return b.name.localeCompare(a.name);
    
    // Default fallback is Name: A to Z
    return a.name.localeCompare(b.name); 
  });

  // Smart URL parameter updating
  const handleCategoryClick = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === "All Products") {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    setSearchParams(newParams);
  };

  const handleSortClick = (sortId) => {
    const newParams = new URLSearchParams(searchParams);
    // If selecting the default sort, remove it from the URL to keep it clean
    if (sortId === "name-asc") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", sortId);
    }
    setSearchParams(newParams);
    setIsSortOpen(false);
  };

  // Close the sort dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.id === activeSort)?.label || "Name: A to Z";

  return (
    <main className="flex-1 w-full bg-white border-t border-stone-200 min-h-[calc(100vh-88px)]">
      <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex flex-col md:flex-row items-stretch">
        
        {/* Left Sidebar - Architectural Vertical Column */}
        <aside className="w-full md:w-56 shrink-0 flex flex-col pt-16 pr-8 md:pr-12 md:border-r border-stone-200">
          <h3 className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-10">Categories</h3>
          <ul className="flex flex-col space-y-5">
            {categories.map((cat) => (
              <li key={cat}>
                {/* Custom Left-to-Right Underline Hover Interaction */}
                <button 
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative text-left w-fit text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 pb-1 
                    after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-stone-900 after:transition-all after:duration-[400ms] after:ease-[cubic-bezier(0.25,0.1,0.25,1)]
                    ${
                    activeCategory === cat 
                      ? 'text-stone-900 font-semibold after:w-full' 
                      : 'text-stone-400 hover:text-stone-900 after:w-0 hover:after:w-full'
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 flex flex-col min-w-0 md:pl-12 pt-12 md:pt-16 pb-24">
          
          {/* Top Header / Filters - Structural Horizontal Axis */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-5 border-b border-stone-200 gap-4">
            <div className="text-stone-500 font-sans text-xs tracking-wide">
              Showing {displayedProducts.length} {displayedProducts.length === 1 ? 'Product' : 'Products'}
            </div>
            
            <div className="flex items-center space-x-8">
              <button className="text-[10px] uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 flex items-center gap-2 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              
              {/* Custom Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 transition-colors focus:outline-none"
                >
                  <span>Sort: {currentSortLabel}</span>
                  <svg className={`w-3 h-3 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div 
                  className={`absolute right-0 mt-4 w-52 bg-white border border-stone-200/80 shadow-xl shadow-stone-900/5 z-20 transition-all duration-300 origin-top-right ${
                    isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
                  }`}
                >
                  <div className="py-2 flex flex-col">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSortClick(option.id)}
                        className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-wider transition-colors ${
                          activeSort === option.id 
                            ? 'text-stone-900 bg-stone-50 font-medium' 
                            : 'text-stone-400 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid or Loading State */}
          {isLoading ? (
            <div className="py-32 text-center text-stone-400 font-serif italic text-xl">Loading essentials...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
              {displayedProducts.map((product) => (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id} 
                  className="group cursor-pointer block"
                >
                  {/* Image Frame - Warm paper tone against the pure white page */}
                  <div className="aspect-square w-full bg-[#FAF9F6] overflow-hidden border border-stone-200 mb-4 relative">
                    <img 
                      src={product.img} 
                      alt={product.name} 
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)]" 
                    />
                    {/* Minimalist hover overlay */}
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/[0.02] transition-colors duration-500" />
                  </div>
                  
                  {/* Product Info - Flush Left Alignment */}
                  <div className="flex flex-col pr-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 block">
                        {product.category}
                      </span>
                      {product.sellerName && product.sellerName !== "Cartly Campus Hub" && (
                        <span className="text-[8px] uppercase tracking-wider text-stone-500 font-medium truncate max-w-[100px]">
                          By {product.sellerName.split("'")[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-stone-900 font-serif text-base leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      <span className="text-stone-500 font-sans text-sm tracking-wide mt-1">
                        {product.price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {displayedProducts.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <span className="text-stone-400 font-serif italic text-xl">
                    No products found matching your criteria.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}