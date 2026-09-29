# MGEARS storefront

A responsive, frontend-only footwear storefront built with React, Vite, Tailwind CSS, React Router, and Lucide icons. All catalog, account, cart, wishlist, and order behavior is simulated in the browser; there is no backend or payment integration.

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

## Routes

- `/` — Home
- `/shop`, `/search`, `/category/:category` — Searchable and filterable catalog
- `/product/:slug` — Product details
- `/cart`, `/checkout`, `/order-success` — Shopping and checkout flow
- `/login`, `/register`, `/forgot-password`, `/reset-password` — Mock account access
- `/account`, `/account/orders`, `/account/orders/:orderId`, `/account/profile`, `/account/addresses` — Customer account
- `/wishlist`, `/track-order` — Saved products and order tracking
- `/return-policy`, `/shipping-policy`, `/size-guide`, `/contact`, `/about` — Customer support and company information

Cart, wishlist, mock user, saved addresses, and placed demo orders persist in local storage. Checkout confirmation is stored for the current browser session. Product photography is loaded from Unsplash.
