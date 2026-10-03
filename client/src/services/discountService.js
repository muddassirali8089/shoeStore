import { apiClient, listData, normalizeEntity, requestData } from './api'

export const discountService = {
  async list() {
    return listData(await requestData(apiClient.get('/discounts')), normalizeEntity)
  },
  async create(record) {
    return normalizeEntity(await requestData(apiClient.post('/discounts', {
      name: record.name || record.code,
      code: record.code,
      type: record.type,
      value: record.value,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      status: record.status,
      usageLimit: record.usageLimit,
    })))
  },
  async update(id, record) {
    const fields = ['name', 'code', 'type', 'value', 'startsAt', 'endsAt', 'status', 'usageLimit']
    const payload = Object.fromEntries(
      fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]),
    )
    return normalizeEntity(await requestData(apiClient.patch(`/discounts/${encodeURIComponent(id)}`, payload)))
  },
  async remove(id) {
    return requestData(apiClient.delete(`/discounts/${encodeURIComponent(id)}`))
  },
}
