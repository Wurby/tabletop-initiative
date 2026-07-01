import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import ClusterGrid from './ClusterGrid'
import ClusterView from './ClusterView'
import PoiDetail from './PoiDetail'

function defaultGridDims(n) {
  const slots = n + 2
  const cols = Math.max(2, Math.ceil(Math.sqrt(slots)))
  const rows = Math.ceil(slots / cols)
  return { rows, cols }
}

export default function LocationsPanel({ campaign, campaignCode }) {
  const showError = useToast()
  const clusters = campaign.locations ?? []
  const n = clusters.length
  const dims = defaultGridDims(n)
  const gridRows = campaign.locationsGridRows ?? dims.rows
  const gridCols = campaign.locationsGridCols ?? dims.cols

  const [view, setView] = useState('clusters') // 'clusters' | 'cluster' | 'poi'
  const [activeClusterId, setActiveClusterId] = useState(null)
  const [activePoiId, setActivePoiId] = useState(null)

  const activeCluster = clusters.find((c) => c.id === activeClusterId) ?? null
  const activePoi = activeCluster?.pois?.find((p) => p.id === activePoiId) ?? null

  async function saveClusters(nextClusters, nextRows, nextCols) {
    try {
      const update = { locations: nextClusters }
      if (nextRows != null) update.locationsGridRows = nextRows
      if (nextCols != null) update.locationsGridCols = nextCols
      await dmUpdate(campaignCode, update)
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  function handleClusterGridChange(nextClusters, nextRows, nextCols) {
    saveClusters(nextClusters, nextRows ?? null, nextCols ?? null)
  }

  async function handleAddCluster() {
    const n = clusters.length
    const dims = defaultGridDims(n)
    const cols = gridCols ?? dims.cols
    const newCluster = {
      id: crypto.randomUUID(),
      name: 'New Location',
      gridRow: Math.floor(n / cols),
      gridCol: n % cols,
      arrival: '',
      nightArrival: '',
      situation: '',
      plotHooks: '',
      poiGridRows: null,
      poiGridCols: null,
      pois: [],
    }
    await saveClusters([...clusters, newCluster])
    setActiveClusterId(newCluster.id)
    setView('cluster')
  }

  async function handleClusterUpdate(updatedCluster) {
    const next = clusters.map((c) => (c.id === updatedCluster.id ? updatedCluster : c))
    await saveClusters(next)
    // Keep local state in sync — active cluster name etc may have changed
    setActiveClusterId(updatedCluster.id)
  }

  async function handlePoiUpdate(updatedPoi) {
    const nextClusters = clusters.map((c) => {
      if (c.id !== activeClusterId) return c
      return { ...c, pois: c.pois.map((p) => (p.id === updatedPoi.id ? updatedPoi : p)) }
    })
    await saveClusters(nextClusters)
  }

  async function handleDeleteCluster(clusterId) {
    const next = clusters.filter((c) => c.id !== clusterId)
    await saveClusters(next)
    setView('clusters')
    setActiveClusterId(null)
    setActivePoiId(null)
  }

  async function handleDeletePoi(poiId) {
    const nextClusters = clusters.map((c) => {
      if (c.id !== activeClusterId) return c
      return { ...c, pois: c.pois.filter((p) => p.id !== poiId) }
    })
    await saveClusters(nextClusters)
    setView('cluster')
    setActivePoiId(null)
  }

  function openCluster(cluster) {
    setActiveClusterId(cluster.id)
    setActivePoiId(null)
    setView('cluster')
  }

  function openPoi(poi) {
    setActivePoiId(poi.id)
    setView('poi')
  }

  function goBack() {
    if (view === 'poi') { setActivePoiId(null); setView('cluster') }
    else if (view === 'cluster') { setActiveClusterId(null); setView('clusters') }
  }

  // Breadcrumb
  const crumbs = [
    { label: 'Locations', onClick: () => { setView('clusters'); setActiveClusterId(null); setActivePoiId(null) } },
    ...(activeCluster ? [{ label: activeCluster.name, onClick: () => { setView('cluster'); setActivePoiId(null) } }] : []),
    ...(activePoi ? [{ label: `${activePoi.letter} — ${activePoi.name}`, onClick: null }] : []),
  ]

  return (
    <section className="flex flex-col h-full">
      {/* Section header */}
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/30 text-base">›</span>}
              {c.onClick ? (
                <button
                  onClick={c.onClick}
                  className="text-base font-normal text-white/60 hover:text-white transition-colors"
                >
                  {c.label}
                </button>
              ) : (
                <span className="text-xl font-normal text-white">{c.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'clusters' && (
          <div className="overflow-y-auto flex-1 py-4">
            {clusters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-brand-ink/40 text-sm font-light">No locations yet…</p>
                <button
                  onClick={handleAddCluster}
                  className="text-xs font-normal text-brand-rivulet border border-brand-rivulet/30 hover:border-brand-rivulet px-3 py-1.5 transition-colors"
                >
                  + Add First Cluster
                </button>
              </div>
            ) : (
              <ClusterGrid
                clusters={clusters}
                gridRows={gridRows}
                gridCols={gridCols}
                onGridChange={handleClusterGridChange}
                onClusterClick={openCluster}
                onAddCluster={handleAddCluster}
              />
            )}
          </div>
        )}

        {view === 'cluster' && activeCluster && (
          <ClusterView
            cluster={activeCluster}
            onPoiClick={openPoi}
            onBack={goBack}
            onUpdate={handleClusterUpdate}
            onDelete={handleDeleteCluster}
          />
        )}

        {view === 'poi' && activePoi && activeCluster && (
          <PoiDetail
            poi={activePoi}
            cluster={activeCluster}
            onUpdate={handlePoiUpdate}
            onBack={goBack}
            onDelete={handleDeletePoi}
          />
        )}
      </div>
    </section>
  )
}
