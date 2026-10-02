/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { brands as defaultBrands, categories as defaultCategories, products as defaultProducts, sizes } from '../data/products'
import { normalizeCondition } from '../components/product/conditionUtils'

const ProductContext = createContext(null)
const readList = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(() => readList('mg-products', defaultProducts).map(normalizeProduct))
  const [categories, setCategories] = useState(() => readList('mg-categories', defaultCategories))
  const [brands, setBrands] = useState(() => readList('mg-brands', defaultBrands))
  useEffect(() => {
    const syncProducts = () => setProducts(readList('mg-products', defaultProducts).map(normalizeProduct))
    const syncCategories = () => setCategories(readList('mg-categories', defaultCategories))
    const syncBrands = () => setBrands(readList('mg-brands', defaultBrands))
    window.addEventListener('storage', syncProducts)
    window.addEventListener('storage', syncCategories)
    window.addEventListener('storage', syncBrands)
    window.addEventListener('mg-products-updated', syncProducts)
    window.addEventListener('mg-categories-updated', syncCategories)
    window.addEventListener('mg-brands-updated', syncBrands)
    return () => {
      window.removeEventListener('storage', syncProducts)
      window.removeEventListener('storage', syncCategories)
      window.removeEventListener('storage', syncBrands)
      window.removeEventListener('mg-products-updated', syncProducts)
      window.removeEventListener('mg-categories-updated', syncCategories)
      window.removeEventListener('mg-brands-updated', syncBrands)
    }
  }, [])
  const value = useMemo(() => ({
    products: products.filter((product) => product.active !== false),
    allProducts: products,
    categories: categories.filter((category) => category.active !== false),
    brands: brands.filter((brand) => typeof brand === 'string' || brand.active !== false),
    sizes,
  }), [products, categories, brands])
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

function normalizeProduct(product) {
  const catalogProduct = Object.fromEntries(Object.entries(product).filter(([key]) => key !== 'slug' && key !== 'sku'))
  return {
    ...catalogProduct,
    condition: normalizeCondition(product.condition),
    sizes: Array.isArray(product.sizes) ? product.sizes.map((entry) => Number(typeof entry === 'object' ? entry.size : entry)).filter((size) => Number.isFinite(size) && size > 0) : [],
    images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, 4) : [],
    thumbnail: product.thumbnail || product.images?.[0] || '',
  }
}

export const useProducts = () => useContext(ProductContext)
