import assert from "node:assert/strict";
import { test } from "node:test";
import { orderIdentifierFilter } from "../controllers/order.controller.js";

test("order detail identifiers accept database IDs and public order numbers", () => {
  assert.deepEqual(orderIdentifierFilter("507f1f77bcf86cd799439011"), {
    _id: "507f1f77bcf86cd799439011",
  });
  assert.deepEqual(orderIdentifierFilter("ord-20261003-6e606d"), {
    orderNumber: "ORD-20261003-6E606D",
  });
});
