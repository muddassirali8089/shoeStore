import { apiClient, listData, normalizeEntity, requestData } from './api'

async function listAll(path, normalizer = (record) => record) {
  const all = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const response = await apiClient.get(path, { params: { page, limit: 100 } })
    if (response.data?.success === false) throw new Error(response.data.message || `Unable to load ${path}.`)
    all.push(...listData(response.data?.data, normalizer))
    hasMore = page < (response.data?.pagination?.pages || 1)
    page += 1
  }
  return all
}

export const adminService = {
  dashboard: () => requestData(apiClient.get('/admin/dashboard')),
  inventory: () => listAll('/admin/inventory'),
  customers: () => listAll('/admin/customers', normalizeEntity),
  customer: (identifier) => requestData(apiClient.get(`/admin/customers/${encodeURIComponent(identifier)}`)),
  settings: () => requestData(apiClient.get('/admin/settings')),
  updateSettings: (settings) => requestData(apiClient.patch('/admin/settings', settings)),
}
