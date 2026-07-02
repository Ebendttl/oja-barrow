import { createClient } from '@supabase/supabase-js';

// Define TS Types for database models
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'rider' | 'ops_admin' | 'super_admin';
  full_name: string;
  organization_id: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  bio: string;
  banner_url: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  payout_account: {
    bank_name: string;
    account_number: string;
    bank_code: string;
  } | null;
  commission_rate_override: number | null;
  stall_theme: {
    accentColor: string;
  };
  created_at: string;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  commission_rate: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  haggle_enabled: boolean;
  floor_price: number | null;
  stock: number;
  created_at: string;
  images?: string[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  stock: number;
  price_override: number | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  agreed_price: number | null;
  haggle_thread_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  checkout_id: string;
  buyer_id: string;
  vendor_id: string;
  status: 'pending_payment' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  shipping_address: any;
  total_amount: number;
  commission_amount: number;
  payout_amount: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  quantity: number;
  unit_price: number;
  product_name?: string; // resolved
}

export interface EscrowTransaction {
  id: string;
  order_id: string;
  held_amount: number;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  released_at: string | null;
  created_at: string;
}

export interface HaggleThread {
  id: string;
  product_id: string;
  buyer_id: string;
  vendor_id: string;
  status: 'open' | 'accepted' | 'declined' | 'expired';
  round_count: number;
  created_at: string;
  updated_at: string;
  offers?: HaggleOffer[];
}

export interface HaggleOffer {
  id: string;
  thread_id: string;
  offered_by: 'buyer' | 'vendor' | 'system';
  amount: number;
  message: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  vendor_id: string;
  available_balance: number;
  pending_balance: number;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  vendor_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processed_at: string | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  opened_by: string;
  reason: string;
  evidence_urls: string[];
  status: 'open' | 'resolved_refunded' | 'resolved_released' | 'cancelled';
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  row_id: string;
  old_values: any | null;
  new_values: any | null;
  performed_by: string | null;
  created_at: string;
}

//------------------------------------------------------------------------------
// DUAL-MODE PROVIDER (SUPABASE OR LOCAL STORAGE DATABASE SIMULATOR)
//------------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Seed data definitions representing seed.sql structure
const INITIAL_ORGS: Organization[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Ọjà Digital Markets Limited',
    slug: 'oja-markets',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'chidi@oja.ng',
    role: 'buyer',
    full_name: 'Chidi Egwu',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'nnamdi@alaba.ng',
    role: 'vendor',
    full_name: 'Nnamdi Obi',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'yetunde@adire.ng',
    role: 'vendor',
    full_name: 'Yetunde Adebayo',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'tunde@computervillage.ng',
    role: 'vendor',
    full_name: 'Tunde Balogun',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'admin@oja.ng',
    role: 'ops_admin',
    full_name: 'Barrow Admin',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'suleiman@ojarider.ng',
    role: 'rider',
    full_name: 'Suleiman Yusuf',
    organization_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    store_name: 'Alaba Electronics Kings',
    slug: 'alaba-electronics',
    bio: 'Your direct plug for premium smart TVs, sound systems, and home appliances in Lagos.',
    banner_url: '/images/stalls/alaba_banner.jpg',
    approval_status: 'approved',
    payout_account: { bank_name: 'Access Bank', account_number: '1234567890', bank_code: '044' },
    commission_rate_override: 4.5,
    stall_theme: { accentColor: '#FF5A36' },
    created_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    store_name: 'Adire by Yetunde',
    slug: 'adire-by-yetunde',
    bio: 'Exquisite hand-dyed adire materials, silk kaftans, and custom Kampala dresses direct from Abeokuta.',
    banner_url: '/images/stalls/adire_banner.jpg',
    approval_status: 'approved',
    payout_account: { bank_name: 'GTBank', account_number: '0987654321', bank_code: '058' },
    commission_rate_override: 5.0,
    stall_theme: { accentColor: '#FFC93C' },
    created_at: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    store_name: 'Computer Village Hub',
    slug: 'computer-village-hub',
    bio: 'Quality UK used and brand new iPhones, Samsung Galaxies, MacBooks and gadgets. Wholesale prices.',
    banner_url: '/images/stalls/computer_village_banner.jpg',
    approval_status: 'approved',
    payout_account: { bank_name: 'Zenith Bank', account_number: '1122334455', bank_code: '057' },
    commission_rate_override: 4.0,
    stall_theme: { accentColor: '#191A35' },
    created_at: new Date().toISOString(),
  },
];

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    parent_id: null,
    name: 'Electronics',
    slug: 'electronics',
    commission_rate: 5.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    parent_id: null,
    name: 'Fashion',
    slug: 'fashion',
    commission_rate: 7.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1',
    parent_id: null,
    name: 'Phones & Gadgets',
    slug: 'phones-gadgets',
    commission_rate: 3.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    parent_id: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    name: 'Home Audio',
    slug: 'home-audio',
    commission_rate: 5.0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    parent_id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
    name: 'Traditional Wear',
    slug: 'traditional-wear',
    commission_rate: 7.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2',
    parent_id: 'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1',
    name: 'Smartphones',
    slug: 'smartphones',
    commission_rate: 3.5,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    vendor_id: '44444444-4444-4444-4444-444444444444',
    category_id: 'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2',
    name: 'iPhone 13 Pro Max (128GB, Tokunbo)',
    slug: 'iphone-13-pro-max-tokunbo',
    description: 'Super clean UK used iPhone 13 Pro Max. 100% battery health, Face ID working, no scratches. 128GB space. Face-to-face quality, deal directly with computer village plugs.',
    price: 850000.00,
    haggle_enabled: true,
    floor_price: 780000.00,
    stock: 3,
    created_at: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1632661676136-6827481d3319?w=600&auto=format&fit=crop&q=80'],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    vendor_id: '44444444-4444-4444-4444-444444444444',
    category_id: 'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2',
    name: 'Samsung Galaxy S22 Ultra (Dual Sim)',
    slug: 'samsung-galaxy-s22-ultra',
    description: 'Tokunbo Samsung S22 Ultra, 12GB RAM, 256GB storage. Comes with original S-Pen. Tested and certified by Computer Village Hub techs.',
    price: 680000.00,
    haggle_enabled: true,
    floor_price: 620000.00,
    stock: 2,
    created_at: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80'],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    category_id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    name: 'Handmade Indigo Adire Silk Kaftan',
    slug: 'handmade-indigo-adire-silk-kaftan',
    description: 'Luxurious hand-dyed adire silk kaftan with matching head tie. Rich deep indigo patterns that last. Comfortable for all sizes.',
    price: 45000.00,
    haggle_enabled: true,
    floor_price: 38000.00,
    stock: 10,
    created_at: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'],
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    vendor_id: '33333333-3333-3333-3333-333333333333',
    category_id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    name: 'Aso Oke Ankara Embroidered Gown',
    slug: 'aso-oke-ankara-embroidered-gown',
    description: 'Premium custom embroidered Ankara gown with Aso Oke paneling at the collar and cuffs. High quality stitching for special occasions. Non-negotiable premium piece.',
    price: 65000.00,
    haggle_enabled: false,
    floor_price: null,
    stock: 5,
    created_at: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    vendor_id: '22222222-2222-2222-2222-222222222222',
    category_id: 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2',
    name: 'Polystar Smart Home Theater System',
    slug: 'polystar-smart-home-theater',
    description: 'Heavy bass smart Bluetooth home theater system. 5.1 channel, 1000W power output, HDMI support. Feel the energy of Alaba sound systems in your parlor.',
    price: 150000.00,
    haggle_enabled: true,
    floor_price: 135000.00,
    stock: 8,
    created_at: new Date().toISOString(),
    images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80'],
  },
];

// Helper to interact with the database store
class LocalStorageDB {
  private getStore(key: string, initial: any): any[] {
    if (typeof window === 'undefined') return initial;
    const data = localStorage.getItem(`oja_${key}`);
    if (!data) {
      localStorage.setItem(`oja_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  private setStore(key: string, data: any[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`oja_${key}`, JSON.stringify(data));
  }

  // Collections
  get organizations(): Organization[] { return this.getStore('organizations', INITIAL_ORGS); }
  set organizations(data: Organization[]) { this.setStore('organizations', data); }

  get users(): User[] { return this.getStore('users', INITIAL_USERS); }
  set users(data: User[]) { this.setStore('users', data); }

  get vendors(): Vendor[] { return this.getStore('vendors', INITIAL_VENDORS); }
  set vendors(data: Vendor[]) { this.setStore('vendors', data); }

  get categories(): Category[] { return this.getStore('categories', INITIAL_CATEGORIES); }
  set categories(data: Category[]) { this.setStore('categories', data); }

  get products(): Product[] { return this.getStore('products', INITIAL_PRODUCTS); }
  set products(data: Product[]) { this.setStore('products', data); }

  get wallets(): Wallet[] {
    const defaultWallets: Wallet[] = this.vendors.map(v => ({
      id: `w-${v.id}`,
      vendor_id: v.id,
      available_balance: 0.0,
      pending_balance: 0.0,
      created_at: new Date().toISOString()
    }));
    return this.getStore('wallets', defaultWallets);
  }
  set wallets(data: Wallet[]) { this.setStore('wallets', data); }

  get haggleThreads(): HaggleThread[] { return this.getStore('haggle_threads', []); }
  set haggleThreads(data: HaggleThread[]) { this.setStore('haggle_threads', data); }

  get haggleOffers(): HaggleOffer[] { return this.getStore('haggle_offers', []); }
  set haggleOffers(data: HaggleOffer[]) { this.setStore('haggle_offers', data); }

  get cartItems(): CartItem[] { return this.getStore('cart_items', []); }
  set cartItems(data: CartItem[]) { this.setStore('cart_items', data); }

  get orders(): Order[] { return this.getStore('orders', []); }
  set orders(data: Order[]) { this.setStore('orders', data); }

  get orderItems(): OrderItem[] { return this.getStore('order_items', []); }
  set orderItems(data: OrderItem[]) { this.setStore('order_items', data); }

  get escrowTransactions(): EscrowTransaction[] { return this.getStore('escrow_transactions', []); }
  set escrowTransactions(data: EscrowTransaction[]) { this.setStore('escrow_transactions', data); }

  get payoutRequests(): PayoutRequest[] { return this.getStore('payout_requests', []); }
  set payoutRequests(data: PayoutRequest[]) { this.setStore('payout_requests', data); }

  get disputes(): Dispute[] { return this.getStore('disputes', []); }
  set disputes(data: Dispute[]) { this.setStore('disputes', data); }

  get auditLogs(): AuditLog[] { return this.getStore('audit_logs', []); }
  set auditLogs(data: AuditLog[]) { this.setStore('audit_logs', data); }

  // Database mutations & logic
  logAudit(action: string, tableName: string, rowId: string, oldVal: any = null, newVal: any = null) {
    const logs = this.auditLogs;
    logs.push({
      id: Math.random().toString(),
      action,
      table_name: tableName,
      row_id: rowId,
      old_values: oldVal,
      new_values: newVal,
      performed_by: 'system',
      created_at: new Date().toISOString()
    });
    this.auditLogs = logs;
  }

  // Haggle offers helper with triggers
  addHaggleOffer(threadId: string, offeredBy: 'buyer' | 'vendor', amount: number, message?: string) {
    const threads = this.haggleThreads;
    const threadIndex = threads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) throw new Error('Haggle thread not found');

    const thread = threads[threadIndex];
    if (thread.status !== 'open') throw new Error('Haggle thread is no longer open');

    const offers = this.haggleOffers;
    const newOffer: HaggleOffer = {
      id: Math.random().toString(),
      thread_id: threadId,
      offered_by: offeredBy,
      amount,
      message: message || null,
      created_at: new Date().toISOString()
    };
    
    offers.push(newOffer);
    this.haggleOffers = offers;

    // Trigger: Auto decline if below floor price (silent auto-decline)
    const product = this.products.find(p => p.id === thread.product_id);
    if (!product) throw new Error('Product not found');

    if (offeredBy === 'buyer') {
      if (product.floor_price !== null && amount < product.floor_price) {
        // Auto-decline!
        thread.status = 'declined';
        thread.updated_at = new Date().toISOString();
        threads[threadIndex] = thread;
        this.haggleThreads = threads;

        // Add system decline offer
        const systemOffer: HaggleOffer = {
          id: Math.random().toString(),
          thread_id: threadId,
          offered_by: 'system',
          amount,
          message: 'Your offer is too low. The seller has declined this price. Please try a higher offer.',
          created_at: new Date().toISOString()
        };
        const updatedOffers = this.haggleOffers;
        updatedOffers.push(systemOffer);
        this.haggleOffers = updatedOffers;

        this.logAudit('HAGGLE_AUTO_DECLINE', 'haggle_threads', threadId, { status: 'open' }, { status: 'declined' });
        return;
      }

      // Check max rounds
      if (thread.round_count >= 5) {
        thread.status = 'declined';
        thread.updated_at = new Date().toISOString();
        threads[threadIndex] = thread;
        this.haggleThreads = threads;

        const systemOffer: HaggleOffer = {
          id: Math.random().toString(),
          thread_id: threadId,
          offered_by: 'system',
          amount,
          message: 'Maximum negotiation rounds (5) reached. This haggle is closed.',
          created_at: new Date().toISOString()
        };
        const updatedOffers = this.haggleOffers;
        updatedOffers.push(systemOffer);
        this.haggleOffers = updatedOffers;

        this.logAudit('HAGGLE_MAX_ROUNDS_DECLINE', 'haggle_threads', threadId, { status: 'open' }, { status: 'declined' });
        return;
      }

      // Standard round increment
      thread.round_count += 1;
      thread.updated_at = new Date().toISOString();
      threads[threadIndex] = thread;
      this.haggleThreads = threads;
    } else {
      // Vendor counter offer
      thread.updated_at = new Date().toISOString();
      threads[threadIndex] = thread;
      this.haggleThreads = threads;
    }
  }

  // Accept offer helper
  acceptHaggle(threadId: string, acceptor: 'buyer' | 'vendor') {
    const threads = this.haggleThreads;
    const threadIndex = threads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) throw new Error('Haggle thread not found');

    const thread = threads[threadIndex];
    thread.status = 'accepted';
    thread.updated_at = new Date().toISOString();
    threads[threadIndex] = thread;
    this.haggleThreads = threads;

    this.logAudit('HAGGLE_ACCEPTED', 'haggle_threads', threadId, { status: 'open' }, { status: 'accepted' });

    // Auto add to Cart at accepted price!
    const offers = this.haggleOffers.filter(o => o.thread_id === threadId);
    const lastOffer = offers[offers.length - 1];
    if (lastOffer) {
      this.addToCart(thread.buyer_id, thread.product_id, 1, lastOffer.amount, threadId);
    }
  }

  // Decline offer helper
  declineHaggle(threadId: string) {
    const threads = this.haggleThreads;
    const threadIndex = threads.findIndex(t => t.id === threadId);
    if (threadIndex === -1) throw new Error('Haggle thread not found');

    const thread = threads[threadIndex];
    thread.status = 'declined';
    thread.updated_at = new Date().toISOString();
    threads[threadIndex] = thread;
    this.haggleThreads = threads;

    this.logAudit('HAGGLE_DECLINED', 'haggle_threads', threadId, { status: 'open' }, { status: 'declined' });
  }

  // Cart operations
  addToCart(buyerId: string, productId: string, quantity: number, agreedPrice?: number, haggleThreadId?: string) {
    const items = this.cartItems;
    // For simplicity, search for same product/agreedPrice combo
    const existing = items.find(i => i.product_id === productId && i.agreed_price === (agreedPrice || null));
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id: Math.random().toString(),
        cart_id: `cart-${buyerId}`,
        product_id: productId,
        product_variant_id: null,
        quantity,
        agreed_price: agreedPrice || null,
        haggle_thread_id: haggleThreadId || null,
        created_at: new Date().toISOString()
      });
    }
    this.cartItems = items;
  }

  removeFromCart(itemId: string) {
    const items = this.cartItems;
    this.cartItems = items.filter(i => i.id !== itemId);
  }

  // Checkout and Split-Cart Pattern: creates separate orders per vendor
  checkout(buyerId: string, shippingAddress: any) {
    const cartItems = this.cartItems.filter(i => i.cart_id === `cart-${buyerId}`);
    if (cartItems.length === 0) throw new Error('Cart is empty');

    // Group items by vendor
    const itemsByVendor: { [vendorId: string]: CartItem[] } = {};
    for (const item of cartItems) {
      const product = this.products.find(p => p.id === item.product_id);
      if (!product) continue;
      if (!itemsByVendor[product.vendor_id]) {
        itemsByVendor[product.vendor_id] = [];
      }
      itemsByVendor[product.vendor_id].push(item);
    }

    const checkoutId = Math.random().toString();
    const currentOrders = this.orders;
    const currentOrderItems = this.orderItems;
    const currentEscrows = this.escrowTransactions;
    const currentWallets = this.wallets;

    for (const vendorId of Object.keys(itemsByVendor)) {
      const items = itemsByVendor[vendorId];
      let totalAmount = 0;
      
      const orderId = Math.random().toString();

      for (const item of items) {
        const product = this.products.find(p => p.id === item.product_id);
        if (!product) continue;
        const price = item.agreed_price !== null ? item.agreed_price : product.price;
        totalAmount += price * item.quantity;

        currentOrderItems.push({
          id: Math.random().toString(),
          order_id: orderId,
          product_id: item.product_id,
          product_variant_id: null,
          quantity: item.quantity,
          unit_price: price,
          product_name: product.name
        });
      }

      // Compute commission and payout
      const vendor = this.vendors.find(v => v.id === vendorId);
      const commissionRate = vendor?.commission_rate_override !== null && vendor?.commission_rate_override !== undefined
        ? vendor.commission_rate_override
        : 5.0; // default 5%
      
      const commissionAmount = (totalAmount * commissionRate) / 100;
      const payoutAmount = totalAmount - commissionAmount;

      const newOrder: Order = {
        id: orderId,
        checkout_id: checkoutId,
        buyer_id: buyerId,
        vendor_id: vendorId,
        status: 'paid', // Immediately 'paid' simulating successful Paystack webhook
        shipping_address: shippingAddress,
        total_amount: totalAmount,
        commission_amount: commissionAmount,
        payout_amount: payoutAmount,
        created_at: new Date().toISOString()
      };

      currentOrders.push(newOrder);

      // Trigger: Create escrow transaction (held)
      const newEscrow: EscrowTransaction = {
        id: Math.random().toString(),
        order_id: orderId,
        held_amount: payoutAmount,
        status: 'held',
        released_at: null,
        created_at: new Date().toISOString()
      };
      currentEscrows.push(newEscrow);

      // Trigger: Sync to Wallet (pending balance)
      const walletIdx = currentWallets.findIndex(w => w.vendor_id === vendorId);
      if (walletIdx !== -1) {
        currentWallets[walletIdx].pending_balance += payoutAmount;
      }

      this.logAudit('ESCROW_HELD', 'escrow_transactions', newEscrow.id, null, newEscrow);
    }

    this.orders = currentOrders;
    this.orderItems = currentOrderItems;
    this.escrowTransactions = currentEscrows;
    this.wallets = currentWallets;

    // Clear cart items for buyer
    this.cartItems = this.cartItems.filter(i => i.cart_id !== `cart-${buyerId}`);
  }

  // Buyer confirms delivery -> escrow released to vendor available balance
  confirmDelivery(orderId: string) {
    const orders = this.orders;
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');

    const order = orders[orderIndex];
    order.status = 'completed';
    orders[orderIndex] = order;
    this.orders = orders;

    // Update escrow transaction
    const escrows = this.escrowTransactions;
    const escrowIdx = escrows.findIndex(e => e.order_id === orderId && e.status === 'held');
    if (escrowIdx !== -1) {
      const escrow = escrows[escrowIdx];
      escrow.status = 'released';
      escrow.released_at = new Date().toISOString();
      
      // Update wallet: move pending_balance -> available_balance
      const wallets = this.wallets;
      const walletIdx = wallets.findIndex(w => w.vendor_id === order.vendor_id);
      if (walletIdx !== -1) {
        wallets[walletIdx].pending_balance = Math.max(0, wallets[walletIdx].pending_balance - escrow.held_amount);
        wallets[walletIdx].available_balance += escrow.held_amount;
        this.wallets = wallets;
      }

      this.escrowTransactions = escrows;
      this.logAudit('ESCROW_RELEASED', 'escrow_transactions', escrow.id, { status: 'held' }, { status: 'released' });
    }
  }

  // Buyer raises dispute
  disputeEscrow(orderId: string) {
    const orders = this.orders;
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error('Order not found');

    const order = orders[orderIndex];
    order.status = 'disputed';
    orders[orderIndex] = order;
    this.orders = orders;

    // Update escrow transaction
    const escrows = this.escrowTransactions;
    const escrowIdx = escrows.findIndex(e => e.order_id === orderId && e.status === 'held');
    if (escrowIdx !== -1) {
      const escrow = escrows[escrowIdx];
      escrow.status = 'disputed';
      this.escrowTransactions = escrows;
      this.logAudit('ESCROW_DISPUTED', 'escrow_transactions', escrow.id, { status: 'held' }, { status: 'disputed' });
    }
  }

  // Request payout
  requestPayout(vendorId: string, amount: number) {
    const wallets = this.wallets;
    const walletIdx = wallets.findIndex(w => w.vendor_id === vendorId);
    if (walletIdx === -1) throw new Error('Wallet not found');

    const wallet = wallets[walletIdx];
    if (wallet.available_balance < amount) throw new Error('Insufficient funds');

    wallet.available_balance -= amount;
    this.wallets = wallets;

    const payouts = this.payoutRequests;
    const newRequest: PayoutRequest = {
      id: Math.random().toString(),
      vendor_id: vendorId,
      amount,
      status: 'pending',
      processed_at: null,
      created_at: new Date().toISOString()
    };
    payouts.push(newRequest);
    this.payoutRequests = payouts;

    this.logAudit('PAYOUT_REQUESTED', 'payout_requests', newRequest.id, null, newRequest);
  }
}

export const db = new LocalStorageDB();
