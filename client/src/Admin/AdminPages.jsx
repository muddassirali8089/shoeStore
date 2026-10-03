import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Download,
  Eye,
  Filter,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  Users,
  X,
} from "lucide-react";
import { makeId, money, orderSubtotal, useAdmin } from "./AdminContext";
import {
  AdminTable,
  Button,
  ConfirmModal,
  Field,
  Modal,
  PageHeader,
  SelectField,
  StatusBadge,
  Toolbar,
  moneyCell,
} from "./AdminUI";
import ConditionBadge from "../components/product/ConditionBadge";
import {
  normalizeCondition,
  PRODUCT_CONDITIONS,
} from "../components/product/conditionUtils";
import { sizes as shoeSizes } from "../data/products";

const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};
const dateTime = (value) => {
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
const fullName = (customer = {}) =>
  customer.fullName ||
  [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
  "Guest customer";
const customerInitials = (customer = {}) =>
  fullName(customer)
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const productStatus = (product) =>
  product.status || (Number(product.stock) > 0 ? "Active" : "Draft");
const productImage = (product) =>
  product.thumbnail || product.images?.[0] || "";
const productSizes = (product) =>
  (product.sizes || []).map((entry) =>
    Number(typeof entry === "object" ? entry.size : entry),
  );
const fallbackPhoto =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80";
const stripProductIdentifiers = (product) =>
  Object.fromEntries(
    Object.entries(product).filter(([key]) => key !== "slug" && key !== "sku"),
  );

async function compressProductImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82),
  );
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

function MetricCard({
  label,
  value,
  delta,
  direction = "up",
  icon: Icon,
  footnote,
  spark = [4, 7, 5, 9, 8, 13, 11, 16, 13, 19, 17, 23],
}) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-top">
        <span>{label}</span>
        <span className="admin-metric-icon">
          <Icon size={17} />
        </span>
      </div>
      <strong className="admin-metric-value">{value}</strong>
      <div className="admin-metric-bottom">
        <span
          className={`admin-metric-delta ${direction === "up" ? "positive" : "negative"}`}
        >
          {direction === "up" ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}
          {delta}
        </span>
        <span>{footnote}</span>
        <svg
          className={`admin-sparkline spark-${direction}`}
          viewBox="0 0 92 30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={spark
              .map((point, index) => `${index * 8.35},${28 - point}`)
              .join(" ")}
          />
        </svg>
      </div>
    </article>
  );
}

const salesBars = [
  38, 55, 44, 66, 51, 72, 60, 77, 54, 82, 67, 93, 70, 86, 62, 78, 52, 88, 74,
  96, 65, 80, 59, 90, 72, 98, 67, 85,
];
const weekLabels = [
  "Sep 02",
  "Sep 06",
  "Sep 10",
  "Sep 14",
  "Sep 18",
  "Sep 22",
  "Sep 26",
];

export function DashboardPage() {
  const { products, orders } = useAdmin();
  const revenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeProducts = products.filter(
    (product) => productStatus(product) === "Active",
  ).length;
  const lowStock = products.filter(
    (product) => Number(product.stock) <= 5,
  ).length;
  const topProducts = [...products]
    .sort((a, b) => Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0))
    .slice(0, 5);
  const latestOrders = [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  return (
    <>
      <PageHeader
        eyebrow="TUESDAY, SEPTEMBER 29, 2026"
        title="Good evening, Admin"
        description="Here’s what’s happening with your store today."
        actions={
          <Button variant="subtle" icon={CalendarDays}>
            Last 30 days <span className="admin-button-caret">⌄</span>
          </Button>
        }
      />
      <div className="admin-metrics-grid">
        <MetricCard
          label="Gross sales"
          value={money(revenue)}
          delta="12.8%"
          footnote="vs. previous period"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Orders"
          value={orders.length.toLocaleString()}
          delta="8.2%"
          footnote="vs. previous period"
          icon={ShoppingBag}
          spark={[3, 6, 5, 11, 8, 13, 15, 12, 17, 21, 18, 25]}
        />
        <MetricCard
          label="Products active"
          value={activeProducts}
          delta="3.1%"
          direction="down"
          footnote="vs. previous period"
          icon={Package}
          spark={[20, 17, 18, 14, 16, 13, 14, 10, 12, 8, 10, 7]}
        />
        <MetricCard
          label="Customers"
          value={new Set(
            orders.map((order) => order.customer?.email).filter(Boolean),
          ).size.toLocaleString()}
          delta="18.4%"
          footnote="vs. previous period"
          icon={Users}
          spark={[3, 5, 8, 6, 12, 9, 13, 16, 13, 20, 18, 26]}
        />
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-card admin-revenue-card">
          <div className="admin-card-heading">
            <div>
              <h2>Sales over time</h2>
              <p>A look at your store’s recent performance</p>
            </div>
            <SelectField value="30 days" onChange={() => {}}>
              <option>30 days</option>
              <option>7 days</option>
              <option>90 days</option>
            </SelectField>
          </div>
          <div className="admin-chart-summary">
            <strong>{money(revenue)}</strong>
            <span>
              <ArrowUpRight size={14} /> 12.8%
            </span>
          </div>
          <div
            className="admin-bar-chart"
            role="img"
            aria-label="Sales over the last 30 days, trending upward"
          >
            {salesBars.map((height, index) => (
              <div
                key={index}
                className={`admin-chart-bar${index === salesBars.length - 3 ? " highlighted" : ""}`}
                style={{ height: `${height}%` }}
                title={`${height}% of peak`}
              />
            ))}
          </div>
          <div className="admin-chart-labels">
            {weekLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </section>
        <section className="admin-card admin-channel-card">
          <div className="admin-card-heading">
            <div>
              <h2>Order fulfillment</h2>
              <p>Current order status breakdown</p>
            </div>
            <Link to="/admin/orders/list" className="admin-text-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="admin-fulfillment">
            <div className="admin-donut">
              <div>
                <strong>{orders.length}</strong>
                <span>Total orders</span>
              </div>
            </div>
            <div className="admin-fulfillment-legend">
              {[
                ["Delivered", "green"],
                ["Shipped", "blue"],
                ["Processing", "amber"],
                ["Cancelled", "gray"],
              ].map(([status, color]) => (
                <div key={status}>
                  <i className={`legend-${color}`} />
                  <span>{status}</span>
                  <strong>
                    {orders.filter((order) => order.status === status).length}
                  </strong>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-low-stock-callout">
            <span className="admin-callout-icon">
              <Package size={16} />
            </span>
            <span>
              <strong>{lowStock} products</strong> are running low on stock
            </span>
            <Link to="/admin/inventory" aria-label="View low stock">
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
        <section className="admin-card admin-table-card">
          <div className="admin-card-heading">
            <div>
              <h2>Recent orders</h2>
              <p>The latest activity from your store</p>
            </div>
            <Link to="/admin/orders/list" className="admin-text-link">
              All orders <ArrowRight size={14} />
            </Link>
          </div>
          <div className="admin-recent-orders">
            {latestOrders.map((order) => (
              <Link
                key={order.id}
                className="admin-recent-order"
                to={`/admin/orders/${encodeURIComponent(order.id)}`}
              >
                <span className="admin-order-avatar">
                  {customerInitials(order.customer)}
                </span>
                <span className="admin-recent-customer">
                  <strong>{fullName(order.customer)}</strong>
                  <small>
                    {order.id} <span>·</span> {shortDate(order.date)}
                  </small>
                </span>
                <span className="admin-recent-status">
                  <StatusBadge>{order.status}</StatusBadge>
                </span>
                <strong className="admin-money">{money(order.total)}</strong>
                <ArrowRight size={15} className="admin-recent-arrow" />
              </Link>
            ))}
          </div>
        </section>
        <section className="admin-card admin-table-card admin-top-products">
          <div className="admin-card-heading">
            <div>
              <h2>Popular products</h2>
              <p>Your most-loved pairs by customer reviews</p>
            </div>
            <Link to="/admin/products/list" className="admin-text-link">
              View products <ArrowRight size={14} />
            </Link>
          </div>
          <div className="admin-popular-list">
            {topProducts.map((product, index) => (
              <div className="admin-popular-item" key={product.id}>
                <span className="admin-popular-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <img src={productImage(product) || fallbackPhoto} alt="" />
                <span className="admin-popular-name">
                  <strong>{product.name}</strong>
                  <small>
                    {product.brand} <span>·</span> {product.category}
                  </small>
                </span>
                <span className="admin-popular-stock">
                  {product.stock} in stock
                </span>
                <strong className="admin-money">{money(product.price)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function CatalogList({ kind }) {
  const navigate = useNavigate();
  const {
    products,
    categories,
    brands,
    updateProducts,
    updateCategories,
    updateBrands,
    notify,
  } = useAdmin();
  const config = {
    products: {
      title: "Products",
      singular: "product",
      subtitle:
        "Manage the pairs in your store and keep your catalog in good shape.",
      data: products,
      set: updateProducts,
      add: "/admin/products/add",
      icon: Package,
    },
    categories: {
      title: "Categories",
      singular: "category",
      subtitle: "Keep your collection organized and easy to browse.",
      data: categories,
      set: updateCategories,
      add: "/admin/categories/add",
      icon: Filter,
    },
    brands: {
      title: "Brands",
      singular: "brand",
      subtitle: "Manage the labels your customers love.",
      data: brands,
      set: updateBrands,
      add: "/admin/brands/add",
      icon: BadgePercent,
    },
  }[kind];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [deleting, setDeleting] = useState(null);
  const data =
    kind === "brands"
      ? config.data.map((brand) =>
          typeof brand === "string"
            ? {
                id: `brand-${brand.toLowerCase().replace(/\W+/g, "-")}`,
                name: brand,
                status: "Active",
              }
            : brand,
        )
      : config.data;
  const availableShoeSizes = [
    ...new Set(
      products
        .flatMap(productSizes)
        .filter((size) => Number.isFinite(size) && size > 0),
    ),
  ].sort((a, b) => a - b);
  const filtered = data.filter((item) => {
    if (filter !== "All statuses" && (item.status || "Active") !== filter)
      return false;
    if (kind !== "products") return true;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (brandFilter && item.brand !== brandFilter) return false;
    if (
      conditionFilter &&
      normalizeCondition(item.condition) !== conditionFilter
    )
      return false;
    if (sizeFilter && !productSizes(item).includes(Number(sizeFilter)))
      return false;
    if (stockFilter === "In stock" && Number(item.stock) <= 10) return false;
    if (
      stockFilter === "Low stock" &&
      (Number(item.stock) < 1 || Number(item.stock) > 10)
    )
      return false;
    if (stockFilter === "Out of stock" && Number(item.stock) !== 0)
      return false;
    if (minPrice && Number(item.price) < Number(minPrice)) return false;
    if (maxPrice && Number(item.price) > Number(maxPrice)) return false;
    return true;
  });
  const remove = () => {
    try {
      const next = config.data.filter((item) => item.id !== deleting.id);
      config.set(next);
      if (kind === "products")
        updateCategories(
          categories.map((category) => ({
            ...category,
            productCount: next.filter((item) => item.category === category.name)
              .length,
          })),
        );
      notify(
        `${config.singular[0].toUpperCase()}${config.singular.slice(1)} removed.`,
      );
    } catch (error) {
      notify(error.message, "error");
    }
    setDeleting(null);
  };
  const actionColumn = {
    key: "actions",
    label: "",
    sortable: false,
    align: "right",
    render: (item) => (
      <div className="admin-row-actions">
        {kind === "products" && (
          <Link
            className="admin-icon-button"
            to={`/admin/products/${encodeURIComponent(item.id)}`}
            aria-label={`View ${item.name}`}
            title={`View ${item.name}`}
          >
            <Eye size={15} />
          </Link>
        )}
        <button
          className="admin-icon-button"
          title={`Edit ${config.singular}`}
          onClick={() =>
            navigate(`/admin/${kind}/edit/${encodeURIComponent(item.id)}`)
          }
        >
          <Pencil size={15} />
        </button>
        <button
          className="admin-icon-button danger-hover"
          title={`Delete ${config.singular}`}
          onClick={() => setDeleting(item)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    ),
  };
  let columns;
  if (kind === "products")
    columns = [
      {
        key: "image",
        label: "Image",
        sortable: false,
        render: (p) => (
          <img
            className="admin-product-table-image"
            src={productImage(p) || fallbackPhoto}
            alt={p.name}
          />
        ),
      },
      {
        key: "name",
        label: "Product",
        searchValue: (p) => `${p.name} ${p.brand} ${p.category}`,
        render: (p) => (
          <div className="admin-product-cell">
            <span>
              <strong>{p.name}</strong>
              <small>{p.brand}</small>
            </span>
          </div>
        ),
      },
      { key: "brand", label: "Brand" },
      { key: "category", label: "Category" },
      {
        key: "condition",
        label: "Condition",
        render: (p) => <ConditionBadge condition={p.condition} />,
      },
      {
        key: "sizes",
        label: "Sizes",
        searchValue: (p) => productSizes(p).join(" "),
        render: (p) => productSizes(p).join(", ") || "—",
      },
      {
        key: "price",
        label: "Price",
        align: "right",
        sortValue: (p) => Number(p.price),
        render: (p) => moneyCell(p.price),
      },
      {
        key: "stock",
        label: "Stock",
        align: "right",
        render: (p) => (
          <span
            className={p.stock <= 10 ? "admin-stock-low" : "admin-stock-good"}
          >
            {p.stock} in stock
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (p) => <StatusBadge>{productStatus(p)}</StatusBadge>,
      },
      actionColumn,
    ];
  else if (kind === "categories")
    columns = [
      {
        key: "name",
        label: "Category",
        searchValue: (item) => `${item.name} ${item.description || ""}`,
        render: (item) => (
          <div className="admin-name-cell">
            <span className="admin-entity-avatar">
              <Filter size={16} />
            </span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.slug}</small>
            </span>
          </div>
        ),
      },
      {
        key: "productCount",
        label: "Products",
        align: "right",
        render: (item) => (
          <span>
            {products.filter((p) => p.category === item.name).length} products
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => <StatusBadge>{item.status || "Active"}</StatusBadge>,
      },
      actionColumn,
    ];
  else
    columns = [
      {
        key: "name",
        label: "Brand",
        searchValue: (item) => `${item.name} ${item.description || ""}`,
        render: (item) => (
          <div className="admin-name-cell">
            <span className="admin-brand-token">{item.name.slice(0, 1)}</span>
            <span>
              <strong>{item.name}</strong>
              <small>
                {item.slug || item.name.toLowerCase().replace(/\W+/g, "-")}
              </small>
            </span>
          </div>
        ),
      },
      {
        key: "productCount",
        label: "Products",
        align: "right",
        render: (item) => (
          <span>
            {products.filter((p) => p.brand === item.name).length} products
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (item) => <StatusBadge>{item.status || "Active"}</StatusBadge>,
      },
      actionColumn,
    ];
  const categoryProductCount =
    deleting && kind === "categories"
      ? products.filter((product) => product.category === deleting.name).length
      : 0;
  return (
    <>
      <PageHeader
        eyebrow="CATALOG"
        title={config.title}
        description={config.subtitle}
        actions={
          <Button icon={Plus} onClick={() => navigate(config.add)}>
            Add {config.singular}
          </Button>
        }
      />
      <div className="admin-card">
        <Toolbar
          search={search}
          setSearch={setSearch}
          placeholder={`Search ${config.title.toLowerCase()}…`}
        >
          <SelectField
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </SelectField>
          {kind === "products" && (
            <>
              <SelectField
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
              >
                <option value="">All brands</option>
                {brands.map((item) => {
                  const name = typeof item === "string" ? item : item.name;
                  return <option key={name}>{name}</option>;
                })}
              </SelectField>
              <SelectField
                value={conditionFilter}
                onChange={(event) => setConditionFilter(event.target.value)}
              >
                <option value="">All conditions</option>
                {PRODUCT_CONDITIONS.map((condition) => (
                  <option key={condition}>{condition}</option>
                ))}
              </SelectField>
              <SelectField
                value={sizeFilter}
                onChange={(event) => setSizeFilter(event.target.value)}
              >
                <option value="">All sizes</option>
                {availableShoeSizes.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </SelectField>
              <SelectField
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="">All stock</option>
                <option>In stock</option>
                <option>Low stock</option>
                <option>Out of stock</option>
              </SelectField>
              <input
                className="admin-filter-input"
                type="number"
                min="0"
                aria-label="Minimum price"
                placeholder="Min price"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <input
                className="admin-filter-input"
                type="number"
                min="0"
                aria-label="Maximum price"
                placeholder="Max price"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </>
          )}
          <span className="admin-result-count">
            {filtered.length} {config.title.toLowerCase()}
          </span>
        </Toolbar>
        <AdminTable rows={filtered} columns={columns} searchValue={search} />
      </div>
      {deleting && (
        <ConfirmModal
          title={`Delete ${config.singular}?`}
          description={
            categoryProductCount
              ? `“${deleting.name}” contains ${categoryProductCount} products. They will remain in your catalog but will no longer belong to this category.`
              : `“${deleting.name}” will be permanently removed from your store.`
          }
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories, brands, updateProducts, notify } = useAdmin();
  const item = id
    ? products.find((entry) => String(entry.id) === decodeURIComponent(id))
    : null;
  const [form, setForm] = useState(() => {
    if (!item)
      return {
        name: "",
        brand: "",
        category: "",
        gender: "Unisex",
        condition: "BrandNew",
        description: "",
        price: "",
        originalPrice: "",
        discount: 0,
        sizes: [],
        colors: [],
        features: [],
        status: "Active",
        rating: 4.5,
      };
    const initial = {
      ...item,
      condition: normalizeCondition(item.condition),
      sizes: (item.sizes || []).map((entry) =>
        typeof entry === "object"
          ? { size: entry.size, quantity: entry.quantity ?? "" }
          : { size: entry, quantity: "" },
      ),
    };
    delete initial.stock;
    return initial;
  });
  const [catalogFormKind, setCatalogFormKind] = useState(null);
  const [showSizeErrors, setShowSizeErrors] = useState(false);
  const [imageEntries, setImageEntries] = useState(() =>
    (item?.images || (item?.thumbnail ? [item.thumbnail] : []))
      .slice(0, 4)
      .map((value) => ({ preview: value, value })),
  );
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const objectUrls = useRef(new Set());
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    },
    [],
  );

  async function processFile(file) {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      notify("Choose a JPG, JPEG, PNG, or WEBP image.", "error");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify("Image must be smaller than 5MB.", "error");
      return null;
    }
    const preview = URL.createObjectURL(file);
    objectUrls.current.add(preview);
    try {
      const value = await compressProductImage(file);
      return { preview, value };
    } catch (imageError) {
      URL.revokeObjectURL(preview);
      objectUrls.current.delete(preview);
      notify(imageError.message, "error");
      return null;
    }
  }

  async function addFiles(fileList) {
    const selectedFiles = Array.from(fileList || []);
    const slots = 4 - imageEntries.length;
    if (selectedFiles.length > slots) {
      const message =
        !slots || imageEntries.length === 0
          ? "Maximum 4 product images allowed."
          : `You can upload only ${slots} more image${slots === 1 ? "" : "s"}.`;
      notify(message, "error");
    }
    if (slots <= 0) return;
    const additions = await Promise.all(
      selectedFiles.slice(0, slots).map(processFile),
    );
    setImageEntries((current) =>
      [...current, ...additions.filter(Boolean)].slice(0, 4),
    );
  }

  async function replaceImage(index, file) {
    if (!file) return;
    const replacement = await processFile(file);
    if (!replacement) return;
    setImageEntries((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? replacement : image,
      ),
    );
  }

  function removeImage(index) {
    const removed = imageEntries[index];
    if (removed.preview.startsWith("blob:")) {
      URL.revokeObjectURL(removed.preview);
      objectUrls.current.delete(removed.preview);
    }
    setImageEntries((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  function makeMain(index) {
    setImageEntries((current) => {
      const next = [...current];
      next.unshift(next.splice(index, 1)[0]);
      return next;
    });
  }

  function updateSize(index, key, value) {
    set(
      "sizes",
      (form.sizes || []).map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    );
    setError("");
  }

  function addSize(size = "") {
    const current = form.sizes || [];
    if (size !== "" && current.some((row) => Number(row.size) === Number(size)))
      return;
    set("sizes", [
      ...current,
      { size: size === "" ? "" : String(size), quantity: "" },
    ]);
    setError("");
  }

  function sizeError(index) {
    const row = form.sizes[index];
    const size = Number(row.size);
    const quantity = Number(row.quantity);
    if (!Number.isFinite(size) || size <= 0) return "Enter a valid shoe size.";
    if (
      form.sizes.some(
        (other, rowIndex) => rowIndex !== index && Number(other.size) === size,
      )
    )
      return "Each size can only be added once.";
    if (
      row.quantity === "" ||
      row.quantity === null ||
      row.quantity === undefined
    )
      return "Enter a quantity for this size.";
    if (!Number.isInteger(quantity) || quantity <= 0)
      return "Quantity must be a positive whole number.";
    return "";
  }

  const totalStock = (form.sizes || []).reduce(
    (total, row) => total + (Number(row.quantity) || 0),
    0,
  );

  function submit(event) {
    event.preventDefault();
    setShowSizeErrors(true);
    const name = String(form.name || "").trim();
    if (!name) {
      setError("Enter a product name.");
      return;
    }
    if (!form.sizes?.length) {
      setError("Add at least one size and quantity.");
      return;
    }
    if (form.sizes.some((_, index) => sizeError(index))) {
      setError("Fix the missing or invalid size quantities before saving.");
      return;
    }
    if (!imageEntries.length) {
      setError("Upload at least one product image.");
      return;
    }
    if (
      products.some(
        (product) =>
          product.id !== item?.id &&
          product.name.trim().toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("A product with this name already exists.");
      return;
    }
    const price = Math.round(Number(form.price));
    const originalPrice = Math.round(Number(form.originalPrice) || price);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price.");
      return;
    }
    const existing = item ? stripProductIdentifiers(item) : {};
    const images = imageEntries.map((image) => image.value);
    const data = {
      ...existing,
      ...form,
      id: item?.id || makeId("product"),
      name,
      condition: normalizeCondition(form.condition),
      price,
      originalPrice,
      discount:
        originalPrice > price
          ? Math.round((1 - price / originalPrice) * 100)
          : 0,
      stock: totalStock,
      sizes: form.sizes
        .map((row) => ({
          size: Number(row.size),
          quantity: Number(row.quantity),
        }))
        .sort((a, b) => a.size - b.size),
      images,
      thumbnail: images[0],
      colors: Array.isArray(form.colors)
        ? form.colors
        : String(form.colors || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
      features: Array.isArray(form.features)
        ? form.features
        : String(form.features || "")
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
      status: form.status,
      active: form.status === "Active",
    };
    delete data.slug;
    delete data.sku;
    try {
      updateProducts(
        item
          ? products.map((product) => (product.id === item.id ? data : product))
          : [data, ...products],
      );
      notify(
        item
          ? "Product updated successfully."
          : "Product created successfully.",
      );
      navigate("/admin/products/list");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  if (id && !item)
    return (
      <>
        <PageHeader eyebrow="PRODUCTS" title="Product not found" />
        <div className="admin-card admin-not-found">
          <p>This product may have been removed.</p>
          <Link to="/admin/products/list" className="admin-text-link">
            Back to products <ArrowRight size={14} />
          </Link>
        </div>
      </>
    );

  return (
    <>
      <PageHeader
        eyebrow={`PRODUCTS / ${item ? "EDIT" : "NEW"}`}
        title={`${item ? "Edit" : "Add"} product`}
        description="Add the details, sizes, and condition for this pair."
        actions={
          <Button
            variant="subtle"
            onClick={() => navigate("/admin/products/list")}
          >
            <ChevronLeft size={16} /> Back to products
          </Button>
        }
      />
      <form className="admin-product-form" onSubmit={submit}>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Product information</h2>
              <p>Core details displayed to shoppers.</p>
            </div>
            <div className="admin-form-fields">
              <Field
                className="admin-full-field"
                label="Product name"
                value={form.name || ""}
                onChange={(event) => set("name", event.target.value)}
                required
              />
              <div className="admin-catalog-field">
                <Field label="Brand">
                  <select
                    value={form.brand || ""}
                    onChange={(event) => set("brand", event.target.value)}
                    required
                  >
                    <option value="">Select brand</option>
                    {brands
                      .filter(
                        (brand) =>
                          typeof brand === "string" || brand.active !== false,
                      )
                      .map((brand) => (
                        <option
                          key={typeof brand === "string" ? brand : brand.id}
                          value={typeof brand === "string" ? brand : brand.name}
                        >
                          {typeof brand === "string" ? brand : brand.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Button
                  icon={Plus}
                  variant="outline"
                  onClick={() => setCatalogFormKind("brands")}
                >
                  Add Brand
                </Button>
              </div>
              <div className="admin-catalog-field">
                <Field label="Category">
                  <select
                    value={form.category || ""}
                    onChange={(event) => set("category", event.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((category) => category.active !== false)
                      .map((category) => (
                        <option
                          key={category.id || category.slug}
                          value={category.name}
                        >
                          {category.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <Button
                  icon={Plus}
                  variant="outline"
                  onClick={() => setCatalogFormKind("categories")}
                >
                  Add Category
                </Button>
              </div>
              <Field label="Gender">
                <select
                  value={form.gender || "Unisex"}
                  onChange={(event) => set("gender", event.target.value)}
                >
                  <option>Men</option>
                  <option>Women</option>
                  <option>Unisex</option>
                </select>
              </Field>
              <Field label="Condition">
                <select
                  value={normalizeCondition(form.condition)}
                  onChange={(event) => set("condition", event.target.value)}
                  required
                >
                  {PRODUCT_CONDITIONS.map((condition) => (
                    <option key={condition}>{condition}</option>
                  ))}
                </select>
              </Field>
              <Field className="admin-full-field" label="Description">
                <textarea
                  value={form.description || ""}
                  onChange={(event) => set("description", event.target.value)}
                  rows="4"
                  required
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Pricing</h2>
              <p>Set the current and original prices.</p>
            </div>
            <div className="admin-form-fields">
              <Field
                label="Price (Rs.)"
                type="number"
                min="1"
                value={form.price ?? ""}
                onChange={(event) => set("price", event.target.value)}
                required
              />
              <Field
                label="Original price (Rs.)"
                type="number"
                min="0"
                value={form.originalPrice ?? ""}
                onChange={(event) => set("originalPrice", event.target.value)}
              />
              <Field
                label="Discount (%)"
                type="number"
                value={
                  form.originalPrice > form.price && form.price
                    ? Math.round(
                        (1 - Number(form.price) / Number(form.originalPrice)) *
                          100,
                      )
                    : 0
                }
                readOnly
                hint="Calculated from the original price and current price."
              />
            </div>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Available shoe sizes</h2>
              <p>Select a listed size or enter a custom size below.</p>
            </div>
            <fieldset className="admin-size-picker">
              <legend className="sr-only">Available shoe sizes</legend>
              {shoeSizes.map((size) => {
                const selected = (form.sizes || []).some(
                  (row) => Number(row.size) === size,
                );
                return (
                  <button
                    type="button"
                    key={size}
                    className={
                      selected
                        ? "admin-size-option selected"
                        : "admin-size-option"
                    }
                    aria-pressed={selected}
                    disabled={selected}
                    onClick={() => addSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </fieldset>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Available sizes</h2>
              <p>Set the quantity available for each shoe size.</p>
            </div>
            <div className="admin-size-quantities">
              <div className="admin-size-quantity-heading">
                <span>Size</span>
                <span>Quantity</span>
                <span className="sr-only">Actions</span>
              </div>
              {(form.sizes || []).map((row, index) => {
                const rowError = showSizeErrors ? sizeError(index) : "";
                const usedSizes = form.sizes
                  .filter((_, rowIndex) => rowIndex !== index)
                  .map((other) => Number(other.size));
                return (
                  <div className="admin-size-quantity-row" key={index}>
                    <label className="admin-field">
                      <span className="sr-only">Size {index + 1}</span>
                      <input
                        aria-label={`Size ${index + 1}`}
                        aria-invalid={Boolean(
                          rowError &&
                          (!row.size ||
                            !Number.isFinite(Number(row.size)) ||
                            Number(row.size) <= 0 ||
                            usedSizes.includes(Number(row.size))),
                        )}
                        type="number"
                        min="0.01"
                        step="any"
                        value={row.size ?? ""}
                        onChange={(event) =>
                          updateSize(index, "size", event.target.value)
                        }
                        placeholder="e.g. 42"
                      />
                    </label>
                    <label className="admin-field">
                      <span className="sr-only">
                        Quantity for size {row.size || index + 1}
                      </span>
                      <input
                        aria-label={`Quantity for size ${row.size || index + 1}`}
                        aria-invalid={Boolean(
                          rowError && rowError.includes("quantity"),
                        )}
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantity ?? ""}
                        onChange={(event) =>
                          updateSize(index, "quantity", event.target.value)
                        }
                        placeholder="0"
                      />
                    </label>
                    <button
                      className="admin-icon-button danger-hover"
                      type="button"
                      aria-label={`Remove size row ${index + 1}`}
                      onClick={() => {
                        set(
                          "sizes",
                          form.sizes.filter(
                            (_, rowIndex) => rowIndex !== index,
                          ),
                        );
                        setError("");
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    {rowError && (
                      <small className="admin-size-row-error">{rowError}</small>
                    )}
                  </div>
                );
              })}
              <div className="admin-size-quantity-actions">
                <Button
                  icon={Plus}
                  variant="outline"
                  onClick={() => {
                    set("sizes", [
                      ...(form.sizes || []),
                      { size: "", quantity: "" },
                    ]);
                    setError("");
                  }}
                >
                  Add Size
                </Button>
                <strong>
                  Total Stock <span>{totalStock}</span>
                </strong>
              </div>
            </div>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Product images</h2>
              <p>Upload 1–4 JPG, PNG, or WEBP images. Maximum 5MB each.</p>
            </div>
            <div className="admin-image-manager">
              <button
                type="button"
                className="admin-image-dropzone"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addFiles(event.dataTransfer.files);
                }}
              >
                <span className="admin-image-upload-icon">
                  <Package size={21} />
                </span>
                <strong>Upload product images</strong>
                <span>Drag and drop images here, or choose files</span>
                <small>
                  {4 - imageEntries.length} image slot
                  {4 - imageEntries.length === 1 ? "" : "s"} remaining
                </small>
                <span className="admin-button admin-button-outline admin-button-small">
                  Choose images
                </span>
              </button>
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              {imageEntries.length > 0 && (
                <div className="admin-image-preview-grid">
                  {imageEntries.map((image, index) => (
                    <article
                      className="admin-image-preview"
                      key={`${image.value.slice(0, 30)}-${index}`}
                    >
                      <img
                        src={image.preview}
                        alt={`Product preview ${index + 1}`}
                      />
                      <div>
                        <strong>
                          {index === 0 ? "Main Image" : `Image ${index + 1}`}
                        </strong>
                        <div className="admin-image-actions">
                          <label className="admin-image-action">
                            Replace
                            <input
                              className="sr-only"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                              onChange={(event) => {
                                replaceImage(index, event.target.files[0]);
                                event.target.value = "";
                              }}
                            />
                          </label>
                          {index > 0 && (
                            <button
                              type="button"
                              className="admin-image-action"
                              onClick={() => makeMain(index)}
                            >
                              Set as Main Image
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-image-remove"
                            aria-label={`Remove image ${index + 1}`}
                            onClick={() => removeImage(index)}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="admin-form-card">
          <div className="admin-form-section">
            <div className="admin-form-section-title">
              <h2>Additional information</h2>
              <p>Optional details that help shoppers choose.</p>
            </div>
            <div className="admin-form-fields">
              <Field
                label="Colors (comma separated)"
                value={
                  Array.isArray(form.colors)
                    ? form.colors.join(", ")
                    : form.colors || ""
                }
                onChange={(event) => set("colors", event.target.value)}
              />
              <Field label="Features (one per line)">
                <textarea
                  rows="3"
                  value={
                    Array.isArray(form.features)
                      ? form.features.join("\n")
                      : form.features || ""
                  }
                  onChange={(event) => set("features", event.target.value)}
                />
              </Field>
              <Field label="Product status">
                <select
                  value={form.status || "Active"}
                  onChange={(event) => set("status", event.target.value)}
                >
                  <option>Active</option>
                  <option>Draft</option>
                </select>
              </Field>
              <Field
                label="Rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating ?? 4.5}
                onChange={(event) => set("rating", Number(event.target.value))}
              />
            </div>
          </div>
        </section>
        {error && (
          <p className="admin-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-product-form-footer">
          <Button
            variant="subtle"
            onClick={() => navigate("/admin/products/list")}
          >
            Cancel
          </Button>
          <Button icon={Save} type="submit">
            {item ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
      {catalogFormKind && (
        <CatalogForm
          kind={catalogFormKind}
          embedded
          onCancel={() => setCatalogFormKind(null)}
          onCreated={(record) => {
            set(
              catalogFormKind === "brands" ? "brand" : "category",
              record.name,
            );
            setCatalogFormKind(null);
          }}
        />
      )}
    </>
  );
}

function CatalogForm({ kind, embedded = false, onCancel, onCreated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, brands, updateCategories, updateBrands, notify } =
    useAdmin();
  const store = { categories, brands };
  const item = id
    ? store[kind].find((entry) => String(entry.id) === decodeURIComponent(id))
    : null;
  const [form, setForm] = useState(() => item || {});
  const [error, setError] = useState("");
  const setters = { categories: updateCategories, brands: updateBrands };
  const labels = {
    categories: ["category", "Categories"],
    brands: ["brand", "Brands"],
  };
  const [singular, plural] = labels[kind];
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  function submit(event) {
    event.preventDefault();
    const name = String(form.name || "").trim();
    if (!name) {
      setError("Enter a name before saving.");
      return;
    }
    const records = store[kind];
    const duplicate = records.some(
      (record) =>
        record.id !== item?.id &&
        record.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setError(`A ${singular} with this name already exists.`);
      return;
    }
    const data = {
      ...form,
      name,
      id: item?.id || makeId(kind.slice(0, -1)),
      status: form.status || "Active",
    };
    data.active = data.status === "Active";
    data.slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    try {
      setters[kind](
        item
          ? records.map((record) => (record.id === item.id ? data : record))
          : [data, ...records],
      );
      notify(
        `${singular[0].toUpperCase()}${singular.slice(1)} ${item ? "updated" : "created"} successfully.`,
      );
      if (onCreated) onCreated(data);
      else navigate(`/admin/${kind}/list`);
    } catch (saveError) {
      setError(saveError.message);
    }
  }
  if (id && !item)
    return (
      <>
        <PageHeader eyebrow={plural.toUpperCase()} title="Record not found" />
        <div className="admin-card admin-not-found">
          <p>This record may have been removed.</p>
          <Link to={`/admin/${kind}/list`} className="admin-text-link">
            Back to {plural.toLowerCase()} <ArrowRight size={14} />
          </Link>
        </div>
      </>
    );
  const catalogNameField = (
    <Field
      label={`${singular[0].toUpperCase()}${singular.slice(1)} name`}
      value={form.name || ""}
      onChange={(event) => set("name", event.target.value)}
      required
      placeholder={`Enter ${singular} name`}
    />
  );
  const fields =
    embedded && (kind === "brands" || kind === "categories") ? (
      <div className="admin-form-fields">{catalogNameField}</div>
    ) : (
      <div className="admin-form-fields">
        <Field
          label={`${singular[0].toUpperCase()}${singular.slice(1)} name`}
          value={form.name || ""}
          onChange={(event) => set("name", event.target.value)}
          required
          placeholder={`Enter ${singular} name`}
        />
        <Field
          label="URL slug"
          value={form.slug || ""}
          onChange={(event) => set("slug", event.target.value)}
          placeholder="generated-from-name"
        />
        {kind === "categories" && (
          <>
            <Field label="Description" className="admin-full-field">
              <textarea
                value={form.description || ""}
                onChange={(event) => set("description", event.target.value)}
                rows="4"
                placeholder="Describe this collection…"
              />
            </Field>
            <Field
              label="Image URL"
              className="admin-full-field"
              value={form.image || ""}
              onChange={(event) => set("image", event.target.value)}
              placeholder="https://…"
            />
          </>
        )}
        {kind === "brands" && (
          <Field label="Description" className="admin-full-field">
            <textarea
              value={form.description || ""}
              onChange={(event) => set("description", event.target.value)}
              rows="4"
              placeholder="A short introduction to this brand…"
            />
          </Field>
        )}
        <Field label="Status">
          <select
            value={form.status || "Active"}
            onChange={(event) => set("status", event.target.value)}
          >
            <option>Active</option>
            <option>Draft</option>
            <option>Archived</option>
          </select>
        </Field>
      </div>
    );
  if (embedded)
    return (
      <Modal
        title={`Add ${singular}`}
        description={`Enter the details for this ${singular}.`}
        onClose={onCancel}
        size="wide"
      >
        <form className="admin-inline-catalog-form" onSubmit={submit}>
          {fields}
          {error && (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="admin-modal-footer">
            <Button variant="subtle" onClick={onCancel}>
              Cancel
            </Button>
            <Button icon={Save} type="submit">
              Create {singular}
            </Button>
          </div>
        </form>
      </Modal>
    );
  return (
    <>
      <PageHeader
        eyebrow={`${plural.toUpperCase()} / ${item ? "EDIT" : "NEW"}`}
        title={`${item ? "Edit" : "Add"} ${singular}`}
        description={`Enter the details for this ${singular}.`}
        actions={
          <Button
            variant="subtle"
            onClick={() => navigate(`/admin/${kind}/list`)}
          >
            <ChevronLeft size={16} /> Back to {plural.toLowerCase()}
          </Button>
        }
      />
      <form className="admin-form-card" onSubmit={submit}>
        <div className="admin-form-section">
          <div className="admin-form-section-title">
            <h2>Details</h2>
            <p>Core information shown across your store.</p>
          </div>
          {fields}
        </div>
        {error && (
          <p className="admin-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-form-footer">
          <span>Changes are saved to this browser’s local store data.</span>
          <div>
            <Button
              variant="subtle"
              onClick={() => navigate(`/admin/${kind}/list`)}
            >
              Cancel
            </Button>
            <Button icon={Save} type="submit">
              {item ? "Save changes" : `Create ${singular}`}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export function ProductListPage() {
  return <CatalogList kind="products" />;
}
export function CategoryListPage() {
  return <CatalogList kind="categories" />;
}
export function BrandListPage() {
  return <CatalogList kind="brands" />;
}
export function ProductFormPage() {
  const { id } = useParams();
  return <ProductForm key={id || "new-product"} />;
}
export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useAdmin();
  const product = products.find(
    (item) => String(item.id) === decodeURIComponent(id),
  );
  if (!product)
    return (
      <NotFoundPanel title="Product not found" back="/admin/products/list" />
    );

  const images = product.images?.length
    ? product.images
    : [productImage(product) || fallbackPhoto];
  const colors = Array.isArray(product.colors)
    ? product.colors
    : String(product.colors || "")
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean);
  const features = Array.isArray(product.features)
    ? product.features
    : String(product.features || "")
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean);
  const sizeRows = (product.sizes || []).map((entry) =>
    typeof entry === "object"
      ? { size: entry.size, quantity: entry.quantity }
      : { size: entry, quantity: null },
  );
  const originalPrice = Number(product.originalPrice) || Number(product.price);

  return (
    <>
      <PageHeader
        eyebrow={<Link to="/admin/products/list">PRODUCTS</Link>}
        title={product.name}
        description={[
          product.brand,
          product.category,
          normalizeCondition(product.condition),
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button
              variant="subtle"
              onClick={() => navigate("/admin/products/list")}
            >
              <ChevronLeft size={16} /> Back to products
            </Button>
            <Button
              icon={Pencil}
              onClick={() =>
                navigate(
                  `/admin/products/edit/${encodeURIComponent(product.id)}`,
                )
              }
            >
              Edit product
            </Button>
          </>
        }
      />
      <div className="admin-detail-grid admin-product-view-grid">
        <div className="admin-detail-main">
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Product images</h2>
                <p>
                  {images.length} image{images.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <img
              className="admin-product-view-hero"
              src={images[0]}
              alt={product.name}
            />
            <div className="admin-product-view-thumbnails">
              {images.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                />
              ))}
            </div>
          </section>
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Description</h2>
                <p>Product details for your catalog</p>
              </div>
            </div>
            <p className="admin-product-view-description">
              {product.description || "No description provided."}
            </p>
            {features.length > 0 && (
              <>
                <h3 className="admin-product-view-subheading">Features</h3>
                <ul className="admin-product-view-features">
                  {features.map((feature, index) => (
                    <li key={`${feature}-${index}`}>{feature}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Size availability</h2>
                <p>{Number(product.stock) || 0} units in total</p>
              </div>
            </div>
            {sizeRows.length ? (
              <div className="admin-product-size-table">
                <div>
                  <span>Size</span>
                  <span>Available</span>
                </div>
                {sizeRows.map((row, index) => (
                  <div key={`${row.size}-${index}`}>
                    <strong>{row.size}</strong>
                    <span>
                      {row.quantity !== null
                        ? `${row.quantity} units`
                        : Number(product.stock) > 0
                          ? "In stock"
                          : "Out of stock"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-product-view-description">No sizes listed.</p>
            )}
          </section>
        </div>
        <aside className="admin-detail-side admin-product-view-side">
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Product overview</h2>
                <p>Catalog and inventory status</p>
              </div>
              <StatusBadge>{productStatus(product)}</StatusBadge>
            </div>
            <div className="admin-product-view-price">
              <strong>{money(product.price)}</strong>
              {originalPrice > Number(product.price) && (
                <>
                  <del>{money(originalPrice)}</del>
                  <span>
                    {Math.round(
                      (1 - Number(product.price) / originalPrice) * 100,
                    )}
                    % off
                  </span>
                </>
              )}
            </div>
            <div className="admin-info-list">
              <div>
                <span>Brand</span>
                <strong>{product.brand || "—"}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{product.category || "—"}</strong>
              </div>
              <div>
                <span>Gender</span>
                <strong>{product.gender || "—"}</strong>
              </div>
              <div>
                <span>Condition</span>
                <strong>{normalizeCondition(product.condition) || "—"}</strong>
              </div>
              <div>
                <span>Stock</span>
                <strong>{Number(product.stock) || 0} units</strong>
              </div>
              <div>
                <span>Rating</span>
                <strong>
                  {Number(product.rating)
                    ? `${Number(product.rating).toFixed(1)} / 5`
                    : "—"}
                </strong>
              </div>
            </div>
          </section>
          {colors.length > 0 && (
            <section className="admin-card admin-detail-card">
              <h2>Colors</h2>
              <div className="admin-product-view-colors">
                {colors.map((color, index) => (
                  <span key={`${color}-${index}`}>{color}</span>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
export function CategoryFormPage() {
  return <CatalogForm kind="categories" />;
}
export function BrandFormPage() {
  return <CatalogForm kind="brands" />;
}

function OrderColumns({ onStatus }) {
  return [
    {
      key: "id",
      label: "Order",
      searchValue: (order) =>
        `${order.id} ${fullName(order.customer)} ${order.customer?.email || ""}`,
      render: (order) => (
        <Link
          className="admin-order-id"
          to={`/admin/orders/${encodeURIComponent(order.id)}`}
        >
          {order.id}
        </Link>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortValue: (order) => new Date(order.date).getTime(),
      render: (order) => shortDate(order.date),
    },
    {
      key: "customer",
      label: "Customer",
      searchValue: (order) =>
        `${fullName(order.customer)} ${order.customer?.email || ""}`,
      render: (order) => (
        <div className="admin-name-cell">
          <span className="admin-order-avatar">
            {customerInitials(order.customer)}
          </span>
          <span>
            <strong>{fullName(order.customer)}</strong>
            <small>{order.customer?.email || "No email provided"}</small>
          </span>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      align: "right",
      render: (order) =>
        `${(order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)} items`,
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      sortValue: (order) => Number(order.total),
      render: (order) => moneyCell(order.total),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => (
        <button
          className="admin-status-action"
          onClick={() => onStatus(order)}
          title="Change order status"
        >
          <StatusBadge>{order.status}</StatusBadge>
        </button>
      ),
    },
    {
      key: "action",
      label: "",
      sortable: false,
      align: "right",
      render: (order) => (
        <Link
          className="admin-icon-button"
          aria-label={`View ${order.id}`}
          to={`/admin/orders/${encodeURIComponent(order.id)}`}
        >
          <Eye size={16} />
        </Link>
      ),
    },
  ];
}

export function OrdersPage() {
  const { orders, updateOrders, notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [editing, setEditing] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const rows = orders.filter(
    (order) => filter === "All statuses" || order.status === filter,
  );
  function changeStatus(order, status) {
    if (status === "Cancelled") {
      setCancelConfirm(order);
      setEditing(null);
      return;
    }
    try {
      updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      );
      notify(`${order.id} is now ${status.toLowerCase()}.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setEditing(null);
  }
  function cancelOrder() {
    try {
      updateOrders(
        orders.map((item) =>
          item.id === cancelConfirm.id
            ? { ...item, status: "Cancelled" }
            : item,
        ),
      );
      notify(`${cancelConfirm.id} was cancelled.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setCancelConfirm(null);
  }
  return (
    <>
      <PageHeader
        eyebrow="COMMERCE"
        title="Orders"
        description="Track, fulfill, and update customer orders."
        actions={
          <Button
            variant="subtle"
            icon={Download}
            onClick={() => exportCSV(orders, "orders.csv")}
          >
            Export
          </Button>
        }
      />
      <div className="admin-card">
        <Toolbar
          search={search}
          setSearch={setSearch}
          placeholder="Search orders or customers…"
        >
          <SelectField
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All statuses</option>
            {[
              "Pending",
              "Confirmed",
              "Processing",
              "Shipped",
              "Out for Delivery",
              "Delivered",
              "Cancelled",
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </SelectField>
          <span className="admin-result-count">{rows.length} orders</span>
        </Toolbar>
        <AdminTable
          rows={rows}
          columns={OrderColumns({ onStatus: setEditing })}
          searchValue={search}
        />
      </div>
      {editing && (
        <Modal
          title={`Update ${editing.id}`}
          description={`Current status: ${editing.status}`}
          onClose={() => setEditing(null)}
        >
          <div className="admin-status-options">
            {[
              "Pending",
              "Confirmed",
              "Processing",
              "Shipped",
              "Out for Delivery",
              "Delivered",
              "Cancelled",
            ].map((status) => (
              <button
                key={status}
                className="admin-status-option"
                onClick={() => changeStatus(editing, status)}
              >
                <StatusBadge>{status}</StatusBadge>
                {editing.status === status && <Check size={16} />}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {cancelConfirm && (
        <ConfirmModal
          title="Cancel this order?"
          description={`${cancelConfirm.id} will be marked cancelled. This action can’t be undone.`}
          confirmLabel="Cancel order"
          onCancel={() => setCancelConfirm(null)}
          onConfirm={cancelOrder}
        />
      )}
    </>
  );
}

function exportCSV(rows, filename) {
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

export function OrderDetailPage() {
  const { id } = useParams();
  const { orders, products, updateOrders, notify } = useAdmin();
  const order = orders.find(
    (item) => String(item.id) === decodeURIComponent(id),
  );
  const [confirm, setConfirm] = useState(false);
  if (!order)
    return <NotFoundPanel title="Order not found" back="/admin/orders/list" />;
  const subtotal = orderSubtotal(order);
  const discount = Number(order.discount) || 0;
  const shipping =
    Number(order.shipping) ||
    Math.max(0, Number(order.total) - subtotal + discount);
  function markShipped() {
    try {
      updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, status: "Shipped" } : item,
        ),
      );
      notify(`${order.id} marked as shipped.`);
    } catch (error) {
      notify(error.message, "error");
    }
  }
  function cancelOrder() {
    try {
      updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, status: "Cancelled" } : item,
        ),
      );
      notify(`${order.id} was cancelled.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setConfirm(false);
  }
  return (
    <>
      <PageHeader
        eyebrow={<Link to="/admin/orders/list">ORDERS</Link>}
        title={order.id}
        description={`Placed ${dateTime(order.date)}`}
        actions={
          <>
            <Button
              variant="subtle"
              onClick={() => window.print()}
              icon={Download}
            >
              Print order
            </Button>
            {order.status !== "Cancelled" && order.status !== "Shipped" && (
              <Button icon={Truck} onClick={markShipped}>
                Mark as shipped
              </Button>
            )}
          </>
        }
      />
      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Items in this order</h2>
                <p>{order.items?.length || 0} line items</p>
              </div>
              <StatusBadge>{order.status}</StatusBadge>
            </div>
            <div className="admin-line-items">
              {(order.items || []).map((line, index) => {
                const product = products.find(
                  (item) => item.id === line.productId,
                );
                return (
                  <div
                    className="admin-line-item"
                    key={`${line.productId}-${index}`}
                  >
                    <img
                      src={
                        line.image ||
                        (product && productImage(product)) ||
                        fallbackPhoto
                      }
                      alt=""
                    />
                    <span className="admin-line-name">
                      <strong>
                        {line.name || product?.name || "Store product"}
                      </strong>
                      <small>
                        {line.brand || product?.brand || "Morrow Goods"}
                        {line.size ? ` · Size ${line.size}` : ""}
                      </small>
                    </span>
                    <span className="admin-line-quantity">
                      × {Number(line.quantity) || 1}
                    </span>
                    <strong className="admin-money">
                      {money(
                        (Number(line.price) || Number(product?.price) || 0) *
                          (Number(line.quantity) || 1),
                      )}
                    </strong>
                  </div>
                );
              })}
            </div>
            <div className="admin-order-totals">
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              {discount > 0 && (
                <div>
                  <span>Discount</span>
                  <strong>−{money(discount)}</strong>
                </div>
              )}
              <div>
                <span>Shipping</span>
                <strong>{shipping === 0 ? "Free" : money(shipping)}</strong>
              </div>
              <div className="total-line">
                <span>Total</span>
                <strong>{money(order.total)}</strong>
              </div>
            </div>
          </section>
          <section className="admin-card admin-detail-card">
            <div className="admin-card-heading">
              <div>
                <h2>Timeline</h2>
                <p>Order activity and fulfillment updates</p>
              </div>
            </div>
            <div className="admin-timeline">
              <div className="admin-timeline-entry">
                <span className="timeline-dot done">
                  <Check size={11} />
                </span>
                <span>
                  <strong>Order placed</strong>
                  <small>{dateTime(order.date)}</small>
                </span>
              </div>
              <div className="admin-timeline-entry">
                <span
                  className={`timeline-dot ${order.status !== "Processing" ? "done" : ""}`}
                >
                  {order.status !== "Processing" && <Check size={11} />}
                </span>
                <span>
                  <strong>{order.status}</strong>
                  <small>
                    {order.status === "Processing"
                      ? "Awaiting fulfillment"
                      : "Status updated by store admin"}
                  </small>
                </span>
              </div>
            </div>
          </section>
        </div>
        <aside className="admin-detail-side">
          <section className="admin-card admin-detail-card">
            <h2>Customer</h2>
            <div className="admin-customer-summary">
              <span className="admin-customer-avatar">
                {customerInitials(order.customer)}
              </span>
              <span>
                <strong>{fullName(order.customer)}</strong>
                <small>{order.customer?.email || "No email"}</small>
              </span>
            </div>
            <div className="admin-info-list">
              <div>
                <span>Phone</span>
                <strong>{order.customer?.phone || "—"}</strong>
              </div>
              <div>
                <span>Shipping address</span>
                <strong>
                  {[
                    order.customer?.address,
                    order.customer?.city,
                    order.customer?.province,
                    order.customer?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </strong>
              </div>
            </div>
            <Link
              className="admin-text-link"
              to={`/admin/customers/${encodeURIComponent(order.customer?.email || "")}`}
            >
              View customer <ArrowRight size={14} />
            </Link>
          </section>
          <section className="admin-card admin-detail-card">
            <h2>Payment</h2>
            <div className="admin-payment-line">
              <span className="admin-payment-icon">
                <CircleDollarSign size={18} />
              </span>
              <span>
                <strong>{order.payment || "Not specified"}</strong>
                <small>
                  {order.paymentStatus === "COD"
                    ? `Due on delivery · ${money(order.total)}`
                    : `Paid · ${money(order.total)}`}
                </small>
              </span>
            </div>{" "}
            <div className="admin-info-list">
              <div>
                <span>Payment status</span>
                <StatusBadge>
                  {order.status === "Cancelled"
                    ? "Cancelled"
                    : order.paymentStatus || "Pending"}
                </StatusBadge>
              </div>
              <div>
                <span>Order total</span>
                <strong>{money(order.total)}</strong>
              </div>
            </div>
          </section>
          {order.status !== "Cancelled" && (
            <button
              className="admin-cancel-order-link"
              onClick={() => setConfirm(true)}
            >
              Cancel order
            </button>
          )}
        </aside>
      </div>
      {confirm && (
        <ConfirmModal
          title="Cancel this order?"
          description={`${order.id} will be marked cancelled.`}
          confirmLabel="Cancel order"
          onCancel={() => setConfirm(false)}
          onConfirm={cancelOrder}
        />
      )}
    </>
  );
}

function customerRecords(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const customer = order.customer || {};
    const email = String(customer.email || "")
      .toLowerCase()
      .trim();
    const key = email || `${fullName(customer)}-${customer.phone || order.id}`;
    const row = map.get(key) || {
      id: encodeURIComponent(email || key),
      email,
      customer,
      orders: [],
      spent: 0,
      lastOrder: order.date,
    };
    row.orders.push(order);
    if (order.status !== "Cancelled") row.spent += Number(order.total) || 0;
    if (new Date(order.date) > new Date(row.lastOrder)) {
      row.lastOrder = order.date;
      row.customer = customer;
    }
    map.set(key, row);
  });
  return [...map.values()].sort(
    (a, b) => new Date(b.lastOrder) - new Date(a.lastOrder),
  );
}

export function CustomersPage() {
  const { orders } = useAdmin();
  const [search, setSearch] = useState("");
  const records = customerRecords(orders);
  const columns = [
    {
      key: "customer",
      label: "Customer",
      searchValue: (row) =>
        `${fullName(row.customer)} ${row.email} ${row.customer?.phone || ""}`,
      render: (row) => (
        <div className="admin-name-cell">
          <span className="admin-order-avatar">
            {customerInitials(row.customer)}
          </span>
          <span>
            <strong>{fullName(row.customer)}</strong>
            <small>{row.email || "No email address"}</small>
          </span>
        </div>
      ),
    },
    {
      key: "orders",
      label: "Orders",
      align: "right",
      render: (row) => row.orders.length,
    },
    {
      key: "spent",
      label: "Total spent",
      align: "right",
      sortValue: (row) => row.spent,
      render: (row) => moneyCell(row.spent),
    },
    {
      key: "lastOrder",
      label: "Last order",
      render: (row) => shortDate(row.lastOrder),
    },
    {
      key: "action",
      label: "",
      sortable: false,
      align: "right",
      render: (row) => (
        <Link
          className="admin-icon-button"
          to={`/admin/customers/${row.id}`}
          aria-label={`View ${fullName(row.customer)}`}
        >
          <Eye size={16} />
        </Link>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="RELATIONSHIPS"
        title="Customers"
        description="A customer list built from the contact details on store orders."
        actions={
          <Button
            variant="subtle"
            icon={Download}
            onClick={() => exportCSV(orders, "customers.csv")}
          >
            Export
          </Button>
        }
      />
      <div className="admin-info-banner">
        <Users size={17} />
        <span>
          Customer records are derived from order checkout details; there are no
          separate customer accounts yet.
        </span>
      </div>
      <div className="admin-card">
        <Toolbar
          search={search}
          setSearch={setSearch}
          placeholder="Search customers…"
        >
          <span className="admin-result-count">{records.length} customers</span>
        </Toolbar>
        <AdminTable
          rows={records}
          columns={columns}
          searchValue={search}
          emptyTitle="No customers yet"
        />
      </div>
    </>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const { orders } = useAdmin();
  const key = decodeURIComponent(id).toLowerCase();
  const customer = customerRecords(orders).find(
    (row) =>
      decodeURIComponent(row.id).toLowerCase() === key || row.email === key,
  );
  if (!customer)
    return (
      <NotFoundPanel title="Customer not found" back="/admin/customers/list" />
    );
  const { customer: details } = customer;
  return (
    <>
      <PageHeader
        eyebrow={<Link to="/admin/customers/list">CUSTOMERS</Link>}
        title={fullName(details)}
        description={customer.email || "No email on file"}
        actions={
          <Button
            variant="subtle"
            icon={Download}
            onClick={() => exportCSV(customer.orders, "customer-orders.csv")}
          >
            Export orders
          </Button>
        }
      />
      <div className="admin-customer-profile-grid">
        <section className="admin-card admin-detail-card">
          <div className="admin-card-heading">
            <div>
              <h2>Customer overview</h2>
              <p>Order and contact details</p>
            </div>
            <span className="admin-customer-avatar large">
              {customerInitials(details)}
            </span>
          </div>
          <div className="admin-customer-stats">
            <div>
              <span>Total orders</span>
              <strong>{customer.orders.length}</strong>
            </div>
            <div>
              <span>Lifetime spend</span>
              <strong>{money(customer.spent)}</strong>
            </div>
            <div>
              <span>First order</span>
              <strong>
                {shortDate(
                  [...customer.orders].sort(
                    (a, b) => new Date(a.date) - new Date(b.date),
                  )[0]?.date,
                )}
              </strong>
            </div>
          </div>
          <div className="admin-info-list">
            <div>
              <span>Email</span>
              <strong>{details.email || "—"}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{details.phone || "—"}</strong>
            </div>
            <div>
              <span>Latest shipping address</span>
              <strong>
                {[
                  details.address,
                  details.city,
                  details.province,
                  details.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </strong>
            </div>
          </div>
        </section>
        <section className="admin-card admin-detail-card">
          <div className="admin-card-heading">
            <div>
              <h2>Order history</h2>
              <p>{customer.orders.length} total orders</p>
            </div>
          </div>
          <div className="admin-recent-orders">
            {[...customer.orders]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((order) => (
                <Link
                  key={order.id}
                  className="admin-recent-order"
                  to={`/admin/orders/${encodeURIComponent(order.id)}`}
                >
                  <span className="admin-recent-customer">
                    <strong>{order.id}</strong>
                    <small>
                      {shortDate(order.date)} <span>·</span>{" "}
                      {(order.items || []).length} items
                    </small>
                  </span>
                  <StatusBadge>{order.status}</StatusBadge>
                  <strong className="admin-money">{money(order.total)}</strong>
                  <ArrowRight size={15} className="admin-recent-arrow" />
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}

export function InventoryPage() {
  const { products, updateProducts, notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All inventory");
  const [editing, setEditing] = useState(null);
  const [stock, setStock] = useState("");
  const low = products.filter((product) => Number(product.stock) <= 5).length;
  const rows = products.filter(
    (product) =>
      filter === "All inventory" ||
      (filter === "Low stock"
        ? Number(product.stock) > 0 && Number(product.stock) <= 5
        : filter === "Out of stock"
          ? Number(product.stock) === 0
          : Number(product.stock) > 5),
  );
  const columns = [
    {
      key: "name",
      label: "Product",
      searchValue: (p) => `${p.name} ${p.brand}`,
      render: (p) => (
        <div className="admin-product-cell">
          <img src={productImage(p) || fallbackPhoto} alt="" />
          <span>
            <strong>{p.name}</strong>
            <small>{p.brand}</small>
          </span>
        </div>
      ),
    },
    { key: "category", label: "Category" },
    {
      key: "stock",
      label: "Available",
      align: "right",
      render: (p) => (
        <strong
          className={
            Number(p.stock) <= 5 ? "admin-stock-low" : "admin-stock-good"
          }
        >
          {Number(p.stock)} units
        </strong>
      ),
    },
    {
      key: "stockStatus",
      label: "Stock status",
      render: (p) => (
        <StatusBadge>
          {Number(p.stock) === 0
            ? "Out of stock"
            : Number(p.stock) <= 5
              ? "Low stock"
              : "In stock"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      align: "right",
      render: (p) => (
        <button
          className="admin-button admin-button-outline admin-button-small"
          onClick={() => {
            setEditing(p);
            setStock(p.stock);
          }}
        >
          Adjust stock
        </button>
      ),
    },
  ];
  function saveStock(event) {
    event.preventDefault();
    const quantity = Number(stock);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    try {
      updateProducts(
        products.map((product) =>
          product.id === editing.id ? { ...product, stock: quantity } : product,
        ),
      );
      notify(`${editing.name} stock updated to ${quantity}.`);
      setEditing(null);
    } catch (error) {
      notify(error.message, "error");
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Inventory"
        description="Monitor stock levels across your catalog."
        actions={
          <Button
            variant="subtle"
            icon={RefreshCw}
            onClick={() => notify("Inventory is up to date.")}
          >
            Refresh stock
          </Button>
        }
      />
      <div className="admin-inventory-summary">
        <div>
          <span className="inventory-summary-icon">
            <Package size={18} />
          </span>
          <span>
            <strong>{products.length}</strong>
            <small>Total products</small>
          </span>
        </div>
        <div>
          <span className="inventory-summary-icon low">
            <ArrowDownRight size={18} />
          </span>
          <span>
            <strong>{low}</strong>
            <small>Low stock</small>
          </span>
        </div>
        <div>
          <span className="inventory-summary-icon empty">
            <X size={18} />
          </span>
          <span>
            <strong>
              {products.filter((p) => Number(p.stock) === 0).length}
            </strong>
            <small>Out of stock</small>
          </span>
        </div>
      </div>
      <div className="admin-card">
        <Toolbar
          search={search}
          setSearch={setSearch}
          placeholder="Search inventory…"
        >
          <SelectField
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>All inventory</option>
            <option>Low stock</option>
            <option>Out of stock</option>
            <option>In stock</option>
          </SelectField>
          <span className="admin-result-count">{rows.length} products</span>
        </Toolbar>
        <AdminTable rows={rows} columns={columns} searchValue={search} />
      </div>
      {editing && (
        <Modal
          title="Adjust inventory"
          description={editing.name}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={saveStock}>
            <Field
              label="Available quantity"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
            <div className="admin-modal-footer">
              <Button variant="subtle" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" icon={Save}>
                Save stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function DiscountsPage() {
  const { discounts, updateDiscounts, notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const rows = discounts;
  const columns = [
    {
      key: "code",
      label: "Discount code",
      searchValue: (row) => row.code,
      render: (row) => (
        <div className="admin-name-cell">
          <span className="admin-discount-icon">
            <BadgePercent size={17} />
          </span>
          <span>
            <strong className="admin-code">{row.code}</strong>
            <small>
              {row.type === "Percentage" ? `${row.value}% off` : row.type}
            </small>
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) =>
        row.type === "Percentage"
          ? `${row.value}%`
          : row.type === "Fixed amount"
            ? money(row.value)
            : row.type,
    },
    {
      key: "uses",
      label: "Uses",
      align: "right",
      sortValue: (row) => row.uses,
      render: (row) => `${row.uses || 0} / ${row.usageLimit || "∞"}`,
    },
    { key: "endsAt", label: "Expires", render: (row) => shortDate(row.endsAt) },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge>{row.status}</StatusBadge>,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      align: "right",
      render: (row) => (
        <div className="admin-row-actions">
          <button
            className="admin-icon-button"
            title="Edit discount"
            onClick={() => openForm(row)}
          >
            <Pencil size={15} />
          </button>
          <button
            className="admin-icon-button danger-hover"
            title="Delete discount"
            onClick={() => setDeleting(row)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];
  function openForm(record = null) {
    setEditing(record);
    setForm(
      record || {
        type: "Percentage",
        status: "Active",
        value: 10,
        uses: 0,
        usageLimit: 100,
        startsAt: new Date().toISOString().slice(0, 10),
        endsAt: "2026-12-31",
      },
    );
    setError("");
    setFormOpen(true);
  }
  function submit(event) {
    event.preventDefault();
    const code = String(form.code || "")
      .trim()
      .toUpperCase();
    if (
      !code ||
      discounts.some(
        (item) => item.id !== editing?.id && item.code.toUpperCase() === code,
      )
    ) {
      setError("Enter a unique discount code.");
      return;
    }
    if (
      form.type === "Percentage" &&
      (Number(form.value) < 1 || Number(form.value) > 100)
    ) {
      setError("Percentage discounts must be between 1% and 100%.");
      return;
    }
    if (new Date(form.endsAt) < new Date(form.startsAt)) {
      setError("The end date must be after the start date.");
      return;
    }
    const next = {
      ...form,
      id: editing?.id || makeId("discount"),
      code,
      value: Number(form.value) || 0,
      uses: Number(form.uses) || 0,
      usageLimit: Number(form.usageLimit) || 0,
    };
    try {
      updateDiscounts(
        editing
          ? discounts.map((item) => (item.id === editing.id ? next : item))
          : [next, ...discounts],
      );
      notify(`Discount ${code} ${editing ? "updated" : "created"}.`);
      setFormOpen(false);
    } catch (saveError) {
      setError(saveError.message);
    }
  }
  function remove() {
    try {
      updateDiscounts(discounts.filter((item) => item.id !== deleting.id));
      notify(`${deleting.code} removed.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setDeleting(null);
  }
  return (
    <>
      <PageHeader
        eyebrow="PROMOTIONS"
        title="Discounts"
        description="Create offers and keep promotions up to date."
        actions={
          <Button icon={Plus} onClick={() => openForm()}>
            Create discount
          </Button>
        }
      />
      <div className="admin-promo-stats">
        <div>
          <BadgePercent size={19} />
          <span>
            <small>Active offers</small>
            <strong>
              {discounts.filter((item) => item.status === "Active").length}
            </strong>
          </span>
        </div>
        <div>
          <Users size={19} />
          <span>
            <small>Total redemptions</small>
            <strong>
              {discounts
                .reduce((sum, item) => sum + (Number(item.uses) || 0), 0)
                .toLocaleString()}
            </strong>
          </span>
        </div>
        <div>
          <CalendarDays size={19} />
          <span>
            <small>Scheduled</small>
            <strong>
              {discounts.filter((item) => item.status === "Scheduled").length}
            </strong>
          </span>
        </div>
      </div>
      <div className="admin-card">
        <Toolbar
          search={search}
          setSearch={setSearch}
          placeholder="Search discount codes…"
        >
          <span className="admin-result-count">{discounts.length} offers</span>
        </Toolbar>
        <AdminTable
          rows={rows}
          columns={columns}
          searchValue={search}
          emptyTitle="No discounts yet"
        />
      </div>
      {formOpen && (
        <Modal
          title={`${editing ? "Edit" : "Create"} discount`}
          description="Set up an offer for your customers."
          onClose={() => setFormOpen(false)}
        >
          <form onSubmit={submit} className="admin-modal-form">
            <Field
              label="Discount code"
              value={form.code || ""}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value.toUpperCase() })
              }
              required
              placeholder="e.g. WELCOME10"
            />
            <Field label="Discount type">
              <select
                value={form.type || "Percentage"}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
              >
                <option>Percentage</option>
                <option>Fixed amount</option>
                <option>Free shipping</option>
              </select>
            </Field>
            {form.type !== "Free shipping" && (
              <Field
                label={
                  form.type === "Percentage"
                    ? "Percentage off"
                    : "Amount off (cents)"
                }
                type="number"
                min="1"
                value={form.value ?? ""}
                onChange={(event) =>
                  setForm({ ...form, value: event.target.value })
                }
                required
              />
            )}
            {form.type === "Percentage" && Number(form.value) > 100 && (
              <small className="admin-inline-error">
                Percentage can’t exceed 100.
              </small>
            )}
            <Field
              label="Usage limit"
              type="number"
              min="0"
              value={form.usageLimit ?? ""}
              onChange={(event) =>
                setForm({ ...form, usageLimit: event.target.value })
              }
              hint="Set 0 for unlimited uses."
            />
            <Field
              label="Start date"
              type="date"
              value={form.startsAt || ""}
              onChange={(event) =>
                setForm({ ...form, startsAt: event.target.value })
              }
              required
            />
            <Field
              label="End date"
              type="date"
              value={form.endsAt || ""}
              onChange={(event) =>
                setForm({ ...form, endsAt: event.target.value })
              }
              required
            />
            <Field label="Status">
              <select
                value={form.status || "Active"}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
              >
                <option>Active</option>
                <option>Scheduled</option>
                <option>Expired</option>
                <option>Disabled</option>
              </select>
            </Field>
            {error && (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            )}
            <div className="admin-modal-footer">
              <Button variant="subtle" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" icon={Save}>
                {editing ? "Save changes" : "Create discount"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmModal
          title="Delete discount?"
          description={`${deleting.code} will be removed permanently.`}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, notify } = useAdmin();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    if (
      !form.storeName.trim() ||
      !form.storeEmail.trim() ||
      Number(form.taxRate) < 0 ||
      Number(form.standardShipping) < 0 ||
      Number(form.freeShippingThreshold) < 0
    ) {
      setError(
        "Check the store details and enter valid, non-negative amounts.",
      );
      return;
    }
    try {
      const next = {
        ...form,
        taxRate: Number(form.taxRate),
        standardShipping: Number(form.standardShipping),
        expressShipping: Number(form.expressShipping),
        freeShippingThreshold: Number(form.freeShippingThreshold),
        processingDays: Number(form.processingDays),
      };
      updateSettings(next);
      setForm(next);
      setSaved(true);
      setError("");
      notify("Store settings saved.");
      window.setTimeout(() => setSaved(false), 2600);
    } catch (saveError) {
      setError(saveError.message);
    }
  }
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Settings"
        description="Store details, checkout, and fulfillment preferences."
        actions={
          <Button
            icon={saved ? Check : Save}
            onClick={() =>
              document.getElementById("admin-settings-form")?.requestSubmit()
            }
          >
            {saved ? "Saved" : "Save settings"}
          </Button>
        }
      />
      <form
        id="admin-settings-form"
        className="admin-settings-layout"
        onSubmit={submit}
      >
        <div className="admin-settings-main">
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Store details</h2>
                <p>These details identify your store to customers.</p>
              </div>
              <div className="admin-form-fields">
                <Field
                  label="Store name"
                  value={form.storeName}
                  onChange={(event) => set("storeName", event.target.value)}
                  required
                />
                <Field
                  label="Store contact email"
                  type="email"
                  value={form.storeEmail}
                  onChange={(event) => set("storeEmail", event.target.value)}
                  required
                />
                <Field label="Store currency">
                  <select
                    value={form.currency}
                    onChange={(event) => set("currency", event.target.value)}
                  >
                    <option>CAD</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </Field>
                <Field
                  label="Tax rate (%)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.taxRate}
                  onChange={(event) => set("taxRate", event.target.value)}
                  required
                />
              </div>
            </div>
          </section>
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Shipping & fulfillment</h2>
                <p>Set shipping rates and order handling preferences.</p>
              </div>
              <div className="admin-form-fields">
                <Field
                  label="Free shipping threshold (cents)"
                  type="number"
                  min="0"
                  value={form.freeShippingThreshold}
                  onChange={(event) =>
                    set("freeShippingThreshold", event.target.value)
                  }
                  hint="Orders above this value ship free."
                />
                <Field
                  label="Standard shipping (cents)"
                  type="number"
                  min="0"
                  value={form.standardShipping}
                  onChange={(event) =>
                    set("standardShipping", event.target.value)
                  }
                />
                <Field
                  label="Express shipping (cents)"
                  type="number"
                  min="0"
                  value={form.expressShipping}
                  onChange={(event) =>
                    set("expressShipping", event.target.value)
                  }
                />
                <Field
                  label="Processing time (business days)"
                  type="number"
                  min="0"
                  value={form.processingDays}
                  onChange={(event) =>
                    set("processingDays", event.target.value)
                  }
                />
              </div>
            </div>
          </section>
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Payments</h2>
                <p>Choose the payment options shown to customers.</p>
              </div>
              <div className="admin-payment-options">
                {["Credit card", "Apple Pay", "PayPal", "Google Pay"].map(
                  (method) => (
                    <label key={method}>
                      <input
                        type="checkbox"
                        checked={(form.acceptedPayments || []).includes(method)}
                        onChange={(event) =>
                          set(
                            "acceptedPayments",
                            event.target.checked
                              ? [...(form.acceptedPayments || []), method]
                              : form.acceptedPayments.filter(
                                  (item) => item !== method,
                                ),
                          )
                        }
                      />
                      <span>
                        <CreditCardIcon method={method} />
                      </span>
                      <strong>{method}</strong>
                      <i />
                    </label>
                  ),
                )}
              </div>
            </div>
          </section>
          {error && <p className="admin-form-error">{error}</p>}
        </div>
        <aside className="admin-settings-side">
          <section className="admin-card admin-detail-card">
            <h2>Store status</h2>
            <div className="admin-store-toggle">
              <span>
                <i className={form.maintenanceMode ? "offline" : ""} />
                <strong>
                  {form.maintenanceMode ? "Maintenance mode" : "Store is live"}
                </strong>
              </span>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={Boolean(form.maintenanceMode)}
                  onChange={(event) =>
                    set("maintenanceMode", event.target.checked)
                  }
                />
                <span />
              </label>
            </div>
            <p className="admin-settings-hint">
              When maintenance mode is on, visitors will see a notice while you
              update your store.
            </p>
          </section>
          <section className="admin-card admin-detail-card">
            <span className="admin-settings-note-icon">
              <ShieldIcon />
            </span>
            <h2>Local demo workspace</h2>
            <p className="admin-settings-hint">
              Admin data is saved in this browser using local storage. These
              settings are a preview and are not connected to a payment or
              shipping provider.
            </p>
          </section>
        </aside>
      </form>
    </>
  );
}

function CreditCardIcon({ method }) {
  if (method === "Apple Pay") return <span className="admin-pay-apple">●</span>;
  if (method === "PayPal") return <span className="admin-pay-pal">P</span>;
  if (method === "Google Pay")
    return <span className="admin-pay-google">G</span>;
  return <CreditCard size={17} />;
}
function CreditCard() {
  return <CircleDollarSign size={17} />;
}
function ShieldIcon() {
  return <span className="admin-shield-icon">✓</span>;
}

function NotFoundPanel({ title, back }) {
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
