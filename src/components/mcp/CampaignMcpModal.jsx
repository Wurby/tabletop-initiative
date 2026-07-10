import { useState } from 'react'
import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { generateMcpKey, mcpServerUrl } from '../../lib/mcp'

export default function CampaignMcpModal({ campaign, campaignCode, onClose }) {
  const showError = useToast()
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const mcpKey = campaign.meta?.mcpKey ?? null
  const url = mcpServerUrl(mcpKey)
  const configured = Boolean(import.meta.env.VITE_MCP_BASE_URL)

  async function handleGenerate() {
    setSaving(true)
    try {
      await dmUpdate(campaignCode, { 'meta.mcpKey': generateMcpKey() })
      setConfirmRegenerate(false)
    } catch {
      showError('Failed to save — check your connection.')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40" onClick={onClose}>
      <div
        className="bg-brand-mint-dark shadow-modal w-[30rem] max-w-[95vw] flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base">MCP Server</h2>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          <p className="text-brand-ink text-sm font-normal leading-relaxed">
            Connect Claude Code or Claude.ai to this campaign so it can read and author
            locations, templates, and notes directly into Firestore.
          </p>

          {!configured && (
            <p className="text-brand-danger text-xs font-normal">
              MCP server URL isn't configured for this app (missing VITE_MCP_BASE_URL). Set it
              and rebuild before generating a key.
            </p>
          )}

          {!mcpKey ? (
            <button
              onClick={handleGenerate}
              disabled={saving || !configured}
              className="self-start text-xs font-normal text-white bg-brand-forest hover:bg-brand-forest-dark px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {saving ? 'Generating…' : 'Generate Key'}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-brand-forest text-xs font-normal">Connector URL</span>
                <div className="flex items-stretch gap-1.5">
                  <input
                    readOnly
                    value={url ?? ''}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-white border border-brand-ink/15 px-2 py-1.5 text-brand-ink text-xs font-mono focus:outline-none min-w-0"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-xs font-normal text-brand-ink/60 hover:text-brand-ink border border-brand-ink/15 hover:border-brand-ink/30 px-2.5 transition-colors"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-brand-danger text-xs font-normal leading-relaxed">
                Anyone with this URL can view and edit this campaign. Don't share it — treat it
                like a password.
              </p>

              {confirmRegenerate ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-ink/60">
                    Regenerating breaks the old URL for anything already connected. Continue?
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={saving}
                    className="text-xs text-brand-danger hover:text-brand-danger-dark transition-colors shrink-0"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmRegenerate(false)}
                    className="text-xs text-brand-ink/40 hover:text-brand-ink transition-colors shrink-0"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRegenerate(true)}
                  className="self-start text-xs font-normal text-brand-ink/50 hover:text-brand-ink border border-brand-ink/15 hover:border-brand-ink/30 px-2.5 py-1 transition-colors"
                >
                  Regenerate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
