import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { products } from '../data/products'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`

function CartItem({ item, product, cart }) {
  const { notify } = useUI()
  const { addToWishlist } = useWishlist()
  return <article className="cart-item"><Link to={`/product/${product.slug}`}><img src={product.thumbnail} alt={product.name} /></Link><div className="cart-item-info"><span className="eyebrow">{product.brand}</span><Link to={`/product/${product.slug}`} className="cart-item-title">{product.name}</Link><span className="cart-item-meta">EU {item.size} <span>·</span> {product.condition}</span><div className="cart-item-mobile-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => cart.updateQuantity(item.key, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => cart.updateQuantity(item.key, item.quantity + 1)}><Plus size={13} /></button></div><b>{money(product.price * item.quantity)}</b></div><button className="cart-item-save" onClick={() => { addToWishlist(product.id); notify('Added to wishlist.') }}><Heart size={12} /> Save for later</button></div><b className="cart-item-price">{money(product.price * item.quantity)}</b><button className="remove-item" aria-label={`Remove ${product.name}`} onClick={() => { cart.removeFromCart(item.key); notify('Product removed from your bag.') }}><Trash2 size={16} /></button></article>
}

function Summary({ cart, checkout = false, placing = false }) {
  return <aside className="order-summary"><span className="eyebrow">THE TOTALS</span><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>{cart.shipping === 0 ? 'Complimentary' : money(cart.shipping)}</span></div>{cart.discount > 0 && <div className="summary-row discount-row"><span>Discount</span><span>−{money(cart.discount)}</span></div>}  <div className="summary-total"><span>Total</span><strong>{money(cart.total)}</strong></div><small>Prices include all applicable taxes.</small>{checkout ? <button type="submit" form="checkout-form" disabled={placing} className="button button-dark full-button">{placing ? 'Placing order…' : 'Place my order'} <ArrowRight size={16} /></button> : <Link className="button button-dark full-button" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link>}<div className="secure-note"><ShieldCheck size={16} /> Safe, secure checkout</div></aside>
}

export function CartPage() {
  const cart = useCart()
  const saleSubtotal = cart.subtotal - cart.discount
  return <main className="subpage cart-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Your bag</span></div><div className="page-title-row"><div><span className="eyebrow">THE GOOD STUFF</span><h1>Your bag<span className="title-count"> ({cart.count})</span></h1></div><Link className="text-link" to="/shop"><ArrowLeft size={15} /> Keep browsing</Link></div>{cart.items.length ? <div className="cart-layout"><section className="cart-list">{cart.items.map((item) => { const product = products.find((entry) => entry.id === item.productId); return product && <CartItem item={item} product={product} cart={cart} key={item.key} /> })}<div className="cart-delivery-note"><Truck size={17} /><span><b>You’re {saleSubtotal >= 25000 ? 'all set for complimentary delivery.' : `${money(25000 - saleSubtotal)} away from complimentary delivery.`}</b><small>Good things make their way across Pakistan.</small></span></div></section><Summary cart={cart} /></div> : <div className="cart-empty"><div className="empty-bag-icon"><span>0</span></div><span className="eyebrow">NOTHING IN HERE (YET)</span><h2>Your bag is taking a breather.</h2><p>Good shoes are just a few clicks away. Find a pair that feels like you.</p><Link className="button button-dark" to="/shop">Find your next pair <ArrowRight size={16} /></Link></div>}</main>
}

export function CheckoutPage() {
  const cart = useCart()
  const { notify } = useUI()
  const navigate = useNavigate()
  const [payment, setPayment] = useState('Cash on delivery')
  const [placing, setPlacing] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    if (!cart.items.length) { notify('Your bag is empty. Add a pair before checking out.', 'error'); navigate('/shop'); return }
    setPlacing(true)
    const form = new FormData(event.currentTarget)
    const order = { id: `MG-${Date.now().toString().slice(-8)}`, date: new Date().toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Processing', total: cart.total, items: cart.items, customer: Object.fromEntries(form), payment }
    window.setTimeout(() => {
      sessionStorage.setItem('mg-last-order', JSON.stringify(order))
      const previousOrders = JSON.parse(localStorage.getItem('mg-orders') || '[]')
      localStorage.setItem('mg-orders', JSON.stringify([order, ...previousOrders]))
      cart.clearCart()
      notify('Your order has been placed.')
      navigate('/order-success')
    }, 650)
  }
  return <main className="subpage checkout-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span><span>Checkout</span></div><div className="page-title-row"><div><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1></div><div className="checkout-secure"><ShieldCheck size={16} /> Secure, frontend-only checkout</div></div><div className="checkout-layout"><form className="checkout-form" id="checkout-form" onSubmit={submit}><section className="form-section"><div className="form-section-heading"><span>01</span><div><h2>Your details</h2><p>Where should we send your order updates?</p></div></div><div className="form-grid"><label>First name<input name="firstName" autoComplete="given-name" required /></label><label>Last name<input name="lastName" autoComplete="family-name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+92" required /></label></div></section><section className="form-section"><div className="form-section-heading"><span>02</span><div><h2>Delivery address</h2><p>We currently deliver all across Pakistan.</p></div></div><div className="form-grid"><label className="wide">Street address<input name="address" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>Province<select name="province" required defaultValue=""><option value="" disabled>Select province</option>{['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Postal code<input name="postalCode" autoComplete="postal-code" required /></label></div></section><section className="form-section"><div className="form-section-heading"><span>03</span><div><h2>Payment</h2><p>Choose how you’d like to pay.</p></div></div><div className="payment-options">{['Cash on delivery', 'Bank transfer', 'Card payment (demo)'].map((option) => <label className={payment === option ? 'payment-option selected' : 'payment-option'} key={option}><input type="radio" name="payment" checked={payment === option} onChange={() => setPayment(option)} /><span className="payment-radio" /><span><b>{option}</b><small>{option === 'Cash on delivery' ? 'Pay when your order arrives' : option === 'Bank transfer' ? 'We’ll share transfer details after confirmation' : 'Payment details are not collected in this demo'}</small></span></label>)}</div></section><p className="checkout-disclaimer"><ShieldCheck size={16} /> This is a frontend demo. No payment is collected and no real order is sent.</p></form><div className="checkout-summary-wrap"><Summary cart={cart} checkout placing={placing} /><div className="checkout-items-preview"><span className="eyebrow">IN YOUR BAG</span>{cart.items.map((item) => { const product = products.find((entry) => entry.id === item.productId); return product && <div key={item.key}><img src={product.thumbnail} alt={product.name} /><span>{product.name}<small>EU {item.size} × {item.quantity}</small></span><b>{money(product.price * item.quantity)}</b></div> })}</div></div></div></main>
}

export function OrderSuccess() {
  const order = (() => {
    try { return JSON.parse(sessionStorage.getItem('mg-last-order')) } catch { return null }
  })()
  return <main className="success-page"><div className="success-check"><Check size={32} /></div><span className="eyebrow">THANK YOU FOR SHOPPING WITH US</span><h1>Your order is <em>in good hands.</em></h1><p>We’ve got your order. A confirmation summary will be on its way soon.</p><div className="success-order-card"><div><span>ORDER NUMBER</span><b>{order?.id || 'MG-26092901'}</b></div><div><span>ESTIMATED DELIVERY</span><b>3–5 business days</b></div><div><span>ORDER TOTAL</span><b>{money(order?.total || 0)}</b></div></div>{order?.customer && <div className="success-more"><section><span className="eyebrow">DELIVERING TO</span><b>{order.customer.firstName} {order.customer.lastName}</b><p>{order.customer.address}<br />{order.customer.city}, {order.customer.province} {order.customer.postalCode}</p></section><section><span className="eyebrow">IN THIS ORDER</span>{order.items.map((item) => { const product = products.find((entry) => entry.id === item.productId); return product && <p key={item.key || item.productId}>{product.name} · EU {item.size} × {item.quantity}</p> })}</section></div>}<div className="success-actions"><Link className="button button-dark" to="/track-order">Track your order <ArrowRight size={16} /></Link><Link className="button button-outline" to="/shop">Continue shopping</Link></div><p className="demo-note">This is a frontend simulation. No real order or payment was processed.</p></main>
}
