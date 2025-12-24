import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { BRAND_SHORT } from '../lib/data'
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa'
import { MdPhone, MdEmail, MdLocationOn } from 'react-icons/md'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-base-200 text-base-content">
      <div className="footer p-10 max-w-7xl mx-auto">
        {/* Brand */}
        <aside className="flex flex-col items-start gap-3">
          <img src={logo} alt={BRAND_SHORT} className="h-10 w-auto object-contain" />
          <p className="text-sm opacity-80 max-w-xs">Local flavors, delivered with love. Fresh, homemade food right to your doorstep.</p>
          <div className="flex gap-3 mt-2">
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="btn btn-circle btn-sm btn-ghost hover:bg-green-500/20 hover:text-green-500">
              <FaWhatsapp className="w-5 h-5" />
            </a>
            <a href="#" className="btn btn-circle btn-sm btn-ghost hover:bg-pink-500/20 hover:text-pink-500">
              <FaInstagram className="w-5 h-5" />
            </a>
            <a href="#" className="btn btn-circle btn-sm btn-ghost hover:bg-blue-500/20 hover:text-blue-500">
              <FaFacebook className="w-5 h-5" />
            </a>
          </div>
        </aside>
        
        {/* Quick Links */}
        <nav>
          <h6 className="footer-title">Quick Links</h6>
          <Link to="/" className="link link-hover">Home</Link>
          <Link to="/about" className="link link-hover">About Us</Link>
          <Link to="/contact" className="link link-hover">Contact</Link>
          <Link to="/profile" className="link link-hover">My Profile</Link>
        </nav>
        
        {/* Legal */}
        <nav>
          <h6 className="footer-title">Legal</h6>
          <Link to="/terms" className="link link-hover">Terms & Conditions</Link>
          <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
          <Link to="/shipping" className="link link-hover">Shipping Policy</Link>
          <Link to="/cancellation-refunds" className="link link-hover">Refund Policy</Link>
        </nav>
        
        {/* Contact Info */}
        <nav>
          <h6 className="footer-title">Contact Us</h6>
          <a href="tel:+919999999999" className="link link-hover flex items-center gap-2">
            <MdPhone className="w-4 h-4" /> +91 99999 99999
          </a>
          <a href="mailto:hello@venkys.com" className="link link-hover flex items-center gap-2">
            <MdEmail className="w-4 h-4" /> hello@venkys.com
          </a>
          <span className="flex items-start gap-2 opacity-80">
            <MdLocationOn className="w-4 h-4 mt-0.5 flex-shrink-0" /> 
            <span>Durgapur, West Bengal</span>
          </span>
        </nav>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-base-300">
        <div className="footer footer-center p-4 max-w-7xl mx-auto text-sm opacity-70">
          <p>© {currentYear} {BRAND_SHORT}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
