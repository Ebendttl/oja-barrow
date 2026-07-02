-- Initial migration for Ọjà (Barrow)
-- Enables UUID generation and sets up schema, enums, triggers, and RLS.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums/Types if necessary (using TEXT constraints is more flexible in Supabase, but we will use clean CHECK constraints)

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Users (extending auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'vendor', 'rider', 'ops_admin', 'super_admin')),
    full_name TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    banner_url TEXT,
    approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    payout_account JSONB,
    commission_rate_override NUMERIC,
    stall_theme JSONB DEFAULT '{"accentColor": "#FF5A36"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Categories (hierarchical)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    commission_rate NUMERIC NOT NULL DEFAULT 5.0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    haggle_enabled BOOLEAN NOT NULL DEFAULT false,
    floor_price NUMERIC CHECK (floor_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_floor_price CHECK (floor_price IS NULL OR floor_price <= price)
);

-- 6. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Size', 'Color'
    value TEXT NOT NULL, -- e.g., 'L', 'Blue'
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price_override NUMERIC CHECK (price_override >= 0)
);

-- 7. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Carts & Cart Items
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    agreed_price NUMERIC CHECK (agreed_price >= 0),
    haggle_thread_id UUID, -- NULL if purchased at standard price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_id UUID NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'completed', 'cancelled')) DEFAULT 'pending_payment',
    shipping_address JSONB NOT NULL,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    commission_amount NUMERIC NOT NULL CHECK (commission_amount >= 0),
    payout_amount NUMERIC NOT NULL CHECK (payout_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0)
);

-- 11. Escrow Transactions
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    held_amount NUMERIC NOT NULL CHECK (held_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('held', 'released', 'refunded', 'disputed')) DEFAULT 'held',
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Haggle Threads
CREATE TABLE IF NOT EXISTS haggle_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'declined', 'expired')) DEFAULT 'open',
    round_count INTEGER NOT NULL DEFAULT 1 CHECK (round_count <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Haggle Offers
CREATE TABLE IF NOT EXISTS haggle_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES haggle_threads(id) ON DELETE CASCADE,
    offered_by TEXT NOT NULL CHECK (offered_by IN ('buyer', 'vendor', 'system')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
    available_balance NUMERIC NOT NULL DEFAULT 0.0 CHECK (available_balance >= 0),
    pending_balance NUMERIC NOT NULL DEFAULT 0.0 CHECK (pending_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Payout Requests
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'processed')) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('open', 'resolved_refunded', 'resolved_released', 'cancelled')) DEFAULT 'open',
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Riders
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    coverage_area JSONB,
    rating NUMERIC DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')) DEFAULT 'assigned',
    proof_of_delivery TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_rating INTEGER CHECK (product_rating BETWEEN 1 AND 5),
    vendor_rating INTEGER CHECK (vendor_rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Flash Sales / Market Days
CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    discount_rules JSONB, -- Details of participating products and discount percentages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. Audit Log (Immutable ledger tracker)
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    row_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------------------------------
-- LEDGER SYNC TRIGGERS
--------------------------------------------------------------------------------

-- Trigger 1: Sync Escrow to Vendor Wallet balances
CREATE OR REPLACE FUNCTION handle_escrow_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Wallet row must exist. Auto-create if missing.
    INSERT INTO wallets (vendor_id, available_balance, pending_balance)
    SELECT o.vendor_id, 0.0, 0.0
    FROM orders o
    WHERE o.id = NEW.order_id
    ON CONFLICT (vendor_id) DO NOTHING;

    -- If escrow transaction transitions to 'held' (meaning paid)
    IF NEW.status = 'held' AND (OLD.status IS NULL OR OLD.status <> 'held') THEN
        UPDATE wallets
        SET pending_balance = pending_balance + NEW.held_amount
        WHERE vendor_id = (SELECT vendor_id FROM orders WHERE id = NEW.order_id);
        
        INSERT INTO audit_log (action, table_name, row_id, new_values)
        VALUES ('ESCROW_HELD', 'escrow_transactions', NEW.id, row_to_json(NEW)::jsonb);
    
    -- If escrow is released to vendor
    ELSIF NEW.status = 'released' AND OLD.status = 'held' THEN
        UPDATE wallets
        SET pending_balance = pending_balance - NEW.held_amount,
            available_balance = available_balance + NEW.held_amount
        WHERE vendor_id = (SELECT vendor_id FROM orders WHERE id = NEW.order_id);
        
        INSERT INTO audit_log (action, table_name, row_id, old_values, new_values)
        VALUES ('ESCROW_RELEASED', 'escrow_transactions', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        
    -- If escrow is refunded back to buyer
    ELSIF NEW.status = 'refunded' AND OLD.status = 'held' THEN
        UPDATE wallets
        SET pending_balance = pending_balance - NEW.held_amount
        WHERE vendor_id = (SELECT vendor_id FROM orders WHERE id = NEW.order_id);
        
        INSERT INTO audit_log (action, table_name, row_id, old_values, new_values)
        VALUES ('ESCROW_REFUNDED', 'escrow_transactions', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        
    -- If escrow is disputed
    ELSIF NEW.status = 'disputed' AND OLD.status = 'held' THEN
        -- We keep the balance in pending until dispute resolution
        INSERT INTO audit_log (action, table_name, row_id, old_values, new_values)
        VALUES ('ESCROW_DISPUTED', 'escrow_transactions', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_escrow_change
AFTER INSERT OR UPDATE ON escrow_transactions
FOR EACH ROW EXECUTE FUNCTION handle_escrow_change();

-- Trigger 2: Auto-create Wallet when vendor is approved
CREATE OR REPLACE FUNCTION auto_create_vendor_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status <> 'approved') THEN
        INSERT INTO wallets (vendor_id, available_balance, pending_balance)
        VALUES (NEW.id, 0.0, 0.0)
        ON CONFLICT (vendor_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vendor_approval
AFTER UPDATE ON vendors
FOR EACH ROW EXECUTE FUNCTION auto_create_vendor_wallet();


--------------------------------------------------------------------------------
-- HAGGLE AUTO-DECLINE TRIGGER
--------------------------------------------------------------------------------

-- Trigger 3: Silent Auto-Decline for offers below the hidden floor price
CREATE OR REPLACE FUNCTION handle_new_haggle_offer()
RETURNS TRIGGER AS $$
DECLARE
    v_floor_price NUMERIC;
    v_haggle_enabled BOOLEAN;
    v_current_round INTEGER;
    v_buyer_id UUID;
    v_vendor_id UUID;
    v_product_id UUID;
BEGIN
    -- Only evaluate if offer is placed by 'buyer'
    IF NEW.offered_by = 'buyer' THEN
        -- Get product details from the parent thread
        SELECT t.product_id, t.round_count, t.buyer_id, t.vendor_id, p.floor_price, p.haggle_enabled
        INTO v_product_id, v_current_round, v_buyer_id, v_vendor_id, v_floor_price, v_haggle_enabled
        FROM haggle_threads t
        JOIN products p ON p.id = t.product_id
        WHERE t.id = NEW.thread_id;
        
        -- If Haggle Mode is disabled, auto-decline
        IF NOT v_haggle_enabled THEN
            UPDATE haggle_threads
            SET status = 'declined', updated_at = now()
            WHERE id = NEW.thread_id;
            
            INSERT INTO haggle_offers (thread_id, offered_by, amount, message)
            VALUES (NEW.thread_id, 'system', NEW.amount, 'Offers are not currently accepted for this product.');
            
            RETURN NEW;
        END IF;

        -- Check if offer is below the hidden floor price
        IF v_floor_price IS NOT NULL AND NEW.amount < v_floor_price THEN
            -- Silent Auto-Decline!
            UPDATE haggle_threads
            SET status = 'declined', updated_at = now()
            WHERE id = NEW.thread_id;
            
            INSERT INTO haggle_offers (thread_id, offered_by, amount, message)
            VALUES (
                NEW.thread_id, 
                'system', 
                NEW.amount, 
                'Your offer is too low. The seller has declined this price. Please try a higher offer.'
            );
        -- Auto-increment round count
        ELSE
            IF v_current_round >= 5 THEN
                -- Cap exceeded: auto-expire or decline
                UPDATE haggle_threads
                SET status = 'declined', updated_at = now()
                WHERE id = NEW.thread_id;
                
                INSERT INTO haggle_offers (thread_id, offered_by, amount, message)
                VALUES (NEW.thread_id, 'system', NEW.amount, 'Maximum negotiation rounds (5) reached. This haggle is closed.');
            ELSE
                UPDATE haggle_threads
                SET round_count = round_count + 1, updated_at = now()
                WHERE id = NEW.thread_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_new_haggle_offer
AFTER INSERT ON haggle_offers
FOR EACH ROW EXECUTE FUNCTION handle_new_haggle_offer();


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE haggle_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE haggle_offers ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policies
CREATE POLICY select_orgs ON organizations FOR SELECT USING (true);
CREATE POLICY admin_orgs ON organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 2. Users Policies
CREATE POLICY select_users ON users FOR SELECT USING (true);
CREATE POLICY update_self ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY admin_users ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 3. Vendors Policies
CREATE POLICY select_vendors ON vendors FOR SELECT USING (true);
CREATE POLICY manage_own_vendor ON vendors FOR ALL USING (id = auth.uid());
CREATE POLICY admin_vendors ON vendors FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 4. Categories Policies
CREATE POLICY select_categories ON categories FOR SELECT USING (true);
CREATE POLICY admin_categories ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 5. Products Policies
CREATE POLICY select_products ON products FOR SELECT USING (true);
CREATE POLICY manage_own_products ON products FOR ALL USING (
    vendor_id = auth.uid() AND EXISTS (SELECT 1 FROM vendors WHERE id = auth.uid() AND approval_status = 'approved')
);
CREATE POLICY admin_products ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 6. Product Variants Policies
CREATE POLICY select_variants ON product_variants FOR SELECT USING (true);
CREATE POLICY manage_own_variants ON product_variants FOR ALL USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.vendor_id = auth.uid())
);

-- 7. Product Images Policies
CREATE POLICY select_images ON product_images FOR SELECT USING (true);
CREATE POLICY manage_own_images ON product_images FOR ALL USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.vendor_id = auth.uid())
);

-- 8. Carts Policies
CREATE POLICY manage_own_cart ON carts FOR ALL USING (buyer_id = auth.uid());
CREATE POLICY manage_own_cart_items ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.buyer_id = auth.uid())
);

-- 9. Orders Policies
CREATE POLICY select_own_orders ON orders FOR SELECT USING (
    buyer_id = auth.uid() OR vendor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY insert_buyer_order ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY update_order_status ON orders FOR UPDATE USING (
    vendor_id = auth.uid() OR buyer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 10. Order Items Policies
CREATE POLICY select_own_order_items ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR orders.vendor_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 11. Escrow Transactions Policies
CREATE POLICY select_own_escrow ON escrow_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = escrow_transactions.order_id AND (orders.buyer_id = auth.uid() OR orders.vendor_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY manage_escrow_admin ON escrow_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 12. Haggle Threads Policies
CREATE POLICY select_own_haggles ON haggle_threads FOR SELECT USING (
    buyer_id = auth.uid() OR vendor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY insert_buyer_haggle ON haggle_threads FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY update_own_haggles ON haggle_threads FOR UPDATE USING (buyer_id = auth.uid() OR vendor_id = auth.uid());

-- 13. Haggle Offers Policies
CREATE POLICY select_own_haggle_offers ON haggle_offers FOR SELECT USING (
    EXISTS (SELECT 1 FROM haggle_threads WHERE haggle_threads.id = haggle_offers.thread_id AND (haggle_threads.buyer_id = auth.uid() OR haggle_threads.vendor_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY insert_own_haggle_offers ON haggle_offers FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM haggle_threads 
        WHERE haggle_threads.id = thread_id 
        AND (haggle_threads.buyer_id = auth.uid() OR haggle_threads.vendor_id = auth.uid())
        AND haggle_threads.status = 'open'
    )
);

-- 14. Wallets Policies
CREATE POLICY select_own_wallet ON wallets FOR SELECT USING (
    vendor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 15. Payout Requests Policies
CREATE POLICY manage_own_payouts ON payout_requests FOR ALL USING (
    vendor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 16. Disputes Policies
CREATE POLICY select_own_disputes ON disputes FOR SELECT USING (
    opened_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM orders WHERE orders.id = disputes.order_id AND orders.vendor_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY insert_own_disputes ON disputes FOR INSERT WITH CHECK (
    opened_by = auth.uid() AND 
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND (orders.buyer_id = auth.uid() OR orders.vendor_id = auth.uid()))
);
CREATE POLICY manage_disputes_admin ON disputes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 17. Riders Policies
CREATE POLICY select_riders ON riders FOR SELECT USING (true);
CREATE POLICY manage_own_rider ON riders FOR ALL USING (id = auth.uid());

-- 18. Deliveries Policies
CREATE POLICY select_own_deliveries ON deliveries FOR SELECT USING (
    rider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM orders WHERE orders.id = deliveries.order_id AND (orders.buyer_id = auth.uid() OR orders.vendor_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
CREATE POLICY update_rider_deliveries ON deliveries FOR UPDATE USING (
    rider_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 19. Reviews Policies
CREATE POLICY select_reviews ON reviews FOR SELECT USING (true);
CREATE POLICY insert_own_reviews ON reviews FOR INSERT WITH CHECK (
    buyer_id = auth.uid() AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.buyer_id = auth.uid())
);

-- 20. Flash Sales Policies
CREATE POLICY select_flash_sales ON flash_sales FOR SELECT USING (true);
CREATE POLICY manage_flash_sales_admin ON flash_sales FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);

-- 21. Audit Log Policies
CREATE POLICY view_audit_log_admin ON audit_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('ops_admin', 'super_admin'))
);
