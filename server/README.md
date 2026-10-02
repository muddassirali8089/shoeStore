# ShoeStore API

Node.js ES-module REST API for the ShoeStore backend. The React frontend is deliberately not connected or modified. All controller actions catch and respond to their own errors; there is no global error middleware or async-handler wrapper.

## Setup

1. From `server/`, run `npm install`.
2. Copy `.env.example` to `.env` and fill in the MongoDB, JWT, initial admin, Cloudinary, and SMTP values.
3. Run `npm run dev` for Nodemon or `npm start` for the regular server.
4. The default port is `5000`. Health: `GET http://localhost:5000/api/v1/health`.

The initial admin is created on first startup when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Passwords are hashed. Admin routes use `Authorization: Bearer <token>`.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port, defaults to 5000 |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign access tokens and hash recovery secrets |
| `JWT_EXPIRES_IN` | Access token lifetime, defaults to `1d` |
| `ADMIN_NAME` | Initial admin display name |
| `ADMIN_EMAIL` | Initial admin email and recovery destination |
| `ADMIN_PASSWORD` | Initial admin password (8+ characters) |
| `PASSWORD_RESET_CODE_EXPIRY` | Reset-code and reset-token lifetime in seconds, defaults to 600 |
| `PASSWORD_RESET_MAX_ATTEMPTS` | Wrong-code attempts before the challenge is removed, defaults to 5 |
| `CLIENT_ORIGIN` | Optional comma-separated CORS origins; unset allows any origin |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_HOST` | SMTP hostname |
| `EMAIL_PORT` | SMTP port (465 uses TLS) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Optional sender address; defaults to `EMAIL_USER` |

`.env` is ignored by Git. MongoDB and Cloudinary credentials are never returned by the API. Product uploads need all Cloudinary values; email actions need all SMTP values.

## Response and Errors

Successful responses use `{ "success": true, "message": "...", "data": ... }`. List endpoints include `pagination` when paginated. Failures use `{ "success": false, "message": "..." }`; development-mode server failures may include `error` for debugging. Do not run with `NODE_ENV` unset in a production deployment.

## Authentication

### Admin Auth

| Method | URL | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/admin/login` | Public | Login (also `/api/v1/admin/auth/login`) |
| POST | `/api/v1/admin/logout` | Admin | Discard client bearer token |
| GET | `/api/v1/admin/me` | Admin | Current admin |
| POST | `/api/v1/admin/forgot-password` | Public, rate limited | Email a six-digit code |
| POST | `/api/v1/admin/verify-code` | Public, rate limited | Verify code and receive one-time `resetToken` |
| POST | `/api/v1/admin/reset-password` | Public, rate limited | Set password with email and reset token |

The same routes are available below `/api/v1/admin/auth/`. The code is stored only as a hash, expires, and has a bounded number of attempts. Verification returns a one-use random reset token; include it in the reset request.

Login request:

```json
{ "email": "admin@example.com", "password": "your-admin-password" }
```

Recovery requests:

```json
{ "email": "admin@example.com" }
```

```json
{ "email": "admin@example.com", "code": "482913" }
```

```json
{ "email": "admin@example.com", "resetToken": "TOKEN_FROM_VERIFY_RESPONSE", "newPassword": "new-password-at-least-8-characters" }
```

## Products

| Method | URL | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/v1/products` | Public | Search, filters, sorting, pagination |
| GET | `/api/v1/products/:id` | Public | MongoDB ObjectId, active products only |
| POST | `/api/v1/products` | Admin | `multipart/form-data`; file field `images`, maximum 4 files |
| PATCH/PUT | `/api/v1/products/:id` | Admin | Partial update; use `retainedImages` JSON array to keep existing Cloudinary URLs and attach replacement `images` files |
| DELETE | `/api/v1/products/:id` | Admin | Deletes product and attempts Cloudinary cleanup |

Multipart text fields: `name`, `brand`, `category`, `gender`, `condition`, `description`, `price`, optional `originalPrice`, `sizes` JSON, `colors` JSON or comma-separated, `features` JSON or newline-separated, `status`, `featured`, `bestseller`, and `newArrival`. Brand/category accept an ObjectId or an existing name. Valid conditions: `BrandNew`, `Premium 10/10`, `Excellent 9/10`, `Good 8/10`, `Used 7/10`. Sizes are arbitrary positive numbers (including halves), each with positive integer `quantity`. Images are JPG/JPEG/PNG/WEBP, maximum 5MB each.

Example `sizes` multipart field:

```json
[{ "size": 42, "quantity": 3 }, { "size": 42.5, "quantity": 2 }]
```

Product list query parameters: `search`, `brand`, `category`, `condition`, `gender`, `size`, `minPrice`, `maxPrice`, `stock` (`in-stock`, `low-stock`, `out-of-stock`), `sort` (`newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`), `page`, and `limit`.

## Categories and Brands

| Method | URL | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/v1/categories` | Public | Active categories |
| GET | `/api/v1/categories/:id` | Public | Active category by ObjectId |
| POST | `/api/v1/categories` | Admin | `{ "name": "Running", "description": "...", "image": "https://..." }` |
| PATCH/PUT | `/api/v1/categories/:id` | Admin | Update supplied fields |
| DELETE | `/api/v1/categories/:id` | Admin | Rejected while products reference it |
| GET | `/api/v1/brands` | Public | Active brands |
| GET | `/api/v1/brands/:id` | Public | Active brand by ObjectId |
| POST | `/api/v1/brands` | Admin | `{ "name": "Nike", "logo": "https://..." }` |
| PATCH/PUT | `/api/v1/brands/:id` | Admin | Update supplied fields |
| DELETE | `/api/v1/brands/:id` | Admin | Rejected while products reference it |

## Orders

| Method | URL | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/orders` | Public | Guest order; COD only; prices and totals calculated by server |
| GET | `/api/v1/orders/:orderNumber?phone=...` | Public | Tracking requires the checkout phone number |
| GET | `/api/v1/admin/orders` | Admin | Filters, pagination, newest/oldest sorting |
| GET | `/api/v1/admin/orders/:id` | Admin | Order by MongoDB ObjectId |
| PATCH | `/api/v1/admin/orders/:id/status` | Admin | `{ "status": "confirmed" }` |
| PATCH | `/api/v1/admin/orders/:id/payment-status` | Admin | `{ "paymentStatus": "received" }` |
| PATCH | `/api/v1/admin/orders/:id/cancel` | Admin | Cancel pending/confirmed and restore stock once |
| PATCH | `/api/v1/admin/orders/:id/return` | Admin | Return delivered order and restore stock once |

Order request example:

```json
{
  "customer": { "name": "Ali Khan", "phone": "03001234567", "email": "ali@example.com" },
  "shippingAddress": { "address": "Main Road", "city": "Islamabad", "province": "Islamabad Capital Territory", "postalCode": "44000" },
  "items": [{ "product": "PRODUCT_OBJECT_ID", "size": 42, "quantity": 2 }],
  "paymentMethod": "cash_on_delivery",
  "discountCode": "WELCOME10",
  "orderNotes": "Please call before delivery"
}
```

Allowed order statuses are exactly `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, and `returned`. Allowed transitions: pending to confirmed/cancelled; confirmed to shipped/cancelled; shipped to delivered; delivered to returned. Payment method is always `cash_on_delivery`; payment status is `pending` or `received`. Admin manually marks COD as received. Inventory changes only on the selected size. Updates use atomic size quantity predicates and compensate stock changes if order persistence fails; production MongoDB replica-set transactions are not required.

Order-list query parameters: `status`, `paymentStatus`, `from`, `to`, `customer`, `phone`, `orderNumber`, `sort` (`newest` or `oldest`), `page`, and `limit`.

## Admin Operations

| Method | URL | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/dashboard` | Admin | Also `/api/v1/admin/dashboard/stats` |
| GET | `/api/v1/admin/inventory` | Admin | One row per product size; `status`, `search`, `page`, `limit` |
| GET | `/api/v1/admin/products` | Admin | Includes draft/archived products; optional `status`, `page`, and `limit` |
| GET | `/api/v1/admin/products/:id` | Admin | Read product by MongoDB ObjectId including inactive products |
| GET | `/api/v1/admin/customers` | Admin | Customer rollups derived from orders, no customer accounts |
| GET | `/api/v1/admin/customers/:identifier` | Admin | Identifier may be email or phone |
| GET | `/api/v1/admin/brands` | Admin | Includes inactive/draft brands |
| GET | `/api/v1/admin/categories` | Admin | Includes inactive/draft categories |
| GET | `/api/v1/discounts` or `/api/v1/admin/discounts` | Admin | Discount management list |
| POST | `/api/v1/discounts` or `/api/v1/admin/discounts` | Admin | Create discount |
| GET | `/api/v1/discounts/:id` or `/api/v1/admin/discounts/:id` | Admin | Read discount |
| PATCH/PUT | `/api/v1/discounts/:id` or `/api/v1/admin/discounts/:id` | Admin | Update discount |
| DELETE | `/api/v1/discounts/:id` or `/api/v1/admin/discounts/:id` | Admin | Delete discount |
| GET | `/api/v1/admin/settings` | Admin | Read persisted store settings |
| PATCH | `/api/v1/admin/settings` | Admin | Update store settings; COD flag only |

Discount body example:

```json
{ "name": "Welcome offer", "code": "WELCOME10", "type": "Percentage", "value": 10, "startsAt": "2026-10-01", "endsAt": "2026-12-31", "status": "Active", "usageLimit": 500 }
```

Supported discount types are `Percentage`, `Fixed amount`, and `Free shipping`. Settings support `storeName`, `storeEmail`, `currency`, `taxRate`, `freeShippingThreshold`, `standardShipping`, `expressShipping`, `processingDays`, `maintenanceMode`, and `cashOnDeliveryEnabled`. No online payment methods are configurable.

## Postman Test Order

1. `GET /api/v1/health`.
2. `POST /api/v1/admin/login`; save `data.token` as a Bearer token.
3. Create a category and brand; retain their `_id` values.
4. Create a product using multipart form-data, one to four `images` files, brand/category ObjectIds, and JSON `sizes`.
5. Read/search/filter products. Update product and remove/replace an image using `retainedImages` plus optional uploaded files.
6. Create a guest COD order with product ObjectId, an available size, and quantity. Verify the matching size quantity decreased.
7. Track with `GET /api/v1/orders/ORDER_NUMBER?phone=03001234567`.
8. Admin list/detail order; update status to confirmed, shipped, delivered; mark payment received. Test cancellation from pending/confirmed and return from delivered, checking size stock restoration.
9. Verify dashboard, inventory, derived customers, discounts, and settings.
10. Test password recovery: request code, verify code, pass the returned reset token to reset-password, then log in with the new password.
11. Test missing Bearer token, invalid IDs/condition/size, more than four images, unavailable stock, and non-COD payment.

## Implementation Notes

- MongoDB models: `Admin`, `Product`, `Brand`, `Category`, `Order`, `Discount`, `PasswordReset`, and singleton `StoreSettings`.
- No Customer account model, password, or authentication exists.
- Product and category/brand images are URL strings; product files are uploaded to Cloudinary. Category images and brand logos may be supplied as URLs.
- Product `totalStock`/`stock` are derived virtuals from size quantities. No SKU or slug is stored.
- Order/customer emails are best-effort and do not roll back a saved order.
- Verification code expiry, attempt count, and email are enforced by backend; a generic forgot-password response avoids disclosing whether an admin email exists.
- API smoke tests can run without live services; full Postman testing needs valid MongoDB, Cloudinary, and SMTP configuration.
