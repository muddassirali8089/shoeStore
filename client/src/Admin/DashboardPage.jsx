import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CircleDollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { money, useAdmin } from "./AdminContext";
import { Button, PageHeader, SelectField, StatusBadge } from "./AdminUI";
import { shortDate, fullName, customerInitials, productStatus, productImage, fallbackPhoto } from "./adminPageUtils";

function MetricCard({
  label,
  value,
  delta,
  direction = "up",
  icon: Icon,
  footnote,
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
      </div>
    </article>
  );
}

export function DashboardPage() {
  const { products, orders, dashboard, loading, error } = useAdmin();
  const revenue = Number(dashboard?.totalSales) || 0;
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
        eyebrow="LIVE STORE DATA"
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
          label="Revenue received"
          value={money(revenue)}
          delta="Recorded"
          footnote="delivered and paid"
          icon={CircleDollarSign}
        />
        <MetricCard
          label="Orders"
          value={orders.length.toLocaleString()}
          delta={dashboard?.pendingOrders ?? 0}
          footnote="pending orders"
          icon={ShoppingBag}
        />
        <MetricCard
          label="Products active"
          value={activeProducts}
          delta={activeProducts}
          direction="down"
          footnote="active catalog products"
          icon={Package}
        />
        <MetricCard
          label="Customers"
          value={Number(dashboard?.totalCustomers || 0).toLocaleString()}
          delta={dashboard?.totalCustomers ?? 0}
          footnote="guest customers"
          icon={Users}
        />
      </div>
      {loading && <p className="admin-inline-hint">Loading dashboard data…</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="admin-dashboard-grid">
        <section className="admin-card admin-revenue-card">
          <div className="admin-card-heading">
            <div>
              <h2>Sales over time</h2>
              <p>Gross sales from delivered orders with payment received</p>
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
              <ArrowUpRight size={14} /> Recorded sales
            </span>
          </div>
          <div className="admin-bar-chart" role="img" aria-label="Sales totals from the backend">
            {orders.slice(0, 28).map((order) => (
              <div key={order.id} className="admin-chart-bar" style={{ height: `${Math.max(4, (Number(order.total) / Math.max(revenue, Number(order.total), 1)) * 100)}%` }} title={`${order.id}: ${money(order.total)}`} />
            ))}
          </div>
          {!orders.length && <p className="admin-inline-hint">No order sales data is available yet.</p>}
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
                ["pending", "amber"],
                ["confirmed", "amber"],
                ["shipped", "blue"],
                ["delivered", "green"],
                ["cancelled", "gray"],
                ["returned", "gray"],
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
                  <StatusBadge>
                    {order.status
                      ? order.status[0].toUpperCase() + order.status.slice(1)
                      : "Pending"}
                  </StatusBadge>
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
