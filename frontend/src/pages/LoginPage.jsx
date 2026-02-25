import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardHat, Lock } from 'lucide-react'
import api from '../services/api'

function LoginPage({ onLogin, isAuthenticated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/login', {
        username: form.username,
        password: form.password,
      })

      if (onLogin) {
        onLogin({
          token: res.data.token,
          user: res.data.user,
        })
      }

      navigate('/', { replace: true })
    } catch (err) {
      console.error('Login failed', err)
      setError(
        err.response?.data?.message ||
          'Gagal login, periksa kembali username dan password',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <HardHat className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                PPE Management System
              </div>
              <div className="text-xl font-semibold text-slate-900">
                SAFETYPRO
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Login
            </h1>
            <p className="text-sm text-slate-600">
              Masuk untuk mengelola data inventaris APD dan inspeksi.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex bg-red-500 items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </button>
          </form>

          {/* <p className="text-xs text-slate-500 text-center">
            Default akun: <span className="font-medium">admin / admin123</span>
          </p> */}
        </div>
      </div>
    </div>
  )
}

export default LoginPage

