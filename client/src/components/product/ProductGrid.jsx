import { ArrowRight, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, emptyText = 'No products found.', loading = false }) {
  if (loading) return <div className="product-grid">{Array.from({ length: 8 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>
  if (!products.length) return <div className="empty-state"><SearchX size={34} /><h3>{emptyText}</h3><p>Try changing your filters or explore our full collection.</p><Link to="/shop" className="button button-dark">Continue shopping <ArrowRight size={16} /></Link></div>
  return <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>
}
