import { useState } from 'react'
import { searchPeople } from '../lib/search'
import { allNodes, MAX_GENERATION } from '../lib/graph'
import { go } from '../lib/router'
import { useMe } from '../lib/prefs'
import { PersonResult } from '../components/PersonPicker'

export function SearchScreen({ onAskMe }: { onAskMe: () => void }) {
  const [q, setQ] = useState('')
  const [artFailed, setArtFailed] = useState(false)
  const [meId] = useMe()
  const hits = q.trim() ? searchPeople(q, 40) : []

  return (
    <div className="animate-fadeup pb-32">
      <div className="px-5 pb-3 pt-6">
        <h1 className="kg-name text-3xl font-bold">Санжыра</h1>
        <p className="mt-0.5 text-base text-muted">Багыш уруусу · Сары-Булак айылы · Жалал-Абад</p>
      </div>

      <div className="sticky top-[57px] z-10 bg-paper/95 px-5 pb-3 pt-1 backdrop-blur">
        <label className="relative block">
          <span className="sr-only">Адамды атынан издөө</span>
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Адамды атынан издөө…"
            enterKeyHint="search"
            className="w-full rounded-2xl border border-line bg-surface py-4 pl-12 pr-4 text-lg shadow-soft outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      <div className="px-5">
        {!q.trim() && (
          <div className="mt-4 grid gap-3">
            {!meId && (
              <button onClick={onAskMe} className="rounded-2xl border-2 border-brand/40 bg-brand-soft/60 p-4 text-left active:scale-[0.99]">
                <span className="kg-name block text-xl font-bold text-brand">Өзүңүздү табыңыз</span>
                <span className="mt-1 block text-base text-ink/80">Бир жолу тандасаңыз, ар бир адамдын барагында ал сизге ким болору жазылат.</span>
              </button>
            )}
            <div className="rounded-2xl border border-line bg-surface p-5 text-center shadow-soft">
              <p className="text-lg">
                Санжырада <b className="tabular-nums">{allNodes().length}</b> адам · <b className="tabular-nums">{MAX_GENERATION + 1}</b> муун
              </p>
              <p className="mt-1 text-base text-muted">Тууганыңыздын атын жазып баштаңыз.</p>
            </div>
            {!artFailed && (
              <figure className="mt-4 flex justify-center">
                <div className="overflow-hidden rounded-full bg-black shadow-lift ring-4 ring-surface" style={{ width: 'min(64vw, 248px)', height: 'min(64vw, 248px)' }}>
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
          <div className="mt-12 text-center">
            <p className="kg-name text-xl font-bold">«{q}» табылган жок</p>
            <p className="mx-auto mt-1 max-w-[16rem] text-base text-muted">Атты башкача же кыскараак жазып көрүңүз.</p>
          </div>
        )}

        {hits.length > 0 && (
          <div className="mt-1 divide-y divide-line/70 rounded-2xl border border-line bg-surface px-2">
            {hits.map((h) => (
              <PersonResult key={h.node.id} p={h.node} onPick={(p) => go({ name: 'person', id: p.id })} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
