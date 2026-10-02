/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { brands as customerBrands, categories as customerCategories, products as customerProducts } from "../data/products";
import { normalizeCondition } from "../components/product/conditionUtils";

const AdminContext = createContext(null);
const storageKeys = {
  products: "mg-products",
  categories: "mg-categories",
  brands: "mg-brands",
  orders: "mg-orders",
  discounts: "mg-discounts",
  settings: "mg-settings",
};

const extraCatalog = [
  ["Air Jordan 1 Low", "Nike", "Sports", "Men", 23900, "photo-1552346154-21d32810aba3"],
  ["Samba OG", "Adidas", "Casual", "Unisex", 18900, "photo-1525966222134-fcfa99b8ae77"],
  ["990v6 Made in USA", "New Balance", "Running", "Men", 32900, "photo-1539185441755-769473a23570"],
  ["Cloudtilt", "On", "Running", "Women", 27900, "photo-1542291026-7eec264c27ff"],
  ["Gel-Nimbus 26", "ASICS", "Running", "Unisex", 28900, "photo-1542291026-7eec264c27ff"],
  ["XT-6 Advanced", "Salomon", "Hiking", "Unisex", 31900, "photo-1551632811-561732d1e306"],
];
const slug = (value = "") => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const stripProductIdentifiers = (product) => Object.fromEntries(Object.entries(product).filter(([key]) => key !== "slug" && key !== "sku"));
const extras = extraCatalog.map(([name, brand, category, gender, price, photo], index) => ({
  id: `admin-shoe-${index + 1}`, name, brand, category, gender, price,
  originalPrice: Math.round(price * 1.2), discount: 17,
  images: [`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`],
  thumbnail: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=600&q=85`,
  sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44], colors: ["White / Grey", "Black"],
  condition: "BrandNew", description: `${name} — dependable comfort for wherever the day takes you.`,
  features: ["Comfort cushioning", "Durable outsole"], stock: 7 + index * 3, rating: 4.6,
  reviewsCount: 20 + index * 9, featured: index < 2, bestseller: index % 2 === 0,
  newArrival: index > 3, status: "Active", active: true,
}));
const productSeed = [...customerProducts.map((product, index) => ({
  ...stripProductIdentifiers(product),
  condition: normalizeCondition(product.condition),
  status: product.stock === 0 ? "Draft" : "Active",
  active: product.stock > 0,
  sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].filter((size) => (size + index) % 5 !== 0),
})), ...extras];

const categorySeed = [
  ...customerCategories.map((item, index) => ({ ...item, id: `cat-${slug(item.name)}`, status: "Active", active: true, productCount: 0, sortOrder: index + 1 })),
  ...["Running", "Basketball", "Lifestyle", "Training", "Skateboarding", "Outdoor"].map((name, index) => ({
    id: `cat-${slug(name)}`, name, slug: slug(name), description: `Explore our ${name.toLowerCase()} footwear collection.`,
    image: "", status: "Active", active: true, productCount: 0, sortOrder: index + 6,
  })),
];
const brandSeed = customerBrands.map((name, index) => ({
  id: `brand-${slug(name)}`, name, slug: slug(name), description: `${name} footwear, selected for everyday comfort and performance.`,
  status: "Active", active: true, productCount: 0, sortOrder: index + 1,
}));

const people = [
  ["Olivia Bennett", "olivia.bennett@example.com", "+1 416 555 0142", "Toronto", "Ontario"],
  ["Ethan Parker", "ethan.parker@example.com", "+1 604 555 0181", "Vancouver", "British Columbia"],
  ["Amara Wilson", "amara.wilson@example.com", "+1 514 555 0197", "Montreal", "Quebec"],
  ["Noah Chen", "noah.chen@example.com", "+1 403 555 0164", "Calgary", "Alberta"],
  ["Sofia Martinez", "sofia.martinez@example.com", "+1 613 555 0129", "Ottawa", "Ontario"],
  ["Liam Thompson", "liam.thompson@example.com", "+1 902 555 0175", "Halifax", "Nova Scotia"],
  ["Maya Patel", "maya.patel@example.com", "+1 204 555 0138", "Winnipeg", "Manitoba"],
  ["Lucas Brown", "lucas.brown@example.com", "+1 416 555 0176", "Toronto", "Ontario"],
  ["Ava Robinson", "ava.robinson@example.com", "+1 780 555 0146", "Edmonton", "Alberta"],
  ["Gabriel Roy", "gabriel.roy@example.com", "+1 514 555 0112", "Montreal", "Quebec"],
  ["Zoe Kim", "zoe.kim@example.com", "+1 604 555 0133", "Vancouver", "British Columbia"],
  ["James Foster", "james.foster@example.com", "+1 905 555 0190", "Hamilton", "Ontario"],
  ["Isabella Singh", "isabella.singh@example.com", "+1 306 555 0150", "Saskatoon", "Saskatchewan"],
  ["Henry Scott", "henry.scott@example.com", "+1 709 555 0118", "St. John's", "Newfoundland"],
  ["Layla Adams", "layla.adams@example.com", "+1 416 555 0189", "Toronto", "Ontario"],
];
const sampleStatuses = ["Processing", "Shipped", "Delivered", "Confirmed", "Processing", "Out for Delivery", "Delivered", "Shipped", "Processing", "Delivered", "Confirmed", "Shipped", "Delivered", "Processing", "Cancelled"];
const orderSeed = people.map(([fullName, email, phone, city, province], index) => {
  const product = productSeed[(index * 3 + 1) % productSeed.length];
  const second = index % 4 === 0 ? productSeed[(index * 5 + 4) % productSeed.length] : null;
  const items = [product, ...(second ? [second] : [])].map((item, itemIndex) => ({
    productId: item.id, name: item.name, brand: item.brand, image: item.thumbnail,
    size: [38, 39, 40, 41, 42][(index + itemIndex) % 5], quantity: 1,
    price: item.price,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 25000 ? 0 : 1200;
  const [firstName, ...last] = fullName.split(" ");
  return {
    id: `MG-${String(26090000 + index * 137).slice(0, 8)}`, date: new Date(2026, 8, 28 - index).toISOString(),
    status: sampleStatuses[index], total: subtotal + shipping, subtotal, shipping,
    items, customer: { firstName, lastName: last.join(" "), email, phone, address: `${120 + index} ${["King", "Queen", "Main", "Bloor", "Granville"][index % 5]} Street`, city, province, postalCode: `M${index + 1}A ${index + 2}B${index + 3}` },
    payment: index % 3 === 0 ? "Visa ending in 4242" : index % 3 === 1 ? "Mastercard ending in 0088" : "Apple Pay",
  };
});

const defaultSettings = {
  storeName: "Morrow Goods", storeEmail: "hello@morrowgoods.com", currency: "PKR",
  taxRate: 13, freeShippingThreshold: 25000, standardShipping: 1200,
  expressShipping: 2400, processingDays: 1, acceptedPayments: ["Credit card", "Apple Pay", "PayPal"],
  maintenanceMode: false,
};
function readStorage(key, fallback, normalize = (data) => data) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? normalize(JSON.parse(raw)) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}; using seeded admin data.`, error);
    return fallback;
  }
}
function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to persist ${key}.`, error);
    throw new Error("Your changes could not be saved. Check available browser storage and try again.", { cause: error });
  }
}
const asList = (value, fallback) => Array.isArray(value) ? value : fallback;
const mergeSeedRows = (value, seed, getKey = (item) => item.id) => {
  const rows = asList(value, seed);
  const keys = new Set(rows.map(getKey));
  return [...rows, ...seed.filter((item) => !keys.has(getKey(item)))];
};
const normalizeOrder = (order, index) => {
  const customer = order.customer || {};
  return {
    ...order,
    id: order.id || `MG-IMPORT-${index + 1}`,
    date: order.createdAt || order.date || new Date().toISOString(),
    status: order.status || "Pending",
    items: asList(order.items, []).map((item) => ({
      ...item,
      productId: item.productId || item.id || item.productSnapshot?.id || "",
      name: item.name || item.product?.name || item.productSnapshot?.name || "Store product",
      size: item.size || "",
      quantity: Number(item.quantity) || 1,
      price: Number(item.price || item.unitPrice || item.product?.price || 0),
    })),
    customer: {
      fullName: customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.name || "",
      firstName: customer.firstName || customer.name?.split(" ")[0] || "",
      lastName: customer.lastName || customer.name?.split(" ").slice(1).join(" ") || "",
      email: customer.email || "", phone: customer.phone || "", address: customer.address || customer.addressLine1 || "",
      city: customer.city || "", province: customer.province || customer.state || "",
      postalCode: customer.postalCode || "",
      notes: customer.notes || order.notes || "",
    },
    subtotal: Number(order.subtotal) || undefined,
    total: Number(order.total) || 0,
    payment: order.payment || order.paymentMethod || "Not specified",
    paymentStatus: order.paymentStatus || "",
    notes: customer.notes || order.notes || "",
  };
};

export function AdminProvider({ children }) {
  const [products, setProducts] = useState(() => readStorage(storageKeys.products, productSeed, (data) => mergeSeedRows(
    asList(data, productSeed).map((product) => {
      const sizes = Array.isArray(product.sizes) ? product.sizes.map((entry) => typeof entry === "object" && entry !== null
        ? { ...entry, size: Number(entry.size), quantity: Number(entry.quantity) }
        : Number(entry)).filter((entry) => typeof entry === "object"
        ? Number.isFinite(entry.size) && entry.size > 0 && Number.isInteger(entry.quantity) && entry.quantity > 0
        : Number.isFinite(entry) && entry > 0) : [];
      const stock = sizes.length && sizes.every((entry) => typeof entry === "object")
        ? sizes.reduce((total, entry) => total + entry.quantity, 0)
        : Number(product.stock) || 0;
      return {
        ...stripProductIdentifiers(product),
        condition: normalizeCondition(product.condition),
        sizes,
        stock,
        images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 4) : [],
        thumbnail: product.thumbnail || product.images?.[0] || "",
        status: product.status || (product.active === false || stock <= 0 ? "Draft" : "Active"),
        active: product.active !== undefined ? product.active : stock > 0,
      };
    }),
    productSeed,
  )));
  const [categories, setCategories] = useState(() => readStorage(storageKeys.categories, categorySeed, (data) => mergeSeedRows(data, categorySeed)));
  const [brands, setBrands] = useState(() => readStorage(storageKeys.brands, brandSeed, (data) => {
    const rows = asList(data, brandSeed).map((brand) => typeof brand === "string" ? brandSeed.find((seed) => seed.name === brand) || { id: `brand-${slug(brand)}`, name: brand, slug: slug(brand), status: "Active", active: true } : { ...brand, active: brand.active !== false });
    return mergeSeedRows(rows, brandSeed);
  }));
  const [orders, setOrders] = useState(() => readStorage(storageKeys.orders, orderSeed, (data) => mergeSeedRows(
    asList(data, orderSeed).map(normalizeOrder),
    orderSeed,
  )));
  const [discounts, setDiscounts] = useState(() => readStorage(storageKeys.discounts, [
    { id: "disc-welcome", code: "WELCOME10", type: "Percentage", value: 10, status: "Active", usageLimit: 500, uses: 124, startsAt: "2026-01-01", endsAt: "2026-12-31" },
    { id: "disc-summer", code: "SUMMER15", type: "Percentage", value: 15, status: "Active", usageLimit: 250, uses: 83, startsAt: "2026-06-01", endsAt: "2026-10-15" },
    { id: "disc-ship", code: "FREESHIP", type: "Free shipping", value: 0, status: "Active", usageLimit: 1000, uses: 276, startsAt: "2026-01-01", endsAt: "2026-12-31" },
    { id: "disc-weekend", code: "WEEKEND12", type: "Percentage", value: 12, status: "Scheduled", usageLimit: 200, uses: 0, startsAt: "2026-10-03", endsAt: "2026-10-05" },
    { id: "disc-run", code: "RUN1500", type: "Fixed amount", value: 1500, status: "Active", usageLimit: 150, uses: 38, startsAt: "2026-09-01", endsAt: "2026-11-30" },
  ], (data) => asList(data, [])));
  const [settings, setSettings] = useState(() => readStorage(storageKeys.settings, defaultSettings, (data) => ({ ...defaultSettings, ...data })));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      [[storageKeys.products, products], [storageKeys.categories, categories], [storageKeys.brands, brands],
        [storageKeys.orders, orders], [storageKeys.discounts, discounts], [storageKeys.settings, settings]]
        .forEach(([key, value]) => {
          if (localStorage.getItem(key) === null) saveStorage(key, value);
        });
    } catch (error) {
      console.error("Unable to initialize admin browser data.", error);
    }
  }, [products, categories, brands, orders, discounts, settings]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("mg-products-updated"));
    window.dispatchEvent(new CustomEvent("mg-categories-updated"));
    window.dispatchEvent(new CustomEvent("mg-brands-updated"));
  }, []);
  useEffect(() => {
    const syncOrders = () => setOrders(readStorage(storageKeys.orders, orderSeed, (data) => mergeSeedRows(
      asList(data, orderSeed).map(normalizeOrder),
      orderSeed,
    )));
    window.addEventListener("mg-orders-updated", syncOrders);
    window.addEventListener("storage", syncOrders);
    return () => {
      window.removeEventListener("mg-orders-updated", syncOrders);
      window.removeEventListener("storage", syncOrders);
    };
  }, []);
  const commit = useCallback((key, setter, value) => {
    saveStorage(storageKeys[key], value);
    setter(value);
    if (["products", "categories", "brands", "orders"].includes(key)) {
      window.dispatchEvent(new CustomEvent(`mg-${key}-updated`, { detail: { [key]: value } }));
    }
  }, []);
  const updateProducts = useCallback((value) => commit("products", setProducts, value), [commit]);
  const updateCategories = useCallback((value) => commit("categories", setCategories, value), [commit]);
  const updateBrands = useCallback((value) => commit("brands", setBrands, value), [commit]);
  const updateOrders = useCallback((value) => commit("orders", setOrders, value), [commit]);
  const updateDiscounts = useCallback((value) => commit("discounts", setDiscounts, value), [commit]);
  const updateSettings = useCallback((value) => commit("settings", setSettings, value), [commit]);
  const notify = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const value = useMemo(() => ({
    products, categories, brands, orders, discounts, settings, toast,
    updateProducts, updateCategories, updateBrands, updateOrders, updateDiscounts, updateSettings,
    notify,
  }), [products, categories, brands, orders, discounts, settings, toast, updateProducts, updateCategories, updateBrands, updateOrders, updateDiscounts, updateSettings, notify]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider.");
  return context;
}

export const makeId = (prefix = "item") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const money = (amount) => `Rs. ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
export const orderSubtotal = (order) => Number(order.subtotal) || (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
