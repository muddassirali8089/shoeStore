import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ProductProvider } from './context/ProductContext'
import { UIProvider } from './context/UIContext'
import { WishlistProvider } from './context/WishlistContext'
import { OrderProvider } from './context/OrderContext'
import { useProducts } from './context/ProductContext'
import AnnouncementBar from './components/layout/AnnouncementBar'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import CartDrawer from './components/cart/CartDrawer'
import ToastViewport from './components/common/ToastViewport'
import Home from './pages/Home'
import { CatalogPage } from './pages/Catalog'
import ProductDetails from './pages/ProductDetails'
import { CartPage, CheckoutPage, OrderSuccess } from './pages/Commerce'
import { TrackOrderPage, WishlistPage } from './pages/GuestPages'
import { AboutPage, ContactPage, NotFoundPage, ReturnPolicyPage, ShippingPolicyPage, SizeGuidePage } from './pages/SupportPages'
import AdminRoutes from './Admin'

function MainLayout() {
  const { error } = useProducts()
  return <><AnnouncementBar /><Header />{error && <p className="validation-message" role="alert">Store catalog unavailable: {error}</p>}<Outlet /><Footer /><CartDrawer /><ToastViewport /></>
}

function StoreRoutes() {
  return <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<CatalogPage />} />
      <Route path="/search" element={<CatalogPage searchMode />} />
      <Route path="/category/:category" element={<CatalogPage />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/track-order" element={<TrackOrderPage />} />
      <Route path="/return-policy" element={<ReturnPolicyPage />} />
      <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
      <Route path="/size-guide" element={<SizeGuidePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
}

export default function App() {
  return <UIProvider><ProductProvider><CartProvider><WishlistProvider><OrderProvider><BrowserRouter><Routes>
    <Route path="/admin/*" element={<AdminRoutes />} />
    <Route path="/login" element={<Navigate to="/admin/login" replace />} />
    <Route path="/*" element={<StoreRoutes />} />
  </Routes></BrowserRouter></OrderProvider></WishlistProvider></CartProvider></ProductProvider></UIProvider>
}
