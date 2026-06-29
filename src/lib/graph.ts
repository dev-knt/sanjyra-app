import type { Person, PersonNode } from '../types'
import { PEOPLE } from '../data/people'

// Build an in-memory graph once. At a few thousand people this is trivially fast;
// the same code maps onto a DB query layer later.

const byId = new Map<string, Person>()
for (const p of PEOPLE) byId.set(p.id, p)

const childrenOf = new Map<string, string[]>()
for (const p of PEOPLE) {
  if (p.fatherId) {
    const arr = childrenOf.get(p.fatherId) ?? []
    arr.push(p.id)
    childrenOf.set(p.fatherId, arr)
  }
}

// Generation = distance from the deepest root ancestor (0 at top).
const genCache = new Map<string, number>()
function generationOf(id: string): number {
  const cached = genCache.get(id)
  if (cached != null) return cached
  const p = byId.get(id)
  const g = !p || !p.fatherId ? 0 : generationOf(p.fatherId) + 1
  genCache.set(id, g)
  return g
}

export const NODES = new Map<string, PersonNode>()
for (const p of PEOPLE) {
  NODES.set(p.id, {
    ...p,
    childrenIds: (childrenOf.get(p.id) ?? []).sort((a, b) => {
      const ya = byId.get(a)?.birthYear ?? 9999
      const yb = byId.get(b)?.birthYear ?? 9999
      return ya - yb
    }),
    generation: generationOf(p.id),
  })
}

export function getNode(id: string): PersonNode | undefined {
  return NODES.get(id)
}

export function allNodes(): PersonNode[] {
  return [...NODES.values()]
}

export function fatherOf(id: string): PersonNode | undefined {
  const f = NODES.get(id)?.fatherId
  return f ? NODES.get(f) : undefined
}

export function childrenNodes(id: string): PersonNode[] {
  return (NODES.get(id)?.childrenIds ?? []).map((c) => NODES.get(c)!).filter(Boolean)
}

// Ancestor chain INCLUDING the person, oldest-last → [self, father, grandfather, ...].
export function ancestorChain(id: string): PersonNode[] {
  const chain: PersonNode[] = []
  let cur: PersonNode | undefined = NODES.get(id)
  const seen = new Set<string>()
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    chain.push(cur)
    cur = cur.fatherId ? NODES.get(cur.fatherId) : undefined
  }
  return chain
}

// The classic "жети ата": self + up to 7 fathers. Returns oldest-first for the fan.
export function sevenAta(id: string, depth = 7): PersonNode[] {
  return ancestorChain(id).slice(0, depth + 1)
}

// All descendant ids of a person (not including the person).
export function descendantIds(id: string): Set<string> {
  const out = new Set<string>()
  const stack = [...(NODES.get(id)?.childrenIds ?? [])]
  while (stack.length) {
    const c = stack.pop()!
    if (out.has(c)) continue
    out.add(c)
    stack.push(...(NODES.get(c)?.childrenIds ?? []))
  }
  return out
}

// People grouped by generation (0 = oldest), each list sorted by birth year.
export function byGeneration(): { gen: number; people: PersonNode[] }[] {
  const map = new Map<number, PersonNode[]>()
  for (const n of NODES.values()) {
    const arr = map.get(n.generation) ?? []
    arr.push(n)
    map.set(n.generation, arr)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gen, people]) => ({ gen, people: people.sort((a, b) => (a.birthYear ?? 0) - (b.birthYear ?? 0)) }))
}
