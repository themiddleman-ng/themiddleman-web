'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Development', 'Design', 'Marketing', 'Writing'];

  const gigs = [
    {
      id: 1,
      title: 'Modern Next.js & React Web App Development',
      category: 'Development',
      seller: 'Alex River',
      rating: 4.9,
      reviewsCount: 128,
      price: 150,
      image: '/next.svg',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 2,
      title: 'Professional Brand Identity & Logo Design',
      category: 'Design',
      seller: 'Sarah Miller',
      rating: 4.8,
      reviewsCount: 95,
      price: 80,
      image: '/window.svg',
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 3,
      title: 'High-Converting Copywriting & Sales Pages',
      category: 'Writing',
      seller: 'David K.',
      rating: 5.0,
      reviewsCount: 42,
      price: 60,
      image: '/file.svg',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 4,
      title: 'UI/UX Mobile App Design in Figma',
      category: 'Design',
      seller: 'Emily Tsang',
      rating: 4.9,
      reviewsCount: 74,
      price: 200,
      image: '/globe.svg',
      color: 'from-purple-500 to-violet-600',
    },
    {
      id: 5,
      title: 'Full-Stack Supabase Integration & DB Setup',
      category: 'Development',
      seller: 'Liam Wright',
      rating: 4.7,
      reviewsCount: 51,
      price: 120,
      image: '/next.svg',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 6,
      title: 'SEO Optimization & Content Marketing Strategy',
      category: 'Marketing',
      seller: 'Sophia Lane',
      rating: 4.6,
      reviewsCount: 33,
      price: 90,
      image: '/globe.svg',
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gig.seller.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Middleman
            </span>
            <div className="hidden md:flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <a href="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Browse</a>
              <a href="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">My Orders</a>
              <a href="#" className="hover:text-zinc-950 dark:hover:text-white transition-colors">Messages</a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            />
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
              <div className="h-full w-full rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                U
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <header className="relative overflow-hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-30" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-2xl">
            Find the perfect service for your next project
          </h1>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400 max-w-lg">
            Connect with verified independent service providers to build, design, write, and launch your ideas.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-sm'
                  : 'bg-white hover:bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gigs Grid */}
        {filteredGigs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGigs.map((gig) => (
              <div
                key={gig.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 hover:shadow-xl dark:hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div>
                  {/* Aspect Card Header */}
                  <div className={`relative h-40 w-full bg-gradient-to-br ${gig.color} p-6 flex flex-col justify-between`}>
                    <span className="self-start rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                      {gig.category}
                    </span>
                    <div className="flex items-center justify-center opacity-85 group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={gig.image}
                        alt=""
                        width={48}
                        height={48}
                        className="invert brightness-0"
                      />
                    </div>
                    <div className="text-[10px] font-medium text-white/80 self-end">
                      Managed Securely
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                        {gig.seller.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {gig.seller}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {gig.title}
                    </h3>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-5 py-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-500">★</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{gig.rating}</span>
                    <span className="text-xs text-zinc-400">({gig.reviewsCount})</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Starting at</span>
                    <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">${gig.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No services found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
