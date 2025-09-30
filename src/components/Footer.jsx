import logo from '../assets/logo.png'

export default function Footer() {
  return (
  <footer className="footer p-10 bg-base-200 text-base-content">
      <aside className="flex flex-col items-start gap-2">
        <img src={logo} alt="Venky's" className="h-8 w-auto object-contain" />
        <p>Local flavors, delivered with love.</p>
      </aside>
      <nav>
        <h6 className="footer-title">Company</h6>
        <a className="link link-hover" href="/about">About</a>
        <a className="link link-hover" href="/contact">Contact</a>
      </nav>
      <nav>
        <h6 className="footer-title">Legal</h6>
        <a className="link link-hover">Terms of use</a>
        <a className="link link-hover">Privacy policy</a>
      </nav>
    </footer>
  )
}
