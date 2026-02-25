import { useEffect, useState } from 'react'
import { Building2, HardHat, PlusCircle, Trash2 } from 'lucide-react'
import api from '../services/api'

function MasterDataPage() {
  const [departments, setDepartments] = useState([])
  const [loadingDept, setLoadingDept] = useState(false)
  const [savingDept, setSavingDept] = useState(false)
  const [savingBatch, setSavingBatch] = useState(false)
  const [error, setError] = useState('')
  const [batchInfo, setBatchInfo] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [formDept, setFormDept] = useState({
    name: '',
    code: '',
  })

  const [formBatch, setFormBatch] = useState({
    departmentId: '',
    namaApd: '',
    jumlahUnit: '',
    lokasi: '',
  })

  async function loadMaster() {
    setLoadingDept(true)
    setError('')
    try {
      const deptRes = await api.get('/departments')
      setDepartments(deptRes.data || [])
    } catch (err) {
      console.error('Failed to load master data', err)
      setError('Gagal memuat master data')
    } finally {
      setLoadingDept(false)
    }
  }

  useEffect(() => {
    loadMaster()
  }, [])

  function handleDeptChange(e) {
    const { name, value } = e.target
    setFormDept((prev) => ({ ...prev, [name]: value }))
  }

  async function handleDeptSubmit(e) {
    e.preventDefault()
    setSavingDept(true)
    setError('')
    try {
      const res = await api.post('/departments', {
        name: formDept.name,
        code: formDept.code,
      })
      setDepartments((prev) => [...prev, res.data])
      setFormDept({ name: '', code: '' })
    } catch (err) {
      console.error('Failed to create department', err)
      setError(
        err.response?.data?.message || 'Gagal menambahkan departemen baru',
      )
    } finally {
      setSavingDept(false)
    }
  }

  async function handleDeptDelete(id) {
    if (!window.confirm('Hapus departemen ini? Data terkait mungkin ikut terdampak.')) {
      return
    }
    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/departments/${id}`)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Failed to delete department', err)
      setError(
        err.response?.data?.message ||
          'Gagal menghapus departemen. Pastikan tidak sedang digunakan APD/log.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function handleBatchChange(e) {
    const { name, value } = e.target
    setFormBatch((prev) => ({ ...prev, [name]: value }))
  }

  async function handleBatchSubmit(e) {
    e.preventDefault()
    setSavingBatch(true)
    setError('')
    setBatchInfo(null)

    try {
      const payload = {
        departmentId: formBatch.departmentId,
        namaApd: formBatch.namaApd,
        jumlahUnit: Number(formBatch.jumlahUnit),
        lokasi: formBatch.lokasi || null,
      }
      const res = await api.post('/batch-registration', payload)

      setBatchInfo({
        created: res.data.created,
        tags: res.data.tags || [],
      })

      setFormBatch((prev) => ({
        ...prev,
        jumlahUnit: '',
      }))
    } catch (err) {
      console.error('Failed to run batch registration', err)
      setError(
        err.response?.data?.message ||
          'Gagal melakukan batch registration APD baru',
      )
    } finally {
      setSavingBatch(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-600">
          Kelola departemen dan lakukan batch registration asset APD baru.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Building2 className="h-4 w-4 text-primary-600" />
              Data Departemen
            </div>
            <p className="text-xs text-slate-600">
              Tambahkan departemen baru dan lihat daftar departemen yang sudah
              terdaftar.
            </p>

            <form
              onSubmit={handleDeptSubmit}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
            >
              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Nama Departemen
                </label>
                <input
                  type="text"
                  name="name"
                  value={formDept.name}
                  onChange={handleDeptChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Kode
                </label>
                <input
                  type="text"
                  name="code"
                  value={formDept.code}
                  onChange={handleDeptChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingDept}
                  className="w-full inline-flex bg-red-500 items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="h-4 w-4" />
                  {savingDept ? 'Menyimpan...' : 'Tambah Departemen'}
                </button>
              </div>
            </form>

            <div className="border-t border-slate-200 pt-3 max-h-64 overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Kode
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Nama
                    </th>
                    <th className="text-left font-semibold text-slate-600 px-3 py-1.5">
                      Dibuat
                    </th>
                    <th className="text-right font-semibold text-slate-600 px-3 py-1.5">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 && !loadingDept ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 text-center text-xs text-slate-500"
                      >
                        Belum ada departemen terdaftar.
                      </td>
                    </tr>
                  ) : (
                    departments.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-1.5 font-mono text-slate-800">
                          {d.code}
                        </td>
                        <td className="px-3 py-1.5 text-slate-800">{d.name}</td>
                        <td className="px-3 py-1.5 text-[11px] text-slate-500">
                          {d.created_at
                            ? new Date(d.created_at).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeptDelete(d.id)}
                            disabled={deletingId === d.id}
                            className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {deletingId === d.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <HardHat className="h-4 w-4 text-primary-600" />
              Batch Registration APD
            </div>
            <p className="text-xs text-slate-600">
              Generate beberapa tag asset APD sekaligus untuk satu departemen
              dan jenis APD tertentu.
            </p>

            <form onSubmit={handleBatchSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Departemen
                </label>
                <select
                  name="departmentId"
                  value={formBatch.departmentId}
                  onChange={handleBatchChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Pilih departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Jenis APD (nama alat)
                </label>
                <input
                  type="text"
                  name="namaApd"
                  value={formBatch.namaApd}
                  onChange={handleBatchChange}
                  required
                  placeholder="Contoh: Safety Helmet, Safety Shoes"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  min={1}
                  name="jumlahUnit"
                  value={formBatch.jumlahUnit}
                  onChange={handleBatchChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Lokasi (opsional)
                </label>
                <input
                  type="text"
                  name="lokasi"
                  value={formBatch.lokasi}
                  onChange={handleBatchChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingBatch}
                className="w-full inline-flex bg-red-500 items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingBatch ? 'Memproses...' : 'Generate Tag APD'}
              </button>
            </form>

            {batchInfo && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 space-y-1">
                <div className="font-semibold">
                  Batch registration berhasil:{' '}
                  <span className="font-bold">{batchInfo.created}</span> unit
                </div>
                {batchInfo.tags?.length > 0 && (
                  <div>
                    Tag yang dibuat:
                    <div className="mt-1 flex flex-wrap gap-1">
                      {batchInfo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md border border-emerald-300 bg-white px-2 py-0.5 font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default MasterDataPage

