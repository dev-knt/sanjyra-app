import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { SearchScreen } from './screens/SearchScreen'
import { PersonScreen } from './screens/PersonScreen'
import { RelateScreen } from './screens/RelateScreen'
import { UrpaktarScreen } from './screens/UrpaktarScreen'
import { MeSheet } from './components/MeSheet'
import { useToast } from './components/ui'
import { getNode } from './lib/graph'
import { FANOUT } from './lib/branches'
import { go, useRoute, type Route } from './lib/router'
import { THEMES, useBigText, useMe, useTheme } from './lib/prefs'

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const TABS: { name: Route['name']; label: string; icon: ReactNode }[] = [
  { name: 'search', label: 'Издөө', icon: svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>) },
  { name: 'person', label: 'Адам', icon: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>) },
  { name: 'urpaktar', label: 'Урпактар', icon: svg(<><circle cx="12" cy="4.5" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M12 6.5V12M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M12 12v4" /></>) },
  { name: 'relate', label: 'Тууганчылык', icon: svg(<><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9M12 14v1" /></>) },
]

export default function App() {
  const route = useRoute()
  const [theme] = useTheme()
  const [big] = useBigText()
  const [meId] = useMe()
  const [showMe, setShowMe] = useState(false)
  const [toast, showToast] = useToast()
  const lastPerson = useRef<string | undefined>(undefined)
  if (route.name === 'person') lastPerson.current = route.id

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.style.fontSize = big ? '112.5%' : ''
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES.find((t) => t.id === theme)!.bar)
  }, [theme, big])

  // New screen or new person → start at the top.
  const screenKey = route.name === 'person' ? `p:${route.id}` : route.name
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screenKey])
  // Any navigation (incl. the phone's Back button) closes the «Мен» sheet.
  const hash = typeof location !== 'undefined' ? location.hash : ''
  useEffect(() => setShowMe(false), [hash])

  const askMe = useCallback(() => setShowMe(true), [])
  const me = meId ? getNode(meId) : undefined

  function tab(name: Route['name']) {
    if (name === 'person') go({ name: 'person', id: lastPerson.current ?? meId ?? FANOUT?.id ?? '' })
    else go({ name } as Route)
  }

  return (
    <div className="mx-auto min-h-full max-w-md bg-paper">
      <header className="sticky top-0 z-20 flex h-[57px] items-center justify-between border-b border-line/70 bg-paper/90 px-4 backdrop-blur">
        <button onClick={() => go({ name: 'search' })} className="kg-name flex min-h-[44px] items-center gap-2 text-lg font-bold text-brand">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          Санжыра
        </button>
        <button onClick={askMe} className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 pl-1.5 pr-3.5 text-base font-bold ${me ? 'border-brand text-brand' : 'border-dashed border-brand/50 text-brand'}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm text-white">{me ? me.name.charAt(0) : '?'}</span>
          {me ? 'Мен' : 'Мен ким?'}
        </button>
      </header>

      <main>
        {route.name === 'search' && <SearchScreen onAskMe={askMe} />}
        {route.name === 'person' && <PersonScreen id={route.id} onToast={showToast} onAskMe={askMe} />}
        {route.name === 'urpaktar' && <UrpaktarScreen anchorId={route.anchor} openId={route.open} />}
        {route.name === 'relate' && <RelateScreen aId={route.a} bId={route.b} onToast={showToast} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-surface/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = route.name === t.name
            return (
              <button key={t.name} onClick={() => tab(t.name)} aria-current={active ? 'page' : undefined} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-sm transition ${active ? 'font-bold text-brand' : 'text-muted'}`}>
                <span className="h-6 w-6">{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {showMe && <MeSheet onClose={() => setShowMe(false)} onToast={showToast} />}
      {toast}
    </div>
  )
}
