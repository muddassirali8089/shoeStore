# ShoeStore Server API

This is the backend API for the ShoeStore server. It contains the Express routes, admin auth, catalog management, orders, and discount endpoints. This README focuses only on the server side and the request/response payloads used by the API.

## Base URL

- Local dev: `http://localhost:5000`
- API prefix: `/api/v1`
- Health check: `GET /api/v1/health`

Example:

```bash
curl http://localhost:5000/api/v1/health
```

## Common response format

All API responses follow this pattern:

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Reason for failure"
}
```

## Environment setup

Create a `.env` file in the `server` folder with values like:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shoestore
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-password
CLIENT_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
EMAIL_USER=your-address@gmail.com
EMAIL_PASSWORD=your-google-app-password
EMAIL_FROM=your-address@gmail.com
```

For Gmail accounts, the API uses Gmail SMTP (`smtp.gmail.com` on port `465`) automatically when `EMAIL_HOST` and `EMAIL_PORT` are omitted. Use a Google App Password for `EMAIL_PASSWORD` (not your regular account password). Other mail providers require their SMTP host and port to be set explicitly.

## Authentication

### Admin login

Endpoint:

```http
POST /api/v1/admin/login
```

Payload:

```json
{
  "email": "admin@example.com",
  "password": "your-admin-password"
}
```

Also supported:

```http
POST /api/v1/admin/auth/login
```

Success response:

```json
{
  "success": true,
  "message": "Admin login successful.",
  "data": {
    "admin": {
      "id": "ADMIN_ID",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin",
      "isActive": true
    },
    "token": "JWT_TOKEN"
  }
}
```

Use the returned token in the header:

```http
Authorization: Bearer <token>
```

### Admin profile

```http
GET /api/v1/admin/auth/me
```

Requires admin auth.

### Forgot password / reset password

```http
POST /api/v1/admin/auth/forgot-password
POST /api/v1/admin/auth/verify-code
POST /api/v1/admin/auth/reset-password
```

Example payloads:

```json
{ "email": "admin@example.com" }
```

```json
{ "email": "admin@example.com", "code": "482913" }
```

```json
{
  "email": "admin@example.com",
  "resetToken": "token-from-verify",
  "newPassword": "new-password-123"
}
```

## Products

### Public product list

```http
GET /api/v1/products
```

Query params:

- `page` and `limit`
- `search`
- `brand`
- `category`
- `condition`
- `gender`
- `size`
- `minPrice`
- `maxPrice`
- `sort` (for example `newest`, `oldest`, `priceAsc`, `priceDesc`)

### Product details

```http
GET /api/v1/products/:id
```

### Create product (admin)

```http
POST /api/v1/products
```

This route uses `multipart/form-data`.

Example form-data fields:

- `name`: "Nike Air Max"
- `brand`: "Nike"
- `category`: "Running"
- `gender`: "Men"
- `condition`: "BrandNew"
- `description`: "Comfortable running shoe"
- `price`: 180
- `originalPrice`: 220
- `sizes`: `[{"size":42,"quantity":3},{"size":43,"quantity":2}]`
- `colors`: `["Black","White"]`
- `features`: `["Lightweight","Breathable"]` or newline separated values
- `status`: "Active"
- `featured`: true
- `bestseller`: true
- `newArrival`: false
- `images`: upload up to 4 image files

Note: `images` is the file field name for uploads. `brand` and `category` can be accepted as an ObjectId or by name.
Size quantities must be whole numbers greater than or equal to zero; `0` represents an out-of-stock size and is used by admin inventory updates.
Products expose a derived `outOfStock` flag, which is `true` when the combined quantity across all sizes is zero. This does not change the product's catalog status.

Valid `condition` values:

- `BrandNew`
- `Premium 10/10`
- `Excellent 9/10`
- `Good 8/10`
- `Used 7/10`

### Update product (admin)

```http
PATCH /api/v1/products/:id
```

Or:

```http
PUT /api/v1/products/:id
```

Same payload pattern as create, but partial updates are allowed.

### Delete product (admin)

```http
DELETE /api/v1/products/:id
```

## Brands and categories

### List brands

```http
GET /api/v1/brands
```

### Get one brand

```http
GET /api/v1/brands/:id
```

### Create brand (admin)

```http
POST /api/v1/brands
```

Payload:

```json
{
  "name": "Nike",
  "logo": "https://example.com/logo.png"
}
```

### Create category (admin)

```http
POST /api/v1/categories
```

Payload:

```json
{
  "name": "Running",
  "description": "Performance running shoes",
  "image": "https://example.com/category-image.jpg"
}
```

Admin update and delete endpoints are also available for both brands and categories.

## Discounts

### List discounts

```http
GET /api/v1/discounts
```

### Get one discount

```http
GET /api/v1/discounts/:id
```

### Create discount (admin)

```http
POST /api/v1/discounts
```

Payload:

```json
{
  "name": "Spring Sale",
  "code": "SPRING10",
  "type": "Percentage",
  "value": 10,
  "startsAt": "2026-10-01T00:00:00.000Z",
  "endsAt": "2026-10-31T23:59:59.000Z",
  "status": "Active",
  "usageLimit": 100
}
```

Allowed discount types:

- `Percentage`
- `Fixed amount`
- `Free shipping`

Allowed statuses:

- `Active`
- `Scheduled`
- `Inactive`

## Orders

### Create order

```http
POST /api/v1/orders
```

Payload:

```json
{
  "customer": {
    "name": "Ali Khan",
    "phone": "03001234567",
    "email": "ali@example.com"
  },
  "shippingAddress": {
    "address": "Main Road",
    "city": "Islamabad",
    "province": "Islamabad Capital Territory",
    "postalCode": "44000"
  },
  "items": [
    {
      "product": "PRODUCT_OBJECT_ID",
      "size": 42,
      "quantity": 2
    }
  ],
  "paymentMethod": "cash_on_delivery",
  "discountCode": "WELCOME10",
  "orderNotes": "Please call before delivery"
}
```

Rules:

- Only `cash_on_delivery` is allowed.
- Every order item must include a valid product ID, size, and quantity.
- Stock is validated before order creation.
- Discount codes are validated against date/status/usage rules.
- Order totals are calculated server-side.

### Track order

```http
GET /api/v1/orders/:orderNumber
```

Or:

```http
GET /api/v1/orders/track/:orderNumber
```

Tracking usually requires the checkout phone number as a query param:

```http
GET /api/v1/orders/ORD-20261003-ABC123?phone=03001234567
```

### Admin order routes

```http
GET /api/v1/orders/admin/list
GET /api/v1/orders/admin/:id
PATCH /api/v1/orders/admin/:id/status
PATCH /api/v1/orders/admin/:id/payment-status
PATCH /api/v1/orders/admin/:id/cancel
PATCH /api/v1/orders/admin/:id/return
```

Admin status update payload:

```json
{ "status": "confirmed" }
```

Admin payment update payload:

```json
{ "paymentStatus": "received" }
```

## Admin dashboard routes

```http
GET /api/v1/admin/dashboard
GET /api/v1/admin/dashboard/stats
GET /api/v1/admin/inventory
GET /api/v1/admin/products
GET /api/v1/admin/products/:id
GET /api/v1/admin/orders
GET /api/v1/admin/orders/:id
GET /api/v1/admin/customers
GET /api/v1/admin/customers/:identifier
GET /api/v1/admin/brands
GET /api/v1/admin/categories
GET /api/v1/admin/settings
PATCH /api/v1/admin/settings
```

These routes require admin auth.

## Notes

- The API uses JWT-based admin authentication.
- Public endpoints are generally limited to active products/brands/categories.
- Admin routes require a valid bearer token.
- Product uploads require Cloudinary configuration.
- Orders are created for cash-on-delivery only.

This README is intentionally short and focused on server-side API usage and payload structure.
