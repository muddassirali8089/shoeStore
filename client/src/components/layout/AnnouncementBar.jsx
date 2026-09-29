import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function AnnouncementBar() {
  return <div className="announcement"><span>COMPLIMENTARY DELIVERY ON ORDERS ABOVE RS. 25,000</span><Link to="/shipping-policy">Discover more <ArrowRight size={12} /></Link></div>
}
