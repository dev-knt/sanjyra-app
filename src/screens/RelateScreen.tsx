import type { PersonNode } from '../types'
import { getNode } from '../lib/graph'
import { relate, phrase } from '../lib/kinship'
import { go, absoluteUrl } from '../lib/router'
import { shareLink } from '../lib/share'
import { useMe } from '../lib/prefs'
import { PersonPicker } from '../components/PersonPicker'
import { Avatar } from '../components/ui'

// "Ким болот?" — the relationship between two people, in plain Kyrgyz sentences,
// with the two father-lines meeting at the common ancestor.
function Result({ a, b, onToast }: { a: PersonNode; b: PersonNode; onToast: (t: string) => void }) {
  const r = relate(a.id, b.id)
  if (!r.related || !r.commonAncestor) {
    return <p className="rounded-2xl border border-line bg-surface p-6 text-center text-base text-muted">Бул экөөнүн жалпы бабасы санжырада табылган жок.</p>
  }
  const colA = [...r.pathA].reverse().slice(1) // below the common ancestor, down to A
  const colB = [...r.pathB].reverse().slice(1)
  const open = (id: string) => go({ name: 'person', id })

  async function share() {
    const res = await shareLink(`${b.name} — ${phrase(r.rel, { name: a.name })}`, absoluteUrl({ name: 'relate', a: a.id, b: b.id }))
    if (res === 'copied') onToast('Шилтеме көчүрүлдү')
  }

  return (
    <div className="grid gap-4">
      <section className="animate-fadeup grid gap-3 rounded-3xl border border-brand/30 bg-brand-soft/60 p-5 text-center shadow-soft">
        <p className="kg-name text-2xl font-bold leading-snug">
          {b.name} — {phrase(r.rel, { name: a.name })}
        </p>
        {r.rel.kind !== 'self' && (
          <p className="text-base text-ink/80">
            {a.name} — {phrase(r.reverse, { name: b.name })}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="rounded-full bg-surface px-3 py-1.5 font-bold">
            Жалпы бабасы: <span className="kg-name">{r.commonAncestor.name}</span>
          </span>
          {r.withinSeven != null && (
            <span className={`rounded-full px-3 py-1.5 font-bold ${r.withinSeven ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {r.withinSeven ? `Жети атанын ичинде · ${r.ataApart}-ата` : `Жети атадан тышкары · ${r.ataApart}-ата`}
            </span>
          )}
        </div>
        <button onClick={share} className="mx-auto min-h-[44px] rounded-xl px-4 text-base font-bold text-brand hover:bg-surface/70">
          Бөлүшүү
        </button>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <button onClick={() => open(r.commonAncestor!.id)} className="mx-auto flex flex-col items-center">
          <Avatar person={r.commonAncestor} size={52} />
          <span className="kg-name mt-1 text-lg font-bold">{r.commonAncestor.name}</span>
          <span className="text-sm text-muted">жалпы бабасы</span>
        </button>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[colA, colB].map((col, ci) => (
            <div key={ci} className="flex flex-col items-center">
              {col.map((p, i) => {
                const isEnd = i === col.length - 1
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-line" />
                    <button onClick={() => open(p.id)} className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 px-3 py-1 ${isEnd ? 'border-brand bg-brand-soft' : 'border-line bg-paper'}`}>
                      <Avatar person={p} size={26} />
                      <span className="kg-name text-base font-bold">{p.name}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function RelateScreen({ aId, bId, onToast }: { aId?: string; bId?: string; onToast: (t: string) => void }) {
  const [meId] = useMe()
  const a = getNode(aId ?? '') ?? null
  const b = getNode(bId ?? '') ?? null
  const set = (na: PersonNode | null, nb: PersonNode | null) => go({ name: 'relate', a: na?.id, b: nb?.id }, true)

  return (
    <div className="animate-fadeup grid gap-4 px-4 pb-32 pt-5">
      <header>
        <h1 className="kg-name text-2xl font-bold">Тууганчылык</h1>
        <p className="text-base text-muted">Эки адам бири-бирине ким болорун табыңыз</p>
      </header>

      <div className="grid gap-2">
        <PersonPicker label={a && a.id === meId ? 'Биринчи адам (сиз)' : 'Биринчи адам'} value={a} onChange={(p) => set(p, b)} />
        {!a && meId && (
          <button onClick={() => set(getNode(meId)!, b)} className="min-h-[44px] justify-self-start rounded-xl px-3 text-base font-bold text-brand hover:bg-brand-soft/60">
            + Өзүмдү тандоо
          </button>
        )}
        <div className="flex justify-center">
          <span className="rounded-full border border-line bg-surface px-3 py-0.5 text-sm text-muted">менен</span>
        </div>
        <PersonPicker label="Экинчи адам" value={b} onChange={(p) => set(a, p)} />
      </div>

      {a && b ? (
        a.id === b.id ? (
          <p className="text-center text-base text-muted">Бул бир эле адам. Башка тууганды тандаңыз.</p>
        ) : (
          <Result a={a} b={b} onToast={onToast} />
        )
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-base text-muted">Эки адамды тандасаңыз, алар бири-бирине ким болору көрсөтүлөт.</p>
      )}
    </div>
  )
}
