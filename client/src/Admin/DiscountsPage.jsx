import { useState } from "react";
import { BadgePercent, CalendarDays, Pencil, Plus, Save, Trash2, Users } from "lucide-react";
import { makeId, money, useAdmin } from "./AdminContext";
import { AdminTable, Button, ConfirmModal, Field, Modal, PageHeader, StatusBadge, Toolbar } from "./AdminUI";
import { shortDate } from "./adminPageUtils";

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
