import { apiClient, listData, normalizeEntity, requestData } from './api'

const fields = ['name', 'status', 'description', 'image']
const payload = (record) => Object.fromEntries(
  fields.filter((field) => record[field] !== undefined).map((field) => [field, record[field]]),
)

export const categoryService = {
  async list(admin = false) {
    return listData(await requestData(apiClient.get(admin ? '/admin/categories' : '/categories')), normalizeEntity)
  },
  async create(record) {
    return normalizeEntity(await requestData(apiClient.post('/categories', payload(record))))
  },
  async update(id, record) {
    return normalizeEntity(await requestData(apiClient.patch(`/categories/${encodeURIComponent(id)}`, payload(record))))
  },
  async remove(id) {
    return requestData(apiClient.delete(`/categories/${encodeURIComponent(id)}`))
  },
}
