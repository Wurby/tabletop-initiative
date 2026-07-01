import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import ClusterGrid from './ClusterGrid'
import ClusterView from './ClusterView'
import PoiDetail from './PoiDetail'
import LocationWizardModal from './LocationWizardModal'
import { Sparkles } from '../icons'

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

  const [view, setView] = useState('clusters')
  const [activeClusterId, setActiveClusterId] = useState(null)
  const [activePoiId, setActivePoiId] = useState(null)

  // Wizard state
  const [wizardMode, setWizardMode] = useState(null) // null = closed | 'full' | 'poi'
  const [wizardClusterId, setWizardClusterId] = useState(null)

  const activeCluster = clusters.find((c) => c.id === activeClusterId) ?? null
  const activePoi = activeCluster?.pois?.find((p) => p.id === activePoiId) ?? null
  const wizardCluster = wizardClusterId ? clusters.find(c => c.id === wizardClusterId) : null

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

  // Open wizard for new cluster
  function handleAddCluster() {
    setWizardMode('full')
    setWizardClusterId(null)
  }

  // Add a blank cluster directly (skip wizard)
  async function handleAddBlankCluster() {
    const count = clusters.length
    const cols = gridCols
    const newCluster = {
      id: crypto.randomUUID(),
      name: 'New Location',
      gridRow: Math.floor(count / cols),
      gridCol: count % cols,
      arrival: '', nightArrival: '', situation: '', plotHooks: '',
      poiGridRows: null, poiGridCols: null,
      pois: [{
        id: crypto.randomUUID(),
        letter: 'A', name: 'Location A',
        gridRow: 0, gridCol: 0,
        description: '', encounters: '', whatIsHere: '', whoIsHere: '', quests: '',
      }],
    }
    await saveClusters([...clusters, newCluster])
    setActiveClusterId(newCluster.id)
    setView('cluster')
  }

  // Open wizard to add a POI to an existing cluster
  function handleAddPoiWithWizard(clusterId) {
    setWizardMode('poi')
    setWizardClusterId(clusterId)
  }

  async function handleWizardComplete({ cluster, poi }) {
    if (wizardMode === 'full' && cluster) {
      const count = clusters.length
      const cols = gridCols
      const positioned = {
        ...cluster,
        gridRow: Math.floor(count / cols),
        gridCol: count % cols,
      }
      await saveClusters([...clusters, positioned])
      setActiveClusterId(positioned.id)
      setView('cluster')
    } else if (wizardMode === 'poi' && poi && wizardClusterId) {
      const nextClusters = clusters.map((c) => {
        if (c.id !== wizardClusterId) return c
        return { ...c, pois: [...(c.pois ?? []), poi] }
      })
      await saveClusters(nextClusters)
    }
    setWizardMode(null)
    setWizardClusterId(null)
  }

  async function handleClusterUpdate(updatedCluster) {
    const next = clusters.map((c) => (c.id === updatedCluster.id ? updatedCluster : c))
    await saveClusters(next)
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

  const [openDropdown, setOpenDropdown] = useState(null)

  const crumbs = [
    { label: 'Locations', onClick: () => { setView('clusters'); setActiveClusterId(null); setActivePoiId(null); setOpenDropdown(null) } },
    ...(activeCluster ? [{
      label: activeCluster.name,
      onClick: () => { setView('cluster'); setActivePoiId(null); setOpenDropdown(null) },
      siblings: clusters,
      currentId: activeCluster.id,
      siblingLabel: (c) => c.name,
      onSelectSibling: (c) => { openCluster(c); setOpenDropdown(null) },
    }] : []),
    ...(activePoi ? [{
      label: `${activePoi.letter} — ${activePoi.name}`,
      onClick: null,
      siblings: activeCluster?.pois ?? [],
      currentId: activePoi.id,
      siblingLabel: (p) => `${p.letter} — ${p.name}`,
      onSelectSibling: (p) => { openPoi(p); setOpenDropdown(null) },
    }] : []),
  ]

  return (
    <section className="flex flex-col h-full">
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center shrink-0 relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          {crumbs.map((c, i) => {
            const isLeaf = i === crumbs.length - 1
            const hasDropdown = (c.siblings?.length ?? 0) > 1
            const dropdownOpen = openDropdown === i
            return (
              <span key={i} className="flex items-center gap-2 relative">
                {i > 0 && <span className="text-white/30 text-xl">›</span>}
                <span className="flex items-center gap-1">
                  {c.onClick && !isLeaf ? (
                    <button onClick={c.onClick} className="text-xl font-normal text-white/60 hover:text-white transition-colors">
                      {c.label}
                    </button>
                  ) : (
                    <span className="text-xl font-normal text-white">{c.label}</span>
                  )}
                  {hasDropdown && (
                    <button
                      onClick={() => setOpenDropdown(dropdownOpen ? null : i)}
                      className="text-white/40 hover:text-white transition-colors text-xs leading-none pb-0.5"
                      title="Switch to sibling"
                    >
                      ▾
                    </button>
                  )}
                </span>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[5]" onClick={() => setOpenDropdown(null)} />
                    <div className="absolute top-full left-0 mt-1 z-10 bg-brand-forest-dark shadow-modal min-w-44 py-1 max-h-64 overflow-y-auto">
                      {c.siblings.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => c.onSelectSibling(s)}
                          className={`w-full text-left px-3 py-1.5 text-sm font-normal transition-colors ${
                            s.id === c.currentId
                              ? 'text-white bg-white/10'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {c.siblingLabel(s)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'clusters' && (
          <div className="overflow-y-auto flex-1 py-4">
            {clusters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-brand-ink/40 text-sm font-light">No locations yet…</p>
                <button
                  onClick={handleAddCluster}
                  className="text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark px-4 py-2 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles size={11} /> Build First Location
                </button>
                <button
                  onClick={handleAddBlankCluster}
                  className="text-xs font-normal text-brand-ink/40 hover:text-brand-ink/70 transition-colors"
                >
                  or add blank
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
                onAddBlankCluster={handleAddBlankCluster}
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
            onAddPoiWithWizard={() => handleAddPoiWithWizard(activeCluster.id)}
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

      {wizardMode && (
        <LocationWizardModal
          mode={wizardMode}
          existingCluster={wizardCluster}
          campaign={campaign}
          onComplete={handleWizardComplete}
          onSkip={wizardMode === 'full' ? handleAddBlankCluster : null}
          onClose={() => { setWizardMode(null); setWizardClusterId(null) }}
        />
      )}
    </section>
  )
}
