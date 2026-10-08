import axios from 'axios'

const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
export const API_BASE_URL = configuredUrl.replace(/\/+$/, '')
const TOKEN_KEY = 'mg-admin-token'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('mg-admin-unauthorized'))
    }
    const message = error.response?.data?.message || error.message || 'The request could not be completed.'
    throw new Error(message, { cause: error })
  },
)

export async function requestData(request) {
  const response = await request
  const body = response.data
  if (body?.success === false) throw new Error(body.message || 'The request could not be completed.')
  return body?.data ?? body
}

const idOf = (record) => record?._id || record?.id
const entitySlug = (name = '') => String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
export const normalizeEntity = (record) => {
  if (!record) return record
  return { ...record, id: idOf(record), slug: record.slug || entitySlug(record.name), active: record.status === 'Active' }
}

export function normalizeProduct(record) {
  if (!record) return record
  const stock = Number(record.stock ?? record.totalStock ?? record.sizes?.reduce((sum, size) => sum + Number(size.quantity || 0), 0)) || 0
  const product = {
    ...record,
    id: idOf(record),
    brand: record.brand?.name || record.brand || '',
    category: record.category?.name || record.category || '',
    images: Array.isArray(record.images) ? record.images : [],
    thumbnail: record.thumbnail || record.images?.[0] || '',
    stock,
    outOfStock: record.outOfStock ?? stock === 0,
    active: record.status === 'Active',
  }
  return product
}

export function listData(value, normalizer = (item) => item) {
  const records = Array.isArray(value) ? value : value?.items
  return (records || []).map(normalizer)
}

export const healthService = {
  check: () => requestData(apiClient.get('/health')),
}
