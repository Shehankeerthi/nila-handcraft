# Nila Handcrafts — Backend, CMS & Payments Guide

The updated site (in this same folder) now has individual product pages, a full
shop with search/filter/sort, legal policy pages, a contact page, reviews,
and SEO tags. That covers everything that's possible as a **static site**.

What it still can't do — because these need real hosting, a database, and
provider accounts I can't create on your behalf — is:
- Take a **real payment** (Stripe / PayPal / PayHere)
- Persist orders, stock and accounts **across different visitors' devices**
  (right now, the cart/admin data lives in each visitor's own browser via
  `localStorage`, so an order placed on your phone won't show up if you check
  the admin panel on your laptop)
- Send real emails from the contact form or checkout

Below are the two realistic paths to close that gap, so you can pick one.

## Option A — Managed platform (fastest to launch)

Move the storefront onto **Shopify** or **WooCommerce** (WordPress).

- **Shopify**: ~$25–65/mo. Built-in checkout, PayHere/Stripe/PayPal all
  available as payment providers for Sri Lanka, hosting and security handled
  for you, inventory and order management included out of the box. You'd
  rebuild the current design as a Shopify theme (the visual style, product
  photography and copy all carry over directly).
- **WooCommerce**: Free plugin on top of WordPress, but you pay for hosting
  (~$5–25/mo) and are responsible for updates/security yourself. More
  flexible and cheaper long-term if you're comfortable maintaining it, or
  have a developer who is.

**Choose this if** you want to be taking real orders in days, not weeks, and
don't need anything custom beyond a normal storefront.

## Option B — Custom backend (what this prototype is built to expect)

Keep the current frontend and add a real backend behind it:

1. **API/backend**: Node.js (Express or Next.js API routes) or Django REST
   Framework, with a Postgres or MySQL database, hosted on something like
   Render, Railway, Fly.io, or a VPS. It would expose endpoints for
   products, orders, and accounts — replacing the `localStorage` calls in
   `assets/store.js` with `fetch()` calls to that API.
2. **Payments**: integrate **Stripe** (best docs, not all payment methods
   are available in Sri Lanka) or **PayHere** (built for Sri Lankan
   merchants — cards, eZ Cash, mobile banking). Both work by creating a
   checkout session server-side and redirecting the customer to a hosted
   payment page, so card details never touch your own server.
3. **Admin/CMS**: either build simple authenticated admin routes into the
   same backend (close to what the current in-page admin panel already
   does), or bolt on a headless CMS (Sanity, Strapi) purely for product
   content if a non-technical person needs to edit products without
   touching code.
4. **Email**: a transactional email service (Resend, Postmark, SendGrid) to
   send order confirmations and contact-form messages.

**Choose this if** you want a storefront that behaves and looks exactly like
this prototype, or expect to need custom logic a template platform won't
easily support.

## What to keep either way

Regardless of which path you choose, everything else already built —
product pages, filtering, legal pages, SEO tags, the visual design — carries
over. If you go with Option A, treat this prototype as the design/content
reference for your Shopify/WooCommerce theme. If you go with Option B, this
prototype's `assets/store.js` is already structured so that swapping
`localStorage` reads/writes for `fetch()` calls is the main change needed —
the rendering functions (`renderCartWidgets`, `renderProducts`, etc.) don't
need to change.

## Quick comparison

| | Shopify | WooCommerce | Custom (Node/Django) |
|---|---|---|---|
| Time to launch | Days | 1–2 weeks | Several weeks |
| Ongoing cost | $25–65/mo | $5–25/mo hosting | Hosting + your time |
| Who maintains it | Shopify | You / your host | You / a developer |
| Payment gateways for LK | Stripe, PayHere via app | Stripe, PayHere plugins | Direct integration |
| Design flexibility | Theme-constrained | High | Unlimited |
| Best for | Fastest path to selling | Budget + WordPress comfort | Full control, this exact design |
