import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { allNodes } from '../../lib/graph'
import { rootIds } from '../../lib/layout'
import { SunburstTree } from './SunburstTree'

const FOCAL = allNodes().find((n) => n.name === 'Аттокур')?.id ?? rootIds()[0]

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
          <h1 className="kg-name text-base font-bold">Бүт санжыра дарагы</h1>
          <p className="text-[11px] text-muted">Чымчып чоңойтуңуз · сүйрөп жылдырыңыз · адамды басыңыз</p>
        </div>
        <button onClick={onClose} aria-label="Жабуу" className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted hover:bg-line/50 active:scale-90">
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
