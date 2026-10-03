import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, Package, Plus, Save, Trash2, X } from "lucide-react";
import { makeId, useAdmin } from "./AdminContext";
import { Button, Field, PageHeader } from "./AdminUI";
import { normalizeCondition, PRODUCT_CONDITIONS } from "../components/product/conditionUtils";
import { sizes as shoeSizes } from "../data/products";
import { stripProductIdentifiers, compressProductImage } from "./adminPageUtils";
import { CatalogForm } from "./CatalogFormPages";

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
    const extension = file.name.split(".").pop()?.toLowerCase();
    const inferredType =
      extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "";
    if (!validTypes.includes(file.type) && !inferredType) {
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

export function ProductFormPage() {
  const { id } = useParams();
  return <ProductForm key={id || "new-product"} />;
}
