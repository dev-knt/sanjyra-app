import { useRef, useState, useEffect } from 'react'
import { getNode, fatherOf, childrenNodes, ancestorChain } from '../lib/graph'
import { FanChart } from '../components/FanChart'
import { RequestEditModal } from '../components/RequestEditModal'
import { Avatar, lifespan } from '../components/ui'
import type { PersonNode } from '../types'

// Жети-ата fan in a fixed-height scroll view: the full paternal line is rendered,
// older generations fade out behind the top edge; scroll up to reveal them.
function AncestorFan({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasAbove, setHasAbove] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = el.scrollHeight // start at the bottom (focal person + nearest fathers)
    setHasAbove(el.scrollTop > 4)
  }, [id])
  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={(e) => setHasAbove(e.currentTarget.scrollTop > 4)}
        className="h-[230px] overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 48px)',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 48px)',
        }}
      >
        <FanChart rootId={id} onSelect={onOpen} />
      </div>
      {hasAbove && (
        <div className="pointer-events-none absolute inset-x-0 top-1.5 flex justify-center">
          <span className="flex items-center gap-1 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-soft">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m6 15 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            жогору дагы ата бар
          </span>
        </div>
      )}
    </div>
  )
}

function MiniRow({ p, onOpen, tag }: { p: PersonNode; onOpen: (id: string) => void; tag?: string }) {
  return (
    <button
      onClick={() => onOpen(p.id)}
      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-brand-soft/50 active:scale-[0.99]"
    >
      <Avatar person={p} size={36} />
      <div className="min-w-0 flex-1">
        <div className="kg-name text-sm font-semibold truncate">{p.name}</div>
        <div className="text-[11px] text-muted truncate">
          {tag ? <span className="text-brand font-medium">{tag} · </span> : null}
          {lifespan(p)}
        </div>
      </div>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft">
      <div className="text-xs font-semibold text-muted px-1 mb-1.5 uppercase tracking-wide">{title}</div>
      {children}
    </div>
  )
}

// Lucide line-icons (replacing emojis) — match the bottom-nav icon style.
const ic = 'h-4 w-4'
const TreeIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="12" cy="18" r="2.4" />
    <path d="M6 8.4v1.6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.4M12 12v3.6" />
  </svg>
)
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
  </svg>
)
const PenIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)

export function PersonScreen({ id, onOpen, onRelate, onTree }: { id: string; onOpen: (id: string) => void; onRelate: (id: string) => void; onTree: (id: string) => void }) {
  const [showReq, setShowReq] = useState(false)
  const person = getNode(id)
  if (!person) return <div className="p-8 text-center text-muted">Табылган жок.</div>

  const father = fatherOf(id)
  const siblings = father ? childrenNodes(father.id).filter((c) => c.id !== id) : []
  const children = childrenNodes(id)
  const chain = ancestorChain(id)
  const ataCount = chain.length - 1

  return (
    <div className="animate-fadeup pb-28">
      {/* Header card */}
      <div className="px-5 pt-6">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <Avatar person={person} size={64} />
            <div className="min-w-0">
              <h1 className="kg-name text-2xl font-bold leading-tight flex items-center gap-2">
                {person.name}
              </h1>
              <div className="text-sm text-muted mt-0.5">
                {[lifespan(person), ataCount > 0 ? `${ataCount} муун` : null, person.birthPlace]
                  .filter(Boolean)
                  .join(' · ') || 'уруунун башы'}
              </div>
            </div>
          </div>

          {/* Patronymic breadcrumb as tappable chips (ancestors, oldest-last) */}
          {chain.length > 1 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {chain.slice(1).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpen(p.id)}
                  className="kg-name shrink-0 rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-muted transition hover:border-brand/40 hover:text-brand"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => onTree(id)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-brand/40 bg-brand-soft/60 py-2.5 text-sm font-semibold text-brand active:scale-[0.99]"
            >
              <TreeIcon /> Толук дарак
            </button>
            <button
              onClick={() => onRelate(id)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow-soft active:scale-[0.99]"
            >
              <LinkIcon /> Ким болот?
            </button>
          </div>

          <button
            onClick={() => setShowReq(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-paper py-2.5 text-sm font-semibold text-muted active:scale-[0.99]"
          >
            <PenIcon /> Маалымат оңдоо / толуктоо сурам
          </button>
        </div>
      </div>

      {/* Fan chart — жети ата */}
      <div className="px-5 mt-4">
        <Section title={`Жети ата · ${ataCount} муун`}>
          <AncestorFan id={id} onOpen={onOpen} />
          <p className="text-center text-[11px] text-muted mt-1">Жогору сүрүп бардык аталарды көрүңүз · тегеректи басып өтүңүз</p>
        </Section>
      </div>

      {person.bio && (
        <div className="px-5 mt-4">
          <Section title="Эскерүү">
            <p className="text-sm leading-relaxed px-1 pb-1">{person.bio}</p>
          </Section>
        </div>
      )}

      {/* Family */}
      <div className="px-5 mt-4 grid gap-4">

        {father && (
          <Section title="Атасы">
            <MiniRow p={father} onOpen={onOpen} />
          </Section>
        )}

        {siblings.length > 0 && (
          <Section title={`Бир туугандары · ${siblings.length}`}>
            {siblings.map((s) => (
              <MiniRow key={s.id} p={s} onOpen={onOpen} />
            ))}
          </Section>
        )}

        {children.length > 0 && (
          <Section title={`Балдары · ${children.length}`}>
            {children.map((c) => (
              <MiniRow key={c.id} p={c} onOpen={onOpen} />
            ))}
          </Section>
        )}
      </div>

      {showReq && <RequestEditModal person={person} onClose={() => setShowReq(false)} />}
    </div>
  )
}
