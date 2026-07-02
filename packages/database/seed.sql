-- Seed script for Ọjà (Barrow)

-- 1. Insert Default Organization
INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Ọjà Digital Markets Limited', 'oja-markets')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users for Roles
-- Organization reference is '00000000-0000-0000-0000-000000000001'

-- Buyer: Chidi Egwu
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'chidi@oja.ng', 'buyer', 'Chidi Egwu', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Vendor 1: Alaba Electronics (Nnamdi)
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('22222222-2222-2222-2222-222222222222', 'nnamdi@alaba.ng', 'vendor', 'Nnamdi Obi', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Vendor 2: Adire by Yetunde (Yetunde)
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('33333333-3333-3333-3333-333333333333', 'yetunde@adire.ng', 'vendor', 'Yetunde Adebayo', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Vendor 3: Computer Village Hub (Tunde)
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('44444444-4444-4444-4444-444444444444', 'tunde@computervillage.ng', 'vendor', 'Tunde Balogun', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Admin: Ops Admin
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('55555555-5555-5555-5555-555555555555', 'admin@oja.ng', 'ops_admin', 'Barrow Admin', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Rider: Suleiman Yusuf
INSERT INTO users (id, email, role, full_name, organization_id)
VALUES ('66666666-6666-6666-6666-666666666666', 'suleiman@ojarider.ng', 'rider', 'Suleiman Yusuf', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Vendors profiles
INSERT INTO vendors (id, store_name, slug, bio, approval_status, payout_account, commission_rate_override, stall_theme)
VALUES 
('22222222-2222-2222-2222-222222222222', 'Alaba Electronics Kings', 'alaba-electronics', 'Your direct plug for premium smart TVs, sound systems, and home appliances in Lagos.', 'approved', '{"bank_name": "Access Bank", "account_number": "1234567890", "bank_code": "044"}', 4.5, '{"accentColor": "#FF5A36"}'),
('33333333-3333-3333-3333-333333333333', 'Adire by Yetunde', 'adire-by-yetunde', 'Exquisite hand-dyed adire materials, silk kaftans, and custom Kampala dresses direct from Abeokuta.', 'approved', '{"bank_name": "GTBank", "account_number": "0987654321", "bank_code": "058"}', 5.0, '{"accentColor": "#FFC93C"}'),
('44444444-4444-4444-4444-444444444444', 'Computer Village Hub', 'computer-village-hub', 'Quality UK used and brand new iPhones, Samsung Galaxies, MacBooks and gadgets. Wholesale prices.', 'approved', '{"bank_name": "Zenith Bank", "account_number": "1122334455", "bank_code": "057"}', 4.0, '{"accentColor": "#191A35"}')
ON CONFLICT (id) DO NOTHING;

-- Since the trigger `trg_vendor_approval` runs, wallets for approved vendors are automatically created by the DB trigger!
-- Let's check if they exist or insert them explicitly just in case:
INSERT INTO wallets (vendor_id, available_balance, pending_balance)
VALUES
('22222222-2222-2222-2222-222222222222', 0.0, 0.0),
('33333333-3333-3333-3333-333333333333', 0.0, 0.0),
('44444444-4444-4444-4444-444444444444', 0.0, 0.0)
ON CONFLICT (vendor_id) DO NOTHING;

-- 4. Insert Categories
-- Parent Categories
INSERT INTO categories (id, parent_id, name, slug, commission_rate)
VALUES 
('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', NULL, 'Electronics', 'electronics', 5.0),
('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', NULL, 'Fashion', 'fashion', 7.5),
('p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', NULL, 'Phones & Gadgets', 'phones-gadgets', 3.5)
ON CONFLICT (id) DO NOTHING;

-- Subcategories
INSERT INTO categories (id, parent_id, name, slug, commission_rate)
VALUES 
('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Home Audio', 'home-audio', 5.0),
('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'Traditional Wear', 'traditional-wear', 7.5),
('p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2', 'p1p1p1p1-p1p1-p1p1-p1p1-p1p1p1p1p1p1', 'Smartphones', 'smartphones', 3.5)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Products
-- Products for Computer Village Hub (Smartphones)
INSERT INTO products (id, vendor_id, category_id, name, slug, description, price, haggle_enabled, floor_price, stock)
VALUES 
('a0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2', 'iPhone 13 Pro Max (128GB, Tokunbo)', 'iphone-13-pro-max-tokunbo', 'Super clean UK used iPhone 13 Pro Max. 100% battery health, Face ID working, no scratches. 128GB space. Face-to-face quality, deal directly with computer village plugs.', 850000.00, true, 780000.00, 3),
('a0000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'p2p2p2p2-p2p2-p2p2-p2p2-p2p2p2p2p2p2', 'Samsung Galaxy S22 Ultra (Dual Sim)', 'samsung-galaxy-s22-ultra', 'Tokunbo Samsung S22 Ultra, 12GB RAM, 256GB storage. Comes with original S-Pen. Tested and certified by Computer Village Hub techs.', 680000.00, true, 620000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- Products for Adire by Yetunde (Traditional Wear)
INSERT INTO products (id, vendor_id, category_id, name, slug, description, price, haggle_enabled, floor_price, stock)
VALUES 
('b0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'Handmade Indigo Adire Silk Kaftan', 'handmade-indigo-adire-silk-kaftan', 'Luxurious hand-dyed adire silk kaftan with matching head tie. Rich deep indigo patterns that last. Comfortable for all sizes.', 45000.00, true, 38000.00, 10),
('b0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'Aso Oke Ankara Embroidered Gown', 'aso-oke-ankara-embroidered-gown', 'Premium custom embroidered Ankara gown with Aso Oke paneling at the collar and cuffs. High quality stitching for special occasions. Non-negotiable premium piece.', 65000.00, false, NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Products for Alaba Electronics (Home Audio)
INSERT INTO products (id, vendor_id, category_id, name, slug, description, price, haggle_enabled, floor_price, stock)
VALUES 
('c0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Polystar Smart Home Theater System', 'polystar-smart-home-theater', 'Heavy bass smart Bluetooth home theater system. 5.1 channel, 1000W power output, HDMI support. Feel the energy of Alaba sound systems in your parlor.', 150000.00, true, 135000.00, 8)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Product Images
INSERT INTO product_images (product_id, image_url, is_primary)
VALUES
('a0000000-0000-0000-0000-000000000001', '/images/products/iphone13.jpg', true),
('a0000000-0000-0000-0000-000000000002', '/images/products/s22ultra.jpg', true),
('b0000000-0000-0000-0000-000000000001', '/images/products/adire_silk.jpg', true),
('b0000000-0000-0000-0000-000000000002', '/images/products/aso_oke.jpg', true),
('c0000000-0000-0000-0000-000000000001', '/images/products/polystar.jpg', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Active Market Days (Flash Sale)
-- Start time is 1 hour ago, end time is 23 hours from now (active)
INSERT INTO flash_sales (id, name, slug, start_time, end_time, discount_rules)
VALUES (
    'f0000000-0000-0000-0000-000000000001', 
    'Lagos Market Day Frenzy', 
    'lagos-market-day-frenzy',
    now() - interval '1 hour',
    now() + interval '23 hours',
    '{"discount_percentage": 10, "applicable_products": ["iphone-13-pro-max-tokunbo", "handmade-indigo-adire-silk-kaftan"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
