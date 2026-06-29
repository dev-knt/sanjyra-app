import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ancestorChain } from '../lib/graph'
import { WEB3FORMS_ACCESS_KEY } from '../config'
import { Avatar } from './ui'
import type { PersonNode } from '../types'

type Status = 'idle' | 'sending' | 'sent' | 'error'

// "Suggest an edit" — collects a structured request and emails it to the admin
// via Web3Forms (no backend). NOT a direct edit: the admin + trusted elders
// review before anything changes.
export function RequestEditModal({ person, onClose }: { person: PersonNode; onClose: () => void }) {
  const [what, setWhat] = useState('')
  const [correct, setCorrect] = useState('')
  const [requester, setRequester] = useState('')
  const [relation, setRelation] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [err, setErr] = useState('')

  // Lock background scroll while the sheet is open (incl. iOS rubber-banding).
  useEffect(() => {
    const y = window.scrollY
    const b = document.body
    const prev = b.getAttribute('style') || ''
    b.style.position = 'fixed'
    b.style.top = `-${y}px`
    b.style.left = '0'
    b.style.right = '0'
    b.style.width = '100%'
    b.style.overflow = 'hidden'
    return () => {
      b.setAttribute('style', prev)
      window.scrollTo(0, y)
    }
  }, [])

  const chain = ancestorChain(person.id).map((n) => n.name).join(' ← ')
  const canSend = what.trim().length > 0 && requester.trim().length > 0 && contact.trim().length > 0 && status !== 'sending'

  async function send() {
    if (!WEB3FORMS_ACCESS_KEY) {
      setStatus('error')
      setErr('Жөнөтүү дареги азырынча орнотула элек. Админге кайрылыңыз.')
      return
    }
    setStatus('sending')
    setErr('')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Санжыра — оңдоо сурам: ${person.name}`,
          from_name: requester.trim() || 'Санжыра колдонуучу',
          'Адам': person.name,
          'Ата-теги': chain,
          'Эмнени оңдоо/кошуу керек': what.trim(),
          'Туура маалымат': correct.trim() || '—',
          'Сураган киши': requester.trim(),
          'Тууганчылыгы': relation.trim() || '—',
          'Байланыш': contact.trim() || '—',
        }),
      })
      const data = await res.json()
      if (data.success) setStatus('sent')
      else {
        setStatus('error')
        setErr(data.message || 'Жөнөтүүдө ката кетти.')
      }
    } catch {
      setStatus('error')
      setErr('Тармак катасы. Интернетти текшерип, кайра аракет кылыңыз.')
    }
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fadeup w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain no-scrollbar rounded-t-3xl bg-paper p-5 shadow-lift"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar person={person} size={44} />
            <div className="min-w-0">
              <h2 className="kg-name text-lg font-bold leading-tight">Маалымат оңдоо / толуктоо</h2>
              <p className="kg-name text-sm text-muted truncate">{person.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Жабуу"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none text-muted hover:bg-line/50 active:scale-90"
          >
            ✕
          </button>
        </div>

        {status === 'sent' ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
            <h3 className="kg-name text-lg font-bold">Рахмат! Сурамыңыз жөнөтүлдү.</h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Админ менен аксакалдар текшергенден кийин маалымат жаңыланат.
            </p>
            <button onClick={onClose} className="mt-5 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-soft active:scale-95">
              Жабуу
            </button>
          </div>
        ) : (
          <>
            <p className="mt-3 rounded-xl bg-brand-soft/60 px-3 py-2 text-xs text-ink/80">
              Сурамыңыз админге жөнөтүлөт. Маалымат <b>түз өзгөртүлбөйт</b> — аксакалдар менен текшерилип, бекитилгенден кийин гана жаңыланат.
            </p>

            <div className="mt-4 space-y-3">
              <Field label="Эмнени оңдоо же кошуу керек?" required>
                <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={3} placeholder="Мисалы: ысымы туура эмес, жаңы бала кошуу, туулган жылы…" className={inputCls} />
              </Field>
              <Field label="Туура маалымат (ысым, жылдар, тууганчылык)">
                <textarea value={correct} onChange={(e) => setCorrect(e.target.value)} rows={2} placeholder="Туура болушу керек болгон маалымат…" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Сиздин атыңыз" required>
                  <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Атыңыз" className={inputCls} />
                </Field>
                <Field label="Тууганчылыгыңыз">
                  <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Мис: небереси" className={inputCls} />
                </Field>
              </div>
              <Field label="Байланыш (телефон)" required>
                <input value={contact} onChange={(e) => setContact(e.target.value)} type="tel" inputMode="tel" placeholder="+996…" className={inputCls} />
                <span className="mt-1 block text-[11px] text-muted">Текшерүү үчүн аксакалдар чалышы мүмкүн.</span>
              </Field>
            </div>

            {status === 'error' && <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700">{err}</p>}

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted">
                Жабуу
              </button>
              <button
                onClick={send}
                disabled={!canSend}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-soft active:scale-[0.99] disabled:opacity-40"
              >
                {status === 'sending' ? 'Жөнөтүлүүдө…' : 'Жөнөтүү'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}
