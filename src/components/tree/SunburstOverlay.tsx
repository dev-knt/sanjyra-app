import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getNode, rootIds } from '../../lib/graph'
import { SunburstTree } from './SunburstTree'

// Start the circular view at the FIRST ancestor (from Багыш down) who has more
// than one son — i.e. the topmost branching point. Everything above is a single
// spine so it adds nothing to a fan. As higher ancestors gain siblings in the
// data, this starting point automatically moves up — no code change needed.
const FOCAL = (() => {
  let node = getNode(rootIds()[0] ?? '')
  while (node && node.childrenIds.length === 1) node = getNode(node.childrenIds[0])
  return node?.id ?? rootIds()[0]
})()

// Fullscreen, smoothly-zoomable whole-clan sunburst. Opened from the home page.
export function SunburstOverlay({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  useEffect(() => {
    const b = document.body
    const prev = b.getAttribute('style') || ''
    b.style.overflow = 'hidden'
    return () => b.setAttribute('style', prev)
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line/60 shrink-0">
        <div>
          <h1 className="kg-name text-xl font-bold">Бүт санжыра дарагы</h1>
          <p className="text-sm text-muted">Эки манжа менен чоңойтуңуз · сүйрөп жылдырыңыз · адамды басыңыз</p>
        </div>
        <button onClick={onClose} aria-label="Жабуу" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl text-muted hover:bg-line/50 active:scale-90">
          ✕
        </button>
      </header>

      <div className="flex-1">
        <SunburstTree
          focalId={FOCAL}
          onOpen={(id) => {
            onClose()
            onOpen(id)
          }}
        />
      </div>
    </div>,
    document.body,
  )
}
