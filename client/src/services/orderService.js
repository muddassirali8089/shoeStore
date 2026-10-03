import { apiClient, listData, normalizeEntity, requestData } from './api'

export const orderService = {
  create: (order) => requestData(apiClient.post('/orders', order)),
  track: (orderNumber, phone) => requestData(apiClient.get(`/orders/track/${encodeURIComponent(orderNumber)}`, { params: { phone } })),
  async list() {
    const all = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const response = await apiClient.get('/admin/orders', { params: { page, limit: 100 } })
      if (response.data?.success === false) throw new Error(response.data.message || 'Unable to load orders.')
      all.push(...listData(response.data?.data, normalizeEntity))
      hasMore = page < (response.data?.pagination?.pages || 1)
      page += 1
    }
    return all
  },
  get: (id) => requestData(apiClient.get(`/admin/orders/${encodeURIComponent(id)}`)),
  setStatus: (id, status) => requestData(apiClient.patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })),
  setPaymentStatus: (id, paymentStatus) => requestData(apiClient.patch(`/admin/orders/${encodeURIComponent(id)}/payment-status`, { paymentStatus })),
}
