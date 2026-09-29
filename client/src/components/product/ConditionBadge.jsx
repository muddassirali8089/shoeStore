import { normalizeCondition } from './conditionUtils'

const conditionStyles = {
  BrandNew: 'condition-brand-new',
  'Premium 10/10': 'condition-premium',
  'Excellent 9/10': 'condition-excellent',
  'Good 8/10': 'condition-good',
  'Used 7/10': 'condition-used',
}

export default function ConditionBadge({ condition }) {
  if (!condition) return null
  const normalized = normalizeCondition(condition)
  return <span className={`condition-badge ${conditionStyles[normalized]}`}>{normalized}</span>
}
