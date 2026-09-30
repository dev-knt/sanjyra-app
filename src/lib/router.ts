import { useSyncExternalStore } from 'react'

// Hash routes, so every screen and person has a link (share it, bookmark it) and
// the phone's Back button steps back one screen instead of leaving the app.
// Hash (not path) routing because GitHub Pages can't rewrite unknown paths.
//   #/            search
//   #/p/<id>      person
//   #/u/<a>/<o>   урпактар: window anchored at <a>, son <o> opened
//   #/r/<a>/<b>   relationship between two people
export type Route =
  | { name: 'search' }
  | { name: 'person'; id: string }
  | { name: 'urpaktar'; anchor?: string; open?: string }
  | { name: 'relate'; a?: string; b?: string }

export function parse(hash: string): Route {
  const [head, x, y] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (head === 'p' && x) return { name: 'person', id: x }
  if (head === 'u') return { name: 'urpaktar', anchor: x, open: y }
  if (head === 'r') return { name: 'relate', a: x === '-' ? undefined : x, b: y }
  return { name: 'search' }
}

export function href(r: Route): string {
  const seg = (...parts: (string | undefined)[]) => parts.filter(Boolean).map((p) => encodeURIComponent(p!)).join('/')
  switch (r.name) {
    case 'search':
      return '#/'
    case 'person':
      return `#/p/${seg(r.id)}`
    case 'urpaktar':
      return `#/${seg('u', r.anchor, r.anchor ? r.open : undefined)}`
    case 'relate':
      return `#/${seg('r', r.a ?? (r.b ? '-' : undefined), r.b)}`
  }
}

/** Absolute link for sharing outside the app. */
export function absoluteUrl(r: Route): string {
  return `${location.origin}${location.pathname}${href(r)}`
}

const EVT = 'sanjyra-route'

/** Navigate. `replace` swaps the current history entry (for in-place tweaks). */
export function go(r: Route, replace = false) {
  const h = href(r)
  if (h === location.hash || (h === '#/' && !location.hash)) return
  if (replace) {
    history.replaceState(null, '', h)
    window.dispatchEvent(new Event(EVT))
  } else {
    location.hash = h
  }
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  window.addEventListener(EVT, cb)
  return () => {
    window.removeEventListener('hashchange', cb)
    window.removeEventListener(EVT, cb)
  }
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parse(hash)
}
