import { useState } from "react";
import { ArrowDownRight, Package, RefreshCw, Save, X } from "lucide-react";
import { useAdmin } from "./AdminContext";
import { AdminTable, Button, Field, Modal, PageHeader, SelectField, StatusBadge, Toolbar } from "./AdminUI";
import { productImage, fallbackPhoto } from "./adminPageUtils";

export function InventoryPage() {
  const { products, inventory, updateProducts, refreshInventory, notify, loading } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All inventory");
  const [editing, setEditing] = useState(null);
  const [stock, setStock] = useState("");
  const [editingSize, setEditingSize] = useState("");
  const low = inventory.length
    ? inventory.filter((row) => row.status === "LOW STOCK").length
    : products.filter((product) => Number(product.stock) <= 5).length;
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
            setEditingSize(String(p.sizes?.[0]?.size || ""));
            setStock(String(p.sizes?.[0]?.quantity ?? 0));
          }}
        >
          Adjust stock
        </button>
      ),
    },
  ];
  async function saveStock(event) {
    event.preventDefault();
    const quantity = Number(stock);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    try {
      const updatedSizes = (editing.sizes || []).map((entry) => (
        Number(entry.size) === Number(editingSize) ? { ...entry, quantity } : entry
      ))
      await updateProducts(
        products.map((product) => product.id === editing.id
          ? { ...product, sizes: updatedSizes }
          : product),
      );
      await refreshInventory()
      notify(`${editing.name}, size ${editingSize} stock updated to ${quantity}.`);
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
            onClick={async () => {
              try { await refreshInventory(); notify("Inventory is up to date."); }
              catch (error) { notify(error.message, "error"); }
            }}
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
        {loading && <p className="admin-inline-hint">Loading store inventory…</p>}
        <AdminTable rows={rows} columns={columns} searchValue={search} />
      </div>
      {editing && (
        <Modal
          title="Adjust inventory"
          description={editing.name}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={saveStock}>
            <Field label="Shoe size">
              <select value={editingSize} onChange={(event) => {
                const size = event.target.value
                setEditingSize(size)
                setStock(String(editing.sizes?.find((entry) => Number(entry.size) === Number(size))?.quantity ?? 0))
              }}>
                {(editing.sizes || []).map((entry) => <option key={entry.size} value={entry.size}>{entry.size}</option>)}
              </select>
            </Field>
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
