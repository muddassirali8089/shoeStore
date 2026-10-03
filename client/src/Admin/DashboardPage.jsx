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
    .filter((order) => order.status !== "cancelled")
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
