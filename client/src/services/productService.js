import { apiClient, listData, normalizeProduct, requestData } from './api'

export const productService = {
  async list(params = {}, admin = false) {
    const url = admin ? '/admin/products' : '/products'
    const all = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const response = await apiClient.get(url, { params: { ...params, page, limit: 100 } })
      const body = response.data
      if (body?.success === false) throw new Error(body.message || 'Unable to load products.')
      all.push(...listData(body?.data, normalizeProduct))
      hasMore = page < (body?.pagination?.pages || 1)
      page += 1
    }
    return all
  },
  async get(id) {
    return normalizeProduct(await requestData(apiClient.get(`/products/${encodeURIComponent(id)}`)))
  },
  async create(product, files) {
    return normalizeProduct(await requestData(apiClient.post('/products', productForm(product, files))))
  },
  async update(id, product, files) {
    return normalizeProduct(await requestData(apiClient.patch(`/products/${encodeURIComponent(id)}`, productForm(product, files))))
  },
  async remove(id) {
    return requestData(apiClient.delete(`/products/${encodeURIComponent(id)}`))
  },
}

function productForm(product, files = []) {
  const form = new FormData()
  const fields = ['name', 'brand', 'category', 'gender', 'condition', 'description', 'price', 'originalPrice', 'status', 'rating', 'featured', 'bestseller', 'newArrival']
  fields.forEach((field) => {
    if (product[field] !== undefined && product[field] !== null) form.append(field, String(product[field]))
  })
  form.append('sizes', JSON.stringify(product.sizes || []))
  form.append('colors', JSON.stringify(product.colors || []))
  form.append('features', JSON.stringify(product.features || []))
  const retainedImages = (product.images || []).filter((image) => typeof image === 'string' && /^https?:\/\//i.test(image))
  if (retainedImages.length || !files.length) form.append('retainedImages', JSON.stringify(retainedImages))
  files.forEach((file) => form.append('images', file, file.name))
  return form
}
