import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import {
  HardHat,
  ClipboardList,
  Boxes,
  History,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Users as UsersIcon,
} from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import InputInspeksiPage from './pages/InputInspeksiPage'
import InventarisPage from './pages/InventarisPage'
import LogRiwayatPage from './pages/LogRiwayatPage'
import MasterDataPage from './pages/MasterDataPage'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'

const menuItems = [
  { to: '/', label: 'Dashboard', icon: HardHat },
  { to: '/input-inspeksi', label: 'Input Inspeksi', icon: ClipboardList },
  { to: '/inventaris', label: 'Inventaris APD', icon: Boxes },
  { to: '/log-riwayat', label: 'Log Riwayat', icon: History },
  { to: '/master-data', label: 'Master Data', icon: Settings, adminOnly: true },
  {
    to: '/users',
    label: 'Manajemen User',
    icon: UsersIcon,
    adminOnly: true,
  },
]

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ isAuthenticated, isAdmin, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppContent({ auth, isAuthenticated, onLogin, onLogout }) {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userRole = auth.user?.role
    ? String(auth.user.role).toLowerCase()
    : null
  const isAdmin = userRole === 'admin' || userRole === 'koordinator'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile: overlay when menu open */}
      {isAuthenticated && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          style={{ opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: drawer on mobile, collapsible on desktop */}
      {isAuthenticated && (
        <aside
          className={[
            'fixed md:static inset-y-0 left-0 z-50 bg-slate-900 text-slate-50 flex flex-col transition-all duration-200 ease-out',
            'w-64 md:flex-shrink-0',
            sidebarCollapsed ? 'md:w-20' : 'md:w-64',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          ].join(' ')}
        >
          <div className={[
            'border-b border-slate-800 flex items-center gap-3 flex-shrink-0',
            sidebarCollapsed ? 'px-3 py-4 justify-center md:justify-center' : 'px-6 py-5 md:justify-start',
          ].join(' ')}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            <HardHat className="h-8 w-8 text-amber-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <div className="pr-8 md:pr-0 min-w-0">
                <div className="font-semibold text-lg truncate">SAFETYPRO</div>
                {auth.user && (
                  <div className="text-xs text-slate-400 mt-1 truncate">
                    Masuk sebagai{' '}
                    <span className="font-medium text-slate-200">
                      {auth.user.fullName || auth.user.username}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      sidebarCollapsed ? 'justify-center md:justify-center' : '',
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-200 hover:bg-slate-800/60 hover:text-white',
                    ].join(' ')
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
          <div className={[
            'border-t border-slate-800 flex items-center gap-2 flex-shrink-0',
            sidebarCollapsed ? 'px-2 py-3 flex-col md:flex-col' : 'px-6 py-4 justify-between',
          ].join(' ')}>
            {!sidebarCollapsed && (
              <div className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} SAFETYPRO
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="hidden md:inline-flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                title={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className={[
                  'inline-flex items-center px-2 py-1 rounded-md border border-slate-600 text-[11px] font-medium text-slate-100 hover:bg-slate-800',
                  sidebarCollapsed ? 'px-2 md:w-full justify-center' : '',
                ].join(' ')}
              >
                Keluar
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {isAuthenticated && (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-slate-900 text-white flex items-center gap-3 px-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <HardHat className="h-6 w-6 text-amber-400" />
          <span className="font-semibold text-sm truncate">SAFETYPRO</span>
        </header>
      )}

      <main className={[
        'flex-1 min-w-0 flex flex-col',
        'p-4 md:p-6',
        isAuthenticated ? 'pt-14 md:pt-6' : '',
      ].join(' ')}>
        <div className="max-w-6xl mx-auto w-full min-w-0">
            <Routes>
              <Route
                path="/login"
                element={
                  <LoginPage
                    onLogin={onLogin}
                    isAuthenticated={isAuthenticated}
                  />
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/input-inspeksi"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <InputInspeksiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventaris"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <InventarisPage isAdmin={isAdmin} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log-riwayat"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <LogRiwayatPage isAdmin={isAdmin} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/master-data"
                element={
                  <AdminRoute
                    isAuthenticated={isAuthenticated}
                    isAdmin={isAdmin}
                  >
                    <MasterDataPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <AdminRoute
                    isAuthenticated={isAuthenticated}
                    isAdmin={isAdmin}
                  >
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="*"
                element={
                  <Navigate
                    to={isAuthenticated ? '/' : '/login'}
                    replace
                  />
                }
              />
            </Routes>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('authToken')
    const rawUser = localStorage.getItem('authUser')

    if (token) {
      try {
        const user = rawUser ? JSON.parse(rawUser) : null
        return { token, user }
      } catch {
        localStorage.removeItem('authUser')
        return { token, user: null }
      }
    }

    return { token: null, user: null }
  })

  const isAuthenticated = Boolean(auth.token)

  function handleLogin({ token, user }) {
    localStorage.setItem('authToken', token)
    localStorage.setItem('authUser', JSON.stringify(user))
    setAuth({ token, user })
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    setAuth({ token: null, user: null })
  }

  return (
    <BrowserRouter>
      <AppContent
        auth={auth}
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  )
}

export default App
