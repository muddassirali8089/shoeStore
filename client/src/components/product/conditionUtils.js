export const PRODUCT_CONDITIONS = [
  'BrandNew',
  'Premium 10/10',
  'Excellent 9/10',
  'Good 8/10',
  'Used 7/10',
]

export function normalizeCondition(condition) {
  if (PRODUCT_CONDITIONS.includes(condition)) return condition
  if (condition === 'New') return 'BrandNew'
  if (condition === 'Like New') return 'Premium 10/10'
  if (condition === 'Used') return 'Used 7/10'
  if (condition === 'Refurbished') return 'Good 8/10'
  return 'Excellent 9/10'
}
