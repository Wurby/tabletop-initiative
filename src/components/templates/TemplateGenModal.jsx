import { useState } from 'react'
import { geminiModel } from '../../lib/ai'
import { Sparkles } from '../icons'
import { buildPrompt } from './templatePrompt'
import NotesContextModal from '../notes/NotesContextModal'

const TYPE_HEADER = { mob: 'bg-brand-danger', ally: 'bg-brand-rivulet' }

const CR_OPTIONS = [
  '0', '1/8', '1/4', '1/2',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
]


function parseTemplateJson(text) {
  const clean = text.trim()
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, clean]
  const parsed = JSON.parse(match[1])
  const idMap = {}
  const noteFolders = (parsed.noteFolders ?? []).map((f) => {
    const newId = crypto.randomUUID()
    idMap[f.id] = newId
    return { id: newId, name: f.name ?? 'Folder' }
  })
  const notes = (parsed.notes ?? []).map((n) => ({
    id: crypto.randomUUID(),
    title: n.title ?? '',
    body: n.body ?? '',
    folderId: n.folderId ? (idMap[n.folderId] ?? null) : null,
    createdAt: Date.now(),
  }))
  return {
    name: parsed.name ?? 'Generated Creature',
    type: parsed.type === 'ally' ? 'ally' : 'mob',
    hp: { max: Number(parsed.hp?.max ?? parsed.hp) || 0 },
    ac: Number(parsed.ac) || 0,
    noteFolders,
    notes,
  }
}


export default function TemplateGenModal({ campaign, onClose, onSave }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('mob')
  const [cr, setCr] = useState('')
  const [attackStyle, setAttackStyle] = useState('')
  const [flying, setFlying] = useState(false)
  const [role, setRole] = useState('')
  const [behavior, setBehavior] = useState('')
  const [freeform, setFreeform] = useState('')
  const [reprompt, setReprompt] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set())

  const [generating, setGenerating] = useState(false)
  const [generations, setGenerations] = useState([])
  const [selectedGen, setSelectedGen] = useState(0)
  const [error, setError] = useState(null)

  const current = generations[selectedGen] ?? null
  const allNotes = campaign.dmNotes ?? []
  const selectedNotes = allNotes.filter((n) => selectedNoteIds.has(n.id))

  function toggleNote(id) {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const prompt = buildPrompt(
        { name, type, cr, attackStyle, flying, role, behavior, freeform },
        reprompt,
        selectedNotes
      )
      const result = await geminiModel.generateContent(prompt)
      const text = result.response.text()
      const parsed = parseTemplateJson(text)
      const next = [...generations, parsed]
      setGenerations(next)
      setSelectedGen(next.length - 1)
    } catch (err) {
      setError(err.message || 'Generation failed — try rephrasing.')
    } finally {
      setGenerating(false)
    }
  }

  function toggleOption(val, current, set) {
    set(current === val ? '' : val)
  }

  function chip(label, value, current, set) {
    return (
      <button
        key={label}
        onClick={() => toggleOption(label, current, set)}
        className={`px-2 py-1 text-xs font-normal border transition-colors ${
          current === label
            ? 'bg-brand-forest text-white border-brand-forest'
            : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40">
        <div className="bg-brand-mint-dark shadow-modal flex max-h-[85vh] w-[720px] max-w-[95vw]">

          {/* Left pane — form */}
          <div className="flex flex-col w-72 shrink-0 border-r border-brand-mint">
            <div className={`${TYPE_HEADER[type] ?? TYPE_HEADER.mob} px-4 py-3 shrink-0`}>
              <h2 className="text-white font-normal text-base">Generate Template</h2>
            </div>
            <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
              <input
                className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet w-full"
                placeholder="Name (optional — AI will generate)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex gap-1">
                {['mob', 'ally'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1 text-xs font-normal border transition-colors capitalize ${
                      type === t
                        ? type === 'mob'
                          ? 'bg-brand-danger text-white border-brand-danger'
                          : 'bg-brand-rivulet text-white border-brand-rivulet'
                        : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                    }`}
                  >
                    {t === 'mob' ? 'Mob' : 'Ally'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-forest text-xs w-6 shrink-0">CR</span>
                <input
                  list="cr-options"
                  className="flex-1 bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                  placeholder="e.g. 5 or 1/4"
                  value={cr}
                  onChange={(e) => setCr(e.target.value)}
                />
                <datalist id="cr-options">
                  {CR_OPTIONS.map((v) => <option key={v} value={v} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-brand-forest text-xs">Attack style</span>
                <div className="flex gap-1 flex-wrap">
                  {['Melee', 'Ranged', 'Both'].map((s) => chip(s, attackStyle, attackStyle, setAttackStyle))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-forest text-xs">Flying</span>
                <button
                  onClick={() => setFlying((v) => !v)}
                  className={`px-2 py-1 text-xs font-normal border transition-colors ${
                    flying
                      ? 'bg-brand-forest text-white border-brand-forest'
                      : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                  }`}
                >
                  {flying ? 'Yes' : 'No'}
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-brand-forest text-xs">Role</span>
                <div className="flex gap-1 flex-wrap">
                  {['Solo', 'Boss', 'Swarm'].map((r) => chip(r, role, role, setRole))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-brand-forest text-xs">Behavior</span>
                <div className="flex gap-1 flex-wrap">
                  {['Aggressive', 'Cowardly', 'Targets Weak', 'Targets Strong', 'Targets Closest'].map((b) =>
                    chip(b, behavior, behavior, setBehavior)
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                className="bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-sm font-normal focus:outline-none focus:ring-1 focus:ring-brand-rivulet w-full resize-none"
                placeholder="Additional context…"
                value={freeform}
                onChange={(e) => setFreeform(e.target.value)}
              />
              <button
                onClick={() => setShowNotesModal(true)}
                className="text-xs font-normal text-left border px-3 py-1.5 transition-colors border-brand-ink/20 text-brand-ink/60 hover:border-brand-ink/40 hover:text-brand-ink/80"
              >
                {selectedNoteIds.size > 0
                  ? `${selectedNoteIds.size} DM note${selectedNoteIds.size !== 1 ? 's' : ''} as context ›`
                  : 'Add notes as context…'}
              </button>
            </div>
            <div className="flex border-t border-brand-mint shrink-0">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 py-2 text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles size={11} />
                {generating ? 'Generating…' : generations.length > 0 ? 'Regenerate' : 'Generate'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 text-xs font-normal text-brand-ink hover:bg-brand-mint transition-colors border-l border-brand-mint"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right pane — preview */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-brand-forest px-4 py-3 shrink-0 flex items-center justify-between">
              <h3 className="text-white font-normal text-sm">Preview</h3>
              {current && (
                <button
                  onClick={() => onSave(current)}
                  className="text-xs font-normal text-white opacity-70 hover:opacity-100 border border-white/30 hover:border-white/60 px-2 py-1 transition-all"
                >
                  Edit &amp; Save
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {!current && !generating && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                  <Sparkles size={36} className="text-brand-ink/15" />
                  <p className="text-brand-ink/30 text-sm font-light">Fill in details and generate</p>
                </div>
              )}
              {generating && !current && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-brand-ink/40 text-sm animate-pulse">Generating…</p>
                </div>
              )}
              {current && (
                <div className="p-4 flex flex-col gap-3 relative">
                  {generating && (
                    <div className="absolute inset-0 bg-brand-mint-dark/60 flex items-center justify-center z-10">
                      <p className="text-brand-ink/50 text-sm animate-pulse">Generating…</p>
                    </div>
                  )}
                  <div className="shadow-card flex flex-col">
                    <div className={`${TYPE_HEADER[current.type] ?? TYPE_HEADER.mob} px-3 py-2`}>
                      <p className="text-white text-sm font-normal">{current.name}</p>
                    </div>
                    <div className="bg-brand-mint-dark px-3 py-2 flex gap-3">
                      <span className="text-brand-forest text-xs">
                        HP <span className="text-brand-ink">{current.hp?.max ?? 0}</span>
                      </span>
                      <span className="text-brand-forest text-xs">
                        AC <span className="text-brand-ink">{current.ac ?? 0}</span>
                      </span>
                    </div>
                  </div>

                  {(current.noteFolders ?? []).map((folder) => {
                    const folderNotes = (current.notes ?? []).filter((n) => n.folderId === folder.id)
                    if (folderNotes.length === 0) return null
                    return (
                      <div key={folder.id}>
                        <p className="text-brand-forest text-xs font-normal mb-1.5">{folder.name}</p>
                        <div className="flex flex-col gap-1.5">
                          {folderNotes.map((note) => (
                            <div key={note.id} className="bg-brand-mint p-2.5">
                              {note.title && (
                                <p className="text-xs font-bold text-brand-ink mb-0.5">{note.title}</p>
                              )}
                              <p className="text-xs font-normal text-brand-ink/80 whitespace-pre-wrap">
                                {note.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  <p className="text-brand-ink/25 text-[10px] font-normal">
                    AI-generated — verify rules before play
                  </p>
                </div>
              )}
            </div>

            {generations.length > 0 && (
              <div className="border-t border-brand-mint shrink-0 p-3 flex flex-col gap-2">
                <input
                  className="w-full bg-white border border-brand-mint-dark px-2 py-1 text-brand-ink text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-rivulet"
                  placeholder='Adjust: "make it tougher", "add a paralyze ability"…'
                  value={reprompt}
                  onChange={(e) => setReprompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !generating && handleGenerate()}
                />
                {generations.length > 1 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {generations.map((gen, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedGen(i)}
                        className={`px-2 py-0.5 text-xs font-normal border transition-colors ${
                          i === selectedGen
                            ? 'bg-brand-forest text-white border-brand-forest'
                            : 'border-brand-ink/20 text-brand-ink hover:border-brand-ink/40'
                        }`}
                      >
                        {gen.name}
                      </button>
                    ))}
                  </div>
                )}
                {error && <p className="text-brand-danger text-xs">{error}</p>}
              </div>
            )}
            {error && generations.length === 0 && (
              <div className="border-t border-brand-mint shrink-0 p-3">
                <p className="text-brand-danger text-xs">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotesModal && (
        <NotesContextModal
          campaign={campaign}
          selectedIds={selectedNoteIds}
          onToggle={toggleNote}
          onDone={() => setShowNotesModal(false)}
        />
      )}
    </>
  )
}
