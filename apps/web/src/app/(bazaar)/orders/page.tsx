"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ShieldCheck, CheckCircle2, ShieldAlert, ArrowRight, Truck, RefreshCw } from "lucide-react";
import { db, Order, Product, Vendor, EscrowLedger } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function OrdersPage() {
  const buyerId = '11111111-1111-1111-1111-111111111111';

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [escrows, setEscrows] = useState<EscrowLedger[]>([]);
  
  const loadOrders = () => {
    const buyerOrders = db.orders.filter(o => o.buyer_id === buyerId);
    setOrders(buyerOrders.reverse()); // latest first
    setProducts(db.products);
    setVendors(db.vendors);
    setEscrows(db.escrowLedgers);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmDelivery = (orderId: string) => {
    try {
      db.releaseEscrow(orderId);
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisputeOrder = (orderId: string) => {
    try {
      db.disputeEscrow(orderId);
      loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center gap-2 border-b border-brand-border pb-4">
        <Package className="h-6 w-6 text-brand-indigo" />
        <h1 className="text-2xl md:text-3xl font-extrabold font-display">
          Your Purchases
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-brand-border rounded-3xl space-y-4 shadow-sm">
          <span className="text-4xl">📦</span>
          <h2 className="font-extrabold text-base font-display">No purchases recorded</h2>
          <p className="text-xs text-brand-indigo/60 max-w-xs mx-auto">
            Browse our list of negotiable products on the home screen to place your first offer!
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button className="text-xs font-black px-6">Explore Bazaar</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const product = products.find(p => p.id === order.product_id);
            const vendor = vendors.find(v => v.id === order.vendor_id);
            const escrow = escrows.find(e => e.order_id === order.id);

            return (
              <div key={order.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-5 relative overflow-hidden">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-neutral pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-brand-indigo/50">Order Identifier</span>
                    <h3 className="font-black text-sm font-display text-brand-indigo">
                      ID: {order.id.slice(0, 8)}...
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Delivery Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-[9px] uppercase border ${
                      order.status === 'completed' 
                        ? "bg-brand-green/10 text-brand-green border-brand-green/30" 
                        : order.status === 'disputed'
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-brand-sunflower/20 text-brand-indigo border-brand-sunflower/30"
                    }`}>
                      <Truck className="h-3 w-3 shrink-0" />
                      Status: {order.status}
                    </span>

                    {/* Escrow Status Badge */}
                    {escrow && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-[9px] uppercase border ${
                        escrow.status === 'released' 
                          ? "bg-brand-green/10 text-brand-green border-brand-green/30" 
                          : escrow.status === 'disputed'
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20 animate-pulse"
                      }`}>
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        Escrow: {escrow.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-brand-neutral rounded-xl overflow-hidden shrink-0 border border-brand-border flex items-center justify-center font-bold text-xs">
                    {product?.name.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-brand-coral">
                      Seller: {vendor?.store_name || "Verified Vendor"}
                    </span>
                    <h4 className="font-extrabold text-sm text-brand-indigo mt-0.5">
                      {product?.name}
                    </h4>
                    <p className="text-xs font-black text-brand-indigo mt-1">
                      Amount Paid: ₦{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Tracking Progress timeline */}
                <div className="bg-brand-neutral/30 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between text-[10px] font-black text-brand-indigo/50">
                    <span className={order.status !== 'pending_payment' ? 'text-brand-green' : ''}>1. Paid ✅</span>
                    <span className={order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed' ? 'text-brand-green' : ''}>2. Shipped 🚚</span>
                    <span className={order.status === 'delivered' || order.status === 'completed' ? 'text-brand-green' : ''}>3. Arrived 📦</span>
                    <span className={order.status === 'completed' ? 'text-brand-green' : ''}>4. Settled 🤝</span>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="h-1.5 w-full bg-brand-border rounded-full overflow-hidden">
                    <div className={`h-full bg-brand-green rounded-full transition-all duration-500 ${
                      order.status === 'completed' 
                        ? 'w-full' 
                        : order.status === 'delivered'
                        ? 'w-3/4'
                        : order.status === 'shipped'
                        ? 'w-1/2'
                        : 'w-1/4'
                    }`} />
                  </div>
                </div>

                {/* Escrow Trigger Actions */}
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'disputed' && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-brand-sunflower/10 border border-brand-sunflower/30 rounded-xl p-4">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-[10px] font-black uppercase text-brand-indigo">
                        Escrow Protection Active
                      </span>
                      <p className="text-[10px] text-brand-indigo/70 font-semibold leading-relaxed">
                        Funds are held safely. Please confirm only if you have inspected and received the package.
                      </p>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisputeOrder(order.id)}
                        className="flex-1 sm:flex-initial text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs"
                      >
                        Raise Dispute ⚠️
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmDelivery(order.id)}
                        className="flex-1 sm:flex-initial bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-xs"
                      >
                        Confirm Delivery & Release
                      </Button>
                    </div>
                  </div>
                )}

                {order.status === 'disputed' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 items-start">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-red-600">Dispute Raised</span>
                      <p className="text-[10px] text-brand-indigo/70 font-semibold leading-relaxed mt-0.5">
                        Our administrative resolution desk (Barrow Control) has flagged this order. 
                        We will inspect messages, tracking histories, and authorize refunds or release payout manually.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
