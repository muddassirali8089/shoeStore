import { ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'
import { useUI } from '../../context/UIContext'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`
export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI()
  const { items, subtotal, removeFromCart } = useCart()
  const { allProducts } = useProducts()
  return <><button className={`drawer-scrim ${cartOpen ? 'visible' : ''}`} aria-label="Close bag" onClick={() => setCartOpen(false)} /><aside className={`cart-drawer ${cartOpen ? 'cart-drawer-open' : ''}`} aria-hidden={!cartOpen}>
    <div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <span>({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X /></button></div>
    <div className="drawer-items">{items.length ? items.map((item) => { const product = allProducts.find((entry) => entry.id === item.productId); return product && <div className="drawer-item" key={item.key}><img src={product.thumbnail} alt={product.name} /><div><b>{product.name}</b><small>Size {item.size} · Qty {item.quantity}</small><strong>{money(product.price * item.quantity)}</strong><button onClick={() => removeFromCart(item.key)}>Remove</button></div></div> }) : <div className="drawer-empty">Your bag is waiting for a good pair.</div>}</div>
    <div className="drawer-bottom"><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Delivery is on us for orders above Rs. 25,000.</p><Link className="button button-dark full-button" to="/cart" onClick={() => setCartOpen(false)}>View bag <ArrowRight size={16} /></Link><Link className="drawer-continue" to="/shop" onClick={() => setCartOpen(false)}>Continue shopping</Link></div>
  </aside></>
}
