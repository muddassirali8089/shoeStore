import { useEffect, useState } from 'react'
import { ArrowRight, Check, Heart, Minus, Plus, Search, ShieldCheck, Star, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../context/ProductContext'
import ConditionBadge from '../components/product/ConditionBadge'

const money = (amount) => `Rs. ${amount.toLocaleString('en-PK')}`
export default function ProductDetails() {
  const { id: productId } = useParams()
  const { products, fetchProduct, loading: catalogLoading } = useProducts()
  const listedProduct = products.find((item) => String(item.id) === productId)
  const [detail, setDetail] = useState(null)
  const [detailError, setDetailError] = useState('')
  useEffect(() => {
    let active = true
    async function loadProduct() {
      try {
        const loaded = await fetchProduct(productId)
        if (active) setDetail({ id: productId, product: loaded })
      } catch (error) {
        if (active) setDetailError(error.message)
      }
    }
    loadProduct()
    return () => { active = false }
  }, [fetchProduct, productId])
  const product = detail?.id === productId ? detail.product : listedProduct
  const [imageIndex, setImageIndex] = useState(0)
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [validation, setValidation] = useState('')
  const { addToCart } = useCart()
  const { notify, setCartOpen } = useUI()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  if (!product && catalogLoading) return <div className="not-found" role="status">Loading product…</div>
  if (!product) return <div className="not-found"><span className="eyebrow">THIS PAIR HAS MOVED ON</span><h1>We couldn't find that product.</h1>{detailError && <p role="alert">{detailError}</p>}<Link className="button button-dark" to="/shop">Explore all footwear <ArrowRight size={16} /></Link></div>
  const add = () => {
    if (!size) { setValidation('Please select a size before adding to your bag.'); return }
    if (quantity > (product.sizeStock?.[size] ?? product.stock)) {
      setValidation('There isn’t enough stock for that size. Adjust the quantity and try again.')
      return
    }
    addToCart(product, size, quantity)
    setValidation('')
    notify('Product added to your bag.')
    setCartOpen(true)
  }
  const buy = () => { if (!size) { setValidation('Please select a size before continuing.'); return } if (quantity > (product.sizeStock?.[size] ?? product.stock)) { setValidation('There isn’t enough stock for that size. Adjust the quantity and try again.'); return } addToCart(product, size, quantity); window.location.assign('/checkout') }
  const saved = isInWishlist(product.id)
  const moveZoom = (event) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
    event.currentTarget.style.setProperty('--zoom-x', `${x}%`)
    event.currentTarget.style.setProperty('--zoom-y', `${y}%`)
  }
  return <main className="product-detail-page">{detailError && <p className="validation-message" role="alert">The latest product details could not be loaded: {detailError}</p>}<div className="breadcrumbs detail-breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div><div className="product-detail-layout"><div className="gallery"><div className="gallery-main" onPointerEnter={(event) => { if (event.pointerType === 'mouse') event.currentTarget.classList.add('is-zoomed') }} onPointerMove={moveZoom} onPointerLeave={(event) => { event.currentTarget.classList.remove('is-zoomed'); event.currentTarget.style.setProperty('--zoom-x', '50%'); event.currentTarget.style.setProperty('--zoom-y', '50%') }} aria-label="Move the cursor over the product image to zoom in"><img src={product.images[imageIndex] || product.thumbnail} alt={product.name} /><span className="gallery-zoom-hint"><Search size={13} /> Move to zoom</span></div><div className="gallery-thumbs">{(product.images?.length ? product.images : [product.thumbnail]).map((image, index) => <button className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} key={`${image}-${index}`} aria-label={`View product image ${index + 1}`}><img src={image} alt="" /></button>)}</div></div>
    <section className="product-info"><span className="eyebrow">{product.brand.toUpperCase()}</span><h1>{product.name}</h1><div className="product-condition-line"><span>Condition</span><ConditionBadge condition={product.condition} /></div><div className="rating-line"><span><Star size={15} fill="currentColor" /> {product.rating}</span><span>{product.reviewsCount} considered reviews</span></div><div className="detail-price"><strong>{money(product.price)}</strong><del>{money(product.originalPrice)}</del><span className="sale-badge">-{product.discount}%</span></div><p className="detail-description">{product.description}</p><div className="stock-line"><span className="stock-dot" /> In stock — ships in 1–2 business days</div><div className="detail-divider" /><div className="size-heading"><b>Select size (EU)</b><Link to="/size-guide">Size guide</Link></div><div className="detail-sizes">{product.sizes.map((item) => <button className={size === item ? 'selected' : ''} key={item} onClick={() => { setSize(item); setQuantity(Math.min(quantity, product.sizeStock?.[item] ?? product.stock)); setValidation('') }}>{item}</button>)}</div>{validation && <p className="validation-message">{validation}</p>}<div className="detail-purchase"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={14} /></button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.sizeStock?.[size] ?? product.stock, quantity + 1))} aria-label="Increase quantity"><Plus size={14} /></button></div><button className="button button-dark add-to-bag" onClick={add}>Add to bag <ArrowRight size={16} /></button><button className={`detail-heart ${saved ? 'is-saved' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => { saved ? removeFromWishlist(product.id) : addToWishlist(product.id); notify(saved ? 'Removed from wishlist.' : 'Added to wishlist.') }}><Heart fill={saved ? 'currentColor' : 'none'} size={18} /></button></div><button className="button button-outline full-button buy-now" onClick={buy}>Buy now</button><div className="detail-promises"><div><Truck size={18} /><span>Free delivery<small>On orders over Rs. 25,000</small></span></div><div><ShieldCheck size={18} /><span>Quality checked<small>Every pair, every time</small></span></div><div><Check size={18} /><span>Easy returns<small>14 days to decide</small></span></div></div></section></div>
    <section className="detail-lower"><div className="detail-copy"><span className="eyebrow">THE DETAILS</span><h2>A good fit, <em>all day.</em></h2><p>{product.description}</p><ul>{product.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul><p>Thoughtfully selected and carefully inspected before it finds its way to you. For fit and care information, visit our <Link to="/size-guide">size guide</Link> or <Link to="/shipping-policy">delivery details</Link>.</p></div><div className="detail-specs"><div><span>Brand</span><b>{product.brand}</b></div><div><span>Style</span><b>{product.category}</b></div><div><span>For</span><b>{product.gender}</b></div><div><span>Condition</span><ConditionBadge condition={product.condition} /></div><div><span>Available sizes</span><div className="product-spec-sizes">{product.sizes.map((item) => <span key={item}>EU {item}</span>)}</div></div></div></section>
    <section className="product-reviews"><div><span className="eyebrow">A GOOD WORD FROM THE COMMUNITY</span><h2>Real steps, <em>real comfort.</em></h2><div className="review-score"><Star size={17} fill="currentColor" /> <b>{product.rating}</b><span>Based on {product.reviewsCount} reviews</span></div></div><blockquote><div className="review-stars">★★★★★</div><p>“Comfortable right out of the box. The condition was exactly as described, and they arrived quicker than expected.”</p><footer><b>Hira A.</b><span>Verified MGEARS shopper</span></footer></blockquote></section>
    <section className="section section-pad"><div className="section-heading"><div><span className="eyebrow">YOU MAY ALSO LIKE</span><h2>More good <em>finds.</em></h2></div><Link className="text-link" to="/shop">Explore all <ArrowRight size={16} /></Link></div><ProductGrid products={products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4)} /></section>
  </main>
}
