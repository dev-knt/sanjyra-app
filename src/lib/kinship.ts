import type { PersonNode } from '../types'
import { NODES, ancestorChain } from './graph'
import { genitive, poss2, poss3 } from './kyrgyz'

// ---------------------------------------------------------------------------
// KINSHIP ENGINE — the cultural heart of the app.
//
// Walk both father-chains to their lowest common ancestor, classify the bond,
// then phrase it in Kyrgyz with correct suffixes ("Айбек — Амирдин атасы",
// "Сиздин аталаш бир тууганыңыз"). Terms confirmed so far: аталаш for sons of
// two brothers; past чөбөрө a generic "урпак" with the generation count.
// Brothers are "бир тууган" because birth order is not recorded.
// ---------------------------------------------------------------------------

export type Rel =
  | { kind: 'self' }
  | { kind: 'none' }
  | { kind: 'ancestor'; n: number } // B is A's n-th father
  | { kind: 'descendant'; n: number } // B is A's n-th generation descendant
  | { kind: 'sibling' }
  | { kind: 'ancestorSibling'; n: number } // B is a brother of A's n-th father
  | { kind: 'siblingDescendant'; n: number } // B descends n generations from A's brother
  | { kind: 'cousin'; ata: number; diff: number } // diff > 0: B is that many generations above A

/** Whose relative B is: a named person, or the viewer ("Сиздин …"). */
export type Owner = { you: true } | { name: string }

const ancestorNoun = (n: number) => (n === 1 ? 'ата' : n === 2 ? 'чоң ата' : n === 3 ? 'баба' : `${n}-ата`)
const descendantNoun = (n: number) => (n === 1 ? 'уул' : n === 2 ? 'небере' : n === 3 ? 'чөбөрө' : 'урпак')
const genNote = (n: number) => (n > 3 ? ` (${n} муун ылдый)` : '')

function relFrom(aUp: number, bUp: number): Rel {
  if (aUp < 0 || bUp < 0) return { kind: 'none' }
  if (aUp === 0 && bUp === 0) return { kind: 'self' }
  if (aUp === 0) return { kind: 'descendant', n: bUp }
  if (bUp === 0) return { kind: 'ancestor', n: aUp }
  if (aUp === 1 && bUp === 1) return { kind: 'sibling' }
  if (bUp === 1) return { kind: 'ancestorSibling', n: aUp - 1 }
  if (aUp === 1) return { kind: 'siblingDescendant', n: bUp - 1 }
  return { kind: 'cousin', ata: Math.max(aUp, bUp), diff: aUp - bUp }
}

/** B's relation to the owner as a Kyrgyz phrase: "Амирдин атасы", "Сиздин небереңиз". */
export function phrase(rel: Rel, owner: Owner): string {
  const you = 'you' in owner
  const prefix = you ? 'Сиздин ' : `${genitive(owner.name)} `
  const own = (noun: string) => (you ? poss2(noun) : poss3(noun))
  switch (rel.kind) {
    case 'self':
      return you ? 'Бул сиз' : 'Бул бир эле адам'
    case 'none':
      return 'Жалпы бабасы табылган жок'
    case 'ancestor':
      return prefix + own(ancestorNoun(rel.n))
    case 'descendant':
      return prefix + own(descendantNoun(rel.n)) + genNote(rel.n)
    case 'sibling':
      return prefix + own('бир тууган')
    case 'ancestorSibling':
      return `${prefix}${genitive(own(ancestorNoun(rel.n)))} бир тууганы`
    case 'siblingDescendant':
      return `${prefix}${genitive(own('бир тууган'))} ${poss3(descendantNoun(rel.n))}${genNote(rel.n)}`
    case 'cousin': {
      const noun = rel.ata === 2 && rel.diff === 0 ? 'аталаш бир тууган' : `${rel.ata}-ата бир тууган`
      const note = rel.diff ? ` (${Math.abs(rel.diff)} муун ${rel.diff > 0 ? 'жогору' : 'ылдый'})` : ''
      return prefix + own(noun) + note
    }
  }
}

export interface RelationResult {
  related: boolean
  rel: Rel // B as seen from A
  reverse: Rel // A as seen from B
  commonAncestor?: PersonNode
  aUp: number
  bUp: number
  ataApart: number // "канча ата бир" — generations to the shared father
  // Жети ата: shared ancestor within 7 generations. null for a direct father/son line.
  withinSeven: boolean | null
  pathA: PersonNode[] // A … common ancestor
  pathB: PersonNode[]
}

function lca(aId: string, bId: string): { ancestor?: PersonNode; aUp: number; bUp: number } {
  const depthOfA = new Map<string, number>()
  ancestorChain(aId).forEach((n, i) => depthOfA.set(n.id, i))
  const chainB = ancestorChain(bId)
  for (let j = 0; j < chainB.length; j++) {
    const hit = depthOfA.get(chainB[j].id)
    if (hit != null) return { ancestor: chainB[j], aUp: hit, bUp: j }
  }
  return { aUp: -1, bUp: -1 }
}

export function relate(aId: string, bId: string): RelationResult {
  const none: RelationResult = { related: false, rel: { kind: 'none' }, reverse: { kind: 'none' }, aUp: -1, bUp: -1, ataApart: -1, withinSeven: null, pathA: [], pathB: [] }
  if (!NODES.get(aId) || !NODES.get(bId)) return none
  const { ancestor, aUp, bUp } = lca(aId, bId)
  if (!ancestor) return none
  const rel = relFrom(aUp, bUp)
  const direct = rel.kind === 'ancestor' || rel.kind === 'descendant' || rel.kind === 'self'
  const ataApart = Math.max(aUp, bUp)
  return {
    related: true,
    rel,
    reverse: relFrom(bUp, aUp),
    commonAncestor: ancestor,
    aUp,
    bUp,
    ataApart,
    withinSeven: direct ? null : ataApart <= 7,
    pathA: ancestorChain(aId).slice(0, aUp + 1),
    pathB: ancestorChain(bId).slice(0, bUp + 1),
  }
}
