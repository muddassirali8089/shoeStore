/* eslint-disable react-refresh/only-export-components */
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminProvider } from "./AdminContext";
import { AdminLayout, AdminLogin, AdminProtectedRoute } from "./AdminLayout";
import {
  BrandFormPage, BrandListPage, CategoryFormPage, CategoryListPage, CustomerDetailPage,
  CustomersPage, DashboardPage, DiscountsPage, InventoryPage, OrderDetailPage, OrdersPage,
  ProductFormPage, ProductListPage, SettingsPage,
} from "./AdminPages";

/**
 * Mount inside the application's existing BrowserRouter.
 * Admin routes are intentionally separate from the customer storefront layout.
 */
export function AdminRoutes() {
  return <AdminProvider><Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="products" element={<Navigate to="/admin/products/list" replace />} />
      <Route path="products/list" element={<ProductListPage />} />
      <Route path="products/add" element={<ProductFormPage />} />
      <Route path="products/edit/:id" element={<ProductFormPage />} />
      <Route path="categories" element={<Navigate to="/admin/categories/list" replace />} />
      <Route path="categories/list" element={<CategoryListPage />} />
      <Route path="categories/add" element={<CategoryFormPage />} />
      <Route path="categories/edit/:id" element={<CategoryFormPage />} />
      <Route path="brands" element={<Navigate to="/admin/brands/list" replace />} />
      <Route path="brands/list" element={<BrandListPage />} />
      <Route path="brands/add" element={<BrandFormPage />} />
      <Route path="brands/edit/:id" element={<BrandFormPage />} />
      <Route path="orders" element={<Navigate to="/admin/orders/list" replace />} />
      <Route path="orders/list" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetailPage />} />
      <Route path="customers" element={<Navigate to="/admin/customers/list" replace />} />
      <Route path="customers/list" element={<CustomersPage />} />
      <Route path="customers/:id" element={<CustomerDetailPage />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="discounts" element={<DiscountsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Route>
  </Routes></AdminProvider>;
}

export { AdminProvider, useAdmin, money } from "./AdminContext";
export { AdminLogin, AdminLayout, AdminProtectedRoute } from "./AdminLayout";
export default AdminRoutes;
