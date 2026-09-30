import { useState } from 'react'
import type { PersonNode } from '../types'
import { searchPeople } from '../lib/search'
import { Avatar, LineageLine, patronymic } from './ui'

/** One search result: name, patronymic, and father ‹ grandfather ‹ great-grandfather. */
export function PersonResult({ p, onPick }: { p: PersonNode; onPick: (p: PersonNode) => void }) {
  return (
    <button onClick={() => onPick(p)} className="flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-brand-soft/50 active:scale-[0.99]">
      <Avatar person={p} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="kg-name text-lg font-bold">{p.name}</span>
          <span className="text-sm text-muted">{patronymic(p)}</span>
        </div>
        <LineageLine person={p} />
      </div>
    </button>
  )
}

/** Search box + results list. */
export function PersonSearch({ onPick, placeholder = 'Атын жазыңыз…', limit = 8, autoFocus }: { onPick: (p: PersonNode) => void; placeholder?: string; limit?: number; autoFocus?: boolean }) {
  const [q, setQ] = useState('')
  const hits = q.trim() ? searchPeople(q, limit) : []
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {q.trim() && hits.length === 0 && <p className="px-1 pt-3 text-base text-muted">«{q}» табылган жок. Башкача жазып көрүңүз.</p>}
      {hits.length > 0 && (
        <div className="mt-2 divide-y divide-line/70">
          {hits.map((h) => (
            <PersonResult key={h.node.id} p={h.node} onPick={(p) => { onPick(p); setQ('') }} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Compact pick-a-person card used by the relationship screen. */
export function PersonPicker({ label, value, onChange }: { label: string; value: PersonNode | null; onChange: (p: PersonNode | null) => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft">
      <div className="mb-2 flex min-h-[32px] items-center justify-between px-1">
        <span className="text-sm font-bold text-muted">{label}</span>
        {value && (
          <button onClick={() => onChange(null)} className="min-h-[40px] rounded-xl px-3 text-sm font-bold text-brand hover:bg-brand-soft/60">
            Өзгөртүү
          </button>
        )}
      </div>
      {value ? (
        <div className="flex items-start gap-3 px-1">
          <Avatar person={value} size={44} />
          <div className="min-w-0 flex-1">
            <div className="kg-name text-lg font-bold">{value.name}</div>
            <LineageLine person={value} />
          </div>
        </div>
      ) : (
        <PersonSearch onPick={onChange} limit={6} />
      )}
    </div>
  )
}
