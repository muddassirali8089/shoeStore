import { ArrowUpRight, Heart, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { useWishlist } from '../../context/WishlistContext'
import ConditionBadge from './ConditionBadge'
import './product-stock-status.css'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`
export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { notify, setCartOpen } = useUI()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const saved = isInWishlist(product.id)
  const toggleSaved = (event) => {
    event.preventDefault()
    saved ? removeFromWishlist(product.id) : addToWishlist(product.id)
    notify(saved ? 'Removed from wishlist.' : 'Added to wishlist.')
  }
  const quickAdd = (event) => {
    event.preventDefault()
    if (product.outOfStock) {
      notify('This product is out of stock.', 'error')
      return
    }
    if (!product.sizes?.length) {
      notify('This product currently has no available sizes.', 'error')
      return
    }
    addToCart(product, product.sizes[0])
    notify('Product added to your bag.')
    setCartOpen(true)
  }
  return <article className="product-card">
    <Link className="product-image-wrap" to={`/product/${product.id}`}>
      <img className="product-image" src={product.thumbnail} alt={product.name} loading="lazy" />
      {product.discount > 0 && <span className="sale-badge">-{product.discount}%</span>}
      {product.outOfStock && <span className="product-stock-status">Out of stock</span>}
      <button className={`heart-button ${saved ? 'is-saved' : ''}`} type="button" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={toggleSaved}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
      <span className="quick-view"><ArrowUpRight size={15} /> View details</span>
    </Link>
    <div className="product-card-body">
      <div className="product-brand">{product.brand}<span><Star size={12} fill="currentColor" /> {product.rating}</span></div>
      <Link className="product-name" to={`/product/${product.id}`}>{product.name}</Link>
      <div className="product-card-bottom"><div className="product-prices"><strong>{money(product.price)}</strong><del>{money(product.originalPrice)}</del></div>
        <button className="quick-add" type="button" onClick={quickAdd} aria-label={`Add ${product.name} to bag`}><ShoppingBag size={17} /></button>
      </div>
      <div className="card-meta"><ConditionBadge condition={product.condition} /><span>·</span>{product.category}</div>
    </div>
  </article>
}
