import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'
import CartDrawer from '../components/CartDrawer'
import ItemModal from '../components/ItemModal'
import Footer from '../components/Footer'
import AuthModal from '../components/AuthModal'
import { useUI } from '../context/UIContext'

export default function Layout() {
  const { authMode } = useUI()

  return (
    <CartDrawer>
      <div className={`app-shell ${authMode ? 'blur-when-auth-open' : ''}`}>
        <NavBar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <ItemModal />
      </div>
      {/* Keep modal outside blurred container */}
      <AuthModal />
    </CartDrawer>
  )
}
