# MGEARS storefront and admin

A responsive, frontend-only footwear storefront and separate store management panel built with React, Vite, Tailwind CSS, React Router, and Lucide icons. There is no backend, database, real authentication service, or payment integration.

## Run locally

```sh
npm install
npm run dev
```

## Verify

```sh
npm run lint
npm run build
```

## Customer routes

- `/` — Home
- `/shop`, `/search`, `/category/:category` — Searchable and filterable catalog
- `/product/:slug` — Product details
- `/cart`, `/checkout`, `/order-success` — Guest shopping and checkout
- `/wishlist`, `/track-order` — Guest wishlist and order tracking
- `/return-policy`, `/shipping-policy`, `/size-guide`, `/contact`, `/about` — Customer support

Buyers do not log in or create customer accounts. Checkout collects guest contact and delivery details and saves mock orders in local storage.

## Admin routes

Open `/admin/login` or `/login`; both lead to the admin-only sign-in screen. Demo credentials are `admin@example.com` / `admin123`. The storefront footer also links to **Admin login**.

- `/admin/dashboard`
- `/admin/products`, `/admin/products/add`, `/admin/products/edit/:id`
- `/admin/categories`, `/admin/categories/add`, `/admin/categories/edit/:id`
- `/admin/brands`, `/admin/brands/add`, `/admin/brands/edit/:id`
- `/admin/orders`, `/admin/orders/:id`
- `/admin/customers`, `/admin/customers/:id`
- `/admin/inventory`, `/admin/discounts`, `/admin/settings`

The admin is a frontend-only mock and is not a security boundary.

Cart, wishlist, product catalog, categories, brands, guest orders, admin session, discounts, and settings use React Context and browser local storage for persistence. Product photography is loaded from Unsplash.
