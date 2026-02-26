import { useEffect, useMemo, useState } from 'react'
import { Filter, RefreshCw, Trash2, FileCheck } from 'lucide-react'
import api from '../services/api'

const KONDISI_BADGE = {
  layak: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  perlu_perbaikan: 'bg-amber-50 text-amber-700 border-amber-200',
  rusak_total: 'bg-red-50 text-red-700 border-red-200',
}

const KONDISI_LABEL = {
  layak: 'Layak Pakai',
  perlu_perbaikan: 'Perlu Perbaikan',
  rusak_total: 'Rusak Total',
}

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InventarisPage({ isAdmin = false }) {
  const [departments, setDepartments] = useState([])
  const [apdNames, setApdNames] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [verifikasiModal, setVerifikasiModal] = useState(null)
  const [verifikasiSaving, setVerifikasiSaving] = useState(false)
  const [filters, setFilters] = useState({
    departmentId: '',
    jenisApd: '',
    search: '',
  })

  useEffect(() => {
    let ignore = false
    async function loadMaster() {
      try {
        const [deptRes, apdRes] = await Promise.all([
          api.get('/departments'),
          api.get('/apd-names'),
        ])
        if (ignore) return
        setDepartments(deptRes.data || [])
        setApdNames(apdRes.data || [])
      } catch (err) {
        console.error('Failed to load master data', err)
      }
    }
    loadMaster()
    return () => {
      ignore = true
    }
  }, [])

  async function loadInventaris() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.departmentId) params.departmentId = filters.departmentId
      if (filters.jenisApd) params.namaApd = filters.jenisApd

      const res = await api.get('/inventaris', { params })
      setItems(res.data || [])
    } catch (err) {
      console.error('Failed to load inventaris', err)
      setError('Gagal memuat inventaris APD')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventaris()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  async function handleResetFilters() {
    setFilters({
      departmentId: '',
      jenisApd: '',
      search: '',
    })
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/inventaris')
      setItems(res.data || [])
    } catch (err) {
      console.error('Failed to reset inventaris', err)
      setError('Gagal memuat ulang inventaris APD')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    let list = items

    // Filter cepat berdasarkan teks
    const term = filters.search.trim().toLowerCase()
    if (term) {
      list = list.filter((item) => {
        return (
          item.nama_apd?.toLowerCase().includes(term) ||
          item.tag_id?.toLowerCase().includes(term) ||
          item.department_name?.toLowerCase().includes(term) ||
          item.department_code?.toLowerCase().includes(term) ||
          item.lokasi?.toLowerCase().includes(term) ||
          item.verifikasi_k3l?.toLowerCase().includes(term)
        )
      })
    }

    // Filter tambahan berdasarkan dropdown Departemen & Jenis APD
    if (filters.departmentId) {
      const deptId = Number(filters.departmentId)
      list = list.filter(
        (item) => Number(item.department_id) === deptId,
      )
    }

    if (filters.jenisApd) {
      const jenis = filters.jenisApd.toLowerCase()
      list = list.filter(
        (item) => item.nama_apd?.toLowerCase() === jenis,
      )
    }

    return list
  }, [filters.search, filters.departmentId, filters.jenisApd, items])

  async function handleDeleteItem(id) {
    if (
      !window.confirm(
        'Hapus asset APD ini? Riwayat inspeksi (jika ada) akan tetap tersimpan.',
      )
    ) {
      return
    }
    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/inventaris/${id}`)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete asset', err)
      setError(
        err.response?.data?.message ||
          'Gagal menghapus asset APD. Pastikan tidak sedang digunakan log inspeksi.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function openVerifikasiModal(item) {
    setVerifikasiModal({
      id: item.id,
      tag_id: item.tag_id,
      nama_apd: item.nama_apd,
      verifikasiK3L: item.verifikasi_k3l || '',
    })
  }

  function closeVerifikasiModal() {
    setVerifikasiModal(null)
  }

  function handleVerifikasiChange(e) {
    setVerifikasiModal((prev) =>
      prev ? { ...prev, verifikasiK3L: e.target.value } : null,
    )
  }

  async function handleSaveVerifikasi(e) {
    e.preventDefault()
    if (!verifikasiModal) return
    setVerifikasiSaving(true)
    setError('')
    try {
      await api.patch(
        `/inventaris/${verifikasiModal.id}/verifikasi-k3l`,
        { verifikasiK3L: verifikasiModal.verifikasiK3L },
      )
      setItems((prev) =>
        prev.map((it) =>
          it.id === verifikasiModal.id
            ? { ...it, verifikasi_k3l: verifikasiModal.verifikasiK3L }
            : it,
        ),
      )
      closeVerifikasiModal()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Gagal menyimpan Verifikasi K3L. Pastikan sudah ada data inspeksi.',
      )
    } finally {
      setVerifikasiSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Inventaris APD
          </h1>
          <p className="text-sm text-slate-600">
            Daftar seluruh asset APD beserta lokasi dan kondisinya.
          </p>
        </div>
        <button
          type="button"
          onClick={loadInventaris}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat ulang
        </button>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Departemen
            </label>
            <select
              name="departmentId"
              value={filters.departmentId}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Jenis APD
            </label>
            <select
              name="jenisApd"
              value={filters.jenisApd}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua jenis</option>
              {apdNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              Pencarian cepat
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Cari nama APD, tag ID, departemen, atau lokasi..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan{' '}
            <span className="font-semibold">{filteredItems.length}</span> asset
            APD
          </div>
          {loading && <div className="italic">Memuat data...</div>}
        </div>

        {error && (
          <div className="px-4 py-2.5 text-xs text-red-700 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-xs min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Departemen
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Jenis APD
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Tag ID
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Kondisi
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Lokasi
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Inspeksi Terakhir
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Verifikasi K3L
                </th>
                <th className="text-right font-semibold text-slate-600 px-4 py-2">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-xs text-slate-500"
                  >
                    Belum ada data inventaris yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {item.department_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.department_code}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top text-slate-800">
                      {item.nama_apd}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-800">
                        {item.tag_id}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          KONDISI_BADGE[item.kondisi] ||
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {KONDISI_LABEL[item.kondisi] || item.kondisi}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-slate-800">
                      {item.lokasi || '-'}
                    </td>
                    <td className="px-4 py-2 align-top text-slate-700">
                      {formatDateTime(item.last_inspection_at)}
                    </td>
                    <td className="px-4 py-2 align-top max-w-[180px]">
                      <span className="line-clamp-2 text-[11px] text-slate-600 block">
                        {item.verifikasi_k3l || '-'}
                      </span>
                      {item.last_inspection_at && (
                        <button
                          type="button"
                          onClick={() => openVerifikasiModal(item)}
                          className="inline-flex items-center gap-1 mt-0.5 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <FileCheck className="h-2.5 w-2.5" />
                          {item.verifikasi_k3l ? 'Edit' : 'Isi'} Verifikasi K3L
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-right">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {verifikasiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verifikasi-modal-title"
        >
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md p-4 space-y-3">
            <h2
              id="verifikasi-modal-title"
              className="text-sm font-semibold text-slate-900"
            >
              Verifikasi K3L — {verifikasiModal.nama_apd} ({verifikasiModal.tag_id})
            </h2>
            <form onSubmit={handleSaveVerifikasi} className="space-y-3">
              <textarea
                value={verifikasiModal.verifikasiK3L}
                onChange={handleVerifikasiChange}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Isi verifikasi K3L setelah data inspeksi diinput..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeVerifikasiModal}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={verifikasiSaving}
                  className="inline-flex items-center bg-red-500 gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifikasiSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventarisPage

