import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { geminiFlashModel } from '../../lib/ai'
import { Sparkles } from '../icons'
import {
  buildIndexStepPrompt,
  buildPoiStepPrompt,
  buildPoiNameSuggestionPrompt,
} from './locationPrompts'

const INDEX_STEPS = [
  { phase: 'index', key: 'name', label: 'Name', isName: true, description: 'What is this location called?' },
  { phase: 'index', key: 'arrival', label: 'Arrival', description: 'What do travelers experience when they arrive?' },
  { phase: 'index', key: 'situation', label: 'Situation', description: "What's the current state of affairs?" },
  { phase: 'index', key: 'plotHooks', label: 'Plot Hooks', description: 'What quests or complications exist here?' },
]

const POI_STEPS = [
  { phase: 'poi', key: 'name', label: 'POI Name', isName: true, description: 'Name this first point of interest.' },
  { phase: 'poi', key: 'description', label: 'Description', description: 'What does this POI look like?' },
  { phase: 'poi', key: 'encounters', label: 'Encounters', description: 'What encounters might happen here?' },
  { phase: 'poi', key: 'whatIsHere', label: "What's Here", description: 'What notable objects or features are present?' },
  { phase: 'poi', key: 'whoIsHere', label: "Who's Here", description: 'Who inhabits or frequents this POI?' },
  { phase: 'poi', key: 'quests', label: 'Quests', description: 'What quests or objectives relate to this POI?' },
]

export default function LocationWizardModal({ mode = 'full', existingCluster, campaign, onComplete, onSkip, onClose }) {
  const steps = mode === 'full' ? [...INDEX_STEPS, ...POI_STEPS] : POI_STEPS

  const [stepIdx, setStepIdx] = useState(0)
  const [clusterDraft, setClusterDraft] = useState({
    name: existingCluster?.name ?? '',
    arrival: existingCluster?.arrival ?? '',
    situation: existingCluster?.situation ?? '',
    plotHooks: existingCluster?.plotHooks ?? '',
  })
  const [poiDraft, setPoiDraft] = useState({ name: '', description: '', encounters: '', whatIsHere: '', whoIsHere: '', quests: '' })
  const [fieldValues, setFieldValues] = useState({})
  const [chatHistories, setChatHistories] = useState({})
  const [chatInput, setChatInput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Notes drawer
  const [showNotesDrawer, setShowNotesDrawer] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set())
  const [drawerFolderId, setDrawerFolderId] = useState(null)
  const [drawerExpandedIds, setDrawerExpandedIds] = useState(new Set())

  const allNotes = campaign?.dmNotes ?? []
  const folders = campaign?.dmNoteFolders ?? []
  const selectedNotes = allNotes.filter(n => selectedNoteIds.has(n.id))
  const drawerNotes = drawerFolderId === null ? allNotes : allNotes.filter(n => n.folderId === drawerFolderId)

  function folderSelectedCount(folderId) {
    return allNotes.filter(n => n.folderId === folderId && selectedNoteIds.has(n.id)).length
  }

  function toggleNote(id) {
    setSelectedNoteIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleDrawerExpand(id) {
    setDrawerExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const chatEndRef = useRef(null)

  const currentStep = steps[stepIdx]
  const isNameStep = currentStep.isName
  const value = fieldValues[stepIdx] ?? ''
  const history = chatHistories[stepIdx] ?? []
  const isLastStep = stepIdx === steps.length - 1

  const indexSteps = steps.filter(s => s.phase === 'index')
  const poiSteps = steps.filter(s => s.phase === 'poi')
  const globalIdx = (s) => steps.findIndex(st => st.key === s.key && st.phase === s.phase)

  function stepState(s) {
    const i = globalIdx(s)
    if (i < stepIdx) return 'done'
    if (i === stepIdx) return 'active'
    return 'future'
  }

  function updateDraft(step, text) {
    if (step.phase === 'index') setClusterDraft(d => ({ ...d, [step.key]: text }))
    else setPoiDraft(d => ({ ...d, [step.key]: text }))
  }

  function handleFieldChange(text) {
    setFieldValues(v => ({ ...v, [stepIdx]: text }))
    updateDraft(currentStep, text)
  }

  async function generate(userMessage) {
    setGenerating(true)
    setError(null)
    const currentValue = fieldValues[stepIdx] ?? ''
    const currentHistory = chatHistories[stepIdx] ?? []
    const newHistory = userMessage
      ? [...currentHistory, { role: 'user', content: userMessage }]
      : currentHistory
    try {
      let prompt
      if (currentStep.key === 'name' && currentStep.phase === 'poi') {
        prompt = buildPoiNameSuggestionPrompt(clusterDraft, existingCluster?.pois ?? [], selectedNotes)
      } else if (currentStep.phase === 'index') {
        prompt = buildIndexStepPrompt(currentStep, clusterDraft, newHistory, currentValue, userMessage, selectedNotes)
      } else {
        prompt = buildPoiStepPrompt(currentStep, clusterDraft, poiDraft, newHistory, currentValue, userMessage, selectedNotes)
      }
      const result = await geminiFlashModel.generateContent(prompt)
      const text = result.response.text().trim()
      const updatedHistory = [...newHistory, { role: 'ai', content: text }]
      setChatHistories(h => ({ ...h, [stepIdx]: updatedHistory }))
      setFieldValues(v => ({ ...v, [stepIdx]: text }))
      updateDraft(currentStep, text)
    } catch (err) {
      setError(err.message || 'Generation failed — try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSend() {
    const msg = chatInput.trim()
    if (!msg || generating) return
    setChatInput('')
    await generate(msg)
  }

  function handleNext() {
    if (isNameStep && !(fieldValues[stepIdx] ?? '').trim()) return
    if (isLastStep) handleComplete()
    else setStepIdx(s => s + 1)
  }

  function handleComplete() {
    const letter = existingCluster
      ? String.fromCharCode(65 + (existingCluster.pois?.length ?? 0))
      : 'A'
    if (mode === 'full') {
      const cluster = {
        id: crypto.randomUUID(),
        name: clusterDraft.name || 'New Location',
        gridRow: 0, gridCol: 0,
        arrival: clusterDraft.arrival,
        situation: clusterDraft.situation,
        plotHooks: clusterDraft.plotHooks,
        nightArrival: '',
        poiGridRows: null, poiGridCols: null,
        pois: [{
          id: crypto.randomUUID(),
          letter,
          name: poiDraft.name || `Location ${letter}`,
          gridRow: 0, gridCol: 0,
          description: poiDraft.description,
          encounters: poiDraft.encounters,
          whatIsHere: poiDraft.whatIsHere,
          whoIsHere: poiDraft.whoIsHere,
          quests: poiDraft.quests,
        }],
      }
      onComplete({ cluster })
    } else {
      const n = existingCluster?.pois?.length ?? 0
      const cols = existingCluster?.poiGridCols ?? Math.max(2, Math.ceil(Math.sqrt(n + 3)))
      const poi = {
        id: crypto.randomUUID(),
        letter,
        name: poiDraft.name || `Location ${letter}`,
        gridRow: Math.floor(n / cols),
        gridCol: n % cols,
        description: poiDraft.description,
        encounters: poiDraft.encounters,
        whatIsHere: poiDraft.whatIsHere,
        whoIsHere: poiDraft.whoIsHere,
        quests: poiDraft.quests,
      }
      onComplete({ poi })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
      <div className="relative">
      <div className="bg-brand-mint-dark shadow-modal flex max-h-[60vh] w-[860px] max-w-[97vw]">

        {/* Left sidebar — step list */}
        <div className="w-44 shrink-0 border-r border-brand-mint flex flex-col">
          <div className="bg-brand-forest px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-white/70" />
              <h2 className="text-white font-normal text-sm">
                {mode === 'full' ? 'Build Location' : 'Add POI'}
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 flex flex-col">
            {indexSteps.length > 0 && (
              <>
                <p className="px-4 pb-1.5 text-[10px] font-bold text-brand-ink/30 uppercase tracking-wider">Index</p>
                {indexSteps.map((s) => {
                  const state = stepState(s)
                  const idx = globalIdx(s)
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStepIdx(idx)}
                      className={`w-full text-left px-4 py-1.5 text-xs font-normal transition-colors flex items-center gap-1.5 ${
                        state === 'active'
                          ? 'text-brand-ink bg-brand-mint'
                          : state === 'done'
                          ? 'text-brand-forest hover:bg-brand-mint/60'
                          : 'text-brand-ink/30 hover:text-brand-ink/60 hover:bg-brand-mint/20'
                      }`}
                    >
                      <span className="w-3 shrink-0 text-center text-brand-forest">
                        {state === 'done' ? '✓' : state === 'active' ? '›' : ''}
                      </span>
                      {s.label}
                    </button>
                  )
                })}
              </>
            )}

            {poiSteps.length > 0 && (
              <>
                <p className="px-4 pb-1.5 pt-3 text-[10px] font-bold text-brand-ink/30 uppercase tracking-wider">
                  {mode === 'full' ? 'First POI' : 'New POI'}
                </p>
                {poiSteps.map((s) => {
                  const state = stepState(s)
                  const idx = globalIdx(s)
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStepIdx(idx)}
                      className={`w-full text-left px-4 py-1.5 text-xs font-normal transition-colors flex items-center gap-1.5 ${
                        state === 'active'
                          ? 'text-brand-ink bg-brand-mint'
                          : state === 'done'
                          ? 'text-brand-forest hover:bg-brand-mint/60'
                          : 'text-brand-ink/30 hover:text-brand-ink/60 hover:bg-brand-mint/20'
                      }`}
                    >
                      <span className="w-3 shrink-0 text-center text-brand-forest">
                        {state === 'done' ? '✓' : state === 'active' ? '›' : ''}
                      </span>
                      {s.label}
                    </button>
                  )
                })}
              </>
            )}
          </div>

          <div className="border-t border-brand-mint p-3 flex flex-col gap-2">
            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full py-1.5 text-xs font-normal text-brand-ink/60 border border-brand-ink/20 hover:border-brand-ink/40 hover:text-brand-ink transition-colors"
              >
                Skip — blank canvas
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-1.5 text-xs font-normal text-brand-ink/60 border border-brand-ink/20 hover:border-brand-ink/40 hover:text-brand-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right — current step */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Step header */}
          <div className="bg-brand-forest-dark px-5 py-3 shrink-0 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-normal text-base">{currentStep.label}</p>
              <p className="text-white/50 text-xs font-normal mt-0.5">{currentStep.description}</p>
            </div>
            <button
              onClick={() => setShowNotesDrawer(d => !d)}
              className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1.5 border transition-colors ${
                showNotesDrawer || selectedNoteIds.size > 0
                  ? 'text-white border-white/40 bg-white/10'
                  : 'text-white/50 border-white/20 hover:border-white/40 hover:text-white/80'
              }`}
            >
              Notes{selectedNoteIds.size > 0 ? ` (${selectedNoteIds.size})` : ''}
              <span className="text-[10px]">{showNotesDrawer ? '›' : '‹'}</span>
            </button>
          </div>

          {isNameStep ? (
            <div className="flex-1 flex flex-col px-5 py-5 gap-4">
              <div className="flex gap-3">
                <input
                  autoFocus
                  className="flex-1 bg-white border border-brand-ink/15 px-3 py-2 text-brand-ink text-base font-normal focus:outline-none focus:border-brand-rivulet/50"
                  placeholder={currentStep.phase === 'index' ? 'e.g. The Sunken Mire, Thornwick Village…' : 'e.g. The Old Mill, Crypt Entrance…'}
                  value={value}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && value.trim() && handleNext()}
                />
                <button
                  onClick={() => generate('')}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-normal text-brand-rivulet border border-brand-rivulet/30 hover:border-brand-rivulet transition-colors disabled:opacity-40 shrink-0"
                >
                  <Sparkles size={10} />
                  {generating ? '…' : 'Suggest'}
                </button>
              </div>
              {error && <p className="text-brand-danger text-xs">{error}</p>}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Chat history */}
              {history.length > 0 && (
                <div className="shrink-0 max-h-36 overflow-y-auto border-b border-brand-ink/8 px-5 py-3 flex flex-col gap-2">
                  {history.map((m, i) => (
                    <div key={i} className="text-xs font-normal">
                      {m.role === 'user' ? (
                        <span className="text-brand-rivulet"><span className="font-bold">You:</span> {m.content}</span>
                      ) : (
                        <span className="text-brand-ink/30 italic">AI updated content ↓</span>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Textarea */}
              <div className="flex-1 overflow-hidden px-5 py-4 flex flex-col gap-2">
                {generating ? (
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Sparkles size={14} className="text-brand-ink/20 animate-pulse" />
                    <span className="text-brand-ink/30 text-sm font-light animate-pulse">Generating…</span>
                  </div>
                ) : (
                  <textarea
                    className="flex-1 w-full bg-white border border-brand-ink/15 px-3 py-2 text-sm font-normal text-brand-ink focus:outline-none focus:border-brand-rivulet/50 resize-none font-mono leading-relaxed"
                    placeholder={`${currentStep.label}… (Markdown supported)`}
                    value={value}
                    onChange={(e) => handleFieldChange(e.target.value)}
                  />
                )}
                {error && <p className="text-brand-danger text-xs shrink-0">{error}</p>}
              </div>

              {/* AI action bar */}
              <div className="border-t border-brand-mint px-5 py-3 flex gap-2 shrink-0">
                <input
                  className="flex-1 bg-white border border-brand-ink/15 px-3 py-1.5 text-xs font-normal text-brand-ink focus:outline-none focus:border-brand-rivulet/50 min-w-0"
                  placeholder='Refine with AI: "more ominous", "add a tavern", "shorter"…'
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !generating && handleSend()}
                  disabled={generating}
                />
                <button
                  onClick={() => generate('')}
                  disabled={generating}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-normal text-brand-ink/60 border border-brand-ink/20 hover:border-brand-ink/40 hover:text-brand-ink transition-colors disabled:opacity-40 shrink-0"
                >
                  <Sparkles size={9} />
                  {value ? 'Regen' : 'Generate'}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || generating}
                  className="px-3 py-1.5 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark transition-colors disabled:opacity-40 shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="border-t border-brand-mint px-5 py-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => stepIdx > 0 && setStepIdx(s => s - 1)}
              disabled={stepIdx === 0}
              className="text-xs font-normal text-brand-ink/40 hover:text-brand-ink transition-colors disabled:opacity-0"
            >
              ← Back
            </button>
            <span className="text-[10px] text-brand-ink/25">{stepIdx + 1} / {steps.length}</span>
            <button
              onClick={handleNext}
              disabled={isNameStep && !value.trim()}
              className="text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark px-4 py-1.5 transition-colors disabled:opacity-40"
            >
              {isLastStep ? 'Finish →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Notes Drawer — absolutely to the right of the modal, same height */}
      <div className={`absolute top-0 left-full h-full overflow-hidden transition-all duration-200 ${showNotesDrawer ? 'w-[312px]' : 'w-0'}`}>
        <div className="w-[312px] h-full bg-brand-mint-dark border-l border-brand-mint flex flex-col shadow-modal">
            <div className="bg-brand-forest-dark px-3 py-2 flex items-center justify-between shrink-0">
              <span className="text-white text-xs font-normal">
                DM Notes
                {selectedNoteIds.size > 0 && (
                  <span className="ml-1.5 text-white/50">({selectedNoteIds.size} in context)</span>
                )}
              </span>
              <button
                onClick={() => setShowNotesDrawer(false)}
                className="text-white/50 hover:text-white text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {folders.length > 0 && (
              <div className="px-2 pt-2 pb-1.5 flex gap-1 flex-wrap border-b border-brand-mint shrink-0">
                <button
                  onClick={() => setDrawerFolderId(null)}
                  className={`px-2 py-0.5 text-[10px] font-normal border transition-colors ${
                    drawerFolderId === null
                      ? 'bg-brand-forest text-white border-brand-forest'
                      : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                  }`}
                >
                  All
                </button>
                {folders.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setDrawerFolderId(f.id)}
                    className={`px-2 py-0.5 text-[10px] font-normal border transition-colors ${
                      drawerFolderId === f.id
                        ? 'bg-brand-forest text-white border-brand-forest'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    {f.name}
                    {folderSelectedCount(f.id) > 0 && (
                      <span className="ml-1 bg-brand-rivulet text-white text-[9px] px-0.5">{folderSelectedCount(f.id)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              {drawerNotes.length === 0 && (
                <p className="text-brand-ink/30 text-xs font-light py-4 text-center">No notes</p>
              )}
              {drawerNotes.map(note => {
                const selected = selectedNoteIds.has(note.id)
                const expanded = drawerExpandedIds.has(note.id)
                return (
                  <div key={note.id} className="border-b border-brand-ink/10 last:border-0">
                    <div
                      className="flex items-start gap-2 px-2 py-2 cursor-pointer select-none hover:bg-brand-ink/5 transition-colors"
                      onClick={() => toggleDrawerExpand(note.id)}
                    >
                      <span
                        className="text-brand-ink/30 text-[10px] shrink-0 mt-0.5 transition-transform duration-150"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      >
                        ▶
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-normal text-brand-ink truncate">
                          {note.title || note.body?.split('\n')[0] || 'Untitled'}
                        </p>
                        {!expanded && note.body && (
                          <p className="text-[9px] text-brand-ink/45 line-clamp-2 leading-snug mt-0.5 whitespace-pre-wrap">
                            {note.body}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleNote(note.id) }}
                        className={`shrink-0 text-[9px] px-1.5 py-0.5 border transition-colors whitespace-nowrap ${
                          selected
                            ? 'bg-brand-rivulet text-white border-brand-rivulet'
                            : 'border-brand-ink/20 text-brand-ink/50 hover:border-brand-ink/50 hover:text-brand-ink'
                        }`}
                      >
                        {selected ? '✓ In context' : '+ Use for AI'}
                      </button>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-3 pt-1">
                        <div className="note-prose text-brand-ink text-xs font-normal">
                          <ReactMarkdown>{note.body || ''}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t border-brand-mint px-3 py-2 shrink-0">
              <p className="text-[9px] text-brand-ink/30 leading-relaxed">
                Selected notes are included as context when generating AI content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


