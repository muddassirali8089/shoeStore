/* eslint-disable react-refresh/only-export-components */
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

export const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

export const dateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

export const fullName = (customer = {}) =>
  customer.fullName ||
  [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
  "Guest customer";

export const customerInitials = (customer = {}) =>
  fullName(customer)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const productStatus = (product) =>
  product.status === "Active" && (product.outOfStock ?? Number(product.stock) === 0)
    ? "Out of stock"
    : product.status || (Number(product.stock) > 0 ? "Active" : "Draft");

export const productImage = (product) =>
  product.thumbnail || product.images?.[0] || "";

export const productSizes = (product) =>
  (product.sizes || []).map((entry) =>
    Number(typeof entry === "object" ? entry.size : entry),
  );

export const fallbackPhoto =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80";

export const stripProductIdentifiers = (product) =>
  Object.fromEntries(
    Object.entries(product).filter(([key]) => key !== "slug" && key !== "sku"),
  );

export async function compressProductImage(file) {
  const image = typeof createImageBitmap === "function"
    ? await createImageBitmap(file)
    : await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const fallback = new Image();
        fallback.onload = () => {
          URL.revokeObjectURL(url);
          resolve(fallback);
        };
        fallback.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("This image could not be opened. Try another image."));
        };
        fallback.src = url;
      });
  const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    image.close?.();
    throw new Error("This image could not be processed. Try another image.");
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  const blob = await new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function") {
      reject(new Error("This browser cannot process product images."));
      return;
    }
    canvas.toBlob(resolve, "image/webp", 0.82);
  });
  if (!blob)
    throw new Error("This image could not be processed. Try another image.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("This image could not be read. Try another image."));
    reader.readAsDataURL(blob);
  });
}

export function exportCSV(rows, filename) {
  const data = rows.map((order) => [
    order.id,
    order.date,
    order.status,
    fullName(order.customer),
    order.customer?.email || "",
    order.total,
  ]);
  const csv = [
    ["Order ID", "Date", "Status", "Customer", "Email", "Total"],
    ...data,
  ]
    .map((line) =>
      line
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NotFoundPanel({ title, back }) {
  return (
    <div className="admin-not-found">
      <div className="admin-empty-icon">
        <Search size={19} />
      </div>
      <h2>{title}</h2>
      <p>We couldn’t find that record. It may have been removed.</p>
      <Link to={back} className="admin-text-link">
        Go back <ArrowRight size={14} />
      </Link>
    </div>
  );
}
