import { useRef, useLayoutEffect } from 'react'
import { getNode, fatherOf, childrenNodes, ancestorChain } from '../../lib/graph'
import { branchHue } from '../../lib/branches'
import { Avatar, lifespan } from '../ui'
import type { PersonNode } from '../../types'

function Chip({ p, focus, onTap }: { p: PersonNode; focus?: boolean; onTap: () => void }) {
  const hue = branchHue(p.id)
  return (
    <button onClick={onTap} style={{ width: 86, borderColor: `hsl(${hue} 55% ${focus ? '45%' : '80%'})` }} className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 bg-paper px-2 py-2 transition active:scale-95">
      <Avatar person={p} size={40} />
      <span className="kg-name text-xs font-semibold leading-tight text-center line-clamp-1">{p.name}</span>
      <span className="text-[10px] leading-none text-muted">{p.birthYear ?? ''}</span>
    </button>
  )
}

function Rail({ label, people, focusId, onTap }: { label: string; people: PersonNode[]; focusId?: string; onTap: (id: string) => void }) {
  if (!people.length) return null
  return (
    <div>
      <div className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{label} · {people.length}</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {people.map((p) => <Chip key={p.id} p={p} focus={p.id === focusId} onTap={() => onTap(p.id)} />)}
      </div>
    </div>
  )
}

// Spotlight: only the focal person + immediate neighbourhood. Tap to glide.
export function SpotlightView({ focalId, setFocalId, onOpen }: { focalId: string; setFocalId: (id: string) => void; onOpen?: (id: string) => void }) {
  const p = getNode(focalId)
  if (!p) return null
  const father = fatherOf(focalId)
  const siblings = father ? childrenNodes(father.id) : []
  const children = childrenNodes(focalId)
  const hue = branchHue(focalId)
  // Full paternal line above the focal person, oldest (баба) at the top.
  const ancestors = ancestorChain(focalId).slice(1).reverse()

  // Keep the focal person centred in view: ancestors sit above (scroll up to
  // reveal the whole line up to Багыш), descendants below.
  const scrollRef = useRef<HTMLDivElement>(null)
  const focalRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef(true)
  useLayoutEffect(() => {
    const c = scrollRef.current
    const f = focalRef.current
    if (!c || !f) return
    const target = Math.max(0, f.offsetTop - (c.clientHeight - f.clientHeight) / 2)
    c.scrollTo({ top: target, behavior: firstRef.current ? 'auto' : 'smooth' })
    firstRef.current = false
  }, [focalId])

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-y-auto no-scrollbar px-4 pt-4"
      style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
    >
      {ancestors.length > 0 && (
        <div className="flex flex-col items-center">
          {ancestors.map((a, i) => (
            <div key={a.id} className="flex flex-col items-center">
              {i > 0 && <div className="h-2 w-px bg-line" />}
              <button
                onClick={() => setFocalId(a.id)}
                className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 hover:border-brand/40"
              >
                <Avatar person={a} size={22} />
                <span className="kg-name text-sm font-medium">{a.name}</span>
                {i === ancestors.length - 1 && <span className="text-[10px] text-muted">ата</span>}
              </button>
            </div>
          ))}
          <div className="h-3 w-px bg-line" />
        </div>
      )}

      <div ref={focalRef} key={focalId} className="animate-fadeup mt-1 rounded-3xl border-2 bg-surface p-5 shadow-soft text-center" style={{ borderColor: `hsl(${hue} 55% 55%)` }}>
        <div className="flex justify-center"><Avatar person={p} size={76} /></div>
        <h2 className="kg-name text-2xl font-bold mt-2">{p.name}</h2>
        <div className="text-sm text-muted mt-0.5">{lifespan(p)}{p.birthPlace ? ` · ${p.birthPlace}` : ''}</div>
        {onOpen && (
          <button onClick={() => onOpen(p.id)} className="mt-3 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-soft active:scale-95">
            Кеңири маалымат →
          </button>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <Rail label="Бир туугандары" people={siblings.length > 1 ? siblings : []} focusId={focalId} onTap={setFocalId} />
        <Rail label="Балдары" people={children} onTap={setFocalId} />
      </div>
      {!children.length && <p className="mt-4 text-center text-xs text-muted">Тукуму катталган эмес.</p>}
    </div>
  )
}
