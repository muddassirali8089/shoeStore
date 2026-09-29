import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PromotionBanner({ image, eyebrow, title, description, action, href, compact = false }) {
  return <section className={compact ? 'promotion-banner-compact' : 'editorial-banner'}>
    <div className={compact ? 'promotion-banner-image' : 'editorial-photo'}><img src={image} alt="" loading="lazy" /></div>
    <div className={compact ? 'promotion-banner-copy' : 'editorial-copy'}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className={compact ? 'text-link' : 'button button-light'} to={href}>{action} <ArrowRight size={16} /></Link>
      {!compact && <span className="editorial-index">MGEARS / 2026</span>}
    </div>
  </section>
}
