import { useState, useEffect } from 'react'
import type { PersonNode } from '../types'
import { getNode } from '../lib/graph'
import { relate } from '../lib/kinship'
import { PersonPicker } from '../components/PersonPicker'
import { Avatar } from '../components/ui'

// Visual: common ancestor (баба) at the top, two lineage columns descending to
// person A (left) and person B (right). This is the heart of the app.
function RelationDiagram({ a, b }: { a: PersonNode; b: PersonNode }) {
  const r = relate(a.id, b.id)
  if (!r.related || !r.commonAncestor) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-soft">
        <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-muted/50" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18.84 12.25 1.72-1.71a4 4 0 0 0-5.66-5.66l-1.71 1.72M5.16 11.75l-1.72 1.71a4 4 0 0 0 5.66 5.66l1.71-1.72" />
          <path d="m2 2 20 20" />
        </svg>
        <p className="text-sm text-muted">{r.summary || 'Жалпы баба табылган жок.'}</p>
      </div>
    )
  }

  // Columns: oldest (common ancestor) at top → person at bottom.
  const colA = [...r.pathA].reverse() // [ancestor … A]
  const colB = [...r.pathB].reverse()
  const rows = Math.max(colA.length, colB.length)

  const within7 = r.ataApart <= 7

  return (
    <div className="space-y-4">
      {/* Verdict card */}
      <div className="rounded-3xl border border-brand/30 bg-brand-soft/60 p-5 shadow-soft text-center animate-fadeup">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand/80">Тууганчылык</div>
        <div className="kg-name text-xl font-bold mt-1 capitalize">{r.termForB}</div>
        <p className="text-sm text-ink/80 mt-2 leading-relaxed">{r.summary}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-surface px-3 py-1 font-medium">
            Жалпы баба: <span className="kg-name font-semibold">{r.commonAncestor.name}</span>
          </span>
          <span className="rounded-full bg-surface px-3 py-1 font-medium">{r.ataApart}-ата бир</span>
          <span className={`rounded-full px-3 py-1 font-semibold ${within7 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {within7 ? `⚠ Жети атанын ичинде (${r.ataApart})` : '✓ Жети атадан тышкары'}
          </span>
        </div>
      </div>

      {/* Two-column lineage diagram */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft overflow-x-auto no-scrollbar">
        {/* common ancestor on top */}
        <div className="flex justify-center mb-1">
          <div className="flex flex-col items-center">
            <Avatar person={r.commonAncestor} size={48} />
            <div className="kg-name text-sm font-bold mt-1">{r.commonAncestor.name}</div>
            <div className="text-[10px] text-muted">жалпы баба</div>
          </div>
        </div>
        <div className="flex justify-center text-muted text-lg leading-none">⌄</div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {[colA, colB].map((col, ci) => (
            <div key={ci} className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {ci === 0 ? a.name : b.name}
              </div>
              {col.slice(1).map((p, i) => {
                const isPerson = i === col.length - 2
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    {i > 0 && <div className="h-3 w-px bg-line" />}
                    <div
                      className={`flex items-center gap-1.5 rounded-full border px-2 py-1 ${
                        isPerson ? 'border-brand bg-brand-soft' : 'border-line bg-paper'
                      }`}
                    >
                      <Avatar person={p} size={22} />
                      <span className="kg-name text-xs font-medium whitespace-nowrap">{p.name}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-[10px] text-muted">{rows - 1} муун ылдый</div>
      </div>
    </div>
  )
}

export function RelateScreen({ seedId }: { seedId?: string }) {
  const [a, setA] = useState<PersonNode | null>(seedId ? getNode(seedId) ?? null : null)
  const [b, setB] = useState<PersonNode | null>(null)

  useEffect(() => {
    if (seedId) setA(getNode(seedId) ?? null)
  }, [seedId])

  return (
    <div className="animate-fadeup pb-28">
      <div className="px-5 pt-6 pb-2">
        <h1 className="kg-name text-2xl font-bold">Тууганчылык</h1>
        <p className="text-sm text-muted mt-0.5">Эки адам кандай тууган экенин табыңыз</p>
      </div>

      <div className="px-5 grid gap-3 mt-2">
        <PersonPicker label="Биринчи адам" value={a} onChange={setA} />
        <div className="flex justify-center -my-1">
          <div className="rounded-full bg-surface border border-line px-3 py-0.5 text-xs text-muted shadow-soft">
            менен
          </div>
        </div>
        <PersonPicker label="Экинчи адам" value={b} onChange={setB} />
      </div>

      <div className="px-5 mt-5">
        {a && b ? (
          a.id === b.id ? (
            <p className="text-center text-sm text-muted">Бул бир эле адам — башка тууганды тандаңыз.</p>
          ) : (
            <RelationDiagram a={a} b={b} />
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Эки адамды тандасаңыз, алардын ортосундагы байланыш көрсөтүлөт.
          </div>
        )}
      </div>
    </div>
  )
}
