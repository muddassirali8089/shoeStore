import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil } from "lucide-react";
import { money, useAdmin } from "./AdminContext";
import { Button, PageHeader, StatusBadge } from "./AdminUI";
import { normalizeCondition } from "../components/product/conditionUtils";
import { productStatus, productImage, fallbackPhoto, NotFoundPanel } from "./adminPageUtils";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, error } = useAdmin();
  const product = products.find(
    (item) => String(item.id) === decodeURIComponent(id),
  );
  if (!product && loading)
    return <PageHeader eyebrow="PRODUCTS" title="Loading product…" />;
  if (!product && error)
    return <PageHeader eyebrow="PRODUCTS" title={`Products unavailable: ${error}`} />;
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
