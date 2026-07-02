"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Search, Home, MessageSquare, Package, Store, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import { db } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function BazaarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [activeHaggles, setActiveHaggles] = useState(0);

  // Sync state on mount and intervals to represent live activity
  useEffect(() => {
    const updateStats = () => {
      // Buyer fixed user ID: '11111111-1111-1111-1111-111111111111'
      const buyerId = '11111111-1111-1111-1111-111111111111';
      const items = db.cartItems.filter(item => item.cart_id === `cart-${buyerId}`);
      const count = items.reduce((acc, curr) => acc + curr.quantity, 0);
      setCartCount(count);

      const threads = db.haggleThreads.filter(t => t.buyer_id === buyerId && t.status === 'open');
      setActiveHaggles(threads.length);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000); // Check every second for snappy feedback
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-brand-neutral text-brand-indigo pb-16 md:pb-0">
      {/* Ankara/Adire Top Stripe Accent */}
      <div className="adire-border" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-brand-border px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <span className="text-3xl font-extrabold tracking-tight font-display text-brand-coral">
              Ọjà
            </span>
            <span className="bg-brand-sunflower text-brand-indigo text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
              Bazaar
            </span>
          </Link>

          {/* Search bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search phones, fashion, electronics..."
              className="w-full bg-brand-neutral border border-brand-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-coral/55 focus:border-brand-coral"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                }
              }}
            />
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link href="/market-days" className="text-xs sm:text-sm font-semibold hover:text-brand-coral transition-colors px-2 py-1">
              💥 Market Days
            </Link>
            
            <Link href="/sell-on-oja" className="hidden sm:inline-block text-xs sm:text-sm font-semibold hover:text-brand-coral transition-colors px-2 py-1 text-brand-coral">
              Sell on Ọjà
            </Link>

            {/* Vendor Stall Dashboard link */}
            <Link href="/overview">
              <Button size="sm" variant="outline" className="hidden md:flex items-center gap-1 border-brand-indigo/30 text-xs py-1 px-3">
                <Store className="h-4 w-4 text-brand-coral" />
                <span>My Stall Console</span>
              </Button>
            </Link>

            {/* Cart Icon (Desktop) */}
            <Link href="/cart" className="relative p-2 hover:bg-brand-neutral rounded-full transition-colors">
              <ShoppingCart className="h-5.5 w-5.5 text-brand-indigo" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-coral text-white font-extrabold text-[10px] h-5 w-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer (Desktop/Tablet) */}
      <footer className="bg-brand-indigo text-brand-neutral mt-12 py-8 px-4 border-t border-brand-indigo/80 hidden md:block">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Brand Info */}
          <div>
            <h3 className="text-2xl font-bold font-display text-brand-sunflower mb-3">Ọjà</h3>
            <p className="text-sm text-brand-neutral/80 max-w-xs leading-relaxed">
              Nigeria&apos;s digital open market square. Haggle directly, buy safely, and get it shipped with 100% escrow protection.
            </p>
            <div className="mt-4 text-xs text-brand-neutral/60">
              © 2026 Ọjà Digital Markets Limited. All rights reserved.
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-brand-sunflower text-sm uppercase tracking-wider">Our Trust Safeguards</h4>
            
            <div className="flex gap-3">
              <div className="bg-white/10 p-2 rounded-xl h-fit">
                <ShieldCheck className="h-5 w-5 text-brand-sunflower" />
              </div>
              <div>
                <h5 className="text-sm font-semibold">100% Escrow Protection</h5>
                <p className="text-xs text-brand-neutral/70 mt-0.5">
                  Money is held safely by Barrow Engine. Payout to seller happens ONLY after you verify delivery.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-white/10 p-2 rounded-xl h-fit">
                <HeartHandshake className="h-5 w-5 text-brand-coral" />
              </div>
              <div>
                <h5 className="text-sm font-semibold">No-wahala Dispute Resolution</h5>
                <p className="text-xs text-brand-neutral/70 mt-0.5">
                  Damaged item or wrong order? File a claim and our 24/7 ops administrators will resolve it instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-brand-sunflower text-sm uppercase tracking-wider mb-3">Sellers & Operations</h4>
            <ul className="text-sm space-y-2 text-brand-neutral/80">
              <li>
                <Link href="/sell-on-oja" className="hover:text-brand-coral transition-colors flex items-center gap-1">
                  <span>Open your Stall on Ọjà</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/overview" className="hover:text-brand-coral transition-colors">
                  Vendor Dashboard (Stall console)
                </Link>
              </li>
              <li>
                <Link href="/market-days" className="hover:text-brand-coral transition-colors">
                  Upcoming Market Days Schedules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center text-xs text-brand-neutral/40 flex justify-between max-w-7xl mx-auto">
          <span>Registered in Nigeria — RC: 948281</span>
          <span>Haggle like the market, pay like the internet.</span>
        </div>
      </footer>

      {/* Sticky Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand-border py-2 px-4 flex justify-around items-center md:hidden shadow-lg shadow-black/10">
        
        <Link href="/" className={`flex flex-col items-center gap-0.5 text-xs ${pathname === "/" ? "text-brand-coral font-bold" : "text-brand-indigo/60"}`}>
          <Home className="h-5 w-5" />
          <span>Bazaar</span>
        </Link>

        <Link href="/search" className={`flex flex-col items-center gap-0.5 text-xs ${pathname.startsWith("/search") ? "text-brand-coral font-bold" : "text-brand-indigo/60"}`}>
          <Search className="h-5 w-5" />
          <span>Find</span>
        </Link>

        <Link href="/cart" className="relative flex flex-col items-center gap-0.5 text-xs text-brand-indigo/60">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-coral text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`${pathname.startsWith("/cart") ? "text-brand-coral font-bold" : "text-brand-indigo/60"}`}>Cart</span>
        </Link>

        <Link href="/haggle/inbox" className="relative flex flex-col items-center gap-0.5 text-xs text-brand-indigo/60">
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {activeHaggles > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-sunflower text-brand-indigo font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-sm">
                {activeHaggles}
              </span>
            )}
          </div>
          <span className={`${pathname.startsWith("/haggle") ? "text-brand-coral font-bold" : "text-brand-indigo/60"}`}>Haggles</span>
        </Link>

        <Link href="/orders" className={`flex flex-col items-center gap-0.5 text-xs ${pathname.startsWith("/orders") ? "text-brand-coral font-bold" : "text-brand-indigo/60"}`}>
          <Package className="h-5 w-5" />
          <span>Orders</span>
        </Link>
      </div>
    </div>
  );
}
