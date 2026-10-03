import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ChevronLeft, Save } from "lucide-react";
import { makeId, useAdmin } from "./AdminContext";
import { Button, Field, Modal, PageHeader } from "./AdminUI";

export function CatalogForm({ kind, embedded = false, onCancel, onCreated }) {
  const routeParams = useParams();
  const id = embedded ? null : routeParams.id;
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
  async function submit(event) {
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
      await setters[kind](
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
          value={(form.name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
          readOnly
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
          <span>Changes are saved to the ShoeStore backend.</span>
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

export function CategoryFormPage() {
  return <CatalogFormRoute kind="categories" />;
}

export function BrandFormPage() {
  return <CatalogFormRoute kind="brands" />;
}

function CatalogFormRoute({ kind }) {
  const { loading, error } = useAdmin();
  const title = kind === "categories" ? "Categories" : "Brands";
  if (loading) return <PageHeader eyebrow={title.toUpperCase()} title={`Loading ${title.toLowerCase()}…`} />;
  if (error) return <PageHeader eyebrow={title.toUpperCase()} title={`${title} unavailable: ${error}`} />;
  return <CatalogForm kind={kind} />;
}
