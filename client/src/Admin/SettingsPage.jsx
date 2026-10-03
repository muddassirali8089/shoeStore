import { useState } from "react";
import { Check, CircleDollarSign, Save } from "lucide-react";
import { useAdmin } from "./AdminContext";
import { Button, Field, PageHeader } from "./AdminUI";

export function SettingsPage() {
  const { settings, updateSettings, notify } = useAdmin();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    if (
      !form.storeName.trim() ||
      !form.storeEmail.trim() ||
      Number(form.taxRate) < 0 ||
      Number(form.standardShipping) < 0 ||
      Number(form.freeShippingThreshold) < 0
    ) {
      setError(
        "Check the store details and enter valid, non-negative amounts.",
      );
      return;
    }
    try {
      const next = {
        ...form,
        taxRate: Number(form.taxRate),
        standardShipping: Number(form.standardShipping),
        expressShipping: Number(form.expressShipping),
        freeShippingThreshold: Number(form.freeShippingThreshold),
        processingDays: Number(form.processingDays),
      };
      updateSettings(next);
      setForm(next);
      setSaved(true);
      setError("");
      notify("Store settings saved.");
      window.setTimeout(() => setSaved(false), 2600);
    } catch (saveError) {
      setError(saveError.message);
    }
  }
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE"
        title="Settings"
        description="Store details, checkout, and fulfillment preferences."
        actions={
          <Button
            icon={saved ? Check : Save}
            onClick={() =>
              document.getElementById("admin-settings-form")?.requestSubmit()
            }
          >
            {saved ? "Saved" : "Save settings"}
          </Button>
        }
      />
      <form
        id="admin-settings-form"
        className="admin-settings-layout"
        onSubmit={submit}
      >
        <div className="admin-settings-main">
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Store details</h2>
                <p>These details identify your store to customers.</p>
              </div>
              <div className="admin-form-fields">
                <Field
                  label="Store name"
                  value={form.storeName}
                  onChange={(event) => set("storeName", event.target.value)}
                  required
                />
                <Field
                  label="Store contact email"
                  type="email"
                  value={form.storeEmail}
                  onChange={(event) => set("storeEmail", event.target.value)}
                  required
                />
                <Field label="Store currency">
                  <select
                    value={form.currency}
                    onChange={(event) => set("currency", event.target.value)}
                  >
                    <option>CAD</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </Field>
                <Field
                  label="Tax rate (%)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.taxRate}
                  onChange={(event) => set("taxRate", event.target.value)}
                  required
                />
              </div>
            </div>
          </section>
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Shipping & fulfillment</h2>
                <p>Set shipping rates and order handling preferences.</p>
              </div>
              <div className="admin-form-fields">
                <Field
                  label="Free shipping threshold (cents)"
                  type="number"
                  min="0"
                  value={form.freeShippingThreshold}
                  onChange={(event) =>
                    set("freeShippingThreshold", event.target.value)
                  }
                  hint="Orders above this value ship free."
                />
                <Field
                  label="Standard shipping (cents)"
                  type="number"
                  min="0"
                  value={form.standardShipping}
                  onChange={(event) =>
                    set("standardShipping", event.target.value)
                  }
                />
                <Field
                  label="Express shipping (cents)"
                  type="number"
                  min="0"
                  value={form.expressShipping}
                  onChange={(event) =>
                    set("expressShipping", event.target.value)
                  }
                />
                <Field
                  label="Processing time (business days)"
                  type="number"
                  min="0"
                  value={form.processingDays}
                  onChange={(event) =>
                    set("processingDays", event.target.value)
                  }
                />
              </div>
            </div>
          </section>
          <section className="admin-form-card">
            <div className="admin-form-section">
              <div className="admin-form-section-title">
                <h2>Payments</h2>
                <p>Choose the payment options shown to customers.</p>
              </div>
              <div className="admin-payment-options">
                {["Credit card", "Apple Pay", "PayPal", "Google Pay"].map(
                  (method) => (
                    <label key={method}>
                      <input
                        type="checkbox"
                        checked={(form.acceptedPayments || []).includes(method)}
                        onChange={(event) =>
                          set(
                            "acceptedPayments",
                            event.target.checked
                              ? [...(form.acceptedPayments || []), method]
                              : form.acceptedPayments.filter(
                                  (item) => item !== method,
                                ),
                          )
                        }
                      />
                      <span>
                        <CreditCardIcon method={method} />
                      </span>
                      <strong>{method}</strong>
                      <i />
                    </label>
                  ),
                )}
              </div>
            </div>
          </section>
          {error && <p className="admin-form-error">{error}</p>}
        </div>
        <aside className="admin-settings-side">
          <section className="admin-card admin-detail-card">
            <h2>Store status</h2>
            <div className="admin-store-toggle">
              <span>
                <i className={form.maintenanceMode ? "offline" : ""} />
                <strong>
                  {form.maintenanceMode ? "Maintenance mode" : "Store is live"}
                </strong>
              </span>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={Boolean(form.maintenanceMode)}
                  onChange={(event) =>
                    set("maintenanceMode", event.target.checked)
                  }
                />
                <span />
              </label>
            </div>
            <p className="admin-settings-hint">
              When maintenance mode is on, visitors will see a notice while you
              update your store.
            </p>
          </section>
          <section className="admin-card admin-detail-card">
            <span className="admin-settings-note-icon">
              <ShieldIcon />
            </span>
            <h2>Local demo workspace</h2>
            <p className="admin-settings-hint">
              Admin data is saved in this browser using local storage. These
              settings are a preview and are not connected to a payment or
              shipping provider.
            </p>
          </section>
        </aside>
      </form>
    </>
  );
}

function CreditCardIcon({ method }) {
  if (method === "Apple Pay") return <span className="admin-pay-apple">●</span>;
  if (method === "PayPal") return <span className="admin-pay-pal">P</span>;
  if (method === "Google Pay")
    return <span className="admin-pay-google">G</span>;
  return <CreditCard size={17} />;
}

function CreditCard() {
  return <CircleDollarSign size={17} />;
}

function ShieldIcon() {
  return <span className="admin-shield-icon">✓</span>;
}
