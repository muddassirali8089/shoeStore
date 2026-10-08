import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, CircleDollarSign, Download, Eye, Trash2, Truck } from "lucide-react";
import { money, orderSubtotal, useAdmin } from "./AdminContext";
import { AdminTable, Button, ConfirmModal, Modal, PageHeader, SelectField, StatusBadge, Toolbar, moneyCell } from "./AdminUI";
import { shortDate, dateTime, fullName, customerInitials, productImage, fallbackPhoto, exportCSV, NotFoundPanel } from "./adminPageUtils";

const deliveryStages = ["pending", "confirmed", "shipped", "delivered"];
const statusTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

function statusLabel(status) {
  return status ? status[0].toUpperCase() + status.slice(1) : "Pending";
}

function OrderColumns({ onStatus, onDelete }) {
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
          <StatusBadge>{statusLabel(order.status)}</StatusBadge>
        </button>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (order) => (
        <StatusBadge>{["cancelled", "returned"].includes(order.status) ? "Not applicable" : statusLabel(order.paymentStatus || "pending")}</StatusBadge>
      ),
    },
    {
      key: "action",
      label: "",
      sortable: false,
      align: "right",
      render: (order) => (
        <div className="admin-row-actions">
          <Link
            className="admin-icon-button"
            aria-label={`View ${order.id}`}
            to={`/admin/orders/${encodeURIComponent(order.id)}`}
          >
            <Eye size={16} />
          </Link>
          <button
            className="admin-icon-button danger-hover"
            aria-label={`Delete ${order.id}`}
            title={`Delete ${order.id}`}
            onClick={() => onDelete(order)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];
}

export function OrdersPage() {
  const { orders, updateOrders, deleteOrder, notify } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [editing, setEditing] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const rows = orders.filter(
    (order) => filter === "All statuses" || order.status === filter,
  );
  async function changeStatus(order, status) {
    if (!statusTransitions[order.status]?.includes(status)) return;
    if (["cancelled", "returned"].includes(status)) {
      setStatusConfirm({ order, status });
      setEditing(null);
      return;
    }
    try {
      await updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      );
      notify(`${order.id} is now ${statusLabel(status).toLowerCase()}.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setEditing(null);
  }
  async function confirmStatusChange() {
    const { order, status } = statusConfirm;
    try {
      await updateOrders(
        orders.map((item) =>
          item.id === order.id
            ? { ...item, status }
            : item,
        ),
      );
      notify(`${order.id} was ${status}.`);
    } catch (error) {
      notify(error.message, "error");
    }
    setStatusConfirm(null);
  }
  async function confirmDelete() {
    try {
      await deleteOrder(deleteTarget._id);
      notify(`${deleteTarget.id} was deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      notify(error.message, "error");
      throw error;
    }
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
              ...deliveryStages,
              "cancelled",
              "returned",
            ].map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </SelectField>
          <span className="admin-result-count">{rows.length} orders</span>
        </Toolbar>
        <AdminTable
          rows={rows}
          columns={OrderColumns({ onStatus: setEditing, onDelete: setDeleteTarget })}
          searchValue={search}
        />
      </div>
      {editing && (
        <Modal
          title={`Update ${editing.id}`}
          description={`Current status: ${statusLabel(editing.status)}. Only valid next steps are available.`}
          onClose={() => setEditing(null)}
        >
          <div className="admin-status-options">
            {(statusTransitions[editing.status] || []).map((status) => (
              <button
                key={status}
                className="admin-status-option"
                onClick={() => changeStatus(editing, status)}
              >
                <StatusBadge>{statusLabel(status)}</StatusBadge>
                {["cancelled", "returned"].includes(status) && <Check size={16} />}
              </button>
            ))}
            {!statusTransitions[editing.status]?.length && (
              <p className="admin-inline-hint">This order has no further delivery status changes.</p>
            )}
          </div>
        </Modal>
      )}
      {statusConfirm && (
        <ConfirmModal
          title={`${statusLabel(statusConfirm.status)} this order?`}
          description={`${statusConfirm.order.id} will be marked ${statusConfirm.status}. This action can’t be undone.`}
          confirmLabel={`Mark ${statusConfirm.status}`}
          onCancel={() => setStatusConfirm(null)}
          onConfirm={confirmStatusChange}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Delete this order?"
          description={`${deleteTarget.id} and its order details will be permanently deleted. Any reserved stock will be restored.`}
          confirmLabel="Delete order"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeIdentifier = decodeURIComponent(id || "");
  const { orders, products, updateOrders, deleteOrder, fetchOrder, notify, loading } = useAdmin();
  const listOrder = orders.find(
    (item) => String(item.id) === routeIdentifier,
  );
  const [detailOrder, setOrder] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [statusOverride, setStatusOverride] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      const identifier = listOrder?._id || routeIdentifier;
      if (!identifier) return;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const loaded = await fetchOrder(identifier);
        if (active) setOrder(loaded);
      } catch (error) {
        if (active) setDetailError({ id: routeIdentifier, message: error.message });
      } finally {
        if (active) setDetailLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [fetchOrder, listOrder?._id, routeIdentifier]);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const detailMatchesRoute = detailOrder && (
    String(detailOrder.id) === routeIdentifier ||
    String(detailOrder._id) === routeIdentifier ||
    (listOrder?._id && String(detailOrder._id) === String(listOrder._id))
  );
  const baseOrder = detailMatchesRoute ? detailOrder : listOrder;
  const order = statusOverride?.id === routeIdentifier
    ? { ...baseOrder, status: statusOverride.status, orderStatus: statusOverride.status }
    : baseOrder;
  if (!order && (loading || detailLoading))
    return <PageHeader eyebrow="COMMERCE" title="Loading order…" />;
  if (!order)
    return <NotFoundPanel title={detailError?.id === routeIdentifier ? detailError.message : "Order not found"} back="/admin/orders/list" />;
  if (detailError?.id === routeIdentifier)
    return <NotFoundPanel title={detailError.message} back="/admin/orders/list" />;
  const subtotal = orderSubtotal(order);
  const discount = Number(order.discount) || 0;
  const shipping =
    Number(order.shipping) ||
    Math.max(0, Number(order.total) - subtotal + discount);
  async function updateStatus(status) {
    if (!statusTransitions[order.status]?.includes(status)) return false;
    const previousOrder = order;
    const updatedOrder = { ...order, status, orderStatus: status };
    setStatusOverride({ id: routeIdentifier, status });
    setOrder(updatedOrder);
    setStatusSaving(true);
    try {
      await updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      );
      notify(`${order.id} is now ${statusLabel(status).toLowerCase()}.`);
      return true;
    } catch (error) {
      setOrder(previousOrder);
      setStatusOverride(null);
      notify(error.message, "error");
      return false;
    } finally {
      setStatusSaving(false);
    }
  }
  async function updatePaymentStatus(status) {
    if (terminalStatus || paymentSaving) return;
    const previousOrder = order;
    setOrder({ ...order, paymentStatus: status });
    setPaymentSaving(true);
    try {
      await updateOrders(
        orders.map((item) =>
          item.id === order.id ? { ...item, paymentStatus: status } : item,
        ),
      );
      notify(`${order.id} payment marked ${status}.`);
    } catch (error) {
      setOrder(previousOrder);
      notify(error.message, "error");
    } finally {
      setPaymentSaving(false);
    }
  }
  async function confirmDeleteOrder() {
    try {
      await deleteOrder(order._id);
      notify(`${order.id} was deleted.`);
      navigate("/admin/orders/list");
    } catch (error) {
      notify(error.message, "error");
      throw error;
    }
  }
  const nextDeliveryStatus = {
    pending: "confirmed",
    confirmed: "shipped",
    shipped: "delivered",
  }[order.status];
  const deliveryStatusIndex = deliveryStages.indexOf(order.status);
  const terminalStatus = ["cancelled", "returned"].includes(order.status);
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
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteConfirm(true)}>
              Delete order
            </Button>
            {nextDeliveryStatus && (
              <Button icon={Truck} loading={statusSaving} disabled={detailLoading} onClick={() => updateStatus(nextDeliveryStatus)}>
                Mark as {statusLabel(nextDeliveryStatus).toLowerCase()}
              </Button>
            )}
            {["cancelled", "returned"].includes(order.status) && (
              <StatusBadge>{statusLabel(order.status)}</StatusBadge>
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
              <StatusBadge>{statusLabel(order.status)}</StatusBadge>
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
              {deliveryStages.map((stage, index) => {
                const complete =
                  index < deliveryStatusIndex ||
                  order.status === "delivered" ||
                  order.status === "returned";
                const current = stage === order.status;
                return (
                  <div className={`admin-timeline-entry${current ? " current" : ""}`} key={stage} aria-current={current ? "step" : undefined}>
                    <span className={`timeline-dot${complete ? " done" : ""}${current ? " current" : ""}`}>
                      {complete && <Check size={11} />}
                    </span>
                    <span>
                      <strong>{statusLabel(stage)}</strong>
                      <small>
                        {current
                          ? stage === "pending"
                            ? `Order placed ${dateTime(order.date)}`
                            : "Current delivery stage"
                          : complete
                            ? "Completed"
                            : "Upcoming"}
                      </small>
                    </span>
                  </div>
                );
              })}
              {terminalStatus && (
                <div className="admin-timeline-entry current" aria-current="step">
                  <span className="timeline-dot done current"><Check size={11} /></span>
                  <span>
                    <strong>{statusLabel(order.status)}</strong>
                    <small>Order closed</small>
                  </span>
                </div>
              )}
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
                <strong>Cash on delivery</strong>
                <small>
                  {terminalStatus
                    ? "Payment is not applicable to a cancelled or returned order."
                    : order.paymentStatus === "received"
                      ? `Received · ${money(order.total)}`
                      : `Due on delivery · ${money(order.total)}`}
                </small>
              </span>
            </div>{" "}
            <div className="admin-info-list">
              <div>
                <span>Payment status</span>
                <StatusBadge>
                  {terminalStatus ? "Not applicable" : statusLabel(order.paymentStatus || "pending")}
                </StatusBadge>
              </div>
              <div>
                <span>Order total</span>
                <strong>{money(order.total)}</strong>
              </div>
            </div>
            {!terminalStatus && (
              <Button
                variant="subtle"
                onClick={() =>
                  updatePaymentStatus(order.paymentStatus === "received" ? "pending" : "received")
                }
                loading={paymentSaving}
              >
                Mark payment {order.paymentStatus === "received" ? "pending" : "received"}
              </Button>
            )}
          </section>
          {statusTransitions[order.status]?.includes("cancelled") && (
            <button
              className="admin-cancel-order-link"
              onClick={() => setStatusConfirm({ order, status: "cancelled" })}
            >
              Cancel order
            </button>
          )}
          {statusTransitions[order.status]?.includes("returned") && (
            <button
              className="admin-cancel-order-link"
              onClick={() => setStatusConfirm({ order, status: "returned" })}
            >
              Mark returned
            </button>
          )}
        </aside>
      </div>
      {statusConfirm && (
        <ConfirmModal
          title={`${statusLabel(statusConfirm.status)} this order?`}
          description={`${order.id} will be marked ${statusConfirm.status}. This action can’t be undone.`}
          confirmLabel={`Mark ${statusConfirm.status}`}
          onCancel={() => setStatusConfirm(null)}
          onConfirm={async () => {
            if (await updateStatus(statusConfirm.status)) setStatusConfirm(null);
          }}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete this order?"
          description={`${order.id} and its order details will be permanently deleted. Any reserved stock will be restored.`}
          confirmLabel="Delete order"
          onCancel={() => setDeleteConfirm(false)}
          onConfirm={confirmDeleteOrder}
        />
      )}
    </>
  );
}
