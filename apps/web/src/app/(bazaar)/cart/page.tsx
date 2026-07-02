"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, ShieldCheck, ArrowRight, Trash2, Clock, CreditCard, CheckCircle2, ShieldAlert } from "lucide-react";
import { db, CartItem, Product, Vendor } from "@oja-barrow/database";
import { Button } from "@oja-barrow/ui";

export default function CartPage() {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payoutStep, setPayoutStep] = useState(0); // 0: none, 1: gateway, 2: split, 3: success
  const [createdOrderIds, setCreatedOrderIds] = useState<string[]>([]);
  
  const [deliveryAddress, setDeliveryAddress] = useState({
    streetAddress: "12, Joel Ogunnaike Street, GRA Ikeja",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria"
  });

  const loadCartData = () => {
    setCartItems(db.cartItems);
    setProducts(db.products);
    setVendors(db.vendors);
  };

  useEffect(() => {
    loadCartData();
    const interval = setInterval(loadCartData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveItem = (id: string) => {
    db.cartItems = db.cartItems.filter(item => item.id !== id);
    loadCartData();
  };

  // Calculations
  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const getVendorDetails = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId);
  };

  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  const deliveryFee = cartItems.length > 0 ? 2500 : 0; // Flat Lagos rate
  const total = subtotal + deliveryFee;

  // Paystack verification simulation
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    setPayoutStep(1);

    // Step 1: Simulate Gateway Payment processing
    setTimeout(() => {
      setPayoutStep(2);
      
      // Step 2: Split Orders by Vendor and process via Database Client
      setTimeout(() => {
        try {
          const orderIds = db.checkout(deliveryAddress);
          setCreatedOrderIds(orderIds);
          setPayoutStep(3);
          
          // Clear cart on success
          db.cartItems = [];
          loadCartData();

          // Step 3: Redirect to success page or order list
          setTimeout(() => {
            setIsProcessing(false);
            setPayoutStep(0);
            router.push("/orders");
          }, 2500);

        } catch (err) {
          console.error(err);
          setIsProcessing(false);
          setPayoutStep(0);
        }
      }, 2000);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center gap-2 border-b border-brand-border pb-4">
        <ShoppingCart className="h-6 w-6 text-brand-indigo" />
        <h1 className="text-2xl md:text-3xl font-extrabold font-display">
          Your Shopping Cart
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-brand-border rounded-3xl space-y-4 shadow-sm">
          <span className="text-4xl">🛒</span>
          <h2 className="font-extrabold text-base font-display">Your cart is currently empty</h2>
          <p className="text-xs text-brand-indigo/60 max-w-xs mx-auto">
            Haggle on active product deals to lock in special prices before they expire.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button className="text-xs font-black px-6">Explore Marketplace</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map(item => {
              const prod = getProductDetails(item.product_id);
              const vendor = prod ? getVendorDetails(prod.vendor_id) : null;
              const isHaggled = item.is_haggle;

              return (
                <div key={item.id} className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm flex gap-4 relative overflow-hidden">
                  
                  {/* Ankara Ankara decoration for haggle items */}
                  {isHaggled && (
                    <div className="absolute top-0 right-0 bg-brand-sunflower text-brand-indigo font-black text-[9px] px-3 py-1 uppercase rounded-bl-xl tracking-wider flex items-center gap-1 shadow-sm">
                      <Clock className="h-3 w-3" /> Deal Locked
                    </div>
                  )}

                  {/* Product Thumbnail */}
                  <div className="w-20 h-20 bg-brand-neutral rounded-xl overflow-hidden shrink-0 border border-brand-border flex items-center justify-center font-bold text-xs">
                    {prod?.name.slice(0, 3).toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-coral">
                        Stall: {vendor?.store_name || "Verified Trader"}
                      </span>
                      <h3 className="font-extrabold text-sm text-brand-indigo mt-0.5 line-clamp-1">
                        {prod?.name}
                      </h3>
                      <span className="text-[10px] text-brand-indigo/50 font-semibold">
                        Qty: {item.quantity}
                      </span>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-brand-indigo">
                          ₦{item.price.toLocaleString()}
                        </span>
                        {isHaggled && prod && (
                          <span className="text-xs text-brand-indigo/40 line-through">
                            ₦{prod.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-brand-indigo/40 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Checkout Info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Delivery address details */}
            <div className="bg-white border border-brand-border rounded-2xl p-4 space-y-3 shadow-sm">
              <span className="text-[10px] font-black uppercase text-brand-indigo/50">Delivery Destination</span>
              <div className="text-xs font-semibold space-y-1">
                <p className="font-bold">{deliveryAddress.streetAddress}</p>
                <p className="text-brand-indigo/60">{deliveryAddress.city}, {deliveryAddress.state}</p>
              </div>
            </div>

            {/* Total calculation panel */}
            <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-sm">
              <span className="text-xs font-black uppercase text-brand-indigo block border-b border-brand-neutral pb-2.5">
                Order Summary
              </span>
              
              <div className="text-xs font-semibold space-y-2">
                <div className="flex justify-between text-brand-indigo/70">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-brand-indigo/70">
                  <span>Delivery (Lagos flat)</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-brand-indigo font-black text-sm border-t border-brand-neutral pt-2.5">
                  <span>Total Due</span>
                  <span className="text-brand-coral">₦{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Escrow guarantee banner */}
              <div className="bg-brand-indigo text-brand-neutral p-3 rounded-xl flex gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-sunflower shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-brand-sunflower">Ọjà Escrow Protected</span>
                  <p className="text-[9px] text-brand-neutral/80 leading-relaxed font-semibold">
                    Funds will be held securely in escrow and only released to sellers when you confirm delivery.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleCheckout}
                className="w-full font-black text-xs py-3 flex items-center justify-center gap-1 hover:scale-[1.02] transition-transform"
              >
                <span>Proceed to Pay</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

          </div>

        </div>
      )}

      {/* PAYSTACK GATEWAY SIMULATION PANEL */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-indigo/80 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-brand-indigo rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative text-center">
            
            {/* Step 1: Payment processing */}
            {payoutStep === 1 && (
              <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-sunflower/20 text-brand-indigo animate-bounce">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-lg font-display">Paystack Payment Secure Gateway</h3>
                  <p className="text-xs text-brand-indigo/60 font-semibold max-w-xs mx-auto">
                    Authorizing ₦{total.toLocaleString()} from your linked bank account...
                  </p>
                </div>
                <div className="w-16 h-1 bg-brand-coral/20 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-brand-coral rounded-full animate-progress-bar w-1/2" />
                </div>
              </div>
            )}

            {/* Step 2: Split Escrow Ledger processing */}
            {payoutStep === 2 && (
              <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-indigo text-brand-sunflower animate-spin">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-lg font-display">Barrow Escrow Ledger Processing</h3>
                  <p className="text-xs text-brand-indigo/60 font-semibold max-w-xs mx-auto">
                    Splitting orders by vendor, recording escrow contracts, and generating secure tracking ledgers...
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Success feedback */}
            {payoutStep === 3 && (
              <div className="space-y-4 py-4 animate-in fade-in duration-300">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-green/20 text-brand-green">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-lg font-display text-brand-green">Payment Received!</h3>
                  <p className="text-xs text-brand-indigo/60 font-semibold max-w-xs mx-auto">
                    Orders generated and funded! Directing you to your Order Tracking Panel...
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
