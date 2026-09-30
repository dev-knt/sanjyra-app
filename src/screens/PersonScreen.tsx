import { useState } from 'react'
import { getNode, fatherOf, childrenNodes, ancestorChain } from '../lib/graph'
import { branchOf } from '../lib/branches'
import { relate, phrase } from '../lib/kinship'
import { go, absoluteUrl } from '../lib/router'
import { dative } from '../lib/kyrgyz'
import { shareLink } from '../lib/share'
import { useMe } from '../lib/prefs'
import { RequestEditModal } from '../components/RequestEditModal'
import { Avatar, PersonRow, SectionTitle, familyCount, patronymic } from '../components/ui'

// The one person screen (merged «Адам» + «Дарак», layout A): hero card with the
// relationship to «Мен», a numbered ladder of fathers read like the жети ата
// recitation, then sons and brothers as large rows. Tapping anyone re-centres here.

const ATA_KIN = ['ата', 'чоң ата', 'баба']
const ic = 'h-6 w-6'
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" /></svg>
)
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
)
const PenIcon = () => (
  <svg viewBox="0 0 24 24" className={ic} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
)

function FatherLadder({ id, open }: { id: string; open: (id: string) => void }) {
  const [all, setAll] = useState(false)
  const line = ancestorChain(id).slice(1) // father first
  const shown = all ? line : line.slice(0, 7)
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2">
      {shown.map((a, i) => (
        <div key={a.id}>
          {i === 7 && <div className="ml-12 mt-1 border-t-2 border-dashed border-accent pt-1 text-sm font-bold text-accent">жети атадан жогору</div>}
          <button onClick={() => open(a.id)} className="relative grid min-h-[48px] w-full grid-cols-[36px_1fr_auto] items-center gap-3 rounded-xl px-1 text-left active:bg-brand-soft/50">
            {i < shown.length - 1 && <span className="absolute left-[18px] top-[36px] h-4 w-0.5 bg-line" aria-hidden />}
            <span className="relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border-2 border-line bg-paper text-sm font-bold tabular-nums text-muted">{i + 1}</span>
            <span className="kg-name truncate text-lg font-bold">{a.name}</span>
            <span className="text-sm text-muted">{ATA_KIN[i] ?? ''}</span>
          </button>
        </div>
      ))}
      {line.length >= 7 && !all && (
        <>
          <div className="ml-12 mt-1 border-t-2 border-dashed border-accent pt-1 text-sm font-bold text-accent">жети ата</div>
          {line.length > 7 && (
            <button onClick={() => setAll(true)} className="my-2 min-h-[48px] w-full rounded-xl border-2 border-line text-base font-bold text-brand">
              + {line.length - 7} ата жогору · {dative(line[line.length - 1].name)} чейин
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function PersonScreen({ id, onToast, onAskMe }: { id: string; onToast: (t: string) => void; onAskMe: () => void }) {
  const [showReq, setShowReq] = useState(false)
  const [meId] = useMe()
  const person = getNode(id)
  if (!person) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="kg-name text-xl font-bold">Бул адам табылган жок</p>
        <p className="mt-2 text-base text-muted">Шилтеме эскирген болушу мүмкүн. Издөөдөн табыңыз.</p>
        <button onClick={() => go({ name: 'search' })} className="mt-5 min-h-[48px] rounded-xl bg-brand px-6 text-base font-bold text-white">Издөө</button>
      </div>
    )
  }

  const open = (pid: string) => go({ name: 'person', id: pid })
  const father = fatherOf(id)
  const brothers = father ? childrenNodes(father.id).filter((c) => c.id !== id) : []
  const sons = childrenNodes(id)
  const branch = branchOf(id)
  const meta = [father ? patronymic(person) : 'уруунун башы', person.generation ? `${person.generation}-муун` : null, branch && branch.id !== id ? `${branch.name} бутагы` : null]
    .filter(Boolean)
    .join(' · ')

  let meChip: React.ReactNode
  if (!meId) {
    meChip = (
      <button onClick={onAskMe} className="self-start rounded-full border-2 border-dashed border-brand/50 px-3 py-1.5 text-base font-bold text-brand">
        Мен ким? · сизге ким болорун көрүү
      </button>
    )
  } else if (meId === id) {
    meChip = <span className="self-start rounded-full bg-brand-soft px-3 py-1.5 text-base font-bold text-brand">Бул сиз</span>
  } else {
    const r = relate(meId, id)
    meChip = (
      <button onClick={() => go({ name: 'relate', a: meId, b: id })} className="self-start rounded-2xl bg-brand-soft px-3 py-1.5 text-left text-base">
        <b className="text-brand">{phrase(r.rel, { you: true })}</b>
        {r.commonAncestor && r.rel.kind !== 'ancestor' && r.rel.kind !== 'descendant' && <span className="text-ink/75"> · {r.commonAncestor.name} аркылуу</span>}
      </button>
    )
  }

  async function share() {
    const res = await shareLink(`${person!.name} (${patronymic(person!)}) — Санжыра`, absoluteUrl({ name: 'person', id }))
    if (res === 'copied') onToast('Шилтеме көчүрүлдү')
    else if (res === 'failed') onToast('Бөлүшүү ишке ашкан жок')
  }

  return (
    <div key={id} className="animate-fadeup grid gap-5 px-4 pb-32 pt-5">
      {/* Hero */}
      <section className="grid gap-4 rounded-3xl border border-line bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar person={person} size={68} />
          <div className="min-w-0">
            <h1 className="kg-name text-3xl font-bold leading-tight">{person.name}</h1>
            <p className="mt-0.5 text-base text-muted">{meta}</p>
          </div>
        </div>
        {meChip}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => go({ name: 'relate', a: meId && meId !== id ? meId : id, b: meId && meId !== id ? id : undefined })} className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl bg-brand text-sm font-bold text-white active:scale-[0.98]">
            <LinkIcon /> Ким болот?
          </button>
          <button onClick={share} className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-surface text-sm font-bold text-ink active:scale-[0.98]">
            <ShareIcon /> Бөлүшүү
          </button>
          <button onClick={() => setShowReq(true)} className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-surface text-sm font-bold text-ink active:scale-[0.98]">
            <PenIcon /> Оңдоо
          </button>
        </div>
      </section>

      {father && (
        <section className="grid gap-2">
          <SectionTitle>Жети атасы</SectionTitle>
          <FatherLadder id={id} open={open} />
        </section>
      )}

      {person.bio && (
        <section className="grid gap-2">
          <SectionTitle>Эскерүү</SectionTitle>
          <p className="rounded-2xl border border-line bg-surface p-4 text-base leading-relaxed">{person.bio}</p>
        </section>
      )}

      <section className="grid gap-2">
        <SectionTitle>Уулдары{sons.length ? ` · ${sons.length}` : ''}</SectionTitle>
        {sons.length ? (
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {sons.map((s) => <PersonRow key={s.id} p={s} onOpen={open} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line px-4 py-4 text-base text-muted">
            {familyCount(person)}. Билсеңиз, «Оңдоо» аркылуу кошуп бериңиз.
          </p>
        )}
      </section>

      {brothers.length > 0 && (
        <section className="grid gap-2">
          <SectionTitle>Бир туугандары · {brothers.length}</SectionTitle>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {brothers.map((b) => <PersonRow key={b.id} p={b} onOpen={open} size={40} />)}
          </div>
        </section>
      )}

      {showReq && <RequestEditModal person={person} onClose={() => setShowReq(false)} />}
    </div>
  )
}
