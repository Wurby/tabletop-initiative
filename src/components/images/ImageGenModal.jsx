import { useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { imagenModel, geminiModel } from '../../lib/ai'
import { dmUpdate } from '../../lib/campaign'

export default function ImageGenModal({ campaign, campaignCode, onClose }) {
  const images = campaign.images ?? []
  const [prompt, setPrompt] = useState('')
  const [phase, setPhase] = useState('idle') // idle | generating | preview | saving
  const [generations, setGenerations] = useState([]) // [{ data, mimeType }, ...]
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [label, setLabel] = useState('')
  const [error, setError] = useState(null)

  const selected = generations[selectedIdx] ?? null

  async function handleGenerate() {
    if (!prompt.trim()) return
    setPhase('generating')
    setError(null)
    try {
      const result = await imagenModel.generateContent(prompt.trim())
      const parts = result.response.inlineDataParts()
      if (!parts?.[0]) throw new Error('No image returned — try rephrasing the prompt.')
      const next = [...generations, parts[0].inlineData]
      setGenerations(next)
      setSelectedIdx(next.length - 1)
      setPhase('preview')
    } catch (err) {
      setError(err.message || 'Generation failed.')
      setPhase(generations.length > 0 ? 'preview' : 'idle')
    }
  }

  async function handleSave() {
    if (!selected) return
    setPhase('saving')
    setError(null)
    try {
      let finalLabel = label.trim()
      if (!finalLabel) {
        const labelResult = await geminiModel.generateContent(
          `Give a short 2–4 word descriptive title for an image described as: "${prompt}". Reply with only the title, no punctuation or quotes.`
        )
        finalLabel = labelResult.response.text().trim()
      }

      const byteChars = atob(selected.data)
      const bytes = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
      const blob = new Blob([bytes], { type: selected.mimeType })

      const ext = selected.mimeType.split('/')[1] || 'png'
      const filename = `${crypto.randomUUID()}.${ext}`
      const storagePath = `campaigns/${campaignCode}/images/${filename}`
      const storageRef = ref(storage, storagePath)

      await uploadBytes(storageRef, blob)
      const url = await getDownloadURL(storageRef)

      const entry = {
        id: crypto.randomUUID(),
        url,
        storagePath,
        label: finalLabel,
        uploadedAt: Date.now(),
      }
      await dmUpdate(campaignCode, { images: [...images, entry] })
      onClose()
    } catch (err) {
      setError(err.message || 'Save failed.')
      setPhase('preview')
    }
  }

  function handleReprompt() {
    setError(null)
    setPhase('idle')
  }

  function handleDiscard() {
    setGenerations([])
    setSelectedIdx(0)
    setPrompt('')
    setLabel('')
    setError(null)
    setPhase('idle')
  }

  const busy = phase === 'generating' || phase === 'saving'

  return (
    <div className="fixed inset-0 z-40 bg-brand-ink/60 flex items-center justify-center p-6">
      <div className="bg-brand-mint-dark w-full max-w-md flex flex-col shadow-modal">
        <div className="bg-brand-forest px-4 py-2 flex items-center justify-between">
          <h2 className="text-white font-normal text-base">Generate Image</h2>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-white/60 hover:text-white disabled:opacity-30 text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          <textarea
            className="w-full bg-white border border-brand-ink/20 px-3 py-2 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet resize-none"
            rows={3}
            placeholder="Describe the image…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !busy) handleGenerate()
            }}
            disabled={busy}
          />

          {/* Preview area */}
          {phase === 'generating' && !selected && (
            <div className="w-full h-48 bg-brand-mint flex items-center justify-center">
              <span className="text-brand-ink/40 text-sm animate-pulse">Generating…</span>
            </div>
          )}

          {selected && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                {phase === 'generating' && (
                  <div className="absolute inset-0 bg-brand-mint/70 flex items-center justify-center z-10">
                    <span className="text-brand-ink/60 text-sm animate-pulse">Generating…</span>
                  </div>
                )}
                {phase === 'saving' && (
                  <div className="absolute inset-0 bg-brand-mint/70 flex items-center justify-center z-10">
                    <span className="text-brand-ink/60 text-sm animate-pulse">Saving…</span>
                  </div>
                )}
                <img
                  src={`data:${selected.mimeType};base64,${selected.data}`}
                  alt="Generated preview"
                  className="w-full object-contain max-h-64"
                />
              </div>

              {/* History strip */}
              {generations.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {generations.map((gen, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIdx(i)}
                      disabled={busy}
                      className={`shrink-0 w-14 h-14 overflow-hidden border-2 transition-colors ${
                        i === selectedIdx
                          ? 'border-brand-forest'
                          : 'border-transparent hover:border-brand-ink/30'
                      }`}
                    >
                      <img
                        src={`data:${gen.mimeType};base64,${gen.data}`}
                        alt={`Generation ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Label */}
          {phase === 'preview' && (
            <input
              className="w-full bg-white border border-brand-ink/20 px-3 py-2 text-brand-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-rivulet"
              placeholder="Label (AI-suggested if blank)…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          )}

          {error && <p className="text-brand-danger text-xs">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2">
            {(phase === 'idle' || phase === 'preview') && (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || busy}
                className="flex-1 py-2 text-sm font-normal text-white bg-brand-forest hover:bg-brand-forest-dark disabled:opacity-30 transition-colors"
              >
                {phase === 'preview' ? 'Reprompt' : 'Generate'}
              </button>
            )}
            {phase === 'preview' && (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 text-sm font-normal text-white bg-brand-rivulet hover:bg-brand-rivulet/80 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleDiscard}
                  className="py-2 px-3 text-sm text-brand-ink/40 hover:text-brand-ink transition-colors"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
