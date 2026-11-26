import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 w-full">
      {/* Editorial Hero */}
      <section className="bg-white border-b border-stone-200 py-20 lg:py-28 px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-stone-400 block mb-4">
            About Cartly
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-stone-900 tracking-tight leading-[1.08] max-w-3xl mb-6">
            Curated essentials for the <span className="italic font-light">modern campus</span> experience.
          </h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            Cartly is a student-first campus marketplace designed to make everyday university life simpler. From hostel room necessities and academic stationery to reliable electronics and trekking gear, we connect verified campus sellers directly with students.
          </p>
        </div>
      </section>

      {/* Philosophy & Numbers */}
      <section className="py-16 lg:py-24 px-6 md:px-12 border-b border-stone-200">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-3">
              Our Mission
            </span>
            <h2 className="text-3xl font-serif text-stone-900 tracking-tight mb-4">
              Built by students, for campus life.
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed mb-4">
              Moving into a hostel or gearing up for a new semester shouldn&apos;t mean waiting days for off-campus couriers or navigating confusing gate pickups.
            </p>
            <p className="text-stone-600 text-sm leading-relaxed">
              Cartly brings trusted campus depots, student-run stalls, and verified essentials into one calm, transparent marketplace—complete with Cash on Delivery and direct hostel room fulfillment.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 p-8">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                01 / Quality First
              </span>
              <h3 className="font-serif text-xl text-stone-900 mb-2">Verified Campus Sellers</h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                Every seller on Cartly undergoes campus administration review before listing products, ensuring authentic items and accountable local service.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-8">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                02 / Campus Speed
              </span>
              <h3 className="font-serif text-xl text-stone-900 mb-2">Direct Hostel Delivery</h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                Orders are fulfilled from North, South, and Central campus hubs straight to your hostel block and room number without main-gate friction.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-8">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                03 / Zero Friction
              </span>
              <h3 className="font-serif text-xl text-stone-900 mb-2">Cash on Delivery</h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                Inspect your order at your hostel door before paying. Simple, trustworthy transactions tailored for student budgets.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-8">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                04 / Student Commerce
              </span>
              <h3 className="font-serif text-xl text-stone-900 mb-2">Empowering Creators</h3>
              <p className="text-stone-500 text-xs leading-relaxed">
                Student entrepreneurs can launch their own storefront in minutes via Seller Studio, manage live stock, and grow their campus brand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 lg:py-20 px-6 md:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 border border-stone-200 bg-[#FAF9F6] p-8 sm:p-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
              Explore Cartly
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
              Ready to upgrade your semester setup?
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link
              to="/shop"
              className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 px-8 hover:bg-black transition-colors"
            >
              Browse Shop
            </Link>
            <Link
              to="/seller"
              className="border border-stone-300 bg-white text-stone-900 text-xs uppercase tracking-[0.15em] font-medium py-4 px-8 hover:border-stone-900 transition-colors"
            >
              Sell on Cartly
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
