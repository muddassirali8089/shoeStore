import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../index.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("root health endpoint identifies the API", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, message: "ShoeStore API is running." });
});

test("database health endpoint reports disconnected without MongoDB", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    success: false,
    data: { status: "degraded", database: "disconnected" },
  });
});

test("unknown routes return a direct JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/v1/not-a-route`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { success: false, message: "Route not found." });
});

test("admin routes reject requests without a bearer token", async () => {
  const response = await fetch(`${baseUrl}/api/v1/admin/orders`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Admin authentication is required.",
  });
});

test("product writes reject unauthenticated requests before parsing uploads", async () => {
  const response = await fetch(`${baseUrl}/api/v1/products`, { method: "POST" });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Admin authentication is required.",
  });
});

test("empty admin login body returns a controller validation response", async () => {
  const response = await fetch(`${baseUrl}/api/v1/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "null",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "A valid email and password are required.",
  });
});

test("product schema derives stock from unique arbitrary shoe sizes", async () => {
  const product = new Product({
    name: "Size test shoe",
    brand: "507f1f77bcf86cd799439011",
    category: "507f1f77bcf86cd799439012",
    condition: "Excellent 9/10",
    description: "Test product",
    price: 100,
    images: ["https://res.cloudinary.com/demo/image/upload/test.jpg"],
    sizes: [{ size: 42, quantity: 3 }, { size: 42.5, quantity: 2 }],
  });
  assert.equal(product.totalStock, 5);
  assert.equal(product.stock, 5);
  await product.validate();

  product.condition = "Almost new";
  await assert.rejects(product.validate(), /condition/);
  product.condition = "Excellent 9/10";
  product.sizes = [{ size: 42, quantity: 0 }];
  assert.equal(product.totalStock, 0);
  await product.validate();
  product.sizes = [{ size: 42, quantity: 3 }, { size: 42, quantity: 2 }];
  await assert.rejects(product.validate(), /sizes/);
  assert.equal("sku" in product.toObject(), false);
  assert.equal("slug" in product.toObject(), false);
});

test("product stock virtual tolerates documents that omit the sizes projection", () => {
  const totalStock = Product.schema.virtuals.totalStock.getters[0];
  assert.equal(totalStock.call({ sizes: undefined }), 0);
});

test("order schema permits COD and only the specified statuses", async () => {
  const order = new Order({
    orderNumber: "ORD-20261002-ABC123",
    customer: { name: "Ali Khan", phone: "03001234567" },
    shippingAddress: { address: "Main Road", city: "Islamabad", province: "ICT", postalCode: "44000" },
    items: [{ product: "507f1f77bcf86cd799439011", name: "Test shoe", size: 42, quantity: 1, price: 100, subtotal: 100 }],
    subtotal: 100,
    shippingFee: 0,
    total: 100,
    paymentMethod: "cash_on_delivery",
    orderStatus: "pending",
    paymentStatus: "pending",
  });
  await order.validate();
  order.orderStatus = "processing";
  await assert.rejects(order.validate(), /orderStatus/);
  order.orderStatus = "pending";
  order.paymentMethod = "credit_card";
  await assert.rejects(order.validate(), /paymentMethod/);
});