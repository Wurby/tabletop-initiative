import { useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const EMPTY_CAMPAIGN = {
  combat: {
    active: false,
    activeIndex: 0,
    display: { type: 'none', url: '', label: '' },
  },
  initiative: [],
  graveyard: [],
  questXp: [],
  images: [],
}

export default function JoinScreen({ uid, onJoin }) {
  const [mode, setMode] = useState('join') // 'join' | 'create'
  const [code, setCode] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!campaignName.trim()) {
      setError('Campaign name is required.')
      return
    }
    setLoading(true)
    setError('')
    const joinCode = generateJoinCode()
    try {
      await setDoc(doc(db, 'campaigns', joinCode), {
        meta: { name: campaignName.trim(), dmUid: uid },
        ...EMPTY_CAMPAIGN,
      })
      onJoin(joinCode, 'dm')
    } catch {
      setError('Failed to create campaign. Check your Firebase config.')
      setLoading(false)
    }
  }

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a join code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const snap = await getDoc(doc(db, 'campaigns', trimmed))
      if (!snap.exists()) {
        setError('Campaign not found.')
        setLoading(false)
        return
      }
      const viewMode = snap.data().meta.dmUid === uid ? 'dm' : 'table'
      onJoin(trimmed, viewMode)
    } catch {
      setError('Failed to join. Check your Firebase config.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-mint flex items-center justify-center p-8">
      <div className="bg-brand-mint-dark shadow-card p-8 w-full max-w-sm">
        <h1 className="text-3xl font-light text-brand-ink mb-8">Tabletop Initiative</h1>

        <div className="flex mb-6 border border-brand-forest">
          <button
            className={`flex-1 py-2 text-sm font-normal transition-colors ${
              mode === 'join'
                ? 'bg-brand-forest text-white'
                : 'text-brand-forest hover:bg-brand-mint'
            }`}
            onClick={() => {
              setMode('join')
              setError('')
            }}
          >
            Join
          </button>
          <button
            className={`flex-1 py-2 text-sm font-normal transition-colors ${
              mode === 'create'
                ? 'bg-brand-forest text-white'
                : 'text-brand-forest hover:bg-brand-mint'
            }`}
            onClick={() => {
              setMode('create')
              setError('')
            }}
          >
            Create
          </button>
        </div>

        {mode === 'join' ? (
          <div className="flex flex-col gap-4">
            <input
              className="bg-white border border-brand-mint-dark px-3 py-2 text-brand-ink font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full uppercase tracking-widest"
              placeholder="Join code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              maxLength={6}
            />
            <button
              className="bg-brand-rivulet text-white px-4 py-2 font-normal hover:bg-brand-rivulet-dark transition-colors disabled:opacity-50"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining…' : 'Join Campaign'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              className="bg-white border border-brand-mint-dark px-3 py-2 text-brand-ink font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
              placeholder="Campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              className="bg-brand-rivulet text-white px-4 py-2 font-normal hover:bg-brand-rivulet-dark transition-colors disabled:opacity-50"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create Campaign'}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-brand-danger font-normal">{error}</p>}
      </div>
    </div>
  )
}
