import { useEffect, useState, type ReactNode } from 'react'
import type { Screen, Theme } from './types'
import { SearchScreen } from './screens/SearchScreen'
import { PersonScreen } from './screens/PersonScreen'
import { RelateScreen } from './screens/RelateScreen'
import { TreeScreen } from './screens/TreeScreen'
import { rootIds } from './lib/layout'
import { allNodes } from './lib/graph'

const ROOT_ID = rootIds()[0]
// The tree branches out at Аттокур; everything above him is a single ancestral
// chain, so land the tree on Аттокур (fathers are still reachable upward).
const ATTOKUR_ID = allNodes().find((n) => n.name === 'Аттокур')?.id ?? ROOT_ID

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: 'koldoo', label: 'Талаа', swatch: '#1f6f6b' },
  { id: 'tenir', label: 'Теңир', swatch: '#0d6ea4' },
  { id: 'kok', label: 'Көк (түн)', swatch: '#34d399' },
]

function ThemeSwitcher({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface border border-line p-1 shadow-soft">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          className={`h-6 w-6 rounded-full border-2 transition ${theme === t.id ? 'border-ink scale-110' : 'border-transparent opacity-70'}`}
          style={{ background: t.swatch }}
          aria-label={t.label}
        />
      ))}
    </div>
  )
}

const NAV: { id: Screen; label: string; icon: ReactNode }[] = [
  {
    id: 'search',
    label: 'Издөө',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'person',
    label: 'Адам',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'tree',
    label: 'Дарак',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="4" r="2" />
        <circle cx="6" cy="14" r="2" />
        <circle cx="18" cy="14" r="2" />
        <circle cx="6" cy="20" r="1.6" />
        <path d="M12 6v3M12 9c0 2-6 2-6 3M12 9c0 2 6 2 6 3M6 16v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'relate',
    label: 'Тууганчылык',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9M12 14v1" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function App() {
  const [theme, setTheme] = useState<Theme>('koldoo')
  const [screen, setScreen] = useState<Screen>('search')
  const [activePerson, setActivePerson] = useState<string>(ATTOKUR_ID)
  const [relateSeed, setRelateSeed] = useState<string | undefined>(undefined)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function openPerson(id: string) {
    setActivePerson(id)
    setScreen('person')
  }
  function openRelate(id: string) {
    setRelateSeed(id)
    setScreen('relate')
  }
  function openPersonTree(id: string) {
    setActivePerson(id)
    setScreen('persontree')
  }

  return (
    <div className="mx-auto min-h-full max-w-md bg-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-paper/80 backdrop-blur border-b border-line/60">
        <div className="kg-name flex items-center gap-1.5 text-sm font-bold text-brand">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          Санжыра
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </header>

      <main>
        {screen === 'search' && <SearchScreen onOpen={openPerson} />}
        {screen === 'person' && <PersonScreen id={activePerson} onOpen={openPerson} onRelate={openRelate} onTree={openPersonTree} />}
        {screen === 'persontree' && <TreeScreen key={activePerson} initialFocalId={activePerson} onOpen={openPerson} />}
        {screen === 'tree' && <TreeScreen initialFocalId={ATTOKUR_ID} onOpen={openPerson} />}
        {screen === 'relate' && <RelateScreen seedId={relateSeed} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-line bg-surface/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {NAV.map((n) => {
            const active = screen === n.id
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-brand' : 'text-muted'
                }`}
              >
                <span className={`h-5 w-5 ${active ? 'scale-110' : ''} transition`}>{n.icon}</span>
                {n.label}
              </button>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
