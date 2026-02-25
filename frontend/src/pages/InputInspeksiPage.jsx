import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import api from '../services/api'

const STATUS_OPTIONS = [
  { value: 'layak', label: 'Layak Pakai' },
  { value: 'perlu_perbaikan', label: 'Perlu Perbaikan' },
  { value: 'rusak_total', label: 'Rusak Total' },
]

function InputInspeksiPage() {
  const [departments, setDepartments] = useState([])
  const [apdNames, setApdNames] = useState([])
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    inspectorName: '',
    lokasiKerja: '',
    departmentId: '',
    jenisApd: '',
    tagId: '',
    statusTemuan: '',
    remarks: '',
  })

  useEffect(() => {
    async function loadMaster() {
      try {
        const [deptRes, namesRes] = await Promise.all([
          api.get('/departments'),
          api.get('/apd-names'),
        ])
        setDepartments(deptRes.data || [])
        setApdNames(namesRes.data || [])
      } catch (err) {
        console.error('Failed to load master data', err)
      }
    }
    loadMaster()
  }, [])

  useEffect(() => {
    async function loadTags() {
      if (!form.departmentId || !form.jenisApd) {
        setTags([])
        return
      }
      try {
        const res = await api.get('/apd-tags', {
          params: {
            departmentId: form.departmentId,
            namaApd: form.jenisApd,
          },
        })
        setTags(res.data || [])
      } catch (err) {
        console.error('Failed to load tags', err)
      }
    }
    loadTags()
  }, [form.departmentId, form.jenisApd])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inspections', {
        inspectorName: form.inspectorName,
        lokasiKerja: form.lokasiKerja,
        departmentId: form.departmentId,
        jenisApd: form.jenisApd,
        tagId: form.tagId,
        statusTemuan: form.statusTemuan,
        remarks: form.remarks,
      })
      setForm({
        inspectorName: '',
        lokasiKerja: '',
        departmentId: '',
        jenisApd: '',
        tagId: '',
        statusTemuan: '',
        remarks: '',
      })
      setTags([])
      alert('Inspeksi berhasil disimpan')
    } catch (err) {
      console.error('Failed to save inspection', err)
      alert('Gagal menyimpan inspeksi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Input Inspeksi PPE
        </h1>
        <p className="text-sm text-slate-600">
          Catat hasil inspeksi APD beserta kondisi dan catatan temuan.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Inspektor
            </label>
            <input
              type="text"
              name="inspectorName"
              value={form.inspectorName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lokasi Kerja
            </label>
            <input
              type="text"
              name="lokasiKerja"
              value={form.lokasiKerja}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Departemen
            </label>
            <select
              name="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Pilih departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jenis APD
            </label>
            <select
              name="jenisApd"
              value={form.jenisApd}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Pilih jenis APD</option>
              {apdNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID Tag APD
            </label>
            <select
              name="tagId"
              value={form.tagId}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Pilih ID Tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.tag_id}>
                  {t.tag_id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status Temuan
            </label>
            <select
              name="statusTemuan"
              value={form.statusTemuan}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Pilih status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Remarks / Catatan
          </label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex bg-red-500 items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan Inspeksi'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InputInspeksiPage

