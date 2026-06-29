import { useState } from 'react'
import type { PersonNode } from '../types'
import { searchPeople } from '../lib/search'
import { Avatar, lifespan } from './ui'

// Compact search-and-pick used by the "How are we related?" screen.
export function PersonPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: PersonNode | null
  onChange: (p: PersonNode | null) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const hits = q ? searchPeople(q, 6) : []

  if (value) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft">
        <div className="text-xs font-medium text-muted mb-2">{label}</div>
        <div className="flex items-center gap-3">
          <Avatar person={value} size={40} />
          <div className="min-w-0 flex-1">
            <div className="kg-name text-base font-semibold truncate">{value.name}</div>
            <div className="text-xs text-muted">{lifespan(value)}</div>
          </div>
          <button
            onClick={() => {
              onChange(null)
              setQ('')
            }}
            className="text-xs font-medium text-muted hover:text-ink px-2 py-1"
          >
            өзгөртүү
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft">
      <div className="text-xs font-medium text-muted mb-2">{label}</div>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Атын жазыңыз…"
        className="w-full rounded-xl bg-paper border border-line px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      {open && hits.length > 0 && (
        <div className="mt-2 space-y-1">
          {hits.map((h) => (
            <button
              key={h.node.id}
              onClick={() => {
                onChange(h.node)
                setOpen(false)
                setQ('')
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-brand-soft/60"
            >
              <Avatar person={h.node} size={32} />
              <div className="min-w-0">
                <div className="kg-name text-sm font-medium truncate">{h.node.name}</div>
                <div className="text-[11px] text-muted truncate">
                  {h.fatherName ? `${h.fatherName}дын уулу/кызы` : 'баба'} · {lifespan(h.node)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
