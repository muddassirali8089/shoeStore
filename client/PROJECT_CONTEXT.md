# MGEARS project context

## Project overview

MGEARS is a frontend-only footwear storefront inspired by mgears.pk, paired with a separate mock admin panel. There is no backend, database, API, real customer/admin authentication service, or payment processing.

## Stack and commands

- React 19 and JavaScript/JSX
- Vite
- Tailwind CSS 4 (Vite plugin)
- React Router DOM
- Lucide React
- Run with `npm run dev`; validate with `npm run lint` and `npm run build`

## Architecture

- `src/App.jsx` contains app-level providers and separates customer routes from `/admin/*`.
- `src/components/`, `src/context/`, `src/pages/`, and `src/data/` contain customer UI, state, pages, and seed data.
- `src/Admin/` contains all admin contexts, data, components, pages, and the distinct admin visual system.
- `src/context/ProductContext.jsx` synchronizes the live customer catalog, categories, and brands with admin local storage updates.
- `src/pages/Commerce.jsx` creates guest orders at checkout, stores order/customer/product/price/payment details, and notifies admin order state.

## Customer behavior

- Buyers are guests: do not add buyer login, registration, customer profiles, or account routes.
- Browse, search, filter, product details, wishlist, cart, and checkout are public.
- Checkout saves a mock order to `mg-orders` and navigates to `/order-success`.
- Track order asks for order ID and the checkout email or phone.
- Product/category/brand/order records use shared local-storage keys so admin changes reflect on the storefront.

## Admin behavior

- Admin-only routing, auth context, mock seed data, contexts, components, and pages live under `src/Admin/`.
- `/login` and `/admin/login` both direct administrators to the admin-only sign-in screen; the storefront footer labels this link clearly as **Admin login**.
- Demo credentials: `admin@example.com` / `admin123`; the local-storage auth flag is a UI simulation, not real access control.
- Admin catalog, categories, brands, orders, inventory, discounts, and settings persist in local storage.
- Customers are derived from guest order details, not accounts.

## UX and design conventions

- Customer experience uses warm neutrals and muted green. Admin uses a separate compact Django Admin-inspired data-focused design.
- Reuse page logic and components; keep state separated by domain context.
- Keep mobile intentional, tables horizontally scrollable where needed, controls semantic and labeled, focus visible, and pages free of horizontal overflow.
- Unsplash URLs provide mock product imagery; selected local image previews exist only for the current browser session.
