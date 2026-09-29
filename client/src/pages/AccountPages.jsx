import { useState } from 'react'
import { ArrowRight, Check, ChevronRight, Circle, LogOut, MapPin, Package, PackageCheck, Search, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { orders, products } from '../data/products'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`
const steps = ['Order placed', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const getOrderList = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('mg-orders')) || []
    return [...saved, ...orders.filter((order) => !saved.some((item) => item.id === order.id))]
  } catch {
    return orders
  }
}

function AccountFrame({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { notify } = useUI()
  if (!user) return <main className="account-login-prompt"><span className="eyebrow">YOUR MGEARS ACCOUNT</span><h1>Good shoes. <em>Good company.</em></h1><p>Log in to see your orders, update your details and keep your wishlist close.</p><Link className="button button-dark" to="/login">Log in to your account <ArrowRight size={16} /></Link><span>New around here? <Link to="/register">Create an account</Link></span></main>
  return <main className="account-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Your account</span></div><div className="account-heading"><span className="eyebrow">GOOD TO HAVE YOU HERE</span><h1>Hi, {user.name.split(' ')[0]}.</h1><p>Your MGEARS corner, all in one place.</p></div><div className="account-layout"><aside className="account-sidebar"><div className="account-user"><span>{user.name.slice(0, 1).toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small></div></div><nav><NavLink end to="/account"><span><Package size={17} /> Overview</span><ChevronRight size={15} /></NavLink><NavLink to="/account/orders"><span><PackageCheck size={17} /> Orders</span><ChevronRight size={15} /></NavLink><NavLink to="/account/profile"><span><UserRound size={17} /> Profile</span><ChevronRight size={15} /></NavLink><NavLink to="/account/addresses"><span><MapPin size={17} /> Addresses</span><ChevronRight size={15} /></NavLink><NavLink to="/wishlist"><span><Circle size={17} /> Wishlist</span><ChevronRight size={15} /></NavLink><button onClick={() => { logout(); notify('You’ve been logged out.'); navigate('/') }}><span><LogOut size={17} /> Log out</span></button></nav></aside><section className="account-main">{children}</section></div></main>
}

export function AccountPage() {
  const { user } = useAuth()
  const wishlistCount = useWishlist().ids.length
  const accountOrders = getOrderList()
  return <AccountFrame>{user && <><div className="account-section-title"><div><span className="eyebrow">YOUR OVERVIEW</span><h2>At a glance.</h2></div><Link className="text-link" to="/account/orders">All orders <ArrowRight size={15} /></Link></div><div className="account-stat-grid"><div><span>YOUR ORDERS</span><b>{accountOrders.length}</b><Link to="/account/orders">View orders <ArrowRight size={14} /></Link></div><div><span>WISHLISTED PAIRS</span><b>{wishlistCount}</b><Link to="/wishlist">See your wishlist <ArrowRight size={14} /></Link></div></div><section className="recent-orders"><div className="account-section-title"><h3>Recent orders</h3><Link to="/account/orders">View all <ArrowRight size={14} /></Link></div>{accountOrders.slice(0, 2).map((order) => <OrderRow order={order} key={order.id} />)}</section><section className="account-help"><div><span className="eyebrow">WE’RE HERE TO HELP</span><h3>Need a hand with anything?</h3><p>Our friendly team is just a message away.</p></div><Link className="button button-outline" to="/contact">Contact support <ArrowRight size={15} /></Link></section></>}</AccountFrame>
}

function OrderRow({ order }) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)
  return <article className="order-row"><div><span className={`status-pill status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span><b>{order.id}</b><small>{order.date} · {count} {count === 1 ? 'pair' : 'pairs'}</small></div><strong>{money(order.total)}</strong><Link className="text-link" to={`/account/orders/${order.id}`}>View details <ArrowRight size={14} /></Link></article>
}

export function OrdersPage() {
  const accountOrders = getOrderList()
  return <AccountFrame><div className="account-section-title"><div><span className="eyebrow">YOUR MGEARS HISTORY</span><h2>Your orders.</h2></div></div>{accountOrders.length ? <div className="orders-list">{accountOrders.map((order) => <OrderRow key={order.id} order={order} />)}</div> : <div className="account-empty"><Package size={30} /><h3>No orders to show.</h3><p>When you find your first pair, it’ll show up here.</p><Link to="/shop">Browse the collection</Link></div>}</AccountFrame>
}

export function OrderDetailsPage() {
  const { orderId } = useParams()
  const order = getOrderList().find((item) => item.id === orderId)
  return <AccountFrame><div className="account-section-title"><div><span className="eyebrow">ORDER DETAILS</span><h2>{order?.id || 'Order not found'}</h2></div><Link className="text-link" to="/account/orders">← Back to orders</Link></div>{order ? <><div className="order-detail-overview"><div><span>ORDER DATE</span><b>{order.date}</b></div><div><span>STATUS</span><b className={`status-pill status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</b></div><div><span>ORDER TOTAL</span><b>{money(order.total)}</b></div></div><h3 className="order-items-heading">What’s in this order</h3>{order.items.map((item) => { const product = products.find((entry) => entry.id === item.productId); return product && <div className="order-product-row" key={item.productId}><img src={product.thumbnail} alt={product.name} /><span><b>{product.name}</b><small>{product.brand} · Qty {item.quantity}</small></span><strong>{money(product.price * item.quantity)}</strong></div> })}<Link className="button button-outline" to="/track-order">Track this order <ArrowRight size={15} /></Link></> : <div className="account-empty"><p>This order could not be found.</p><Link to="/account/orders">Return to orders</Link></div>}</AccountFrame>
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { notify } = useUI()
  const save = (event) => {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget))
    updateProfile({ name: form.name, email: form.email, phone: form.phone })
    notify('Your profile has been updated.')
  }
  return <AccountFrame><div className="account-section-title"><div><span className="eyebrow">YOUR DETAILS</span><h2>Your profile.</h2></div></div><form className="account-edit-form" onSubmit={save}><label>Full name<input name="name" defaultValue={user?.name || ''} autoComplete="name" required /></label><label>Email address<input name="email" type="email" defaultValue={user?.email || ''} autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" defaultValue={user?.phone || ''} autoComplete="tel" /></label><button className="button button-dark">Save changes <Check size={15} /></button></form></AccountFrame>
}

export function AddressesPage() {
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mg-addresses')) || [] } catch { return [] }
  })
  const { notify } = useUI()
  const save = (next) => { setAddresses(next); localStorage.setItem('mg-addresses', JSON.stringify(next)) }
  const addAddress = (event) => {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget))
    save([...addresses, { ...form, id: Date.now() }])
    event.currentTarget.reset()
    notify('Your address has been saved.')
  }
  return <AccountFrame><div className="account-section-title"><div><span className="eyebrow">DELIVERY DETAILS</span><h2>Your addresses.</h2></div></div>{addresses.map((address) => <div className="saved-address" key={address.id}><div><b>{address.name}</b><p>{address.address}, {address.city}, {address.province} {address.postalCode}</p><small>{address.phone}</small></div><button className="clear-filters" onClick={() => { save(addresses.filter((item) => item.id !== address.id)); notify('Address removed.') }}>Remove</button></div>)}<form className="address-form" onSubmit={addAddress}><h3>{addresses.length ? 'Add another address' : 'Add a delivery address'}</h3><div className="form-grid"><label>Name<input name="name" autoComplete="name" required /></label><label>Phone<input name="phone" type="tel" required /></label><label className="wide">Address<input name="address" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>Province<input name="province" required /></label><label>Postal code<input name="postalCode" autoComplete="postal-code" /></label></div><button className="button button-dark">Save address <Check size={15} /></button></form></AccountFrame>
}

export function WishlistPage() {
  const { ids } = useWishlist()
  const saved = products.filter((product) => ids.includes(product.id))
  return <main className="subpage wishlist-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Your wishlist</span></div><div className="page-title-row"><div><span className="eyebrow">PAIRS YOU’VE GOT YOUR EYE ON</span><h1>Your wishlist<span className="title-count"> ({saved.length})</span></h1></div><Link className="text-link" to="/shop">Find more good pairs <ArrowRight size={15} /></Link></div><ProductGrid products={saved} emptyText="Your wishlist is a little quiet." /></main>
}

export function TrackOrderPage() {
  const [lookup, setLookup] = useState(null)
  const [error, setError] = useState('')
  const { notify } = useUI()
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const id = form.get('order').trim().toUpperCase()
    const match = getOrderList().find((item) => item.id.toUpperCase() === id)
    if (match) { setLookup(match); setError(''); notify('We found your order.') } else { setLookup(null); setError('We couldn’t find an order with those details. Please check and try again.') }
  }
  const activeStep = lookup?.status === 'Delivered' ? 5 : lookup?.status === 'Out for Delivery' ? 4 : lookup?.status === 'Shipped' ? 3 : lookup?.status === 'Confirmed' ? 1 : 0
  return <main className="subpage track-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Track your order</span></div><div className="track-hero"><span className="eyebrow">FROM OUR DOOR TO YOURS</span><h1>Good things are <em>on the way.</em></h1><p>Enter your order number to see how your pair is getting along.</p><form className="track-form" onSubmit={submit}><label htmlFor="track-id">Order number</label><div><input name="order" id="track-id" placeholder="e.g. MG-24091852" required /><button className="button button-dark">Track order <Search size={15} /></button></div><label htmlFor="track-contact">Email or phone number</label><input id="track-contact" name="contact" type="text" placeholder="Used at checkout" required /></form>{error && <p className="validation-message">{error}</p>}</div>{lookup && <section className="tracking-result"><div className="tracking-result-head"><div><span className="eyebrow">ORDER {lookup.id}</span><h2>Your pair is on its way.</h2><p>Last updated today · Estimated delivery 3–5 business days</p></div><span className={`status-pill status-${lookup.status.toLowerCase()}`}>{lookup.status}</span></div><div className="timeline">{steps.map((step, index) => <div className={`timeline-step ${index <= activeStep ? 'complete' : ''}`} key={step}><span className="timeline-dot">{index < activeStep ? <Check size={13} /> : index === activeStep ? <span /> : null}</span><div><b>{step}</b>{index === 0 && <small>{lookup.date}</small>}{index === activeStep && <small>Looking good so far</small>}</div></div>)}</div></section>}</main>
}
