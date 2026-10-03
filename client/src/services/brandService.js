import { apiClient, listData, normalizeEntity, requestData } from './api'

const fields = ['name', 'status', 'logo']
const payload = (record) => Object.fromEntries(
  fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]),
)

export const brandService = {
  async list(admin = false) {
    return listData(await requestData(apiClient.get(admin ? '/admin/brands' : '/brands')), normalizeEntity)
  },
  async create(record) {
    return normalizeEntity(await requestData(apiClient.post('/brands', payload(record))))
  },
  async update(id, record) {
    return normalizeEntity(await requestData(apiClient.patch(`/brands/${encodeURIComponent(id)}`, payload(record))))
  },
  async remove(id) {
    return requestData(apiClient.delete(`/brands/${encodeURIComponent(id)}`))
  },
}
