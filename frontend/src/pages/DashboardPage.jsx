import { useEffect, useState } from 'react'
import { HardHat, Wrench, ShieldCheck } from 'lucide-react'
import api from '../services/api'

const statCards = [
  {
    key: 'totalAssets',
    label: 'Total Asset',
    icon: HardHat,
    color: 'bg-primary-500/10 text-primary-700',
  },
  {
    key: 'goodCondition',
    label: 'Kondisi Baik',
    icon: ShieldCheck,
    color: 'bg-emerald-500/10 text-emerald-700',
  },
  {
    key: 'needsService',
    label: 'Rusak / Service',
    icon: Wrench,
    color: 'bg-amber-500/10 text-amber-700',
  },
]

function DashboardPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    goodCondition: 0,
    needsService: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard')
        if (!ignore) {
          setStats({
            totalAssets: res.data.totalAssets ?? 0,
            goodCondition: res.data.goodCondition ?? 0,
            needsService: res.data.needsService ?? 0,
          })
        }
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchStats()
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Dashboard SAFETYPRO
        </h1>
        <p className="text-sm text-slate-600">
          Ringkasan kondisi PPE dan aktivitas inspeksi.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4"
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {card.label}
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  {loading ? '...' : stats[card.key]}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DashboardPage

