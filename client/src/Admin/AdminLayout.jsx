import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, Boxes, ChevronDown, CircleHelp, ClipboardList,
  LayoutDashboard, LogOut, Package, Percent, Settings, ShieldCheck, ShoppingBag, Tags, Users,
} from "lucide-react";
import { useAdmin } from "./AdminContext";
import { useAdminAuth } from "./context/AdminAuthContext";
import { Field, ToastViewport } from "./AdminUI";
import "./admin.css";

const navigation = [
  { label: "Overview", links: [{ to: "/admin/dashboard", title: "Dashboard", icon: LayoutDashboard }] },
  { label: "Commerce", links: [
    { to: "/admin/products/list", title: "Products", icon: Package },
    { to: "/admin/categories/list", title: "Categories", icon: Boxes },
    { to: "/admin/brands/list", title: "Brands", icon: Tags },
    { to: "/admin/orders/list", title: "Orders", icon: ShoppingBag, badge: "orders" },
    { to: "/admin/customers/list", title: "Customers", icon: Users },
  ] },
  { label: "Operations", links: [
    { to: "/admin/inventory", title: "Inventory", icon: ClipboardList },
    { to: "/admin/discounts", title: "Discounts", icon: Percent },
  ] },
  { label: "Workspace", links: [{ to: "/admin/settings", title: "Settings", icon: Settings }] },
];

export function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated } = useAdminAuth();
  const location = useLocation();
  return isAdminAuthenticated ? children : <Navigate to="/admin/login" replace state={{ from: location }} />;
}

export function AdminLogin() {
  const { notify, toast } = useAdmin();
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  useEffect(() => {
    if (location.state?.notice) {
      notify(location.state.notice);
      navigate(location.pathname, { replace: true, state: location.state.from ? { from: location.state.from } : null });
    }
  }, [location.pathname, location.state, navigate, notify]);
  function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password) { setError("Enter your email and password to continue."); return; }
    const result = loginAdmin(email, password);
    if (result === null) { setError("Your browser could not save the admin session. Check your storage settings and try again."); return; }
    if (!result) { setError("That email and password combination isn’t recognized."); return; }
    notify("Welcome back. You’re signed in to the admin workspace.");
    navigate(location.state?.from?.pathname || "/admin/dashboard", { replace: true });
  }
  return <main className="admin-login-shell"><section className="admin-login-art"><div className="admin-login-brand"><span className="admin-logo-mark"><ShoppingBag size={18} /></span>morrow<span>goods</span></div><div className="admin-login-art-copy"><div className="admin-eyebrow">THE MORROW WORKSPACE</div><h1>Good things<br />start behind<br />the scenes.</h1><p>One calm, clear place to run your store.</p></div><div className="admin-login-art-footer"><span>MG / ADMINISTRATION</span><span>01 — 09</span></div></section><section className="admin-login-panel"><form onSubmit={submit} className="admin-login-form"><div className="admin-eyebrow">WELCOME BACK</div><h2>Sign in to your workspace</h2><p className="admin-login-subtitle">Enter your admin credentials to continue.</p>{error && <div className="admin-form-error" role="alert">{error}</div>}<Field label="Email address" type="email" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} required /><Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} required /><Link className="admin-login-forgot" to="/admin/forgot-password">Forgot Password?</Link><button className="admin-button admin-button-primary admin-login-submit" type="submit">Sign in <span>→</span></button><div className="admin-login-credentials"><ShieldCheck size={16} /><span><strong>Initial demo access</strong> · admin@example.com / admin123</span></div></form><footer>© 2026 Morrow Goods <span>·</span> Private admin workspace</footer><ToastViewport toast={toast} /></section></main>;
}

export function AdminLayout() {
  const { orders, notify } = useAdmin();
  const { logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const pending = orders.filter((order) => ["pending", "confirmed"].includes(order.status)).length;
  function signOut() {
    if (!logoutAdmin()) {
      notify("Your browser could not clear the admin session. Check your storage settings and try again.", "error");
      return;
    }
    notify("You have been signed out.");
    navigate("/admin/login");
  }
  const activeTitle = navigation.flatMap((group) => group.links).find((item) => location.pathname.startsWith(item.to))?.title || "Dashboard";
  return <div className="admin-shell"><aside className="admin-sidebar"><NavLink to="/admin/dashboard" className="admin-brand"><span className="admin-logo-mark"><ShoppingBag size={18} /></span><span className="admin-brand-copy">morrow<span>goods</span></span><span className="admin-brand-divider" /><span className="admin-brand-admin">ADMIN</span></NavLink><div className="admin-store-switch"><span className="admin-store-avatar">M</span><span><strong>Morrow Goods</strong><small>Online store</small></span><ChevronDown size={14} /></div><nav className="admin-nav">{navigation.map((group) => <div className="admin-nav-group" key={group.label}><div className="admin-nav-label">{group.label}</div>{group.links.map(({ to, title, icon: Icon, badge }) => <NavLink key={to} to={to} className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}><Icon size={17} strokeWidth={1.8} /><span>{title}</span>{badge === "orders" && pending > 0 && <small>{pending}</small>}</NavLink>)}</div>)}</nav><div className="admin-sidebar-bottom"><NavLink className="admin-help-link" to="/admin/settings"><CircleHelp size={16} />Help & support</NavLink><div className="admin-profile-wrap"><button className="admin-profile" onClick={() => setProfileOpen((value) => !value)}><span className="admin-profile-avatar">AD</span><span><strong>Store Admin</strong><small>Administrator</small></span><ChevronDown size={15} /></button>{profileOpen && <div className="admin-profile-menu"><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>}</div></div></aside><main className="admin-main"><header className="admin-topbar"><div className="admin-breadcrumb"><span>Workspace</span><span>/</span><strong>{activeTitle}</strong></div><div className="admin-topbar-right"><span className="admin-store-status"><i /> Store is live</span><span className="admin-topbar-divider" /><button className="admin-icon-button" aria-label="Analytics"><BarChart3 size={18} /></button><button className="admin-topbar-avatar" onClick={signOut} title="Sign out">AD</button></div></header><div className="admin-content"><Outlet /></div><footer className="admin-main-footer">MORROW GOODS <span>·</span> ADMINISTRATION <span className="admin-footer-spacer" /> A little better, every day.</footer></main><ToastViewport toast={useAdmin().toast} /></div>;
}
