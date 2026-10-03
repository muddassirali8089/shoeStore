import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgePercent, Eye, Filter, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useAdmin } from "./AdminContext";
import { AdminTable, Button, ConfirmModal, PageHeader, SelectField, StatusBadge, Toolbar, moneyCell } from "./AdminUI";
import ConditionBadge from "../components/product/ConditionBadge";
import { normalizeCondition, PRODUCT_CONDITIONS } from "../components/product/conditionUtils";
import { productStatus, productImage, productSizes, fallbackPhoto } from "./adminPageUtils";

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

export function ProductListPage() {
  return <CatalogList kind="products" />;
}

export function CategoryListPage() {
  return <CatalogList kind="categories" />;
}

export function BrandListPage() {
  return <CatalogList kind="brands" />;
}
