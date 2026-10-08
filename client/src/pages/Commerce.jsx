import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useProducts } from '../context/ProductContext'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { useOrders } from '../context/OrderContext'
import InlineSpinner from '../components/common/InlineSpinner'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`

function CartItem({ item, product, cart }) {
  const { notify } = useUI()
  const { addToWishlist } = useWishlist()
  return <article className="cart-item"><Link to={`/product/${product.id}`}><img src={product.thumbnail} alt={product.name} /></Link><div className="cart-item-info"><span className="eyebrow">{product.brand}</span><Link to={`/product/${product.id}`} className="cart-item-title">{product.name}</Link><span className="cart-item-meta">EU {item.size} <span>·</span> {product.condition}</span><div className="cart-item-mobile-row"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => cart.updateQuantity(item.key, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => cart.updateQuantity(item.key, item.quantity + 1)}><Plus size={13} /></button></div><b>{money(product.price * item.quantity)}</b></div><button className="cart-item-save" onClick={() => { addToWishlist(product.id); notify('Added to wishlist.') }}><Heart size={12} /> Save for later</button></div><b className="cart-item-price">{money(product.price * item.quantity)}</b><button className="remove-item" aria-label={`Remove ${product.name}`} onClick={() => { cart.removeFromCart(item.key); notify('Product removed from your bag.') }}><Trash2 size={16} /></button></article>
}

function Summary({ cart, checkout = false, placing = false }) {
  return <aside className="order-summary"><span className="eyebrow">THE TOTALS</span><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>{cart.shipping === 0 ? 'Complimentary' : money(cart.shipping)}</span></div>{cart.discount > 0 && <div className="summary-row discount-row"><span>Discount</span><span>−{money(cart.discount)}</span></div>}  <div className="summary-total"><span>Total</span><strong>{money(cart.total)}</strong></div><small>Final prices and delivery are confirmed by the store.</small>{checkout ? <button type="submit" form="checkout-form" disabled={placing} aria-busy={placing} className="button button-dark full-button">{placing ? <InlineSpinner label="Placing order" /> : <ArrowRight size={16} />}{placing ? 'Placing order…' : 'Place my order'}</button> : <Link className="button button-dark full-button" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link>}<div className="secure-note"><ShieldCheck size={16} /> Safe, secure checkout</div></aside>
}

export function CartPage() {
  const cart = useCart()
  const { allProducts } = useProducts()
  const saleSubtotal = cart.subtotal - cart.discount
  return <main className="subpage cart-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Your bag</span></div><div className="page-title-row"><div><span className="eyebrow">THE GOOD STUFF</span><h1>Your bag<span className="title-count"> ({cart.count})</span></h1></div><Link className="text-link" to="/shop"><ArrowLeft size={15} /> Keep browsing</Link></div>{cart.items.length ? <div className="cart-layout"><section className="cart-list">{cart.items.map((item) => { const product = allProducts.find((entry) => entry.id === item.productId); return product && <CartItem item={item} product={product} cart={cart} key={item.key} /> })}<div className="cart-delivery-note"><Truck size={17} /><span><b>You’re {saleSubtotal >= 25000 ? 'all set for complimentary delivery.' : `${money(25000 - saleSubtotal)} away from complimentary delivery.`}</b><small>Good things make their way across Pakistan.</small></span></div></section><Summary cart={cart} /></div> : <div className="cart-empty"><div className="empty-bag-icon"><span>0</span></div><span className="eyebrow">NOTHING IN HERE (YET)</span><h2>Your bag is taking a breather.</h2><p>Good shoes are just a few clicks away. Find a pair that feels like you.</p><Link className="button button-dark" to="/shop">Find your next pair <ArrowRight size={16} /></Link></div>}</main>
}

export function CheckoutPage() {
  const cart = useCart()
  const { allProducts } = useProducts()
  const { notify } = useUI()
  const navigate = useNavigate()
  const { placeGuestCodOrder, loading: placing, error } = useOrders()
  const submit = async (event) => {
    event.preventDefault()
    if (!cart.items.length) { notify('Your bag is empty. Add a pair before checking out.', 'error'); navigate('/shop'); return }
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await placeGuestCodOrder(fields, cart.items)
      cart.clearCart()
      notify('Your order has been placed.')
      navigate('/order-success')
    } catch (orderError) {
      notify(orderError.message, 'error')
    }
  }
  return <main className="subpage checkout-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span><span>Checkout</span></div><div className="page-title-row"><div><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1></div><div className="checkout-secure"><ShieldCheck size={16} /> Secure guest checkout</div></div><div className="checkout-layout"><form className="checkout-form" id="checkout-form" onSubmit={submit}><section className="form-section"><div className="form-section-heading"><span>01</span><div><h2>Your details</h2><p>We’ll only use these to deliver your order.</p></div></div><div className="form-grid"><label className="wide">Full name<input name="fullName" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+92" required /></label></div></section><section className="form-section"><div className="form-section-heading"><span>02</span><div><h2>Delivery address</h2><p>We currently deliver all across Pakistan.</p></div></div><div className="form-grid"><label className="wide">Complete address<input name="address" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>Province<select name="province" required defaultValue=""><option value="" disabled>Select province</option>{['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Other'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Postal code<input name="postalCode" autoComplete="postal-code" required /></label><label className="wide">Order notes (optional)<textarea name="notes" rows="3" /></label></div></section><section className="form-section"><div className="form-section-heading"><span>03</span><div><h2>Payment</h2><p>Available payment method</p></div></div><div className="payment-options"><label className="payment-option selected"><span className="payment-radio" /><span><b>Cash on Delivery</b><small>Pay when your order arrives</small></span></label></div></section>{error && <p className="validation-message" role="alert">{error}</p>}<p className="checkout-disclaimer"><ShieldCheck size={16} /> Guest checkout. Payment is collected on delivery; the store confirms prices and availability.</p></form><div className="checkout-summary-wrap"><Summary cart={cart} checkout placing={placing} /><div className="checkout-items-preview"><span className="eyebrow">IN YOUR BAG</span>{cart.items.map((item) => { const product = allProducts.find((entry) => entry.id === item.productId); return product && <div key={item.key}><img src={product.thumbnail} alt={product.name} /><span>{product.name}<small>EU {item.size} × {item.quantity}</small></span><b>{money(product.price * item.quantity)}</b></div> })}</div></div></div></main>
}

export function OrderSuccess() {
  const { lastOrder } = useOrders()
  const order = lastOrder || (() => {
    try { return JSON.parse(sessionStorage.getItem('mg-last-order')) } catch { return null }
  })()
  return <main className="success-page"><div className="success-check"><Check size={32} /></div><span className="eyebrow">THANK YOU FOR SHOPPING WITH US</span><h1>Your order is <em>in good hands.</em></h1><p>We’ve got your order. A confirmation summary will be on its way soon.</p>{order ? <><div className="success-order-card"><div><span>ORDER NUMBER</span><b>{order.id}</b></div><div><span>ESTIMATED DELIVERY</span><b>3–5 business days</b></div><div><span>ORDER TOTAL</span><b>{money(order.total)}</b></div></div>{order?.customer && <div className="success-more"><section><span className="eyebrow">DELIVERING TO</span><b>{order.customer.fullName}</b><p>{order.shippingAddress?.address}<br />{order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p></section><section><span className="eyebrow">IN THIS ORDER</span>{order.items?.map((item, index) => <p key={`${item.product}-${index}`}>{item.name} · EU {item.size} × {item.quantity}</p>)}</section></div>}</> : <p>Your order confirmation is unavailable in this browser session. Use Track your order with your order number and phone.</p>}<div className="success-actions"><Link className="button button-dark" to="/track-order">Track your order <ArrowRight size={16} /></Link><Link className="button button-outline" to="/shop">Continue shopping</Link></div></main>
}
