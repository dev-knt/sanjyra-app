import { useSyncExternalStore } from 'react'
import { getNode } from './graph'
import type { Theme } from '../types'

// Per-phone preferences kept in localStorage: who "Мен" is, colour theme, and
// large text. Every read/write is guarded — storage can be blocked or cleared.

const EVT = 'sanjyra-prefs'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
  memory.set(key, value)
  window.dispatchEvent(new Event(EVT))
}
const memory = new Map<string, string | null>()
const get = (key: string) => (memory.has(key) ? memory.get(key)! : read(key))

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVT, cb)
    window.removeEventListener('storage', cb)
  }
}
function usePref(key: string) {
  return useSyncExternalStore(subscribe, () => get(key))
}

/** The viewer's own person id ("Мен"), or null. Ignores ids no longer in the tree. */
export function useMe(): [string | null, (id: string | null) => void] {
  const id = usePref('sanjyra-me')
  return [id && getNode(id) ? id : null, (v) => write('sanjyra-me', v)]
}

export const THEMES: { id: Theme; label: string; swatch: string; bar: string }[] = [
  { id: 'talaa', label: 'Талаа', swatch: '#1f6f6b', bar: '#f4eee3' },
  { id: 'shyrdak', label: 'Шырдак', swatch: '#9e2a2b', bar: '#f6efe2' },
  { id: 'too', label: 'Тоо', swatch: '#16478a', bar: '#eef2f7' },
]

export function useTheme(): [Theme, (t: Theme) => void] {
  const v = usePref('sanjyra-theme')
  const theme = (THEMES.some((t) => t.id === v) ? v : 'talaa') as Theme
  return [theme, (t) => write('sanjyra-theme', t)]
}

export function useBigText(): [boolean, (on: boolean) => void] {
  const v = usePref('sanjyra-bigtext')
  return [v === '1', (on) => write('sanjyra-bigtext', on ? '1' : null)]
}
