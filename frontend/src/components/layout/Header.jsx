import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, LogIn, LogOut, ShoppingCart, UserCircle } from 'lucide-react'
import Button from '../common/Button'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import useUIStore from '../../store/uiStore'

const Header = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const { logout, logoutStatus } = useAuth()
  const { cart } = useCart()
  const { toggleCart } = useUIStore()

  const navItems = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/admin', label: 'Админ', admin: true },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-card">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-neutral-900">
              Bookstore
            </span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {navItems.map((item) => {
              if (item.protected && !isAuthenticated) return null
              if (item.admin && !user?.is_admin) return null
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-neutral-600 hover:text-primary'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative hidden items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:border-primary hover:text-primary md:flex"
            aria-label="Корзина"
            onClick={toggleCart}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Корзина</span>
            <span className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white shadow-card">
              {cart?.total_items ?? 0}
            </span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm transition hover:border-primary hover:text-primary"
                onClick={() => navigate('/profile')}
              >
                <UserCircle className="h-4 w-4" />
                <span>{user?.full_name || user?.username || 'Профиль'}</span>
              </button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                isLoading={logoutStatus === 'pending'}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Выйти
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                Войти
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Регистрация
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

