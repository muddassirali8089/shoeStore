/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { money } from "./AdminContext";

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="admin-page-header"><div><div className="admin-eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="admin-header-actions">{actions}</div>}</div>;
}

export function Button({ children, variant = "primary", icon: Icon, type = "button", ...props }) {
  return <button className={`admin-button admin-button-${variant}`} type={type} {...props}>{Icon && <Icon size={16} strokeWidth={2} />}{children}</button>;
}

export function StatusBadge({ children }) {
  const value = String(children || "Unknown");
  const color = value.toLowerCase().replace(/[^a-z]+/g, "-");
  return <span className={`admin-status status-${color}`}>{value}</span>;
}

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return <label className="admin-search"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><kbd>⌘ K</kbd></label>;
}

export function SelectField({ value, onChange, children, ...props }) {
  return <label className="admin-select-wrap"><select value={value} onChange={onChange} {...props}>{children}</select><ChevronDown size={15} /></label>;
}

export function AdminTable({ columns, rows, searchValue = "", pageSize = 10, emptyTitle = "No records found", emptyMessage = "Try changing your search or filters." }) {
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const query = searchValue.toLowerCase().trim();
    const found = query ? rows.filter((row) => columns.some((column) => String(column.searchValue ? column.searchValue(row) : row[column.key] ?? "").toLowerCase().includes(query))) : [...rows];
    if (!sort.key) return found;
    const column = columns.find((item) => item.key === sort.key);
    return found.sort((a, b) => {
      const av = column?.sortValue ? column.sortValue(a) : a[sort.key];
      const bv = column?.sortValue ? column.sortValue(b) : b[sort.key];
      const compare = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? compare : -compare;
    });
  }, [rows, columns, searchValue, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const changeSort = (key) => {
    setPage(1);
    setSort((current) => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  };
  return <div className="admin-table-frame"><div className="admin-table-scroll"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column.key} className={column.align === "right" ? "align-right" : ""}>{column.sortable === false ? column.label : <button className="admin-sort-button" onClick={() => changeSort(column.key)}>{column.label}{sort.key === column.key ? <span>{sort.direction === "asc" ? "↑" : "↓"}</span> : null}</button>}</th>)}</tr></thead><tbody>{visible.map((row, index) => <tr key={row.id || row.sku || index}>{columns.map((column) => <td key={column.key} className={column.align === "right" ? "align-right" : ""}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table>{visible.length === 0 && <div className="admin-empty"><div className="admin-empty-icon"><Search size={19} /></div><strong>{emptyTitle}</strong><span>{emptyMessage}</span></div>}</div><div className="admin-table-footer"><span>Showing <strong>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong></span><div><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></button><span>Page {currentPage} of {pageCount}</span><button aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></button></div></div></div>;
}

export function Modal({ title, description, children, onClose, size = "normal" }) {
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`admin-modal ${size === "wide" ? "admin-modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="admin-icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>{children}</section></div>;
}

export function ConfirmModal({ title, description, onConfirm, onCancel, confirmLabel = "Delete", danger = true }) {
  return <Modal title={title} description={description} onClose={onCancel}><div className="admin-confirm-icon"><AlertTriangle size={20} /></div><div className="admin-modal-footer"><Button variant="subtle" onClick={onCancel}>Keep it</Button><Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button></div></Modal>;
}

export function ToastViewport({ toast }) {
  if (!toast) return null;
  return <div className={`admin-toast toast-${toast.type}`} role="status"><span>{toast.type === "error" ? <AlertTriangle size={17} /> : <Check size={17} />}</span>{toast.message}</div>;
}

export function Toolbar({ search, setSearch, children, placeholder }) {
  return <div className="admin-toolbar"><SearchInput value={search} onChange={(value) => setSearch(value)} placeholder={placeholder} />{children && <div className="admin-toolbar-filters">{children}</div>}</div>;
}

export function Field({ label, hint, className = "", children, ...props }) {
  return <label className={`admin-field ${className}`}><span>{label}</span>{children || <input {...props} />}{hint && <small>{hint}</small>}</label>;
}

export function moneyCell(value) { return <strong className="admin-money">{money(value)}</strong>; }
