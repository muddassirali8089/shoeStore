import { useState } from 'react'
import { ArrowRight, Check, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { useProducts } from '../context/ProductContext'
import { useUI } from '../context/UIContext'
import { useWishlist } from '../context/WishlistContext'
import { orders } from '../data/products'

const steps = ['Order placed', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
const getOrderList = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('mg-orders'))
    const saved = Array.isArray(stored) ? stored : []
    return [...saved, ...orders.filter((order) => !saved.some((item) => item.id === order.id))]
  } catch {
    return orders
  }
}

export function WishlistPage() {
  const { ids, removeFromWishlist } = useWishlist()
  const { notify } = useUI()
  const [showSaved, setShowSaved] = useState(true)
  const { products } = useProducts()
  const saved = products.filter((product) => ids.includes(product.id))
  return <main className="subpage wishlist-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Your wishlist</span></div><div className="page-title-row"><div><span className="eyebrow">PAIRS YOU’VE GOT YOUR EYE ON</span><h1>Your wishlist<span className="title-count"> ({saved.length})</span></h1></div><Link className="text-link" to="/shop">Find more good pairs <ArrowRight size={15} /></Link></div>{saved.length ? <><div className="wishlist-actions"><button onClick={() => setShowSaved(!showSaved)}>{showSaved ? 'Show saved pairs' : 'Hide saved pairs'}</button><button onClick={() => { saved.forEach((product) => removeFromWishlist(product.id)); notify('Your wishlist has been cleared.') }}><Trash2 size={14} /> Clear wishlist</button></div>{showSaved && <ProductGrid products={saved} />}</> : <ProductGrid products={[]} emptyText="Your wishlist is a little quiet." />}</main>
}

export function TrackOrderPage() {
  const [lookup, setLookup] = useState(null)
  const [error, setError] = useState('')
  const { notify } = useUI()
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const id = form.get('order').trim().toUpperCase()
    const contact = form.get('contact').trim().toLowerCase()
    const found = getOrderList().find((order) => {
      const customer = order.customer || {}
      const fullName = customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      const email = customer.email || ''
      const phone = customer.phone || ''
      return order.id?.toUpperCase() === id && [email, phone, fullName].some((value) => String(value).toLowerCase() === contact)
    })
    if (!found) {
      setLookup(null)
      setError('We couldn’t verify an order using those details. Please check your order number and email or phone.')
      return
    }
    setLookup(found)
    setError('')
    notify('We found your order.')
  }
  const activeStep = lookup?.status === 'Delivered' ? 5 : lookup?.status === 'Out for Delivery' ? 4 : lookup?.status === 'Shipped' ? 3 : lookup?.status === 'Confirmed' ? 1 : 0
  return <main className="subpage track-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Track your order</span></div><div className="track-hero"><span className="eyebrow">FROM OUR DOOR TO YOURS</span><h1>Good things are <em>on the way.</em></h1><p>Enter your order number and checkout email or phone to see how your pair is getting along.</p><form className="track-form" onSubmit={submit}><label htmlFor="track-id">Order number</label><div><input name="order" id="track-id" placeholder="e.g. MG-24091852" required /><button className="button button-dark">Track order <Search size={15} /></button></div><label htmlFor="track-contact">Checkout email or phone number</label><input id="track-contact" name="contact" type="text" placeholder="Used when placing the order" required /></form>{error && <p className="validation-message">{error}</p>}</div>{lookup && <section className="tracking-result"><div className="tracking-result-head"><div><span className="eyebrow">ORDER {lookup.id}</span><h2>Your pair is on its way.</h2><p>Last updated today · Estimated delivery 3–5 business days</p></div><span className={`status-pill status-${lookup.status.toLowerCase().replaceAll(' ', '-')}`}>{lookup.status}</span></div><div className="timeline">{steps.map((step, index) => <div className={`timeline-step ${index <= activeStep ? 'complete' : ''}`} key={step}><span className="timeline-dot">{index < activeStep ? <Check size={13} /> : index === activeStep ? <span /> : null}</span><div><b>{step}</b>{index === 0 && <small>{lookup.date}</small>}{index === activeStep && <small>Looking good so far</small>}</div></div>)}</div></section>}</main>
}
