"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, MessageSquare, ShoppingCart, ArrowLeft, Store, HelpCircle, Check, AlertCircle } from "lucide-react";
import { db, Product, Vendor } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isHaggleOpen, setIsHaggleOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buyer fixed user ID
  const buyerId = '11111111-1111-1111-1111-111111111111';

  useEffect(() => {
    if (slug) {
      const prod = db.products.find(p => p.slug === slug);
      if (prod) {
        setProduct(prod);
        const vend = db.vendors.find(v => v.id === prod.vendor_id);
        if (vend) setVendor(vend);
      }
    }
  }, [slug]);

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Bazaar</Button>
        </Link>
      </div>
    );
  }

  // Handle Buy Now (adds to cart at full retail price)
  const handleBuyNow = () => {
    db.addToCart(buyerId, product.id, 1);
    router.push("/cart");
  };

  // Handle submitting the initial Haggle Offer
  const handleStartHaggle = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(offerAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid offer amount.");
      return;
    }

    if (amount > product.price) {
      setErrorMsg("Your offer cannot be higher than the retail price!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Create new Haggle Thread
      const threadId = Math.random().toString();
      const newThread = {
        id: threadId,
        product_id: product.id,
        buyer_id: buyerId,
        vendor_id: product.vendor_id,
        status: 'open' as const,
        round_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const currentThreads = db.haggleThreads;
      currentThreads.push(newThread);
      db.haggleThreads = currentThreads;

      // Add the offer
      db.addHaggleOffer(threadId, 'buyer', amount, offerMessage);

      setIsHaggleOpen(false);
      // Route user to the Haggle chat view
      router.push(`/haggle/${threadId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start negotiation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-indigo/70 hover:text-brand-coral transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </button>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Image Gallery */}
        <div className="md:col-span-6 space-y-4">
          <div className="relative aspect-square w-full bg-white rounded-3xl overflow-hidden border border-brand-border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images?.[0] || "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80"}
              alt={product.name}
              className="object-cover w-full h-full"
            />
            {product.haggle_enabled && (
              <span className="absolute top-4 left-4 bg-brand-sunflower text-brand-indigo font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 border-2 border-brand-indigo">
                🤝 Negotiable
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Title, Metadata, Buying actions */}
        <div className="md:col-span-6 space-y-6 flex flex-col justify-between">
          
          {/* Header & Description */}
          <div className="space-y-4">
            
            {/* Vendor card */}
            {vendor && (
              <Link href={`/vendor/${vendor.slug}`} className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-brand-border hover:border-brand-coral transition-colors">
                <Store className="h-4.5 w-4.5 text-brand-coral" />
                <span className="text-xs font-bold">{vendor.store_name}</span>
                <span className="text-[9px] bg-brand-coral/5 text-brand-coral px-2 py-0.5 rounded-full uppercase font-black">
                  Verified Seller
                </span>
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold font-display leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-brand-indigo">
                ₦{product.price.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-brand-indigo/60">
                (Retail Retailer Price)
              </span>
            </div>

            <p className="text-sm leading-relaxed text-brand-indigo/80 bg-white p-5 rounded-2xl border border-brand-border">
              {product.description}
            </p>
          </div>

          {/* Action box */}
          <div className="space-y-4 pt-4 border-t border-brand-border">
            
            <div className="flex items-center justify-between text-xs font-bold text-brand-indigo/65 px-1">
              <span>Delivery Status: Dispatch Rider Available</span>
              <span className="text-brand-green">In Stock ({product.stock})</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Buy now direct */}
              <Button 
                onClick={handleBuyNow} 
                className="flex-1 font-extrabold text-sm py-4 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4.5 w-4.5" /> Buy Now (Full Price)
              </Button>

              {/* Haggle mode action */}
              {product.haggle_enabled ? (
                <Button 
                  onClick={() => setIsHaggleOpen(true)}
                  variant="secondary" 
                  className="flex-1 font-extrabold text-sm py-4 flex items-center justify-center gap-2 border-2 border-brand-indigo"
                >
                  <MessageSquare className="h-4.5 w-4.5" /> Start Haggle (Negotiate)
                </Button>
              ) : (
                <div className="flex-1 bg-brand-muted border border-brand-border rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-brand-indigo/60">
                  <AlertCircle className="h-4 w-4 shrink-0 text-brand-indigo/40" />
                  <span>Haggle Mode disabled by vendor for this item.</span>
                </div>
              )}
            </div>

            {/* Escrow Guarantee Banner */}
            <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4 flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-green uppercase tracking-wide">Escrow Insured Deal</h4>
                <p className="text-xs text-brand-indigo/70 mt-1 leading-relaxed">
                  Your funds are held securely. The vendor is only paid when you confirm receipt and inspect the item. 100% money back guarantee.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* HAGGLE OFFER ENTRY MODAL */}
      {isHaggleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-indigo/80 backdrop-blur-sm p-4">
          <div className="bg-brand-neutral border-2 border-brand-indigo rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="text-center space-y-1">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl font-extrabold font-display">Make an Offer</h3>
              <p className="text-xs font-semibold text-brand-indigo/60">
                You are negotiating for: <span className="text-brand-coral">{product.name}</span>
              </p>
            </div>

            <form onSubmit={handleStartHaggle} className="space-y-4">
              
              {/* Target starting price */}
              <div className="bg-white p-3 rounded-xl border border-brand-border text-center space-y-0.5">
                <span className="text-[10px] font-bold text-brand-indigo/45 uppercase">Vendor Retail Price</span>
                <span className="text-xl font-black block text-brand-indigo">₦{product.price.toLocaleString()}</span>
              </div>

              {/* Price input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-indigo/80 block">Your Price Offer (₦)</label>
                <div className="relative">
                  <span className="absolute left-4.5 top-3 font-bold text-brand-indigo/55 text-sm">₦</span>
                  <input
                    type="number"
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Enter your price"
                    className="w-full bg-white border border-brand-border rounded-xl pl-9 pr-4 py-3 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-brand-coral"
                  />
                </div>
              </div>

              {/* Message input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-indigo/80 block">Message to Vendor (Optional)</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. Bro, please I can only do this amount. Send rider tomorrow."
                  rows={2}
                  maxLength={150}
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-coral"
                />
              </div>

              {/* Lowball warnings */}
              <div className="bg-brand-sunflower/10 border border-brand-sunflower/30 rounded-xl p-3.5 flex gap-2.5 items-start">
                <HelpCircle className="h-4.5 w-4.5 text-brand-coral shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-[10px] font-black uppercase text-brand-indigo">Automated Floor Check</h4>
                  <p className="text-[10px] text-brand-indigo/75 mt-0.5 leading-relaxed font-semibold">
                    Ọjà uses a silent floor-limit trigger. If your offer is below the vendor&apos;s hidden absolute minimum, it will be automatically declined instantly. Make it reasonable!
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg text-center">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsHaggleOpen(false)}
                  className="flex-1 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex-1 font-extrabold text-xs"
                >
                  Send Offer 🚀
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
