import { useToast } from '../../lib/toast'
import { dmUpdate } from '../../lib/campaign'
import { NotesEditor } from '../initiative/UnitNotesModal'

export default function DMNotesPanel({ campaign, campaignCode }) {
  const showError = useToast()

  async function handleFoldersChange(nextFolders) {
    try {
      await dmUpdate(campaignCode, { dmNoteFolders: nextFolders })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  async function handleNotesChange(nextNotes) {
    try {
      await dmUpdate(campaignCode, { dmNotes: nextNotes })
    } catch {
      showError('Failed to save — check your connection.')
    }
  }

  return (
    <section>
      <div className="bg-brand-forest px-6 py-2 mb-4 flex items-center">
        <h2 className="text-xl font-normal text-white">Notes</h2>
      </div>
      <NotesEditor
        folders={campaign.dmNoteFolders ?? []}
        notes={campaign.dmNotes ?? []}
        onFoldersChange={handleFoldersChange}
        onNotesChange={handleNotesChange}
      />
    </section>
  )
}
