"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles, AlertCircle, ShoppingCart, Ban, CheckCircle2, RefreshCw } from "lucide-react";
import { db, HaggleThread, HaggleOffer, Product, Vendor } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function HaggleThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  const [thread, setThread] = useState<HaggleThread | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [offers, setOffers] = useState<HaggleOffer[]>([]);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const buyerId = '11111111-1111-1111-1111-111111111111';

  // Load thread data
  const loadData = () => {
    if (threadId) {
      const thr = db.haggleThreads.find(t => t.id === threadId);
      if (thr) {
        setThread(thr);
        const prod = db.products.find(p => p.id === thr.product_id);
        if (prod) setProduct(prod);
        const vend = db.vendors.find(v => v.id === thr.vendor_id);
        if (vend) setVendor(vend);

        const off = db.haggleOffers.filter(o => o.thread_id === threadId);
        setOffers(off);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [threadId]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [offers, isTyping]);

  // Trigger vendor simulated response if buyer just made an offer
  useEffect(() => {
    if (!thread || thread.status !== 'open' || offers.length === 0) return;

    const lastOffer = offers[offers.length - 1];
    if (lastOffer.offered_by === 'buyer') {
      setIsTyping(true);

      const timer = setTimeout(() => {
        setIsTyping(false);
        if (!product) return;

        // Auto-decline if offer is below floor price (done by trigger in db, status will be declined)
        const currentThread = db.haggleThreads.find(t => t.id === threadId);
        if (currentThread && currentThread.status === 'declined') {
          loadData();
          return;
        }

        // Logic for vendor response
        const buyerAmount = lastOffer.amount;
        const retailPrice = product.price;
        const floorPrice = product.floor_price || (retailPrice * 0.85); // fallback

        // If buyer offers >= 94% of retail price, vendor accepts
        if (buyerAmount >= retailPrice * 0.94) {
          db.acceptHaggle(threadId, 'vendor');
          
          // Add vendor accept message
          const systemMsg: HaggleOffer = {
            id: Math.random().toString(),
            thread_id: threadId,
            offered_by: 'system',
            amount: buyerAmount,
            message: `Deal sealed! Vendor has accepted your offer of ₦${buyerAmount.toLocaleString()}. Proceed to checkout.`,
            created_at: new Date().toISOString()
          };
          const currentOffers = db.haggleOffers;
          currentOffers.push(systemMsg);
          db.haggleOffers = currentOffers;
          
          loadData();
        } else {
          // Vendor counters at halfway between buyer offer and retail price
          const counterVal = Math.round(buyerAmount + (retailPrice - buyerAmount) * 0.45);
          
          // Increment round count
          const currentThreads = db.haggleThreads;
          const idx = currentThreads.findIndex(t => t.id === threadId);
          if (idx !== -1) {
            currentThreads[idx].round_count += 1;
            if (currentThreads[idx].round_count >= 5) {
              currentThreads[idx].status = 'declined';
              
              // Exceeded rounds message
              const systemMsg: HaggleOffer = {
                id: Math.random().toString(),
                thread_id: threadId,
                offered_by: 'system',
                amount: counterVal,
                message: 'Negotiation limit reached (5 rounds). Thread closed without agreement.',
                created_at: new Date().toISOString()
              };
              db.haggleOffers = [...db.haggleOffers, systemMsg];
            } else {
              // Add vendor counter offer
              const newOffer: HaggleOffer = {
                id: Math.random().toString(),
                thread_id: threadId,
                offered_by: 'vendor',
                amount: counterVal,
                message: `Oga, let's meet halfway. Pay ₦${counterVal.toLocaleString()} and I will send rider to deliver today.`,
                created_at: new Date().toISOString()
              };
              const currentOffers = db.haggleOffers;
              currentOffers.push(newOffer);
              db.haggleOffers = currentOffers;
            }
            db.haggleThreads = currentThreads;
          }
          loadData();
        }
      }, 2000); // 2 seconds delay for realistic feeling

      return () => clearTimeout(timer);
    }
  }, [offers]);

  if (!thread || !product) {
    return (
      <div className="text-center py-20">
        <p>Loading haggle negotiation...</p>
      </div>
    );
  }

  // Handle buyer submitting a counter-offer
  const handleSubmitCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(counterAmount);

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    const lastOffer = offers[offers.length - 1];
    if (lastOffer && lastOffer.offered_by === 'buyer') {
      setErrorMsg("Please wait for the vendor to respond to your previous offer.");
      return;
    }

    if (amount >= product.price) {
      setErrorMsg(`No need to haggle! You can buy directly for the retail price of ₦${product.price.toLocaleString()}.`);
      return;
    }

    setErrorMsg("");
    setCounterAmount("");
    setCounterMessage("");

    try {
      db.addHaggleOffer(threadId, 'buyer', amount, counterMessage);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit counter.");
    }
  };

  // Buyer accepts vendor's counter offer
  const handleAcceptVendorOffer = () => {
    const lastVendorOffer = [...offers].reverse().find(o => o.offered_by === 'vendor');
    if (!lastVendorOffer) return;

    db.acceptHaggle(threadId, 'buyer');
    
    // Add success system message
    const systemMsg: HaggleOffer = {
      id: Math.random().toString(),
      thread_id: threadId,
      offered_by: 'system',
      amount: lastVendorOffer.amount,
      message: `You accepted the vendor's counter price of ₦${lastVendorOffer.amount.toLocaleString()}! Added to cart.`,
      created_at: new Date().toISOString()
    };
    db.haggleOffers = [...db.haggleOffers, systemMsg];

    loadData();
  };

  // Decline/End negotiation
  const handleDeclineThread = () => {
    db.declineHaggle(threadId);
    loadData();
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl border border-brand-border overflow-hidden shadow-lg">
      
      {/* Header Info */}
      <div className="bg-brand-indigo text-brand-neutral p-4 flex items-center justify-between border-b border-brand-indigo/90">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm font-display text-brand-sunflower leading-none">
                Stall: {vendor?.store_name || "Verified Trader"}
              </h3>
            </div>
            <p className="text-xs text-brand-neutral/80 mt-1 line-clamp-1">
              Negotiation for: {product.name} (₦{product.price.toLocaleString()})
            </p>
          </div>
        </div>

        {/* Round Counter */}
        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-white/50 block">Round Count</span>
          <span className="text-sm font-black text-brand-sunflower">
            {thread.round_count} / 5
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-neutral/40">
        
        <div className="text-center py-2">
          <span className="inline-block bg-brand-sunflower/25 text-brand-indigo text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            🤝 Haggle mode initiated — 5 rounds max
          </span>
        </div>

        {offers.map((offer) => {
          const isBuyer = offer.offered_by === 'buyer';
          const isSystem = offer.offered_by === 'system';

          if (isSystem) {
            return (
              <div key={offer.id} className="mx-auto max-w-md bg-white border border-brand-border rounded-xl p-3 shadow-sm text-center space-y-1">
                <span className="text-xs font-bold text-brand-coral block">
                  📢 Barrow Engine Trigger
                </span>
                <p className="text-xs text-brand-indigo/80 leading-relaxed font-semibold">
                  {offer.message}
                </p>
              </div>
            );
          }

          return (
            <div
              key={offer.id}
              className={`flex flex-col max-w-[80%] ${
                isBuyer ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div className="text-[10px] font-bold text-brand-indigo/50 mb-1">
                {isBuyer ? "You (Buyer)" : vendor?.store_name}
              </div>
              
              <div
                className={`rounded-2xl p-4 shadow-sm space-y-1.5 ${
                  isBuyer
                    ? "bg-brand-coral text-white rounded-tr-none"
                    : "bg-white border border-brand-border text-brand-indigo rounded-tl-none"
                }`}
              >
                <div className="font-black text-base font-display">
                  ₦{offer.amount.toLocaleString()}
                </div>
                {offer.message && (
                  <p className="text-xs leading-relaxed font-medium opacity-90 break-words max-w-xs">
                    &quot;{offer.message}&quot;
                  </p>
                )}
              </div>
              <span className="text-[9px] text-brand-indigo/40 mt-1">
                {new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Vendor is typing simulation */}
        {isTyping && (
          <div className="flex flex-col mr-auto items-start max-w-[80%]">
            <div className="text-[10px] font-bold text-brand-indigo/50 mb-1">
              {vendor?.store_name}
            </div>
            <div className="bg-white border border-brand-border rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
              <span className="text-xs text-brand-indigo/70 font-semibold flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-coral" />
                <span>Vendor is reading offer...</span>
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Footer Controls based on status */}
      <div className="p-4 bg-white border-t border-brand-border">
        
        {/* OPEN STATUS */}
        {thread.status === 'open' && (
          <div className="space-y-4">
            
            {/* If vendor's counter offer is the last message, offer Acceptance shortcut */}
            {offers.length > 0 && offers[offers.length - 1].offered_by === 'vendor' && (
              <div className="bg-brand-sunflower/10 border border-brand-sunflower/30 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-brand-indigo/60">Vendor Counter Offer</span>
                  <span className="text-base font-black block text-brand-indigo">
                    ₦{offers[offers.length - 1].amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleDeclineThread} 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                  >
                    Decline
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAcceptVendorOffer} 
                    className="bg-brand-indigo hover:bg-brand-indigo/90 text-brand-neutral font-black px-4"
                  >
                    Accept Price ✅
                  </Button>
                </div>
              </div>
            )}

            {/* Counter offer form */}
            {(!offers.length || offers[offers.length - 1].offered_by !== 'buyer') && (
              <form onSubmit={handleSubmitCounter} className="space-y-3">
                <div className="flex gap-2">
                  
                  {/* Amount input */}
                  <div className="relative w-44 shrink-0">
                    <span className="absolute left-3.5 top-3.5 font-bold text-brand-indigo/55 text-xs">₦</span>
                    <input
                      type="number"
                      required
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder="Your Counter"
                      className="w-full bg-brand-neutral border border-brand-border rounded-xl pl-7 pr-3 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-brand-coral"
                    />
                  </div>

                  {/* Message input */}
                  <input
                    type="text"
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    placeholder="Type message (e.g. Please bro, last price)"
                    className="flex-1 bg-brand-neutral border border-brand-border rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-coral"
                  />

                  {/* Send button */}
                  <Button 
                    type="submit" 
                    disabled={isTyping}
                    className="aspect-square h-11 w-11 rounded-xl p-0 flex items-center justify-center shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {errorMsg && (
                  <p className="text-[11px] font-bold text-red-600 text-center bg-red-50 p-2 rounded-lg">
                    ⚠️ {errorMsg}
                  </p>
                )}
              </form>
            )}

            {offers.length > 0 && offers[offers.length - 1].offered_by === 'buyer' && (
              <div className="bg-brand-neutral border border-brand-border rounded-xl p-3.5 text-center text-xs font-semibold text-brand-indigo/60">
                ⌛ Waiting for Vendor counter-proposal...
              </div>
            )}

          </div>
        )}

        {/* ACCEPTED STATUS */}
        {thread.status === 'accepted' && (
          <div className="bg-brand-green/10 border-2 border-brand-green rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-brand-green">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <h4 className="font-extrabold text-base font-display">Offer Price Accepted!</h4>
            </div>
            
            <p className="text-xs text-brand-indigo/85 leading-relaxed font-semibold max-w-md mx-auto">
              This deal is sealed and automatically loaded into your checkout cart at the agreed price. 
              The checkout window holds this deal lock for <span className="text-brand-coral font-black">15 minutes</span>.
            </p>

            <div className="flex justify-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="font-bold">
                  Continue Browsing
                </Button>
              </Link>
              <Link href="/cart">
                <Button size="sm" className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" /> Go to Cart & Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* DECLINED STATUS */}
        {thread.status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <Ban className="h-5 w-5 shrink-0" />
              <h4 className="font-extrabold text-sm">Negotiation Terminated</h4>
            </div>
            <p className="text-xs text-brand-indigo/70 font-semibold max-w-sm mx-auto">
              The seller declined or the rounds limit was reached. You can try starting a new haggle with a higher offer.
            </p>
            <div className="pt-1">
              <Link href={`/product/${product.slug}`}>
                <Button size="sm" variant="outline" className="font-bold border-red-200 hover:bg-red-100/50">
                  Try Again 🤝
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
