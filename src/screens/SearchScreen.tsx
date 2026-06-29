import { useState } from 'react'
import { searchPeople } from '../lib/search'
import { allNodes } from '../lib/graph'
import { Avatar, lifespan } from '../components/ui'
import { SunburstOverlay } from '../components/tree/SunburstOverlay'

export function SearchScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [artFailed, setArtFailed] = useState(false)
  const [showSun, setShowSun] = useState(false)
  const hits = q.trim() ? searchPeople(q, 40) : []
  const total = allNodes().length

  return (
    <div className="animate-fadeup">
      <div className="px-5 pt-6 pb-3">
        <h1 className="kg-name text-2xl font-bold">Санжыра</h1>
        <p className="text-sm text-muted mt-0.5">Багыш уруусу · Сары-Булак айылы · Жалал-Абад</p>
      </div>

      <div className="px-5 sticky top-0 z-10 bg-paper/90 backdrop-blur pb-3 pt-1">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Адамды атынан издөө…"
            className="w-full rounded-2xl bg-surface border border-line pl-10 pr-4 py-3.5 text-base shadow-soft outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div className="px-5 pb-28">
        {!q.trim() && (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-full rounded-2xl border border-line bg-surface p-5 text-center shadow-soft">
              <svg viewBox="0 0 24 24" className="mx-auto mb-1.5 h-7 w-7 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.03a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z" />
                <path d="M12 19v3" />
              </svg>
              <p className="text-sm text-muted">
                Санжырада <span className="font-semibold text-ink">{total}</span> адам бар.
                <br />
                Тууганыңыздын атын жазып баштаңыз.
              </p>
            </div>

            <button
              onClick={() => setShowSun(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-semibold text-white shadow-soft active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
              </svg>
              Бүт санжыраны көрүү
            </button>

            {/* Baatyr hero — framed "epic plate": arched top, soft shadow, crisp edges */}
            {!artFailed && (
              <figure className="mt-8 flex w-full flex-col items-center">
                <div
                  className="overflow-hidden rounded-full bg-black shadow-lift ring-4 ring-surface"
                  style={{ width: 'min(64vw, 248px)', height: 'min(64vw, 248px)', outline: '1px solid rgb(var(--c-line))' }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}baatyr.jpg`}
                    alt="Багыш баатыры"
                    draggable={false}
                    onError={() => setArtFailed(true)}
                    className="h-full w-full select-none object-cover"
                    style={{ objectPosition: '50% 12%' }}
                  />
                </div>
              </figure>
            )}
          </div>
        )}

        {q.trim() && hits.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-muted/50" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
              <path d="m9 9 4 4M13 9l-4 4" />
            </svg>
            <p className="kg-name mt-3 text-base font-semibold">«{q}» табылган жок</p>
            <p className="mt-1 max-w-[15rem] text-sm text-muted">Атты башкача же кыскараак жазып көрүңүз.</p>
          </div>
        )}

        <div className="mt-2 space-y-1.5">
          {hits.map((h) => (
            <button
              key={h.node.id}
              onClick={() => onOpen(h.node.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 text-left shadow-soft transition hover:border-brand/40 active:scale-[0.99]"
            >
              <Avatar person={h.node} />
              <div className="min-w-0 flex-1">
                <span className="kg-name text-base font-semibold truncate block">{h.node.name}</span>
                <div className="text-xs text-muted truncate">
                  {[h.fatherName ? `${h.fatherName}дын баласы` : 'уруунун бабасы', lifespan(h.node)].filter(Boolean).join(' · ')}
                </div>
              </div>
              <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {showSun && <SunburstOverlay onClose={() => setShowSun(false)} onOpen={onOpen} />}
    </div>
  )
}
