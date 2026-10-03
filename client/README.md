# ShoeStore storefront and admin

React/Vite storefront and store-management interface integrated with the Express API in `../server`.

## Configure and run

The client reads `VITE_API_URL` as the API base URL (including `/api/v1`). Copy `.env.example` to `.env.local` and adjust it if the API is hosted elsewhere. The default is `http://localhost:5000/api/v1`.

Run the backend and configure its database, JWT, email, and image-storage environment first. Product creation and image uploads require valid backend admin authentication and a configured Cloudinary account. Then:

```sh
npm install
npm run dev
```

The server must allow the Vite client origin through `CLIENT_ORIGIN`.

## Verify

```sh
npm run lint
npm run build
```

## Customer routes and data

- `/`, `/shop`, `/search`, `/category/:category` — API-backed catalog and taxonomy
- `/product/:id` — product details
- `/cart`, `/checkout`, `/order-success` — guest cart and server-confirmed checkout
- `/wishlist` — browser-local guest wishlist
- `/track-order` — order lookup by order number and checkout phone
- `/return-policy`, `/shipping-policy`, `/size-guide`, `/contact`, `/about` — support pages

Guest checkout submits only cash-on-delivery orders. The backend validates product IDs, selected size quantities and availability and calculates the confirmed order totals. The cart/wishlist remain local. There are no customer-account, product-review, online-payment, public discount-validation/redemption, or contact-submission endpoints, so those demo/support experiences remain unconnected.

## Admin routes and data

Open `/admin/login` and authenticate using credentials for an admin account configured on the backend. Admin pages use bearer-token authentication; no demo password or mock browser authentication is provided.

- `/admin/dashboard`, `/admin/inventory`, `/admin/settings`
- `/admin/products`, `/admin/products/add`, `/admin/products/edit/:id`
- `/admin/categories`, `/admin/categories/add`, `/admin/categories/edit/:id`
- `/admin/brands`, `/admin/brands/add`, `/admin/brands/edit/:id`
- `/admin/orders`, `/admin/orders/:id`
- `/admin/customers`, `/admin/customers/:id`
- `/admin/discounts`
- `/admin/forgot-password`, `/admin/verify-code`, `/admin/reset-password`

Product administration uploads the original browser-selected image files (up to four) and retains existing backend image URLs. Forgot-password codes are delivered through the backend email configuration.

## Configuration

See `../server/README.md` for API routes and backend setup. Never put backend secrets in client environment variables; only the public API base URL belongs here.
