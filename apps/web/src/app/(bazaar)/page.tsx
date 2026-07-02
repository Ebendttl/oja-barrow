"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Flame, CheckCircle, ShieldCheck, Sparkles, Store } from "lucide-react";
import { db, Product, Category, Vendor } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function BazaarHomepage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Countdown state for Market Days Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 22, minutes: 59, seconds: 59 });

  useEffect(() => {
    // Read from client database
    setProducts(db.products);
    setCategories(db.categories.filter(c => c.parent_id === null)); // Top-level categories
    setVendors(db.vendors);

    // Live countdown timer loop
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(p => {
        // Find subcategories if any
        const subcategories = db.categories.filter(c => c.parent_id === selectedCategory).map(c => c.id);
        const allowedCategories = [selectedCategory, ...subcategories];
        return p.category_id && allowedCategories.includes(p.category_id);
      })
    : products;

  const haggleFriendlyProducts = products.filter(p => p.haggle_enabled);

  return (
    <div className="space-y-10">
      
      {/* 1. Market Day Banner / Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-brand-indigo text-brand-neutral shadow-xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 border-2 border-brand-sunflower">
        {/* Ankara Motif watermark */}
        <div className="adire-pattern absolute inset-0 pointer-events-none" />

        <div className="relative z-10 flex-1 space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-brand-coral text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider animate-pulse">
            <Flame className="h-4 w-4" /> Live Flash Sale
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight leading-tight">
            Lagos Market Day <br className="hidden md:inline" />
            <span className="text-brand-sunflower">Frenzy is Live!</span>
          </h1>
          
          <p className="text-brand-neutral/85 text-sm md:text-base max-w-md font-medium leading-relaxed">
            Haggle on select UK-Used iPhones, smart audio, and handmade silk adire fabrics. Up to 10% off automatically applied at checkout!
          </p>

          <div className="flex gap-3 pt-2">
            <Link href="/market-days">
              <Button variant="secondary" className="font-extrabold px-6">
                Shop Deals
              </Button>
            </Link>
            <Link href="/sell-on-oja">
              <Button variant="outline" className="border-brand-neutral/30 text-brand-neutral hover:bg-white/10 font-bold">
                Register Stall
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Countdown Clock Widget */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center w-full md:w-fit min-w-[280px]">
          <span className="text-xs uppercase font-black text-brand-sunflower tracking-widest block mb-2">
            ⏰ Time Left to Haggle
          </span>
          <div className="flex items-center justify-center gap-3">
            <div>
              <span className="text-4xl font-extrabold font-display block text-white bg-brand-indigo/60 px-3 py-2 rounded-xl">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-white/60 mt-1 block">Hours</span>
            </div>
            <span className="text-2xl font-black text-brand-sunflower -mt-6">:</span>
            <div>
              <span className="text-4xl font-extrabold font-display block text-white bg-brand-indigo/60 px-3 py-2 rounded-xl">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-white/60 mt-1 block">Mins</span>
            </div>
            <span className="text-2xl font-black text-brand-sunflower -mt-6">:</span>
            <div>
              <span className="text-4xl font-extrabold font-display block text-white bg-brand-indigo/60 px-3 py-2 rounded-xl">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-white/60 mt-1 block">Secs</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-brand-neutral/70 mt-4 block">
            Locked checkout cart holds active deals for 15 mins.
          </span>
        </div>
      </section>

      {/* 2. Horizontal Category Rail */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-extrabold font-display">Explore Categories</h2>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border-2 active:scale-95 ${
              selectedCategory === null
                ? "bg-brand-indigo border-brand-indigo text-brand-neutral shadow-md"
                : "bg-white border-brand-border text-brand-indigo hover:border-brand-indigo/40"
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border-2 active:scale-95 ${
                selectedCategory === cat.id
                  ? "bg-brand-indigo border-brand-indigo text-brand-neutral shadow-md"
                  : "bg-white border-brand-border text-brand-indigo hover:border-brand-indigo/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Haggle-Friendly Deals Shelf (Surfaced Differentiator) */}
      <section className="space-y-4 bg-brand-sunflower/10 border-2 border-dashed border-brand-sunflower/45 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl md:text-2xl font-extrabold font-display flex items-center gap-1.5 text-brand-indigo">
              🤝 Haggle-Friendly Deals
            </h2>
            <p className="text-xs font-semibold text-brand-indigo/70">
              Don&apos;t pay full price! Tap &quot;Make Offer&quot; to strike a deal with the vendor in under 5 rounds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {haggleFriendlyProducts.map(product => {
            const vendor = vendors.find(v => v.id === product.vendor_id);
            return (
              <div
                key={product.id}
                className="group relative bg-white border border-brand-border rounded-2xl overflow-hidden hover:border-brand-coral hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-video w-full bg-brand-neutral overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-brand-coral text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Haggle Mode
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-brand-indigo/60">
                      <Store className="h-3.5 w-3.5 text-brand-coral" />
                      <span>{vendor?.store_name || "Verified Stall"}</span>
                    </div>
                    <h3 className="font-extrabold text-base leading-snug group-hover:text-brand-coral transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-brand-indigo/70 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-neutral">
                    <div>
                      <span className="text-[10px] uppercase font-black text-brand-indigo/50 block">Start Price</span>
                      <span className="text-lg font-black font-display text-brand-indigo">
                        ₦{product.price.toLocaleString()}
                      </span>
                    </div>
                    
                    <Link href={`/product/${product.slug}`}>
                      <Button variant="secondary" size="sm" className="font-black text-xs hover:scale-105 transition-all">
                        Make an Offer 🤝
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Trending Stalls (Vendors) */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-extrabold font-display">Trending Stalls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {vendors.map(vendor => (
            <Link
              key={vendor.id}
              href={`/vendor/${vendor.slug}`}
              className="bg-white border border-brand-border rounded-2xl p-5 hover:border-brand-coral/50 hover:shadow-md transition-all duration-200 text-center flex flex-col items-center justify-between space-y-4"
            >
              <div className="h-14 w-14 rounded-full bg-brand-sunflower/20 flex items-center justify-center text-2xl font-black font-display text-brand-coral">
                {vendor.store_name.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base">{vendor.store_name}</h3>
                <p className="text-xs text-brand-indigo/75 line-clamp-2 leading-relaxed">
                  {vendor.bio}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-brand-coral bg-brand-coral/5 px-2.5 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3 text-brand-coral" /> Verified Trader
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. General Product Catalog */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-extrabold font-display">General Catalog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const vendor = vendors.find(v => v.id === product.vendor_id);
            return (
              <div
                key={product.id}
                className="group bg-white border border-brand-border rounded-2xl overflow-hidden hover:border-brand-indigo hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-brand-neutral overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"}
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.haggle_enabled && (
                    <div className="absolute top-2.5 left-2.5 bg-brand-coral text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Negotiable 🤝
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-brand-indigo/55 line-clamp-1">
                      {vendor?.store_name || "Verified Seller"}
                    </div>
                    <h3 className="font-extrabold text-sm leading-snug line-clamp-1">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-neutral">
                    <span className="font-black text-sm text-brand-indigo">
                      ₦{product.price.toLocaleString()}
                    </span>
                    <Link href={`/product/${product.slug}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-extrabold px-3.5">
                        View Stall
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Mobile Trust Badges Banner */}
      <section className="bg-brand-indigo text-brand-neutral rounded-2xl p-5 border border-brand-indigo shadow-md md:hidden space-y-4">
        <div className="flex gap-3">
          <ShieldCheck className="h-6 w-6 text-brand-sunflower shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm text-brand-sunflower">Escrow Safeguarded</h4>
            <p className="text-xs text-brand-neutral/80 mt-0.5">
              Funds are held securely. Sellers are paid only when you confirm you have received your exact item.
            </p>
          </div>
        </div>
        <div className="flex gap-3 pt-2 border-t border-white/10">
          <Sparkles className="h-6 w-6 text-brand-coral shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm text-brand-coral">No Wahala Disputes</h4>
            <p className="text-xs text-brand-neutral/80 mt-0.5">
              Instant mediation and fast refunds if you get damaged, missing, or incorrect goods.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
