import { useEffect, useMemo, useState } from 'react'
import {
  Filter,
  RefreshCw,
  FileDown,
  FileText,
  Printer,
  FileCheck,
  Trash2,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
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

function LogRiwayatPage({ isAdmin = false }) {
  const [departments, setDepartments] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifikasiModal, setVerifikasiModal] = useState(null)
  const [verifikasiSaving, setVerifikasiSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [filters, setFilters] = useState({
    departmentId: '',
    search: '',
    verifikasiK3L: '', // '' = semua, 'sudah' = sudah verifikasi, 'belum' = belum verifikasi
  })

  useEffect(() => {
    let ignore = false
    async function loadMaster() {
      try {
        const res = await api.get('/departments')
        if (!ignore) setDepartments(res.data || [])
      } catch (err) {
        console.error('Failed to load departments', err)
      }
    }
    loadMaster()
    return () => {
      ignore = true
    }
  }, [])

  async function loadLogs() {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (filters.departmentId) params.departmentId = filters.departmentId
      const res = await api.get('/logs', { params })
      setLogs(res.data || [])
    } catch (err) {
      console.error('Failed to load logs', err)
      setError('Gagal memuat log riwayat inspeksi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const filteredLogs = useMemo(() => {
    let list = logs

    if (filters.departmentId) {
      const deptId = Number(filters.departmentId)
      list = list.filter(
        (log) => Number(log.department_id) === deptId,
      )
    }

    const verifikasiFilter = filters.verifikasiK3L
    if (verifikasiFilter === 'sudah') {
      list = list.filter(
        (log) => log.verifikasi_k3l != null && log.verifikasi_k3l.trim() !== '',
      )
    } else if (verifikasiFilter === 'belum') {
      list = list.filter(
        (log) =>
          log.verifikasi_k3l == null || log.verifikasi_k3l.trim() === '',
      )
    }

    const term = filters.search.trim().toLowerCase()
    if (!term) return list
    return list.filter((log) => {
      return (
        log.inspector_name?.toLowerCase().includes(term) ||
        log.item_name?.toLowerCase().includes(term) ||
        log.tag_id?.toLowerCase().includes(term) ||
        log.department_name?.toLowerCase().includes(term) ||
        log.department_code?.toLowerCase().includes(term) ||
        log.lokasi?.toLowerCase().includes(term) ||
        log.remarks?.toLowerCase().includes(term) ||
        log.verifikasi_k3l?.toLowerCase().includes(term)
      )
    })
  }, [filters.search, filters.verifikasiK3L, filters.departmentId, logs])

  function openVerifikasiModal(log) {
    setVerifikasiModal({
      id: log.id,
      item_name: log.item_name,
      tag_id: log.tag_id,
      verifikasiK3L: log.verifikasi_k3l || '',
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
        `/logs/${verifikasiModal.id}/verifikasi-k3l`,
        { verifikasiK3L: verifikasiModal.verifikasiK3L },
      )
      setLogs((prev) =>
        prev.map((log) =>
          log.id === verifikasiModal.id
            ? { ...log, verifikasi_k3l: verifikasiModal.verifikasiK3L }
            : log,
        ),
      )
      closeVerifikasiModal()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan Verifikasi K3L.',
      )
    } finally {
      setVerifikasiSaving(false)
    }
  }

  async function handleDeleteLog(id) {
    if (!isAdmin) return
    if (!window.confirm('Hapus riwayat inspeksi ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    setDeletingId(id)
    setError('')
    try {
      await api.delete(`/logs/${id}`)
      setLogs((prev) => prev.filter((log) => log.id !== id))
    } catch (err) {
      console.error('Failed to delete log', err)
      setError(
        err.response?.data?.message ||
          'Gagal menghapus riwayat inspeksi. Silakan coba lagi.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function exportExcel() {
    const data = filteredLogs.map((row) => ({
      'WAKTU & INSPEKTOR': `${formatDateTime(row.inspected_at)} - ${
        row.inspector_name
      }`,
      DEPARTEMEN: `${row.department_code} - ${row.department_name}`,
      ITEM: row.item_name,
      'ID TAG': row.tag_id,
      LOKASI: row.lokasi,
      KONDISI: KONDISI_LABEL[row.kondisi] || row.kondisi,
      REMARKS: row.remarks || '',
      'TTD SAFETY REPRESENTATIVE': '',
      'KETUA K3L': '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Log Riwayat')
    XLSX.writeFile(wb, 'safetypro-log-riwayat.xlsx')
  }

  function exportPdf() {
    const doc = new jsPDF('l', 'pt', 'a4')
    doc.text('SAFETYPRO - Log Riwayat Inspeksi', 40, 40)

    const body = filteredLogs.map((row) => [
      `${formatDateTime(row.inspected_at)} - ${row.inspector_name}`,
      `${row.department_code} - ${row.department_name}`,
      row.item_name,
      row.tag_id,
      row.lokasi,
      KONDISI_LABEL[row.kondisi] || row.kondisi,
      row.remarks || '',
    ])

    autoTable(doc, {
      startY: 60,
      head: [
        [
          'WAKTU & INSPEKTOR',
          'DEPARTEMEN',
          'ITEM',
          'ID TAG',
          'LOKASI',
          'KONDISI',
          'REMARKS',
        ],
      ],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    })

    const finalY = (doc.lastAutoTable?.finalY || 60) + 40
    doc.setFontSize(10)

    doc.text('Ttd Safety Representative', 80, finalY)
    doc.text('Ketua K3L', 400, finalY)

    doc.save('safetypro-log-riwayat.pdf')
  }

  function printPreview() {
    const win = window.open('', '_blank')
    if (!win) return

    const rowsHtml = filteredLogs
      .map(
        (row) => `
      <tr>
        <td>${formatDateTime(row.inspected_at)} - ${
          row.inspector_name
        }</td>
        <td>${row.department_code} - ${row.department_name}</td>
        <td>${row.item_name}</td>
        <td>${row.tag_id}</td>
        <td>${row.lokasi}</td>
        <td>${KONDISI_LABEL[row.kondisi] || row.kondisi}</td>
        <td>${row.remarks || ''}</td>
      </tr>`,
      )
      .join('')

    win.document.write(`
      <html>
        <head>
          <title>Print Preview - SAFETYPRO Log Riwayat</title>
          <style>
            body { font-family: system-ui, sans-serif; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 4px 6px; }
            th { background: #e5e7eb; }
          </style>
        </head>
        <body>
          <h2>SAFETYPRO - Log Riwayat Inspeksi</h2>
          <table>
            <thead>
              <tr>
                <th>WAKTU & INSPEKTOR</th>
                <th>DEPARTEMEN</th>
                <th>ITEM</th>
                <th>ID TAG</th>
                <th>LOKASI</th>
                <th>KONDISI</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <div>Safety Representative</div>
              <div style="margin-top: 60px;">(............................)</div>
            </div>
            <div style="text-align: center;">
              <div>Ketua K3L</div>
              <div style="margin-top: 60px;">(............................)</div>
            </div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Log Riwayat Inspeksi
          </h1>
          <p className="text-sm text-slate-600">
            Jejak lengkap inspeksi APD yang sudah dilakukan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex bg-red-500 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            <FileDown className="h-3.5 w-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={printPreview}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filter
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
              Verifikasi K3L
            </label>
            <select
              name="verifikasiK3L"
              value={filters.verifikasiK3L}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua</option>
              <option value="sudah">Sudah verifikasi K3L</option>
              <option value="belum">Belum verifikasi K3L</option>
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
              placeholder="Cari inspektor, item APD, tag ID, departemen, lokasi, atau catatan..."
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan{' '}
            <span className="font-semibold">{filteredLogs.length}</span> log
            inspeksi
          </div>
          {loading && <div className="italic">Memuat data...</div>}
        </div>

        {error && (
          <div className="px-4 py-2.5 text-xs text-red-700 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Waktu Inspeksi
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Inspektor
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Departemen
                </th>
                <th className="text-left font-semibold text-slate-600 px-4 py-2">
                  Item APD
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
                  Catatan / Verifikasi
                </th>
                {isAdmin && (
                  <th className="text-right font-semibold text-slate-600 px-4 py-2">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="px-4 py-6 text-center text-xs text-slate-500"
                  >
                    Belum ada log inspeksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 align-top"
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {formatDateTime(log.inspected_at)}
                    </td>
                    <td className="px-4 py-2 text-slate-800">
                      <div className="font-medium">{log.inspector_name}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-slate-800">{log.department_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {log.department_code}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-800">
                      {log.item_name}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-800">
                        {log.tag_id}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          KONDISI_BADGE[log.kondisi] ||
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {KONDISI_LABEL[log.kondisi] || log.kondisi}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-800">
                      {log.lokasi}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {log.remarks && (
                        <div className="mb-1 text-[11px] text-slate-700">
                          <span className="font-semibold">Catatan: </span>
                          {log.remarks}
                        </div>
                      )}
                      {log.verifikasi_k3l && (
                        <div className="text-[11px] text-slate-700">
                          <span className="font-semibold">Verifikasi K3L: </span>
                          {log.verifikasi_k3l}
                        </div>
                      )}
                      {!log.remarks && !log.verifikasi_k3l && (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                      <button
                        type="button"
                        onClick={() => openVerifikasiModal(log)}
                        className="inline-flex items-center gap-1 mt-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <FileCheck className="h-2.5 w-2.5" />
                        {log.verifikasi_k3l ? 'Edit' : 'Isi'} Verifikasi K3L
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right align-top">
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deletingId === log.id}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deletingId === log.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </td>
                    )}
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
              Verifikasi K3L — {verifikasiModal.item_name} ({verifikasiModal.tag_id})
            </h2>
            <form onSubmit={handleSaveVerifikasi} className="space-y-3">
              <textarea
                value={verifikasiModal.verifikasiK3L}
                onChange={handleVerifikasiChange}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Isi verifikasi K3L..."
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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

export default LogRiwayatPage

