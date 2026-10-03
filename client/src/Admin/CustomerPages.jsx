import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Download, Eye, Users } from "lucide-react";
import { money, useAdmin } from "./AdminContext";
import { AdminTable, Button, PageHeader, StatusBadge, Toolbar, moneyCell } from "./AdminUI";
import { shortDate, fullName, customerInitials, exportCSV, NotFoundPanel } from "./adminPageUtils";

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
    if (order.status !== "cancelled") row.spent += Number(order.total) || 0;
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
