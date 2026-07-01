import ReactMarkdown from 'react-markdown'

export default function NoteOpenModal({ note, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/50">
      <div className="bg-white shadow-modal w-[560px] max-h-[80vh] flex flex-col">
        <div className="bg-brand-forest px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-white font-normal text-base truncate">
            {note.title || 'Note'}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 text-white opacity-60 hover:opacity-100 transition-opacity text-sm"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="note-prose text-brand-ink text-sm font-normal">
            <ReactMarkdown>{note.body || ''}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
