import { useState } from 'react'
import { getNode } from '../lib/graph'
import { go } from '../lib/router'
import { THEMES, useBigText, useMe, useTheme } from '../lib/prefs'
import { Avatar, LineageLine, Sheet } from './ui'
import { PersonSearch } from './PersonPicker'

// «Мен ким?» — the viewer picks himself once; every person page then says how
// that person is related to him. Also holds the look settings (colour, text size).
export function MeSheet({ onClose, onToast }: { onClose: () => void; onToast: (t: string) => void }) {
  const [meId, setMe] = useMe()
  const [theme, setTheme] = useTheme()
  const [big, setBig] = useBigText()
  const me = meId ? getNode(meId) : undefined
  const [changing, setChanging] = useState(!me)

  return (
    <Sheet title={me && !changing ? 'Мен' : 'Мен ким?'} onClose={onClose}>
      {me && !changing ? (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-start gap-3">
            <Avatar person={me} size={52} />
            <div className="min-w-0">
              <div className="kg-name text-2xl font-bold">{me.name}</div>
              <LineageLine person={me} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { go({ name: 'person', id: me.id }); onClose() }} className="min-h-[48px] rounded-xl bg-brand text-base font-bold text-white">
              Менин барагым
            </button>
            <button onClick={() => setChanging(true)} className="min-h-[48px] rounded-xl border border-line bg-paper text-base font-bold text-ink">
              Башка адам
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-base text-muted">Өзүңүздү табыңыз. Ар бир адамдын барагында ал сизге ким болору көрсөтүлөт.</p>
          <PersonSearch
            autoFocus
            placeholder="Атыңызды жазыңыз…"
            onPick={(p) => {
              setMe(p.id)
              setChanging(false)
              onToast(`Сиз: ${p.name}`)
            }}
          />
          {me && (
            <button onClick={() => setChanging(false)} className="mt-3 min-h-[44px] text-base font-bold text-brand">
              ← Артка
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 border-t border-line pt-5">
        <div>
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Түсү</div>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 bg-surface text-base font-bold ${theme === t.id ? 'border-ink' : 'border-line'}`}
              >
                <span className="h-5 w-5 rounded-full" style={{ background: t.swatch }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Тамганын өлчөмү</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { on: false, label: 'Кадимки' },
              { on: true, label: 'Чоң' },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => setBig(o.on)}
                aria-pressed={big === o.on}
                className={`min-h-[48px] rounded-xl border-2 bg-surface font-bold ${o.on ? 'text-xl' : 'text-base'} ${big === o.on ? 'border-ink' : 'border-line'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
