import { useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import PromotionBanner from '../components/home/PromotionBanner'
import { useProducts } from '../context/ProductContext'

const conditions = ['BrandNew', 'Premium 10/10', 'Excellent 9/10', 'Good 8/10', 'Used 7/10']
const sortProducts = (items, sort) => [...items].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : sort === 'rating' ? b.rating - a.rating : sort === 'discount' ? b.discount - a.discount : sort === 'newest' ? Number(b.newArrival) - Number(a.newArrival) : Number(b.featured) - Number(a.featured))
export function CatalogPage({ searchMode = false }) {
  const { products, categories, brands, sizes } = useProducts()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = params.get('q') || ''
  const currentCategory = params.get('category') || (location.pathname.startsWith('/category/') ? location.pathname.split('/').pop() : '')
  const categoryName = categories.find((category) => category.slug === currentCategory)?.name
  const categoryData = categories.find((category) => category.slug === currentCategory)
  const updateParam = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }
  const matching = useMemo(() => {
    let result = products
    if (searchMode && query) {
      const term = query.toLowerCase()
      result = result.filter((product) => `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(term))
    }
    if (currentCategory && currentCategory !== 'new-arrivals') result = result.filter((product) => product.category.toLowerCase() === currentCategory || product.gender.toLowerCase() === currentCategory)
    if (currentCategory === 'new-arrivals' || params.get('category') === 'new-arrivals') result = result.filter((product) => product.newArrival)
    if (params.get('brand')) result = result.filter((product) => product.brand.toLowerCase() === params.get('brand').toLowerCase())
    if (params.get('size')) result = result.filter((product) => product.sizes.includes(Number(params.get('size'))))
    if (params.get('condition')) result = result.filter((product) => product.condition === params.get('condition'))
    if (params.get('gender')) result = result.filter((product) => product.gender.toLowerCase() === params.get('gender').toLowerCase())
    if (params.get('rating')) result = result.filter((product) => product.rating >= Number(params.get('rating')))
    if (params.get('minPrice')) result = result.filter((product) => product.price >= Number(params.get('minPrice')))
    if (params.get('maxPrice')) result = result.filter((product) => product.price <= Number(params.get('maxPrice')))
    if (params.get('discount')) result = result.filter((product) => product.discount >= Number(params.get('discount')))
    return sortProducts(result, params.get('sort'))
  }, [searchMode, query, currentCategory, params, products])
  const title = searchMode ? `Search results${query ? ` for “${query}”` : ''}` : categoryName ? `${categoryName} footwear` : params.get('brand') ? `${params.get('brand')} footwear` : params.get('size') ? `EU ${params.get('size')} footwear` : params.get('condition') ? `${params.get('condition')} footwear` : 'All footwear'
  const filters = <><div className="filter-group"><h3>Category</h3>{categories.map((item) => <label key={item.slug}><input type="checkbox" checked={currentCategory === item.slug} onChange={() => updateParam('category', currentCategory === item.slug ? '' : item.slug)} />{item.name}</label>)}</div>
    <div className="filter-group"><h3>Gender</h3>{['Men', 'Women', 'Unisex'].map((gender) => <label key={gender}><input type="checkbox" checked={params.get('gender') === gender} onChange={() => updateParam('gender', params.get('gender') === gender ? '' : gender)} />{gender}</label>)}</div>
    <div className="filter-group"><h3>Brand</h3>{brands.map((brand) => { const name = typeof brand === 'string' ? brand : brand.name; return <label key={name}><input type="checkbox" checked={params.get('brand') === name} onChange={() => updateParam('brand', params.get('brand') === name ? '' : name)} />{name}</label> })}</div>
    <div className="filter-group"><h3>Size (EU)</h3><div className="filter-size-grid">{sizes.map((size) => <button className={params.get('size') === `${size}` ? 'selected' : ''} key={size} onClick={() => updateParam('size', params.get('size') === `${size}` ? '' : `${size}`)}>{size}</button>)}</div></div>
    <div className="filter-group"><h3>Condition</h3>{conditions.map((condition) => <label key={condition}><input type="checkbox" checked={params.get('condition') === condition} onChange={() => updateParam('condition', params.get('condition') === condition ? '' : condition)} />{condition}</label>)}</div>
    <div className="filter-group"><h3>Price range</h3><div className="price-inputs"><label className="sr-only" htmlFor="min-price">Minimum price</label><input id="min-price" inputMode="numeric" placeholder="Min Rs." value={params.get('minPrice') || ''} onChange={(event) => updateParam('minPrice', event.target.value)} /><label className="sr-only" htmlFor="max-price">Maximum price</label><input id="max-price" inputMode="numeric" placeholder="Max Rs." value={params.get('maxPrice') || ''} onChange={(event) => updateParam('maxPrice', event.target.value)} /></div></div>
    <div className="filter-group"><h3>Discount</h3><label><input type="checkbox" checked={params.get('discount') === '20'} onChange={() => updateParam('discount', params.get('discount') === '20' ? '' : '20')} />20% off or more</label></div>
    <div className="filter-group"><h3>Customer rating</h3><label><input type="checkbox" checked={params.get('rating') === '4'} onChange={() => updateParam('rating', params.get('rating') === '4' ? '' : '4')} />4 stars & above</label></div>
    <button className="clear-filters" onClick={() => setParams(searchMode && query ? { q: query } : {})}>Clear all filters</button></>
  return <main className="catalog-page">  <div className="catalog-hero"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>{searchMode ? 'Search' : 'Shop'}</span></div><span className="eyebrow">{searchMode ? 'A GOOD PLACE TO START' : 'FOOTWEAR WITH A SECOND STORY'}</span><h1>{title}</h1><p>{searchMode ? 'A considered edit of good shoes, matched to your search.' : categoryData?.description || 'Find your next well-loved pair, chosen for comfort and quality.'}</p></div>
  {categoryData && <PromotionBanner compact image={categoryData.image} eyebrow={`THE MGEARS ${categoryData.name.toUpperCase()} EDIT`} title={categoryData.name} description={categoryData.description} action={`Shop ${categoryData.name.toLowerCase()}`} href={`/shop?category=${categoryData.slug}`} />}
    <div className="catalog-toolbar"><span><b>{matching.length}</b> pairs to discover</span><div className="toolbar-actions"><button className="filter-mobile-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> Filters</button><label htmlFor="sort-products">Sort by</label><div className="sort-select"><select id="sort-products" value={params.get('sort') || 'featured'} onChange={(event) => updateParam('sort', event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option><option value="discount">Biggest discount</option></select><ChevronDown size={15} /></div></div></div>
    <div className="catalog-layout"><aside className={`filters-panel ${filtersOpen ? 'filters-panel-open' : ''}`}><div className="filter-mobile-head"><b>Filters</b><button className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button></div>{filters}</aside><section className="catalog-results"><ProductGrid products={matching} emptyText={searchMode ? "Sorry, we couldn't find any products matching your search." : 'No pairs match those filters.'} /></section></div><button className={`filter-scrim ${filtersOpen ? 'visible' : ''}`} aria-label="Close filters" onClick={() => setFiltersOpen(false)} /></main>
}
