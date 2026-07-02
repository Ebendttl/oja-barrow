"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ArrowUpRight, HelpCircle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { db, HaggleThread, Product, User, HaggleOffer } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function StallHaggleInboxPage() {
  const vendorId = '22222222-2222-2222-2222-222222222222';

  const [threads, setThreads] = useState<HaggleThread[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [offers, setOffers] = useState<HaggleOffer[]>([]);

  const loadInbox = () => {
    const thr = db.haggleThreads.filter(t => t.vendor_id === vendorId);
    setThreads(thr.reverse());

    setProducts(db.products);
    setBuyers(db.users.filter(u => u.role === 'buyer'));
    setOffers(db.haggleOffers);
  };

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-3xl p-6 space-y-6 shadow-sm">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-neutral pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold font-display flex items-center gap-2">
            🤝 Haggle Inbox
          </h1>
          <p className="text-xs text-brand-indigo/60 font-semibold mt-1">
            Review active counter-proposals and lock deals with buyers.
          </p>
        </div>
        <span className="text-[10px] font-black uppercase text-brand-sunflower bg-brand-indigo px-3 py-1 rounded-full w-fit">
          Barrow Automated Ops Active
        </span>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-brand-neutral rounded-2xl space-y-3">
          <span className="text-3xl">📥</span>
          <h3 className="font-extrabold text-sm">Inbox is empty</h3>
          <p className="text-xs text-brand-indigo/60 max-w-xs mx-auto leading-relaxed">
            When buyers submit price proposals on your negotiable products, they will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-neutral text-brand-indigo/50 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">Buyer Name</th>
                <th className="pb-3 text-right">Latest Offer</th>
                <th className="pb-3 text-center">Round Count</th>
                <th className="pb-3 text-center">Negotiation Status</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.map(thread => {
                const prod = products.find(p => p.id === thread.product_id);
                const buyer = buyers.find(b => b.id === thread.buyer_id);
                
                // Get latest offer amount
                const threadOffers = offers.filter(o => o.thread_id === thread.id);
                const latestOffer = threadOffers[threadOffers.length - 1];

                return (
                  <tr key={thread.id} className="border-b border-brand-neutral/50 last:border-b-0 hover:bg-brand-neutral/20 transition-colors">
                    <td className="py-4 pl-2 font-bold max-w-[200px] truncate">
                      {prod?.name || "Unknown Product"}
                    </td>
                    <td className="py-4 font-semibold text-brand-indigo/80">
                      {buyer?.full_name || "Lagos Buyer"}
                    </td>
                    <td className="py-4 text-right font-black text-brand-indigo">
                      {latestOffer ? `₦${latestOffer.amount.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-4 text-center font-bold text-brand-indigo/70">
                      {thread.round_count} / 5
                    </td>
                    <td className="py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase ${
                          thread.status === 'accepted' 
                            ? "bg-brand-green/10 text-brand-green" 
                            : thread.status === 'open'
                            ? "bg-brand-sunflower/20 text-brand-indigo animate-pulse"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {thread.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <Link href={`/haggle/${thread.id}`}>
                        <Button size="sm" variant={thread.status === 'open' ? "secondary" : "outline"} className="h-8 text-[10px] font-black px-3.5 flex items-center gap-1 ml-auto">
                          <span>{thread.status === 'open' ? "Negotiate" : "View"}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
