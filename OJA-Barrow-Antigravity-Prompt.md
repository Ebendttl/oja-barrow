# ỌJÀ — "Barrow"
### Nigeria's open market, digitized: haggle, buy, sell, deliver — no wahala.
### A complete, senior-architect build prompt for Antigravity IDE

---

## 0. The pivot, stated plainly

The attached documents solved a *single-property, multi-unit services* problem — one landlord, three or four in-house crafts (a hall, a kitchen, a laundry), one owner checking one dashboard. That's a real and good shape, but it's a fundamentally closed system: fixed number of "vendors" (all of them are the same company), fixed catalog, fixed physical address.

What follows is the opposite shape on every axis that matters:

| Axis | The attached docs (Iroko Court / REOL) | This document (Ọjà / Barrow) |
|---|---|---|
| **Business type** | One owner, one property, few in-house service units | Open multi-vendor marketplace — thousands of independent sellers |
| **Category** | Hospitality/events, food, laundry (services) | Physical goods — electronics, fashion, phones, home, beauty — sold and shipped |
| **Who lists things** | Only the owner/staff, via an admin console | Any approved vendor, self-serve, from their own dashboard |
| **Money model** | Simple income/expense ledger for one business | Multi-party marketplace wallet: escrow, commission, vendor payouts, refunds |
| **Core differentiator** | A unified brand across services under one roof | **Haggle Mode** — real price negotiation baked into checkout (see §4) |
| **Design language** | Premium, editorial, restrained, serif headlines, muted forest/gold | Loud, fast, dense, colorful — an actual market's energy, not a boutique hotel's |
| **Comparable products** | Boutique hospitality/property sites | Jumia, Jiji, Temu, Konga — but with a distinct negotiation mechanic none of them fully commit to |

Same underlying engineering discipline (Next.js + Supabase, RLS as the real security boundary, one repo/two-or-three faces), completely different product, purpose, and visual identity.

---

## 1. The name, and why it's not decoration

**`Ọjà`** *(oh-JAH)* is the Yoruba word for **market** — not a generic "marketplace" business-plan word, but the actual word a Lagos or Ibadan trader uses for the physical, loud, negotiable, alive place where buying and selling happens. It's short, it's ownable as a wordmark, it's instantly legible to the target market, and — critically — it sets an honest expectation: prices here are a *starting point*, not a final word. That expectation is the whole product.

**Legal entity:** Ọjà Digital Markets Limited
**Public brand:** Ọjà
**Internal platform / ops engine name:** **Barrow**

A barrow is the handcart Nigerian market traders use to haul goods between stalls, from the delivery truck to the shop front, behind the noise and color of the market itself. It's the unglamorous machine that makes the market work. That's exactly what the internal engine is: vendor onboarding, inventory, order routing, escrow, payouts, dispute resolution, rider dispatch — invisible to the shopper, indispensable to the seller.

**Tagline:** *"One Market. Every Vendor. Every Deal, Delivered."*
**Secondary line (used in onboarding/marketing):** *"Haggle like the market. Pay like the internet."*

---

## 2. The architectural thesis

A marketplace is not a tree with one trunk — it's a market square with a gate, a ledger-keeper, and a road out to every buyer's door. Concretely:

- **One Turborepo, one Next.js 14+ App Router codebase**, three route groups, one Supabase backend, one design-token system with per-surface theming.
- **`(bazaar)`** — public, unauthenticated where possible (browsing, search, storefronts), auth-required only at cart/checkout/haggle. SEO-indexed, fast, this is the shopper's whole world.
- **`(stall)`** — private, vendor-role-gated. Every approved seller's dashboard: products, orders, haggle inbox, wallet, analytics, "stall styling" (a vendor can theme their own storefront page within brand guardrails — this is a real point of pride for market traders and should be a real feature, not an afterthought).
- **`(control)`** — private, admin/ops-role-gated. Vendor approval queue, category & commission management, dispute resolution for escrow holds, rider/logistics oversight, platform-wide financial reporting.
- **One unified Postgres schema in Supabase**, RLS as the actual boundary: a vendor can only ever see their own products/orders/payouts; a buyer can only ever see their own orders/haggle threads; only `(control)` roles can see cross-vendor financials or resolve disputes. A public browsing route must never leak another shopper's order or another vendor's payout balance.

Building this as separate "seller app" / "buyer app" / "admin panel" repos means three copies of the design tokens, three Supabase clients, and drift within two sprints — same lesson as the property-services version, applied to a much larger, much messier many-to-many system.

---

## 3. Monorepo & Route Architecture

```
oja/                                   ← Turborepo root
│
├── apps/
│   ├── web/
│   │   └── app/
│   │       ├── (bazaar)/              ← PUBLIC-FIRST · buyer-facing · SEO-indexed
│   │       │   ├── page.tsx                     Homepage — flash sales, category rail, trending stalls
│   │       │   ├── search/page.tsx               Full search + filters (price, location, vendor rating)
│   │       │   ├── category/[slug]/page.tsx      Category grid
│   │       │   ├── product/[slug]/page.tsx       Product detail — buy now / haggle / add to cart
│   │       │   ├── vendor/[slug]/page.tsx        Public vendor storefront ("stall page")
│   │       │   ├── market-days/page.tsx          Scheduled flash-sale events, countdown timers
│   │       │   ├── cart/page.tsx
│   │       │   ├── checkout/page.tsx             Escrow-backed checkout
│   │       │   ├── haggle/[threadId]/page.tsx    Buyer-side negotiation chat
│   │       │   ├── orders/page.tsx               Buyer order history + delivery tracking
│   │       │   └── sell-on-oja/page.tsx          Vendor recruitment landing page
│   │       │
│   │       ├── (stall)/               ← PRIVATE · vendor role · self-serve seller console
│   │       │   ├── overview/page.tsx             Today's sales, pending haggles, low stock alerts
│   │       │   ├── products/                     CRUD, bulk upload via CSV, variants, stock
│   │       │   ├── orders/page.tsx               Fulfilment pipeline (paid → packed → handed to rider → delivered)
│   │       │   ├── haggle-inbox/page.tsx         All open negotiations, accept/counter/reject
│   │       │   ├── wallet/page.tsx                Escrow-released balance, payout requests, transaction log
│   │       │   ├── analytics/page.tsx            Views, conversion, top products, repeat-buyer rate
│   │       │   └── stall-settings/page.tsx       Storefront banner, bio, accent color (within brand guardrails)
│   │       │
│   │       ├── (control)/             ← PRIVATE · admin/ops role · platform command center
│   │       │   ├── vendor-approvals/page.tsx
│   │       │   ├── categories/page.tsx
│   │       │   ├── disputes/page.tsx             Escrow disputes, evidence, refund/release decisions
│   │       │   ├── riders/page.tsx                Logistics partner/rider roster & performance
│   │       │   ├── commissions/page.tsx          Per-category commission rates
│   │       │   └── reports/page.tsx              Platform-wide GMV, take-rate, growth
│   │       │
│   │       └── (auth)/
│   │           └── login|register/page.tsx        Shared auth; role determines which faces unlock
│   │
│   └── rider/                          ← Reserved for Phase 2 Expo delivery-partner app (empty scaffold)
│
├── packages/
│   ├── database/                       ← Supabase types, SQL migrations, seed scripts
│   ├── ui/                             ← Shared shadcn/ui components + design tokens (theming per role)
│   ├── config/
│   └── shared/                         ← Haggle state machine, escrow state machine, pricing utils
```

---

## 4. The differentiator: Haggle Mode

Jumia gives you a fixed price. Jiji lets a seller tag "negotiable" and then hands the whole negotiation off to raw WhatsApp/phone calls, outside the platform, where the platform earns nothing and protects no one. Temu's whole model is that the price is already rock-bottom and non-negotiable. None of them digitize the actual *mechanic* of a Nigerian market haggle — the back-and-forth, the "last price," the good-natured push — as a first-class, trackable, in-platform interaction. Ọjà does.

**How it works, concretely:**

1. Any product a vendor marks `haggle_enabled = true` shows both a **"Buy Now"** price and a **"Make an Offer"** button next to it.
2. Tapping "Make an Offer" opens a `haggle_threads` conversation: buyer proposes a price (with an optional message), vendor gets a push/in-app notification, and can **Accept** (converts straight to a cart at the agreed price, held for 15 minutes), **Counter** (proposes a new price), or **Decline**.
3. A visible, capped back-and-forth (configurable, default max 5 rounds) keeps it feeling like a real haggle without becoming an infinite spam loop.
4. Every accepted haggle price is honored automatically at checkout — the buyer never has to re-explain themselves, and the vendor never has to manually override a price.
5. Vendors can set a **hidden floor price** per product; the system will silently auto-decline any offer below it rather than making the vendor respond to lowballs one by one — small mercy, big retention driver for busy sellers.
6. All of this happens **inside escrow-backed checkout**, so — unlike a WhatsApp haggle — the buyer's money is actually protected once a deal is struck.

This single mechanic is the thing that makes Ọjà feel like *the market*, not just another catalog app, and it's the reason the data model below has a `haggle_threads` / `haggle_offers` pair instead of only `products` / `orders`.

---

## 5. Brand & Visual Identity

| Layer | Identity |
|---|---|
| **Legal entity** | Ọjà Digital Markets Limited |
| **Public brand** | Ọjà |
| **Internal ops engine** | Barrow |
| **Buyer-facing surface** | Ọjà Bazaar |
| **Seller-facing surface** | Ọjà Stall |
| **Admin/ops surface** | Barrow Control |
| **Tagline** | "One Market. Every Vendor. Every Deal, Delivered." |
| **Primary palette** | Hot market coral `#FF5A36` · sunflower `#FFC93C` · deep indigo `#191A35` (adire-cloth blue) |
| **Support palette** | Market green `#0FA968` (trust/escrow/delivered states) · warm neutral `#FFF8EE` background |
| **Typography** | A bold, rounded, high-energy display sans (Clash Display or Bricolage Grotesque) for headlines and price tags; a clean workhorse sans (Inter) for body/UI — this should feel like a phone-first shopping app you tap fast, never like a slow editorial magazine |
| **Motif** | Adire/Ankara-pattern accents used sparingly as section dividers and empty-state illustrations — texture, not wallpaper |

**Explicitly the opposite design instinct from a premium hospitality brand:** dense grids over generous whitespace, countdown timers and "X sold today" social proof over quiet restraint, bold saturated color-blocking over a muted forest/gold spine, energetic micro-copy ("Last price?" / "Deal! 🤝" / "3 left at this price") over polished formal copy.

---

## 6. Core Data Model (Barrow's Postgres schema)

```
organizations              — the platform tenant (Ọjà itself; future-proofs white-labeling)
users                       — auth.users extension: role enum (buyer, vendor, rider, ops_admin, super_admin)
vendors                     — approval_status, payout_account, commission_rate_override, stall_theme
categories                  — hierarchical (parent_id), commission_rate default
products                    — vendor_id, category_id, price, haggle_enabled, floor_price (nullable, hidden), stock
product_variants            — size/color/etc, stock per variant
product_images
carts / cart_items
orders                      — buyer_id, vendor_id (one order per vendor per checkout, split-cart pattern), status
order_items
escrow_transactions         — order_id, held_amount, status (held → released → refunded → disputed), released_at
haggle_threads              — product_id, buyer_id, vendor_id, status (open/accepted/declined/expired), round_count
haggle_offers               — thread_id, offered_by, amount, message, created_at
wallets                     — vendor_id, available_balance, pending_balance
payout_requests             — vendor_id, amount, status, processed_at
disputes                    — order_id, opened_by, reason, evidence_urls, resolution, resolved_by (ops_admin)
riders                      — profile, coverage_area, active status
deliveries                  — order_id, rider_id, status (assigned → picked_up → in_transit → delivered), proof_of_delivery
reviews                     — order_id, buyer_id, vendor_id, product_rating, vendor_rating, comment
flash_sales / market_days   — scheduled windows, participating products, discount rules
notifications_preferences
audit_log                   — every financial/escrow mutation, immutable
```

RLS posture: buyers see only their own `orders`, `carts`, `haggle_threads` (as a participant); vendors see only rows where `vendor_id` matches their own vendor record; `ops_admin`/`super_admin` roles see across the platform for disputes, approvals, and reporting — and every escrow release or refund is logged to `audit_log` with no exceptions, since this is the one place real money changes hands between strangers.

---

## 7. Page-by-Page: Ọjà Bazaar (public, buyer-facing)

1. **Homepage** — hero carousel (Market Days flash sales), category rail, "Trending Stalls" (top-rated vendors), "Haggle-Friendly Deals" shelf (products with `haggle_enabled=true` surfaced specifically, since this is the hook), recently-viewed, footer with trust badges (Escrow Protected, Verified Vendors).
2. **Search & Category pages** — filters (price range, location/state, vendor rating, "accepts haggle" toggle, in-stock only), infinite scroll grid, sort (price, newest, best-selling).
3. **Product detail** — image gallery, price + Buy Now + Make an Offer, vendor mini-card (rating, response time, "typically accepts offers within X%"), variant selector, reviews, related products, share.
4. **Vendor storefront (`/vendor/[slug]`)** — the vendor's "stall": banner, bio, all their products, rating breakdown, response-time badge — this is the page that makes a seller feel like they own a real shopfront, not just a row in a database.
5. **Market Days (`/market-days`)** — scheduled flash-sale events with countdown timers, "notify me" opt-in, past-event archive for FOMO/social proof.
6. **Cart → Checkout** — split by vendor automatically (multi-vendor cart = multiple orders, one payment flow), delivery address, payment (card/bank transfer/USSD via a Nigerian payment processor — Paystack or Flutterwave), order summary showing escrow protection messaging plainly ("Your money is held safely until you confirm delivery").
7. **Haggle thread view** — chat-style offer/counter UI, round counter, live countdown on accepted offers ("Deal held for 14:32 — checkout now"), push notification on every counter.
8. **Orders & tracking** — status pipeline, rider location/ETA where available, "Confirm Delivery" button (this is what triggers escrow release to the vendor), one-tap "Open a dispute" if something's wrong.
9. **Sell on Ọjà** — vendor recruitment page: how commission works, how payouts work, how haggle floor prices protect them, application form feeding the `(control)` approvals queue.

---

## 8. Ọjà Stall (private, vendor console) — features in build order

1. Vendor onboarding: application → `(control)` approval → guided first-product upload wizard.
2. Product management: create/edit, bulk CSV upload, variants, stock, `haggle_enabled` + hidden `floor_price` fields.
3. Order fulfilment pipeline with status transitions, packing-slip/label generation.
4. Haggle inbox: every open thread as an actionable queue, accept/counter/decline, auto-decline-below-floor running silently in the background.
5. Wallet: available vs. pending balance (pending = still in active escrow), payout request flow, full transaction history.
6. Analytics: views → conversion funnel, top products, average accepted-haggle discount, repeat-buyer rate.
7. Stall settings: banner image, bio, accent color picker constrained to a brand-safe palette (so every stall still feels like Ọjà, not a foreign site).

## 9. Barrow Control (private, admin/ops) — features in build order

1. Vendor approval queue with document/ID review checklist.
2. Category & commission management (global defaults + per-vendor overrides).
3. Dispute resolution console: order + escrow status + evidence side-by-side, release/refund/split decision, always logged.
4. Rider/logistics roster and performance (on-time %, delivery volume).
5. Platform-wide reporting: GMV, take-rate, top categories, vendor growth, haggle-conversion rate (how often an offer becomes a sale — this number matters a lot to the business).
6. Audit log viewer, platform-wide, searchable/filterable.

---

## 10. Non-Functional Requirements

Mobile-first at every breakpoint, genuinely pleasant one-handed on a mid-range Android phone (this is where the actual Ọjà shopper is). Installable as a PWA. Buyer-side pages target Lighthouse mobile performance 90+, full SEO metadata per product/category/vendor page, sitemap.xml, semantic HTML. RLS on every table with no exceptions; escrow and payout logic covered by automated tests since this is where real money moves between strangers; signed/expiring URLs for any exported vendor reports. Payments via a Nigerian-market processor (Paystack/Flutterwave) with webhook-verified confirmation before any order is marked paid — never trust a client-side "success" callback alone. Design with Nigeria's NDPR in mind for buyer/vendor data retention and consent. TypeScript strict, ESLint + Prettier, feature-based folders, a README documenting setup, environment variables, the schema ERD, and the haggle/escrow state machines specifically (these are the two subsystems a future engineer must never misunderstand).

---

## 11. The Antigravity Prompt (copy-paste this block)

```
=== PROJECT ===
Build "Ọjà" (public brand) powered by "Barrow" (internal ops engine) — a multi-vendor
e-commerce marketplace for the Nigerian market, in the spirit of Jumia/Jiji/Temu, but with a
core differentiator: an in-platform, escrow-protected price-negotiation feature called
"Haggle Mode." Legal entity: Ọjà Digital Markets Limited. Tagline: "One Market. Every Vendor.
Every Deal, Delivered."

=== STACK ===
Turborepo monorepo. Next.js 14+ App Router (apps/web) with THREE route groups sharing one
Supabase (Postgres + Auth + Storage + Edge Functions) backend: (bazaar) public buyer-facing
marketplace, (stall) private vendor seller-console, (control) private admin/ops command center,
plus a shared (auth) group. TypeScript strict throughout. shadcn/ui + Tailwind for the component
layer, with a shared design-token package (packages/ui) themed per surface. Zod + React Hook
Form for all forms. Paystack (or Flutterwave) for payment collection with webhook-verified
confirmation — never trust client-side success callbacks. RLS on every Supabase table as the
real security boundary, not a UI convention: buyers see only their own orders/carts/haggle
threads; vendors see only rows scoped to their own vendor_id; only ops_admin/super_admin roles
see cross-vendor financials, disputes, or platform reporting.

=== CORE DATA MODEL ===
organizations, users (role enum: buyer/vendor/rider/ops_admin/super_admin), vendors
(approval_status, payout_account, stall_theme), categories (hierarchical, commission_rate),
products (vendor_id, price, haggle_enabled boolean, floor_price nullable+hidden, stock),
product_variants, product_images, carts/cart_items, orders (split-cart pattern: one order per
vendor per checkout), order_items, escrow_transactions (held → released → refunded → disputed),
haggle_threads (product_id, buyer_id, vendor_id, status, round_count, capped at 5 rounds
default), haggle_offers (thread_id, offered_by, amount, message), wallets (available_balance,
pending_balance), payout_requests, disputes (evidence_urls, resolution, resolved_by),
riders, deliveries (status pipeline + proof_of_delivery), reviews, flash_sales/market_days,
audit_log (immutable, every escrow/financial mutation logged with no exceptions).

=== HAGGLE MODE — THE CORE DIFFERENTIATOR, BUILD THIS CAREFULLY ===
Any product with haggle_enabled=true shows both "Buy Now" and "Make an Offer." An offer opens
a haggle_thread; the vendor can Accept (locks the agreed price into a 15-minute-held cart),
Counter (new haggle_offer row, notifies the buyer), or Decline. Cap negotiation rounds at 5
by default (configurable per organization). Vendors may set a hidden floor_price per product;
offers below it are auto-declined silently by a Supabase Edge Function or server action —
the vendor is never bothered by lowball offers. An accepted haggle price is honored
automatically at checkout with no manual override needed. All of this must happen inside the
same escrow-backed checkout flow as a normal Buy Now purchase, so a struck deal is always
payment-protected, unlike an off-platform WhatsApp haggle.

=== DESIGN DIRECTION (this is the differentiator's visual half — take it seriously) ===
Reference the ENERGY, never the literal layout, of: Jumia's dense category grids and flash-sale
banners, Temu's countdown-timer urgency and "X left" scarcity cues, and Jiji's classifieds-style
browsing density — synthesized into something distinctly Nigerian-market in spirit: loud, warm,
fast, negotiable. Palette: hot coral #FF5A36, sunflower #FFC93C, deep indigo #191A35 (adire-cloth
blue), market green #0FA968 for trust/escrow/delivered states, warm neutral #FFF8EE background.
Typography: a bold, rounded, high-energy display sans (Clash Display or Bricolage Grotesque) for
headlines/price tags, paired with Inter for body/UI — phone-first and tappable, not editorial.
Motif: adire/Ankara-pattern accents used sparingly as section dividers and empty-state
illustrations, never as wallpaper. Micro-copy should have market personality ("Last price?",
"Deal! 🤝", "3 left at this price") rather than generic SaaS tone. Motion: countdown timers on
Market Days and held-haggle-offers, smooth card hover (image scale + "Make an Offer" button
reveal), skeleton loading on category grids, satisfying micro-interaction on Accept/Counter/
Decline in the haggle chat UI. Mobile-first: sticky Buy Now/Make an Offer bar on product pages,
bottom tab nav (Home/Search/Cart/Haggle Inbox/Orders) on mobile, Lighthouse mobile score 90+,
next/image throughout, lazy-loaded below-the-fold grids.

=== ỌJÀ BAZAAR (PUBLIC) — PAGES, IN BUILD ORDER ===
1. Homepage: hero carousel for Market Days, category rail, "Trending Stalls," a dedicated
   "Haggle-Friendly Deals" shelf, recently-viewed, trust-badge footer (Escrow Protected,
   Verified Vendors).
2. Search & category pages: filters (price range, location, vendor rating, "accepts haggle"
   toggle, in-stock), infinite scroll, sort options.
3. Product detail (`/product/[slug]`): gallery, Buy Now + Make an Offer, vendor mini-card
   (rating, avg response time, typical accepted-offer discount %), variants, reviews, related
   products.
4. Vendor storefront (`/vendor/[slug]`): banner, bio, full product grid, rating breakdown.
5. Market Days (`/market-days`): scheduled flash sales, countdown timers, notify-me capture,
   past-event archive.
6. Cart → Checkout: auto-split by vendor into separate orders under one payment flow, address
   entry, Paystack/Flutterwave payment, explicit escrow-protection messaging shown to the buyer.
7. Haggle thread view (`/haggle/[threadId]`): chat-style offer/counter UI, round counter,
   live countdown on an accepted-but-not-yet-checked-out offer.
8. Orders & tracking: status pipeline, rider ETA where available, "Confirm Delivery" button
   (triggers escrow release), "Open a dispute" action.
9. Sell on Ọjà landing page: commission explainer, payout explainer, floor-price protection
   explainer, application form feeding the (control) vendor-approvals queue.

=== ỌJÀ STALL (VENDOR, PRIVATE) — FEATURES, IN BUILD ORDER ===
1. Vendor application + onboarding wizard (post-approval): guided first product upload.
2. Product CRUD + bulk CSV upload, variants, stock, haggle_enabled + hidden floor_price.
3. Order fulfilment pipeline (paid → packed → handed to rider → delivered) with packing-slip
   generation.
4. Haggle inbox: all open threads as an actionable queue with accept/counter/decline.
5. Wallet: available vs. pending balance, payout requests, full transaction history.
6. Analytics: views→conversion funnel, top products, average accepted-haggle discount,
   repeat-buyer rate.
7. Stall settings: banner, bio, accent-color picker constrained to a brand-safe palette subset.

=== BARROW CONTROL (ADMIN/OPS, PRIVATE) — FEATURES, IN BUILD ORDER ===
1. Vendor approval queue with document/ID review checklist.
2. Category & commission management (platform defaults + per-vendor overrides).
3. Dispute resolution console: order + escrow status + evidence side-by-side, with a
   release/refund/split decision that always writes to audit_log.
4. Rider/logistics roster and delivery performance view.
5. Platform-wide reporting: GMV, take-rate, top categories, vendor growth, and specifically
   haggle-to-sale conversion rate.
6. Audit log viewer: searchable/filterable, platform-wide.

=== NON-FUNCTIONAL REQUIREMENTS ===
Mobile-first responsive at every breakpoint, genuinely pleasant one-handed on a mid-range
Android phone. Installable as a PWA (manifest, service worker, offline-friendly shell). RLS on
every table with no exceptions. Escrow and payout logic covered by automated tests — this is
where real money moves between strangers and must never be left to manual QA alone. Payment
confirmation only via verified webhook, never a trusted client callback. Full SEO metadata,
sitemap.xml, robots.txt, semantic HTML, accessible alt text throughout the (bazaar) surface.
Lighthouse mobile performance 90+ on buyer-facing pages. Design with Nigeria's NDPR (not GDPR
boilerplate) in mind for buyer and vendor data retention/consent. TypeScript strict, ESLint +
Prettier, feature-based folder structure, a README documenting setup, environment variables,
the schema ERD, and — specifically — the haggle_threads/haggle_offers and escrow_transactions
state machines, since a future engineer must never misunderstand these two subsystems.
Architect vendor onboarding and category management so a brand-new product category or a
white-labeled "sister market" can be added primarily through configuration and seed data,
never a schema rewrite.

=== GITHUB REPOSITORY ===
Repository name: oja-barrow
Full path: github.com/<your-username>/oja-barrow
Description: "Ọjà (Barrow) — a multi-vendor Nigerian marketplace with escrow-protected,
in-platform price haggling. Next.js + Supabase."
Suggested internal package scope if publishing shared packages later: @oja-barrow/*

=== DELIVERABLE FOR THIS SESSION ===
First scaffold the Turborepo (apps/web, packages/database, packages/ui, packages/config,
packages/shared), initialize the Next.js app with the stack above, and write the full unified
Supabase schema (organizations, users/roles, vendors, categories, products, product_variants,
carts/orders/order_items, escrow_transactions, haggle_threads, haggle_offers, wallets,
payout_requests, disputes, riders, deliveries, reviews, flash_sales, audit_log) as versioned
SQL migrations with RLS policies. Seed a handful of realistic placeholder vendors, products
(with a meaningful share of them haggle_enabled with sensible floor_prices), categories, and one
active Market Days flash sale, so both the buyer and vendor surfaces have real-looking content
to render against from day one. Then build, in this order: the shared design-token layer in
packages/ui; the (bazaar) marketing/browsing layout (header, bottom mobile nav, footer) plus the
Homepage and a working Product Detail page with a fully functional Haggle Mode end-to-end
(offer → counter → accept → held cart → checkout); then the (stall) vendor Overview dashboard
and Haggle Inbox end-to-end and working. Confirm the schema and the visual direction of the
homepage and the haggle chat UI with me before proceeding to Checkout/escrow, Orders/tracking,
the remaining Stall pages, and Barrow Control in that priority order.
```

---

## 12. A few calls worth flagging, stated plainly

- **The name is doing real work again, on purpose.** "Ọjà" isn't a cute rebrand — it sets the honest expectation ("this is a market, prices move") that the entire Haggle Mode feature depends on. A generic "Marketplace App" name wouldn't have earned that expectation for free.
- **Haggle Mode is the one feature worth protecting from scope-cutting.** It's tempting, under deadline pressure, to ship this as "just a message a buyer can send a vendor" — resist that. The moment it's not a structured, capped, escrow-integrated state machine, it degrades into exactly the off-platform WhatsApp haggle that Jiji already tolerates, and the platform earns nothing and protects no one from it.
- **Split-cart-into-per-vendor-orders is a real architectural decision, not a nice-to-have.** A buyer's single checkout can span multiple independent vendors; each vendor needs their own order, their own escrow hold, and their own fulfilment pipeline, even though the buyer experienced "one checkout."
- **Escrow is the quiet hero here, same role `public_enquiries` played in the property-services version.** Without it, this is just a listings site with extra chat features. With it, every haggle that ends in a deal is actually money-safe for a stranger-to-stranger transaction — which is the entire reason a buyer would trust Ọjà over a random Instagram seller's DMs.
- **Stall theming (vendor accent color, banner) is intentionally allowed, within guardrails.** Letting a vendor feel ownership over their storefront is a real retention lever in market-trader culture — it's the digital equivalent of a trader decorating their own stall — but it's constrained to a brand-safe palette subset so the platform never looks like an uncurated free-for-all.
