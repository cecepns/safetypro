import { useEffect, useState } from 'react'
import { UserPlus, Users, Trash2 } from 'lucide-react'
import api from '../services/api'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
  })

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/users')
      setUsers(res.data || [])
    } catch (err) {
      console.error('Failed to load users', err)
      setError('Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: 'inspektor',
      }
      const res = await api.post('/users', payload)
      setUsers((prev) => [...prev, res.data])
      setForm({
        username: '',
        password: '',
        fullName: '',
      })
    } catch (err) {
      console.error('Failed to create user', err)
      setError(err.response?.data?.message || 'Gagal menambahkan user inspektor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        'Hapus user ini? User dengan role Admin/Koordinator tidak dapat dihapus.',
      )
    ) {
      return
    }

    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      console.error('Failed to delete user', err)
      setError(err.response?.data?.message || 'Gagal menghapus user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Manajemen User
        </h1>
        <p className="text-sm text-slate-600">
          Tambah akun Inspektor dan kelola akun yang memiliki akses ke sistem.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserPlus className="h-4 w-4 text-primary-600" />
              Tambah User Inspektor
            </div>
            <p className="text-xs text-slate-600">
              Buat akun baru dengan role <span className="font-semibold">Inspektor</span>.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-red-500 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus className="h-4 w-4" />
                {saving ? 'Menyimpan...' : 'Tambah User'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Users className="h-4 w-4 text-primary-600" />
              Daftar User
            </div>
            <p className="text-xs text-slate-600">
              Hanya Admin/Koordinator yang dapat mengelola akun user.
            </p>

            <div className="border-t border-slate-200 pt-3 max-h-72 overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Username
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Nama
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Role
                    </th>
                    <th className="text-right font-semibold text-slate-600 px-3 py-1.5">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-xs text-slate-500"
                      >
                        Belum ada user terdaftar.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-1.5 font-mono text-slate-800">
                          {u.username}
                        </td>
                        <td className="px-3 py-1.5 text-slate-800">
                          {u.fullName || '-'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-800 capitalize">
                          {u.role}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {deletingId === u.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {loading && (
                <div className="px-3 py-2 text-[11px] text-slate-500 italic">
                  Memuat data user...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default UsersPage

