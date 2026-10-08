import { useState } from 'react'
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { categories } from '../../data/products'

export default function Header() {
  const { count } = useCart()
  const { menuOpen, setMenuOpen } = useUI()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const selectedCategory = new URLSearchParams(location.search).get('category')
  const isShopPage = location.pathname === '/shop'
  const submitSearch = (event) => {
    event.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
    setMenuOpen(false)
  }
  return <>
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
      <Link to="/" className="brand-logo" aria-label="MGEARS home"><span className="logo-mark">M</span><span>MGEARS<small>PRE-LOVED. WELL-LOVED.</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation"><NavLink to="/shop" className={isShopPage && !selectedCategory ? 'active' : ''} aria-current={isShopPage && !selectedCategory ? 'page' : undefined}>Shop all</NavLink>{categories.map((category) => {
        const active = (isShopPage && selectedCategory === category.slug) || location.pathname === `/category/${category.slug}`
        return <NavLink key={category.slug} to={`/shop?category=${category.slug}`} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{category.name}</NavLink>
      })}</nav>
      <div className="header-actions">
        <button className="icon-button search-toggle" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={20} /></button>
        <Link className="icon-button" to="/wishlist" aria-label="Wishlist"><Heart size={20} /></Link>
        <Link className="icon-button bag-link" to="/cart" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={20} /><span className="bag-count">{count}</span></Link>
      </div>
    </header>
    {(searchOpen || menuOpen) && <button className="overlay-scrim" aria-label="Close overlay" onClick={() => { setSearchOpen(false); setMenuOpen(false) }} />}
    <div className={`search-panel ${searchOpen ? 'search-panel-open' : ''}`}>
      <form className="search-form" onSubmit={submitSearch}><Search size={19} /><input autoFocus placeholder="Search shoes, brands, styles..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search products" /><button type="submit">Search</button><button type="button" className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></form>
    </div>
    <aside className={`mobile-menu ${menuOpen ? 'mobile-menu-open' : ''}`} aria-hidden={!menuOpen}>
      <div className="mobile-menu-top"><Link to="/" className="brand-logo"><span className="logo-mark">M</span><span>MGEARS<small>PRE-LOVED. WELL-LOVED.</small></span></Link><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button></div>
      <nav><NavLink onClick={() => setMenuOpen(false)} to="/shop" className={isShopPage && !selectedCategory ? 'active' : ''} aria-current={isShopPage && !selectedCategory ? 'page' : undefined}>Shop all<span>→</span></NavLink>{categories.map((category) => {
        const active = (isShopPage && selectedCategory === category.slug) || location.pathname === `/category/${category.slug}`
        return <NavLink onClick={() => setMenuOpen(false)} key={category.slug} to={`/shop?category=${category.slug}`} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>{category.name}<span>→</span></NavLink>
      })}</nav>
      <div className="mobile-menu-footer"><Link onClick={() => setMenuOpen(false)} to="/wishlist">Wishlist</Link><Link onClick={() => setMenuOpen(false)} to="/track-order">Track an order</Link></div>
    </aside>
  </>
}
