import { useState, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../lib/firebase'
import { Lock, LockOpen } from '../icons'

const listCampaigns = httpsCallable(functions, 'adminListCampaigns')
const toggleLock = httpsCallable(functions, 'adminToggleLock')
const runCleanup = httpsCallable(functions, 'adminRunCleanup')

function staleness(days) {
  if (days === null || days === undefined) return '—'
  if (days < 1) return 'today'
  return `${days}d`
}

const ENV_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? ''

export default function AdminModal({ onClose }) {
  const [phase, setPhase] = useState(ENV_SECRET ? 'loading' : 'auth')
  const [password, setPassword] = useState(ENV_SECRET)
  const [campaigns, setCampaigns] = useState([])
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [thresholdDays, setThresholdDays] = useState('30')
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState(null)
  const [sortCol, setSortCol] = useState('staleDays')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'staleDays' ? 'desc' : 'asc')
    }
  }

  const sorted = [...campaigns].sort((a, b) => {
    let av = a[sortCol]
    let bv = b[sortCol]
    if (sortCol === 'staleDays') {
      av = av ?? -1
      bv = bv ?? -1
    } else if (sortCol === 'locked') {
      av = av ? 1 : 0
      bv = bv ? 1 : 0
    } else {
      av = (av ?? '').toLowerCase()
      bv = (bv ?? '').toLowerCase()
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortArrow({ col }) {
    if (sortCol !== col) return <span className="opacity-20 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  async function doAuth(pw) {
    try {
      const result = await listCampaigns({ password: pw })
      setCampaigns(result.data)
      setPhase('dashboard')
    } catch {
      setAuthError('Wrong password or server error.')
      setPhase('auth')
    }
  }

  useEffect(() => {
    if (ENV_SECRET) doAuth(ENV_SECRET)
  }, [])

  async function handleAuth() {
    setAuthLoading(true)
    setAuthError(null)
    await doAuth(password)
    setAuthLoading(false)
  }

  async function handleToggleLock(code, currentLocked) {
    try {
      await toggleLock({ password, campaignCode: code, locked: !currentLocked })
      setCampaigns((prev) => prev.map((c) => (c.code === code ? { ...c, locked: !currentLocked } : c)))
    } catch {
      // lock toggle failure is silent — UI state is optimistic
    }
  }

  async function handleCleanup() {
    setCleanupLoading(true)
    setCleanupResult(null)
    try {
      const result = await runCleanup({ password, thresholdDays: Number(thresholdDays) || 30 })
      setCleanupResult(result.data)
      const list = await listCampaigns({ password })
      setCampaigns(list.data)
    } catch (e) {
      setCleanupResult({ error: e.message ?? 'Unknown error' })
    } finally {
      setCleanupLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60">
      <div className="bg-brand-mint-dark shadow-modal w-[640px] max-w-[95vw] flex flex-col max-h-[85vh]">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">Admin</h2>
          <button
            onClick={onClose}
            className="text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        {phase === 'loading' ? (
          <div className="p-6 flex items-center justify-center">
            <span className="text-brand-ink/40 text-sm font-normal">Loading…</span>
          </div>
        ) : phase === 'auth' ? (
          <div className="p-6 flex flex-col gap-3">
            {authError && <p className="text-brand-danger text-sm font-normal">{authError}</p>}
            <input
              type="password"
              className="w-full bg-white border border-brand-mint-dark px-3 py-2 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              autoFocus
            />
            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="px-4 py-2 text-xs font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet-dark disabled:opacity-50 transition-colors"
            >
              {authLoading ? 'Verifying…' : 'Enter'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {campaigns.length === 0 ? (
                <p className="text-brand-ink opacity-40 font-light text-sm py-8 text-center">
                  No campaigns found
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-brand-mint border-b border-brand-ink/10">
                      <th
                        className="text-left px-4 py-2 text-xs font-bold text-brand-ink/50 cursor-pointer hover:text-brand-ink transition-colors select-none"
                        onClick={() => handleSort('name')}
                      >
                        Campaign<SortArrow col="name" />
                      </th>
                      <th
                        className="text-left px-4 py-2 text-xs font-bold text-brand-ink/50 cursor-pointer hover:text-brand-ink transition-colors select-none"
                        onClick={() => handleSort('code')}
                      >
                        Code<SortArrow col="code" />
                      </th>
                      <th
                        className="text-right px-4 py-2 text-xs font-bold text-brand-ink/50 cursor-pointer hover:text-brand-ink transition-colors select-none"
                        onClick={() => handleSort('staleDays')}
                      >
                        Stale<SortArrow col="staleDays" />
                      </th>
                      <th
                        className="text-center px-4 py-2 text-xs font-bold text-brand-ink/50 cursor-pointer hover:text-brand-ink transition-colors select-none"
                        onClick={() => handleSort('locked')}
                      >
                        Lock<SortArrow col="locked" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c) => (
                      <tr key={c.code} className="border-b border-brand-ink/10">
                        <td className="px-4 py-2 text-brand-ink text-sm font-normal truncate max-w-[200px]">
                          {c.name}
                        </td>
                        <td className="px-4 py-2 text-brand-ink/50 text-xs font-bold tracking-widest">
                          {c.code}
                        </td>
                        <td
                          className={`px-4 py-2 text-right text-xs font-normal ${
                            c.staleDays > 30 ? 'text-brand-danger' : 'text-brand-ink/40'
                          }`}
                        >
                          {staleness(c.staleDays)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleToggleLock(c.code, c.locked)}
                            className={`transition-colors ${
                              c.locked
                                ? 'text-brand-forest'
                                : 'text-brand-ink/20 hover:text-brand-ink/50'
                            }`}
                            title={c.locked ? 'Unlock' : 'Lock'}
                          >
                            {c.locked ? <Lock size={13} /> : <LockOpen size={13} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t border-brand-ink/10 px-4 py-3 flex flex-col gap-2 shrink-0">
              {cleanupResult && (
                <p className="text-xs font-normal text-brand-ink/60">
                  {cleanupResult.error
                    ? `Error: ${cleanupResult.error}`
                    : `Deleted ${cleanupResult.deleted} · Errors ${cleanupResult.errors} · Skipped (locked) ${cleanupResult.skipped}`}
                </p>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs font-normal text-brand-ink/60 shrink-0">
                  Delete campaigns older than
                </span>
                <input
                  type="number"
                  className="w-16 text-center text-sm font-normal text-brand-ink bg-white border border-brand-mint-dark px-2 py-1 focus:outline-none"
                  value={thresholdDays}
                  onChange={(e) => setThresholdDays(e.target.value)}
                />
                <span className="text-xs font-normal text-brand-ink/60">days</span>
                <button
                  onClick={handleCleanup}
                  disabled={cleanupLoading}
                  className="ml-auto px-3 py-1.5 text-xs font-normal text-white bg-brand-danger hover:bg-brand-danger-dark disabled:opacity-50 transition-colors shrink-0"
                >
                  {cleanupLoading ? 'Running…' : 'Run Cleanup'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
