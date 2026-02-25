import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  HardHat,
  ClipboardList,
  Boxes,
  History,
  Settings,
} from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import InputInspeksiPage from './pages/InputInspeksiPage'
import InventarisPage from './pages/InventarisPage'
import LogRiwayatPage from './pages/LogRiwayatPage'
import MasterDataPage from './pages/MasterDataPage'
import LoginPage from './pages/LoginPage'

const menuItems = [
  { to: '/', label: 'Dashboard', icon: HardHat },
  { to: '/input-inspeksi', label: 'Input Inspeksi', icon: ClipboardList },
  { to: '/inventaris', label: 'Inventaris APD', icon: Boxes },
  { to: '/log-riwayat', label: 'Log Riwayat', icon: History },
  { to: '/master-data', label: 'Master Data', icon: Settings },
]

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
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
      <div className="min-h-screen bg-slate-100 flex">
        {isAuthenticated && (
          <aside className="w-64 bg-slate-900 text-slate-50 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
              <HardHat className="h-8 w-8 text-amber-400" />
              <div>
                {/* <div className="text-xs uppercase tracking-wide text-slate-400">
                  PPE Management System
                </div> */}
                <div className="font-semibold text-lg">SAFETYPRO</div>
                {auth.user && (
                  <div className="text-xs text-slate-400 mt-1">
                    Masuk sebagai{' '}
                    <span className="font-medium text-slate-200">
                      {auth.user.fullName || auth.user.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-200 hover:bg-slate-800/60 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
            <div className="px-6 py-4 text-xs text-slate-500 border-t border-slate-800 flex items-center justify-between gap-2">
              <div>&copy; {new Date().getFullYear()} SAFETYPRO</div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-2 py-1 rounded-md border border-slate-600 text-[11px] font-medium text-slate-100 hover:bg-slate-800"
              >
                Keluar
              </button>
            </div>
          </aside>
        )}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route
                path="/login"
                element={
                  <LoginPage
                    onLogin={handleLogin}
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
                    <InventarisPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log-riwayat"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <LogRiwayatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/master-data"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <MasterDataPage />
                  </ProtectedRoute>
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
    </BrowserRouter>
  )
}

export default App
