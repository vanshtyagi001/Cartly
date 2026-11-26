import React from 'react';
import Hero from '../components/Hero';
import HomeCatalog from '../components/HomeCatalog';

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col">
      <Hero />
      <HomeCatalog />
    </div>
  );
}