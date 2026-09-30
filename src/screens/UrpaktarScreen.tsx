import { useState } from 'react'
import { getNode, fatherOf, childrenNodes, ancestorChain, descendantCount, MAX_GENERATION } from '../lib/graph'
import { FANOUT } from '../lib/branches'
import { go } from '../lib/router'
import { useMe } from '../lib/prefs'
import { ablative } from '../lib/kyrgyz'
import { familyCount } from '../components/ui'
import { SunburstOverlay } from '../components/tree/SunburstOverlay'
import type { PersonNode } from '../types'

// Browse the clan by branch without sideways scrolling: a sliding window that shows
// at most three levels (a father, his sons, one son's sons). Opening a fourth level
// slides the oldest into the path bar; indentation never exceeds two steps, so the
// view works the same at 5 generations or 50.

function Row({ p, level, toggle, onToggle }: { p: PersonNode; level: 0 | 1 | 2; toggle: '▸' | '▾' | null; onToggle: () => void }) {
  return (
    <div className={`flex min-h-[60px] items-center gap-2 py-2 pr-3 ${level === 0 ? 'bg-brand-soft/70' : ''}`} style={{ paddingLeft: 10 + level * 22 }}>
      {toggle ? (
        <button onClick={onToggle} aria-label={toggle === '▾' ? 'Жабуу' : 'Уулдарын көрүү'} aria-expanded={toggle === '▾'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg font-bold text-brand">
          <svg viewBox="0 0 24 24" className={`h-6 w-6 transition-transform ${toggle === '▾' ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      ) : (
        <span className="h-11 w-11 shrink-0" />
      )}
      <button onClick={() => go({ name: 'person', id: p.id })} className="min-w-0 flex-1 text-left">
        <div className={`kg-name truncate font-bold ${level === 0 ? 'text-xl' : 'text-lg'}`}>{p.name}</div>
        <div className="text-sm text-muted">{familyCount(p)}</div>
      </button>
      <span className="shrink-0 text-sm tabular-nums text-muted">{p.generation}-муун</span>
    </div>
  )
}

export function UrpaktarScreen({ anchorId, openId }: { anchorId?: string; openId?: string }) {
  const [meId] = useMe()
  const [showSun, setShowSun] = useState(false)
  const start = FANOUT?.childrenIds.find((c) => childrenNodes(c).length) // Аттокур → Бөкөлөй
  const anchor = getNode(anchorId ?? '') ?? FANOUT ?? getNode(start ?? '')
  if (!anchor) return null
  const open = anchorId ? openId : start
  const set = (a: string, o: string | undefined, replace: boolean) => go({ name: 'urpaktar', anchor: a, open: o }, replace)

  function toggle(p: PersonNode) {
    if (p.id === anchor!.id) {
      const f = fatherOf(p.id) // step the window up one generation
      if (f) set(f.id, p.id, false)
    } else if (p.fatherId === anchor!.id) {
      set(anchor!.id, open === p.id ? undefined : p.id, true)
    } else {
      set(p.fatherId!, p.id, false) // a grandson opened: slide the window down
    }
  }

  const up = ancestorChain(anchor.id).slice(1).reverse() // oldest first
  const crumbs: (PersonNode | null)[] = up.length > 3 ? [up[0], null, ...up.slice(-2)] : up
  const sons = childrenNodes(anchor.id)
  const me = meId ? getNode(meId) : undefined
  const myLine = me ? ancestorChain(me.id) : []

  return (
    <div className="animate-fadeup grid gap-4 px-4 pb-32 pt-5">
      <header className="grid gap-3">
        <div>
          <h1 className="kg-name text-2xl font-bold">Урпактар</h1>
          <p className="text-base text-muted">
            {FANOUT ? `${ablative(FANOUT.name)} тараган · ${descendantCount(FANOUT.id)} урпак · ${MAX_GENERATION + 1} муун` : ''}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setShowSun(true)} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6.4 6.4" /></svg>
            Бүт санжыра
          </button>
          {me && myLine.length >= 3 ? (
            <button onClick={() => set(myLine[2].id, myLine[1].id, false)} className="min-h-[48px] rounded-xl border-2 border-brand/40 bg-surface text-base font-bold text-brand">
              Менин бутагым
            </button>
          ) : (
            <button onClick={() => set(FANOUT?.id ?? anchor.id, start, false)} className="min-h-[48px] rounded-xl border-2 border-line bg-surface text-base font-bold text-ink">
              Башына
            </button>
          )}
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <nav aria-label="Жол" className="flex min-h-[52px] flex-wrap items-center gap-1.5 border-b border-line px-3 py-2">
          {crumbs.length === 0 && <span className="text-base text-muted">Уруунун башы</span>}
          {crumbs.map((c, i) => (
            <span key={c?.id ?? 'gap'} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted">›</span>}
              {c ? (
                <button onClick={() => set(c.id, up[up.indexOf(c) + 1]?.id ?? anchor.id, false)} className="kg-name min-h-[36px] rounded-full bg-brand-soft px-3 text-base font-bold text-brand">
                  {c.name}
                </button>
              ) : (
                <span className="text-sm text-muted">… {up.length - 3} ата …</span>
              )}
            </span>
          ))}
        </nav>
        <div className="divide-y divide-line">
          <Row p={anchor} level={0} toggle={anchor.fatherId ? '▾' : null} onToggle={() => toggle(anchor)} />
          {sons.map((s) => {
            const isOpen = s.id === open
            const hasSons = childrenNodes(s.id).length > 0
            return (
              <div key={s.id} className="divide-y divide-line">
                <Row p={s} level={1} toggle={hasSons ? (isOpen ? '▾' : '▸') : null} onToggle={() => toggle(s)} />
                {isOpen && childrenNodes(s.id).map((g) => <Row key={g.id} p={g} level={2} toggle={childrenNodes(g.id).length ? '▸' : null} onToggle={() => toggle(g)} />)}
              </div>
            )
          })}
        </div>
      </div>
      <p className="px-1 text-sm text-muted">Жебени бассаңыз, уулдары ачылат. Атын бассаңыз, анын барагы ачылат.</p>

      {showSun && <SunburstOverlay onClose={() => setShowSun(false)} onOpen={(id) => go({ name: 'person', id })} />}
    </div>
  )
}
