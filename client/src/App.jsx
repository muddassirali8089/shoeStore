import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ProductProvider } from './context/ProductContext'
import { UIProvider } from './context/UIContext'
import { WishlistProvider } from './context/WishlistContext'
import AnnouncementBar from './components/layout/AnnouncementBar'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import CartDrawer from './components/cart/CartDrawer'
import ToastViewport from './components/common/ToastViewport'
import Home from './pages/Home'
import { CatalogPage } from './pages/Catalog'
import ProductDetails from './pages/ProductDetails'
import { CartPage, CheckoutPage, OrderSuccess } from './pages/Commerce'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages'
import { AccountPage, AddressesPage, OrderDetailsPage, OrdersPage, ProfilePage, TrackOrderPage, WishlistPage } from './pages/AccountPages'
import { AboutPage, ContactPage, NotFoundPage, ReturnPolicyPage, ShippingPolicyPage, SizeGuidePage } from './pages/SupportPages'

function MainLayout() {
  return <><AnnouncementBar /><Header /><Outlet /><Footer /><CartDrawer /><ToastViewport /></>
}

function Providers() {
  return <UIProvider><AuthProvider><ProductProvider><CartProvider><WishlistProvider><BrowserRouter><Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<CatalogPage />} />
      <Route path="/search" element={<CatalogPage searchMode />} />
      <Route path="/category/:category" element={<CatalogPage />} />
      <Route path="/product/:slug" element={<ProductDetails />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/account/orders" element={<OrdersPage />} />
      <Route path="/account/orders/:orderId" element={<OrderDetailsPage />} />
      <Route path="/account/profile" element={<ProfilePage />} />
      <Route path="/account/addresses" element={<AddressesPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/track-order" element={<TrackOrderPage />} />
      <Route path="/return-policy" element={<ReturnPolicyPage />} />
      <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
      <Route path="/size-guide" element={<SizeGuidePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></BrowserRouter></WishlistProvider></CartProvider></ProductProvider></AuthProvider></UIProvider>
}

export default function App() { return <Providers /> }
