/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminService } from '../services/adminService'
import { brandService } from '../services/brandService'
import { categoryService } from '../services/categoryService'
import { discountService } from '../services/discountService'
import { normalizeProduct } from '../services/api'
import { orderService } from '../services/orderService'
import { productService } from '../services/productService'

const AdminContext = createContext(null)
const defaultSettings = {
  storeName: 'ShoeStore', storeEmail: '', currency: 'PKR', taxRate: 0,
  freeShippingThreshold: 25000, standardShipping: 350, expressShipping: 0,
  processingDays: 1, maintenanceMode: false, cashOnDeliveryEnabled: true,
}

function normalizeOrder(order) {
  const customer = order.customer || {}
  const address = order.shippingAddress || {}
  const status = order.orderStatus || order.status || 'pending'
  return {
    ...order,
    id: order.orderNumber || order._id || order.id,
    _id: order._id || order.id,
    date: order.createdAt || order.date,
    status,
    shipping: order.shippingFee ?? order.shipping,
    notes: order.orderNotes || order.notes || '',
    customer: {
      ...customer,
      fullName: customer.name || customer.fullName || '',
      firstName: customer.name?.split(/\s+/)[0] || '',
      lastName: customer.name?.split(/\s+/).slice(1).join(' ') || '',
      address: address.address || customer.address || '',
      city: address.city || customer.city || '',
      province: address.province || customer.province || '',
      postalCode: address.postalCode || customer.postalCode || '',
      notes: address.notes || customer.notes || '',
    },
    items: (order.items || []).map((item) => ({
      ...item,
      productId: item.product?._id || item.product || item.productId,
      name: item.name || item.product?.name || '',
      image: item.image || item.product?.images?.[0] || '',
      price: Number(item.price || 0),
    })),
    paymentMethod: order.paymentMethod || 'cash_on_delivery',
    paymentStatus: ['cancelled', 'returned'].includes(status) ? 'not_applicable' : order.paymentStatus || 'pending',
  }
}

const asArray = (value) => Array.isArray(value) ? value : []

export function AdminProvider({ children }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [orders, setOrders] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)
  const [dashboard, setDashboard] = useState(null)
  const [inventory, setInventory] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(() => Boolean(window.localStorage.getItem('mg-admin-token')))
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loadedProducts, loadedCategories, loadedBrands, loadedOrders, loadedDiscounts, loadedSettings, loadedDashboard, loadedInventory, loadedCustomers] = await Promise.all([
        productService.list({}, true), categoryService.list(true), brandService.list(true),
        orderService.list(), discountService.list(), adminService.settings(), adminService.dashboard(),
        adminService.inventory(), adminService.customers(),
      ])
      setProducts(loadedProducts.map(normalizeProduct))
      setCategories(loadedCategories)
      setBrands(loadedBrands)
      setOrders(loadedOrders.map(normalizeOrder))
      setDiscounts(loadedDiscounts)
      setSettings({ ...defaultSettings, ...loadedSettings })
      setDashboard(loadedDashboard)
      setInventory(asArray(loadedInventory))
      setCustomers(asArray(loadedCustomers))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = window.localStorage.getItem('mg-admin-token')
    const initialLoad = token ? window.setTimeout(() => refreshAll(), 0) : null
    const authChanged = () => {
      if (window.localStorage.getItem('mg-admin-token')) refreshAll()
      else {
        setProducts([]); setCategories([]); setBrands([]); setOrders([])
        setDiscounts([]); setSettings(defaultSettings); setDashboard(null); setInventory([]); setCustomers([])
      }
    }
    window.addEventListener('mg-admin-auth-changed', authChanged)
    return () => {
      if (initialLoad) window.clearTimeout(initialLoad)
      window.removeEventListener('mg-admin-auth-changed', authChanged)
    }
  }, [refreshAll])

  const updateProducts = useCallback(async (next) => {
    const currentById = new Map(products.map((item) => [String(item.id), item]))
    const nextList = asArray(next)
    const nextIds = new Set(nextList.map((item) => String(item.id)))
    const fields = ['name', 'brand', 'category', 'gender', 'condition', 'description', 'price', 'originalPrice', 'status', 'sizes', 'images', 'colors', 'features', 'featured', 'bestseller', 'newArrival', 'rating']
    const changed = nextList.filter((item) => {
      const current = currentById.get(String(item.id))
      return current && fields.some((field) => JSON.stringify(current[field]) !== JSON.stringify(item[field]))
    })
    await Promise.all([
      ...changed.map((item) => productService.update(item.id, item, [])),
      ...nextList.filter((item) => !currentById.has(String(item.id)))
        .map(() => Promise.reject(new Error('Use the product form to upload the required source image files.'))),
      ...products.filter((item) => !nextIds.has(String(item.id))).map((item) => productService.remove(item.id)),
    ])
    setProducts((await productService.list({}, true)).map(normalizeProduct))
    window.dispatchEvent(new Event('mg-products-updated'))
  }, [products])

  const updateCatalog = useCallback(async (kind, next) => {
    const records = kind === 'categories' ? categories : brands
    const service = kind === 'categories' ? categoryService : brandService
    const existing = new Map(records.map((item) => [String(item.id), item]))
    const list = asArray(next)
    const ids = new Set(list.map((item) => String(item.id)))
    const changed = list.filter((item) => {
      const current = existing.get(String(item.id))
      return current && ['name', 'status', 'description', 'image', 'logo']
        .some((field) => current[field] !== item[field])
    })
    await Promise.all([
      ...changed.map((item) => service.update(item.id, item)),
      ...list.filter((item) => !existing.has(String(item.id))).map((item) => service.create(item)),
      ...records.filter((item) => !ids.has(String(item.id))).map((item) => service.remove(item.id)),
    ])
    const updated = await service.list(true)
    if (kind === 'categories') setCategories(updated)
    else setBrands(updated)
    window.dispatchEvent(new Event(`mg-${kind}-updated`))
  }, [categories, brands])

  const updateOrders = useCallback(async (next) => {
    const nextOrders = asArray(next)
    const inventoryChanged = nextOrders.some((order) => {
      const prior = orders.find((item) => String(item.id) === String(order.id))
      return prior && prior.status !== order.status && ['cancelled', 'returned'].includes(order.status)
    })
    await Promise.all(nextOrders.flatMap((order) => {
      const prior = orders.find((item) => String(item.id) === String(order.id))
      if (!prior) return []
      const operations = []
      if (prior.status !== order.status) operations.push(orderService.setStatus(order._id, order.status))
      if (prior.paymentStatus !== order.paymentStatus) operations.push(orderService.setPaymentStatus(order._id, order.paymentStatus))
      return operations
    }))
    setOrders((await orderService.list()).map(normalizeOrder))
    try {
      setDashboard(await adminService.dashboard())
      setError('')
    } catch (refreshError) {
      setError(`Order saved, but dashboard statistics could not be refreshed: ${refreshError.message}`)
    }
    if (inventoryChanged) {
      try {
        const [updatedProducts, updatedInventory] = await Promise.all([
          productService.list({}, true),
          adminService.inventory(),
        ])
        setProducts(updatedProducts.map(normalizeProduct))
        setInventory(asArray(updatedInventory))
        window.dispatchEvent(new Event('mg-products-updated'))
      } catch (refreshError) {
        setError(`Order saved, but inventory could not be refreshed: ${refreshError.message}`)
      }
    }
  }, [orders])

  const deleteOrder = useCallback(async (id) => {
    await orderService.remove(id)
    setOrders((current) => current.filter((order) => String(order._id) !== String(id)))
    const results = await Promise.allSettled([
      orderService.list(),
      adminService.dashboard(),
      adminService.customers(),
      productService.list({}, true),
      adminService.inventory(),
    ])
    const [updatedOrders, updatedDashboard, updatedCustomers, updatedProducts, updatedInventory] = results
    if (updatedOrders.status === 'fulfilled') setOrders(updatedOrders.value.map(normalizeOrder))
    if (updatedDashboard.status === 'fulfilled') setDashboard(updatedDashboard.value)
    if (updatedCustomers.status === 'fulfilled') setCustomers(asArray(updatedCustomers.value))
    if (updatedProducts.status === 'fulfilled') {
      setProducts(updatedProducts.value.map(normalizeProduct))
      window.dispatchEvent(new Event('mg-products-updated'))
    }
    if (updatedInventory.status === 'fulfilled') setInventory(asArray(updatedInventory.value))
    const refreshErrors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message)
    if (refreshErrors.length) {
      setError(`Order was deleted, but some admin data could not be refreshed: ${refreshErrors.join(' ')}`)
    } else {
      setError('')
    }
  }, [])

  const updateDiscounts = useCallback(async (next) => {
    const existing = new Map(discounts.map((item) => [String(item.id), item]))
    const list = asArray(next)
    const ids = new Set(list.map((item) => String(item.id)))
    await Promise.all([
      ...list.map((item) => existing.has(String(item.id))
        ? discountService.update(item.id, item)
        : discountService.create(item)),
      ...discounts.filter((item) => !ids.has(String(item.id))).map((item) => discountService.remove(item.id)),
    ])
    setDiscounts(await discountService.list())
  }, [discounts])

  const updateSettings = useCallback(async (next) => {
    const fields = ['storeName', 'storeEmail', 'currency', 'taxRate', 'freeShippingThreshold', 'standardShipping', 'expressShipping', 'processingDays', 'maintenanceMode', 'cashOnDeliveryEnabled']
    const payload = Object.fromEntries(fields.filter((field) => next[field] !== undefined).map((field) => [field, next[field]]))
    setSettings({ ...defaultSettings, ...await adminService.updateSettings(payload) })
  }, [])
  const saveProduct = useCallback(async (item, files, id) => {
    const saved = id ? await productService.update(id, item, files) : await productService.create(item, files)
    setProducts((current) => id
      ? current.map((product) => product.id === id ? saved : product)
      : [saved, ...current])
    window.dispatchEvent(new Event('mg-products-updated'))
    return saved
  }, [])
  const removeProduct = useCallback(async (id) => {
    await productService.remove(id)
    setProducts((current) => current.filter((product) => product.id !== id))
    window.dispatchEvent(new Event('mg-products-updated'))
  }, [])
  const refreshInventory = useCallback(async () => setInventory(asArray(await adminService.inventory())), [])
  const fetchCustomer = useCallback((identifier) => adminService.customer(identifier), [])
  const fetchOrder = useCallback(async (id) => normalizeOrder(await orderService.get(id)), [])
  const notify = useCallback((message, type = 'success') => setToast({ message, type, id: Date.now() }), [])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const value = useMemo(() => ({
    products, categories, brands, orders, discounts, settings, dashboard, inventory, customers,
    loading, error, toast, refreshAll, refreshInventory, fetchCustomer, fetchOrder, saveProduct, removeProduct, deleteOrder,
    updateProducts, updateCategories: (next) => updateCatalog('categories', next),
    updateBrands: (next) => updateCatalog('brands', next), updateOrders, updateDiscounts,
    updateSettings, notify,
  }), [products, categories, brands, orders, discounts, settings, dashboard, inventory, customers,
    loading, error, toast, refreshAll, refreshInventory, saveProduct, removeProduct,
    updateProducts, updateCatalog, updateOrders, updateDiscounts, updateSettings, notify, fetchCustomer, fetchOrder, deleteOrder])
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used inside AdminProvider.')
  return context
}

export const makeId = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}`
export const money = (amount) => `Rs. ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`
export const orderSubtotal = (order) => Number(order.subtotal) || (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
