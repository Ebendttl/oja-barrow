"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Wallet, ArrowUpRight, TrendingUp, Clock, CheckCircle2, ShieldAlert, ArrowDownCircle, RefreshCw } from "lucide-react";
import { db, Vendor, Wallet as WalletType, Order, PayoutRequest } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function StallOverviewPage() {
  // Fixed vendor ID (Nnamdi Obi - Alaba Electronics)
  const vendorId = '22222222-2222-2222-2222-222222222222';

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const loadVendorData = () => {
    const vend = db.vendors.find(v => v.id === vendorId);
    if (vend) setVendor(vend);

    const wall = db.wallets.find(w => w.vendor_id === vendorId);
    if (wall) setWallet(wall);

    const ords = db.orders.filter(o => o.vendor_id === vendorId);
    setOrders(ords.reverse()); // latest first

    const pays = db.payoutRequests.filter(p => p.vendor_id === vendorId);
    setPayouts(pays.reverse()); // latest first
  };

  useEffect(() => {
    loadVendorData();
    const interval = setInterval(loadVendorData, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSales = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment')
    .reduce((acc, curr) => acc + curr.total_amount, 0);

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);

    if (isNaN(amount) || amount <= 0) {
      setPayoutError("Please enter a valid amount.");
      return;
    }

    if (!wallet || amount > wallet.available_balance) {
      setPayoutError("Insufficient available balance for this withdrawal.");
      return;
    }

    setPayoutError("");
    setPayoutSuccess(false);

    try {
      db.requestPayout(vendorId, amount);
      setPayoutSuccess(true);
      setPayoutAmount("");
      loadVendorData();
      setTimeout(() => {
        setIsPayoutOpen(false);
        setPayoutSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPayoutError(err.message || "Failed to process withdrawal.");
    }
  };

  if (!vendor || !wallet) {
    return (
      <div className="text-center py-20">
        <p>Loading your stall workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-coral bg-brand-coral/5 px-2.5 py-0.5 rounded-full">
            Active Storefront
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display">
            Welcome back, {vendor.store_name}
          </h1>
          <p className="text-xs text-brand-indigo/60 font-semibold max-w-xl">
            {vendor.bio}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-brand-indigo/25 text-xs font-bold py-2.5">
            Storefront Settings
          </Button>
        </div>
      </div>

      {/* Ledger-Synchronized Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-indigo/60 uppercase">Total Sales Revenue</span>
            <div className="bg-brand-sunflower/20 p-2 rounded-xl text-brand-indigo">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black font-display text-brand-indigo">
              ₦{totalSales.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-brand-green block mt-1">
              ✓ Paystack Webhook Verified
            </span>
          </div>
        </div>

        {/* Escrow Held (Pending) */}
        <div className="bg-brand-indigo text-brand-neutral rounded-2xl p-5 space-y-4 shadow-md relative">
          {/* Subtle pattern background */}
          <div className="adire-pattern absolute inset-0 pointer-events-none rounded-2xl opacity-5" />
          
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-white/60 uppercase">Funds Held in Escrow</span>
            <div className="bg-white/10 p-2 rounded-xl text-brand-sunflower">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-2xl font-black font-display text-brand-sunflower">
              ₦{wallet.pending_balance.toLocaleString()}
            </span>
            <span className="text-[10px] font-medium text-white/50 block mt-1">
              ⌛ Released once buyers confirm delivery
            </span>
          </div>
        </div>

        {/* Available to Withdraw */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-indigo/60 uppercase">Available Balance</span>
            <div className="bg-brand-green/10 p-2 rounded-xl text-brand-green">
              <Wallet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-black font-display text-brand-indigo">
                ₦{wallet.available_balance.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-brand-green block mt-1">
                ✓ Payout ready
              </span>
            </div>
            
            <Button 
              size="sm" 
              onClick={() => setIsPayoutOpen(true)}
              disabled={wallet.available_balance <= 0}
              className="text-xs font-black px-4 py-2 hover:scale-105 transition-transform"
            >
              Withdraw
            </Button>
          </div>
        </div>

      </div>

      {/* Grid Layout for details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Recent Orders */}
        <div className="lg:col-span-8 bg-white border border-brand-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base font-display">Recent Order Transactions</h3>
            <span className="text-[10px] font-bold text-brand-indigo/55">
              Ledger synchronized
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-brand-neutral rounded-2xl text-xs font-semibold text-brand-indigo/50">
              No orders received yet. Active flash sales will show here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-neutral text-brand-indigo/50 font-bold">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Buyer Address</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b border-brand-neutral/50 last:border-b-0 hover:bg-brand-neutral/20 transition-colors">
                      <td className="py-3 font-bold font-display">{order.id.slice(0, 8)}...</td>
                      <td className="py-3 text-brand-indigo/80">
                        {order.shipping_address?.streetAddress}, {order.shipping_address?.city}
                      </td>
                      <td className="py-3 text-right font-black">
                        ₦{order.payout_amount.toLocaleString()}
                      </td>
                      <td className="py-3 flex justify-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase ${
                          order.status === 'completed' 
                            ? "bg-brand-green/10 text-brand-green" 
                            : order.status === 'paid'
                            ? "bg-brand-indigo/10 text-brand-indigo"
                            : "bg-brand-sunflower/20 text-brand-indigo"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Payout History */}
        <div className="lg:col-span-4 bg-white border border-brand-border rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-base font-display">Payout Records</h3>

          {payouts.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-brand-neutral rounded-2xl text-xs font-semibold text-brand-indigo/50">
              No withdrawals requested yet.
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map(pay => (
                <div key={pay.id} className="bg-brand-neutral/35 border border-brand-border rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-indigo/50 block">Requested Amount</span>
                    <span className="text-xs font-black block text-brand-indigo">
                      ₦{pay.amount.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-brand-indigo/40 block mt-0.5">
                      {new Date(pay.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase ${
                      pay.status === 'approved' || pay.status === 'processed'
                        ? "bg-brand-green/10 text-brand-green" 
                        : pay.status === 'pending'
                        ? "bg-brand-sunflower/20 text-brand-indigo animate-pulse"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* PAYOUT REQUEST MODAL/DRAWER */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-indigo/80 backdrop-blur-sm p-4">
          <div className="bg-brand-neutral border-2 border-brand-indigo rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="text-center space-y-1">
              <span className="text-2xl">💸</span>
              <h3 className="text-xl font-extrabold font-display">Request Payout</h3>
              <p className="text-xs font-semibold text-brand-indigo/60">
                Instantly transfer available balance to your payout bank.
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              
              <div className="bg-white p-3.5 rounded-xl border border-brand-border text-center space-y-1">
                <span className="text-[10px] font-bold text-brand-indigo/45 uppercase block">Available Balance</span>
                <span className="text-2xl font-black block text-brand-green">₦{wallet.available_balance.toLocaleString()}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-indigo/80 block">Withdrawal Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4.5 top-3 font-bold text-brand-indigo/55 text-sm">₦</span>
                  <input
                    type="number"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white border border-brand-border rounded-xl pl-9 pr-4 py-3 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-brand-coral"
                  />
                </div>
              </div>

              {/* Settlement Bank details */}
              <div className="bg-brand-indigo text-brand-neutral p-4 rounded-xl border border-brand-indigo">
                <span className="text-[9px] font-black uppercase text-brand-sunflower block">Settlement Destination</span>
                <span className="text-xs font-bold block mt-1">Bank: {vendor.payout_account?.bank_name}</span>
                <span className="text-xs font-bold block">Account: {vendor.payout_account?.account_number}</span>
              </div>

              {payoutError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg text-center">
                  ⚠️ {payoutError}
                </div>
              )}

              {payoutSuccess && (
                <div className="text-xs font-bold text-brand-green bg-brand-green/10 p-2.5 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5" /> Payout request submitted successfully!
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPayoutOpen(false)}
                  className="flex-1 font-bold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={payoutSuccess}
                  className="flex-1 font-extrabold text-xs"
                >
                  Confirm Payout 🚀
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
