import { useState } from 'react'
import { getNode } from '../lib/graph'
import { SpotlightView } from '../components/tree/SpotlightView'

// The primary tree view (Spotlight): one person + their immediate family,
// tap any face to glide through the санжыра.
export function TreeScreen({ initialFocalId, onOpen }: { initialFocalId: string; onOpen: (id: string) => void }) {
  const [focalId, setFocalId] = useState(initialFocalId)
  const focal = getNode(focalId)

  return (
    <div className="animate-fadeup flex flex-col h-[calc(100vh-104px)]">
      <div className="px-5 pt-5 pb-1 shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="kg-name text-xl font-bold truncate">Санжыра дарагы</h1>
          <p className="text-xs text-muted mt-0.5">Адамды басып, ошого өтүңүз</p>
        </div>
        {focal && focalId !== initialFocalId && (
          <button onClick={() => setFocalId(initialFocalId)} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand shadow-soft">
            ↺ Башына
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <SpotlightView focalId={focalId} setFocalId={setFocalId} onOpen={onOpen} />
      </div>
    </div>
  )
}
