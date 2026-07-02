"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, CreditCard, Sparkles, Scale, CheckCircle2, XCircle, ArrowUpRight, BarChart3, AlertCircle } from "lucide-react";
import { db, Order, EscrowLedger, PayoutRequest, Vendor, User, Product } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function ControlDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [escrows, setEscrows] = useState<EscrowLedger[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadOpsData = () => {
    setOrders(db.orders);
    setEscrows(db.escrowLedgers);
    setPayouts(db.payoutRequests);
    setVendors(db.vendors);
    setUsers(db.users);
    setProducts(db.products);
  };

  useEffect(() => {
    loadOpsData();
    const interval = setInterval(loadOpsData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global KPIs
  const totalVolume = escrows.reduce((acc, curr) => acc + curr.amount, 0);
  const currentEscrowPool = escrows
    .filter(e => e.status === 'held' || e.status === 'disputed')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending');
  const activeDisputes = escrows.filter(e => e.status === 'disputed');

  // Admin Dispute Actions
  const handleAdminRelease = (orderId: string) => {
    try {
      db.releaseEscrow(orderId);
      loadOpsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminRefund = (orderId: string) => {
    try {
      // Modify order status to cancelled
      const currentOrders = db.orders;
      const oIdx = currentOrders.findIndex(o => o.id === orderId);
      if (oIdx !== -1) {
        currentOrders[oIdx].status = 'cancelled';
        db.orders = currentOrders;
      }

      // Modify escrow status to refunded
      const currentEscrows = db.escrowLedgers;
      const eIdx = currentEscrows.findIndex(e => e.order_id === orderId);
      if (eIdx !== -1) {
        currentEscrows[eIdx].status = 'refunded';
        db.escrowLedgers = currentEscrows;

        // Refund buyer wallet
        const buyerId = currentOrders[oIdx].buyer_id;
        const refundAmt = currentEscrows[eIdx].amount;
        const currentWallets = db.wallets;
        
        // Return to buyer wallet if they have one, or simulate credit
        // For simulation, we also subtract from vendor pending balance
        const vendorId = currentOrders[oIdx].vendor_id;
        const vWallIdx = currentWallets.findIndex(w => w.vendor_id === vendorId);
        if (vWallIdx !== -1) {
          currentWallets[vWallIdx].pending_balance = Math.max(0, currentWallets[vWallIdx].pending_balance - refundAmt);
        }
        db.wallets = currentWallets;
      }

      loadOpsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Payout Actions
  const handleApprovePayout = (payoutId: string) => {
    try {
      const currentPayouts = db.payoutRequests;
      const idx = currentPayouts.findIndex(p => p.id === payoutId);
      if (idx !== -1) {
        currentPayouts[idx].status = 'approved';
        db.payoutRequests = currentPayouts;
      }
      loadOpsData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Total Volume</span>
          <span className="text-2xl font-black text-white font-display block">
            ₦{totalVolume.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-slate-400">Total transacted volume</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Escrow Pool</span>
          <span className="text-2xl font-black text-brand-sunflower font-display block">
            ₦{currentEscrowPool.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-slate-400">Funds currently protected</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Dispute Queue</span>
          <span className={`text-2xl font-black font-display block ${activeDisputes.length > 0 ? "text-red-500 animate-pulse" : "text-white"}`}>
            {activeDisputes.length}
          </span>
          <span className="text-[9px] font-bold text-slate-400">Active review files</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Payout Queue</span>
          <span className="text-2xl font-black text-brand-green font-display block">
            {pendingPayouts.length}
          </span>
          <span className="text-[9px] font-bold text-slate-400">Awaiting bank dispatch</span>
        </div>

      </div>

      {/* DISPUTES DESK */}
      <section id="disputes" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-black font-display text-white">
              Arbitration & Dispute Resolution Desk
            </h2>
          </div>
          <span className="text-[9px] font-black uppercase text-red-500 bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-full">
            Manual Override Mode
          </span>
        </div>

        {activeDisputes.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-slate-500">
            No active transaction disputes. Escrow ledger is operating smoothly.
          </div>
        ) : (
          <div className="space-y-4">
            {activeDisputes.map(escrow => {
              const order = orders.find(o => o.id === escrow.order_id);
              const prod = order ? products.find(p => p.id === order.product_id) : null;
              const vend = order ? vendors.find(v => v.id === order.vendor_id) : null;
              const buyer = order ? users.find(u => u.id === order.buyer_id) : null;

              return (
                <div key={escrow.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-red-500 block">Escrow Ref: {escrow.id.slice(0, 8)}</span>
                      <h4 className="font-extrabold text-sm text-slate-200 mt-1">
                        Disputed Item: {prod?.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-400">
                      <p>Buyer: <span className="text-slate-200 font-bold">{buyer?.full_name}</span></p>
                      <p>Vendor: <span className="text-slate-200 font-bold">{vend?.store_name}</span></p>
                      <p className="col-span-2 mt-1">Dispute Amount: <span className="text-brand-sunflower font-black">₦{escrow.amount.toLocaleString()}</span></p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      size="sm"
                      onClick={() => handleAdminRefund(order!.id)}
                      className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4"
                    >
                      Force Refund Buyer
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleAdminRelease(order!.id)}
                      className="flex-1 sm:flex-initial bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-xs px-4"
                    >
                      Force Release Vendor
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PENDING WITHDRAWALS QUEUE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand-green" />
            <h2 className="text-lg font-black font-display text-white">
              Settlement Payout dispatch
            </h2>
          </div>
          <span className="text-[9px] font-black uppercase text-brand-green bg-emerald-950/20 border border-emerald-900/40 px-3 py-1 rounded-full">
            Paystack Settlement Dispatch
          </span>
        </div>

        {pendingPayouts.length === 0 ? (
          <div className="text-center py-12 text-xs font-bold text-slate-500">
            No withdrawal requests pending approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Stall/Vendor</th>
                  <th className="pb-3">Settlement Account</th>
                  <th className="pb-3 text-right">Requested Payout</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayouts.map(pay => {
                  const vend = vendors.find(v => v.id === pay.vendor_id);

                  return (
                    <tr key={pay.id} className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-950/50 transition-colors">
                      <td className="py-4 font-bold text-slate-200">
                        {vend?.store_name}
                      </td>
                      <td className="py-4 text-slate-400 font-semibold">
                        {vend?.payout_account?.bank_name} ({vend?.payout_account?.account_number})
                      </td>
                      <td className="py-4 text-right font-black text-white">
                        ₦{pay.amount.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <div className="flex justify-center">
                          <span className="bg-brand-sunflower/10 text-brand-sunflower px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider animate-pulse">
                            {pay.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayout(pay.id)}
                          className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-[10px] px-3.5 h-8 ml-auto"
                        >
                          Approve Payout
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
