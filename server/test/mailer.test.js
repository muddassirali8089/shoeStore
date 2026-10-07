import assert from "node:assert/strict";
import { test } from "node:test";
import { getEmailTransportOptions } from "../utils/mailer.js";

test("Gmail accounts use SMTP defaults when host and port are omitted", () => {
  assert.deepEqual(
    getEmailTransportOptions({
      EMAIL_USER: "store@gmail.com",
      EMAIL_PASSWORD: "app-password",
    }),
    {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: "store@gmail.com", pass: "app-password" },
    },
  );
});

test("explicit SMTP settings are preserved", () => {
  assert.deepEqual(
    getEmailTransportOptions({
      EMAIL_HOST: "smtp.custom.example",
      EMAIL_PORT: "587",
      EMAIL_USER: "store@gmail.com",
      EMAIL_PASSWORD: "app-password",
    }),
    {
      host: "smtp.custom.example",
      port: 587,
      secure: false,
      auth: { user: "store@gmail.com", pass: "app-password" },
    },
  );
});

test("other providers still require an SMTP host and port", () => {
  assert.throws(
    () => getEmailTransportOptions({
      EMAIL_USER: "store@example.com",
      EMAIL_PASSWORD: "password",
    }),
    /EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD/,
  );
});
