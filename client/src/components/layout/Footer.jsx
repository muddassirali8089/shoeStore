import { ArrowUpRight, Camera, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const columns = [
  ['SHOP', ['Shop all|/shop', 'Men|/shop?category=men', 'Women|/shop?category=women', 'Sports|/shop?category=sports', 'Hiking|/shop?category=hiking', 'Casual|/shop?category=casual']],
  ['SUPPORT', ['Track order|/track-order', 'Shipping|/shipping-policy', 'Returns|/return-policy', 'Size guide|/size-guide']],
  ['YOUR ACCOUNT', ['My account|/account', 'Orders|/account/orders', 'Wishlist|/wishlist']],
  ['COMPANY', ['About MGEARS|/about', 'Contact us|/contact']],
]
export default function Footer() {
  return <footer className="site-footer"><div className="footer-main">
    <div className="footer-brand"><Link to="/" className="brand-logo"><span className="logo-mark">M</span><span>MGEARS<small>PRE-LOVED. WELL-LOVED.</small></span></Link><p>Find the right pair. Give great shoes a second stride.</p><a className="social-link" href="https://instagram.com" aria-label="Instagram"><Camera size={17} /></a></div>
    {columns.map(([title, links]) => <div className="footer-column" key={title}><h3>{title}</h3>{links.map((item) => { const [label, url] = item.split('|'); return <Link to={url} key={label}>{label}</Link> })}</div>)}
    <div className="footer-column contact-column"><h3>LET'S TALK</h3><span><MapPin size={15} /> Lahore, Pakistan</span><a href="mailto:hello@mgears.pk"><Mail size={15} /> hello@mgears.pk</a><a href="tel:+923001234567"><Phone size={15} /> +92 300 123 4567</a><Link to="/contact">Get in touch <ArrowUpRight size={14} /></Link></div>
  </div><div className="footer-bottom"><span>© 2026 MGEARS. All rights reserved.</span><span>Thoughtfully sourced. Carefully checked.</span><span>Cash on delivery · Bank transfer</span></div></footer>
}
