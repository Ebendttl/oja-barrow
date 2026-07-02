"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Store, BarChart3, Inbox, ShoppingBag, ArrowLeft, User, DollarSign } from "lucide-react";
import { db } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function StallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeHagglesCount, setActiveHagglesCount] = useState(0);

  // Vendor fixed user ID: '22222222-2222-2222-2222-222222222222' (Nnamdi Obi)
  const vendorId = '22222222-2222-2222-2222-222222222222';

  useEffect(() => {
    const checkInbox = () => {
      const threads = db.haggleThreads.filter(t => t.vendor_id === vendorId && t.status === 'open');
      setActiveHagglesCount(threads.length);
    };

    checkInbox();
    const interval = setInterval(checkInbox, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-brand-neutral/40 text-brand-indigo">
      {/* Adire Stripe Accent */}
      <div className="adire-border" />

      {/* Top Console Navigation */}
      <header className="sticky top-0 z-40 bg-brand-indigo text-brand-neutral px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-black font-display text-brand-sunflower hover:opacity-90">
              Ọjà
            </Link>
            <span className="text-white/20 text-xl font-light">|</span>
            <div className="flex items-center gap-2">
              <Store className="h-4.5 w-4.5 text-brand-coral" />
              <span className="text-xs font-black uppercase tracking-wider text-brand-neutral/90">
                Stall Console
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link 
              href="/overview" 
              className={`flex items-center gap-1.5 hover:text-brand-sunflower transition-colors ${pathname === "/overview" ? "text-brand-sunflower" : "text-brand-neutral/80"}`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </Link>
            <Link 
              href="/haggle-inbox" 
              className={`flex items-center gap-1.5 hover:text-brand-sunflower transition-colors relative ${pathname === "/haggle-inbox" ? "text-brand-sunflower" : "text-brand-neutral/80"}`}
            >
              <Inbox className="h-4 w-4" />
              <span>Haggle Inbox</span>
              {activeHagglesCount > 0 && (
                <span className="bg-brand-coral text-white font-extrabold text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {activeHagglesCount}
                </span>
              )}
            </Link>
          </nav>

          {/* User Controls & Return Button */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="sm" variant="ghost" className="text-brand-neutral hover:bg-white/10 hover:text-white font-bold text-xs gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Exit Console</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Console Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Mobile Sticky Console Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-indigo border-t border-white/10 py-2.5 px-6 flex justify-around items-center md:hidden shadow-lg">
        
        <Link 
          href="/overview" 
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${pathname === "/overview" ? "text-brand-sunflower" : "text-brand-neutral/50"}`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          <span>Overview</span>
        </Link>

        <Link 
          href="/haggle-inbox" 
          className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider relative ${pathname === "/haggle-inbox" ? "text-brand-sunflower" : "text-brand-neutral/50"}`}
        >
          <div className="relative">
            <Inbox className="h-4.5 w-4.5" />
            {activeHagglesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-coral text-white font-extrabold text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center">
                {activeHagglesCount}
              </span>
            )}
          </div>
          <span>Haggles</span>
        </Link>

        <Link 
          href="/" 
          className="flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-neutral/50"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-brand-coral" />
          <span>Exit</span>
        </Link>
      </div>

    </div>
  );
}
