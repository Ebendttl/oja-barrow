"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, Ticket, DollarSign, ArrowLeft } from "lucide-react";
import { db } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [disputedCount, setDisputedCount] = useState(0);

  useEffect(() => {
    const checkDisputes = () => {
      const activeDisputes = db.escrowLedgers.filter(e => e.status === 'disputed');
      setDisputedCount(activeDisputes.length);
    };

    checkDisputes();
    const interval = setInterval(checkDisputes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top command header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-coral p-2 rounded-xl text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm uppercase tracking-wider font-display text-slate-100 leading-none">
              Barrow Control
            </h1>
            <span className="text-[10px] text-brand-sunflower font-bold">
              🛰️ Operations Desk (Lagos Node)
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-1.5 hover:text-white transition-colors ${pathname === "/dashboard" ? "text-white" : ""}`}
          >
            <LayoutDashboard className="h-4 w-4 text-brand-coral" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/dashboard#disputes" 
            className="flex items-center gap-1.5 hover:text-white transition-colors relative"
          >
            <Ticket className="h-4 w-4 text-brand-sunflower" />
            <span>Disputes</span>
            {disputedCount > 0 && (
              <span className="bg-red-500 text-white font-extrabold text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {disputedCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold gap-1">
              <ArrowLeft className="h-4 w-4" /> Exit Ops
            </Button>
          </Link>
        </div>
      </header>

      {/* Main ops dashboard surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>

    </div>
  );
}
