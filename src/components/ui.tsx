import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { PersonNode } from '../types'
import { branchHue } from '../lib/branches'
import { childrenNodes, descendantCount, fathers } from '../lib/graph'

// Avatar colour = the person's ANCESTRAL BRANCH hue (a small curated palette),
// so colour carries meaning (lineage) and the UI isn't a random rainbow.
export function Avatar({ person, size = 44 }: { person: PersonNode; size?: number }) {
  const hue = branchHue(person.id)
  return (
    <div
      className="kg-name flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, fontSize: size * 0.44, background: `hsl(${hue} 55% 88%)`, color: `hsl(${hue} 60% 26%)` }}
      aria-hidden
    >
      {person.name.charAt(0)}
    </div>
  )
}

export function lifespan(p: PersonNode): string {
  if (p.birthYear && p.deathYear) return `${p.birthYear} – ${p.deathYear}`
  if (p.birthYear) return `${p.birthYear}`
  return ''
}

/** "Айбек уулу" — the Kyrgyz patronymic. Sons only in this tree. */
export function patronymic(p: PersonNode): string {
  const f = fathers(p.id, 1)[0]
  return f ? `${f.name} уулу` : 'уруунун башы'
}

/** Father ‹ grandfather ‹ great-grandfather as chips — tells same-name people apart. */
export function LineageLine({ person, depth = 3 }: { person: PersonNode; depth?: number }) {
  const line = fathers(person.id, depth)
  if (!line.length) return <div className="text-sm text-muted">уруунун башы</div>
  return (
    <div className="mt-1 flex flex-wrap items-center gap-y-1">
      {line.map((f, i) => (
        <span key={f.id} className="flex items-center">
          {i > 0 && <span className="px-1 text-sm text-muted/70">‹</span>}
          <span className={`kg-name rounded-full px-1.5 py-0.5 text-sm ${i === 0 ? 'bg-brand-soft font-bold text-brand' : 'bg-paper text-muted'}`}>{f.name}</span>
        </span>
      ))}
    </div>
  )
}

/** "3 уул · 14 урпак" or "тукуму жазылган эмес". */
export function familyCount(p: PersonNode): string {
  const sons = childrenNodes(p.id).length
  if (!sons) return 'тукуму жазылган эмес'
  const d = descendantCount(p.id)
  return d > sons ? `${sons} уул · ${d} урпак` : `${sons} уул`
}

/** A full-width tappable person row (≥ 60px) used for sons and brothers. */
export function PersonRow({ p, onOpen, size = 44 }: { p: PersonNode; onOpen: (id: string) => void; size?: number }) {
  const hasSons = childrenNodes(p.id).length > 0
  return (
    <button onClick={() => onOpen(p.id)} className="flex min-h-[60px] w-full items-center gap-3 px-3 py-2 text-left transition active:bg-brand-soft/50">
      <Avatar person={p} size={size} />
      <span className="kg-name min-w-0 flex-1 truncate text-lg font-bold">{p.name}</span>
      <span className={`shrink-0 whitespace-nowrap text-sm ${hasSons ? 'rounded-full bg-brand-soft px-2.5 py-0.5 font-bold text-brand' : 'text-muted'}`}>{familyCount(p)}</span>
      <span className="text-xl leading-none text-muted" aria-hidden>›</span>
    </button>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>
}

/** Bottom sheet in a portal, with background scroll locked (incl. iOS rubber-banding). */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const y = window.scrollY
    const b = document.body
    const prev = b.getAttribute('style') || ''
    Object.assign(b.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => {
      b.setAttribute('style', prev)
      window.scrollTo(0, y)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl bg-paper shadow-lift"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="kg-name text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Жабуу" className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-muted hover:bg-line/50">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** A short confirmation that fades on its own ("Шилтеме көчүрүлдү"). */
export function useToast(): [ReactNode, (text: string) => void] {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    if (!text) return
    const t = setTimeout(() => setText(null), 2200)
    return () => clearTimeout(t)
  }, [text])
  const node = text
    ? createPortal(
        <div role="status" className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90%] rounded-2xl bg-ink px-4 py-3 text-base text-paper shadow-lift animate-fadeup">
          {text}
        </div>,
        document.body,
      )
    : null
  return [node, setText]
}
