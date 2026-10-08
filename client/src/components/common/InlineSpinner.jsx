import "./inline-spinner.css";

export default function InlineSpinner({ label = "Loading" }) {
  return <span className="inline-spinner" role="status" aria-label={label} />;
}
