/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { normalizeCondition } from '../components/product/conditionUtils'
import { brandService } from '../services/brandService'
import { categoryService } from '../services/categoryService'
import { normalizeProduct } from '../services/api'
import { productService } from '../services/productService'

const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function loadCatalog() {
      try {
        const [loadedProducts, loadedCategories, loadedBrands] = await Promise.all([
          productService.list(), categoryService.list(), brandService.list(),
        ])
        if (!active) return
        setProducts(loadedProducts.map(normalizeStoreProduct))
        setCategories(loadedCategories)
        setBrands(loadedBrands)
      } catch (loadError) {
        if (active) setError(loadError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadCatalog()
    const syncProducts = async () => {
      try { setProducts((await productService.list()).map(normalizeStoreProduct)) } catch (loadError) { setError(loadError.message) }
    }
    const syncCategories = async () => {
      try { setCategories(await categoryService.list()) } catch (loadError) { setError(loadError.message) }
    }
    const syncBrands = async () => {
      try { setBrands(await brandService.list()) } catch (loadError) { setError(loadError.message) }
    }
    window.addEventListener('mg-products-updated', syncProducts)
    window.addEventListener('mg-categories-updated', syncCategories)
    window.addEventListener('mg-brands-updated', syncBrands)
    return () => {
      active = false
      window.removeEventListener('mg-products-updated', syncProducts)
      window.removeEventListener('mg-categories-updated', syncCategories)
      window.removeEventListener('mg-brands-updated', syncBrands)
    }
  }, [])

  const refreshProducts = useCallback(async () => {
    setProducts((await productService.list()).map(normalizeStoreProduct))
  }, [])
  const fetchProduct = useCallback(async (id) => normalizeStoreProduct(await productService.get(id)), [])
  const value = useMemo(() => ({
    products: products.filter((product) => product.active !== false),
    allProducts: products,
    categories: categories.filter((category) => category.active !== false),
    brands: brands.filter((brand) => brand.active !== false),
    sizes: [...new Set(products.flatMap((product) => product.sizes || []))].sort((left, right) => left - right),
    loading,
    error,
    refreshProducts,
    fetchProduct,
  }), [products, categories, brands, loading, error, refreshProducts, fetchProduct])
  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export const useProducts = () => useContext(ProductContext)

function normalizeStoreProduct(product) {
  const availableSizes = Array.isArray(product.sizes) ? product.sizes.filter((entry) => Number(entry.quantity ?? 1) > 0) : []
  return {
    ...normalizeProduct(product),
    condition: normalizeCondition(product.condition),
    sizes: availableSizes.map((entry) => Number(typeof entry === 'object' ? entry.size : entry)).filter((size) => Number.isFinite(size) && size > 0),
    sizeStock: Object.fromEntries(availableSizes.map((entry) => [Number(entry.size), Number(entry.quantity ?? 1)])),
  }
}
