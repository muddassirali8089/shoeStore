# MGEARS project context

## Project overview

MGEARS is a customer-facing footwear storefront inspired by mgears.pk. It is a frontend-only React application; it must not add a backend, database, real authentication, payment processing, or production order submission.

## Stack and commands

- React 19 and JavaScript/JSX
- Vite
- Tailwind CSS 4 (Vite plugin)
- React Router DOM
- Lucide React
- Run locally with `npm run dev`
- Validate with `npm run lint` and `npm run build`

## Main source structure

- `src/App.jsx` defines browser routes and app-wide providers.
- `src/context/` contains separate Auth, Cart, Product, UI, and Wishlist contexts.
- `src/data/products.js` is the mock catalog, categories, brands, sizes, orders, and home banners.
- `src/components/` holds shared layout, product, cart, and promotion UI.
- `src/pages/` contains home, catalog, product, checkout, account, and support pages.
- `src/index.css` contains Tailwind import, design tokens, reusable component styling, and responsive breakpoints.

## State and simulated behavior

- Cart, wishlist, mock user, saved addresses, and placed demo orders persist through local storage.
- Checkout confirmation is stored in session storage and simulates successful order placement.
- Search, category, brand, size, gender, condition, price, discount, rating, and sorting use mock product data and URL query parameters.
- All authentication, tracking, contact, and payment interfaces are frontend demonstrations only.

## UX and design conventions

- Warm neutral surfaces, dark typography, muted green accents, subtle borders, and responsive spacing.
- Keep shared behavior in the relevant Context API provider and reuse components rather than duplicating page logic.
- Maintain a dedicated mobile layout, keyboard focus visibility, semantic controls, accessible icon labels, and no horizontal overflow at small widths.
- External footwear photography currently uses Unsplash image URLs.

## Route groups

Home; shop/search/category/product; cart/checkout/order-success; login/register/password reset; account/orders/order details/profile/addresses; wishlist/tracking; return/shipping/size guide/contact/about; and a catch-all not-found page.
