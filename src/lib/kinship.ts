import type { PersonNode } from '../types'
import { NODES, ancestorChain } from './graph'

// ---------------------------------------------------------------------------
// KINSHIP ENGINE  — the cultural heart of the app.
//
// Given two people, we walk both father-chains to their lowest common ancestor
// (баба), measure how many generations each is below it, then name the bond in
// Kyrgyz patrilineal kinship terms.
//
// ⚠️ DRAFT TERMINOLOGY: the algorithm is solid, but the exact Kyrgyz terms below
//    are a first pass for you (and the aksakals) to validate/correct. Every term
//    is centralised here so a correction is a one-line change.
// ---------------------------------------------------------------------------

export interface RelationResult {
  related: boolean
  commonAncestor?: PersonNode
  aUp: number // generations from A up to the common ancestor
  bUp: number // generations from B up to the common ancestor
  ataApart: number // "канча ата бир" — generations to the shared father
  // Kyrgyz label as seen from A → B ("B is A's …")
  termForB: string
  // Kyrgyz label as seen from B → A
  termForA: string
  // Plain-language summary in Kyrgyz
  summary: string
  // The two chains up to (and including) the common ancestor, for drawing.
  pathA: PersonNode[]
  pathB: PersonNode[]
}

// Lowest common ancestor of two people via their father-chains.
function lca(aId: string, bId: string): { ancestor?: PersonNode; aUp: number; bUp: number } {
  const chainA = ancestorChain(aId)
  const depthOfA = new Map<string, number>()
  chainA.forEach((n, i) => depthOfA.set(n.id, i))

  const chainB = ancestorChain(bId)
  for (let j = 0; j < chainB.length; j++) {
    const hit = depthOfA.get(chainB[j].id)
    if (hit != null) {
      return { ancestor: chainB[j], aUp: hit, bUp: j }
    }
  }
  return { ancestor: undefined, aUp: -1, bUp: -1 }
}

// Descendant term, looking DOWN n generations (n>=1).
function descendantTerm(n: number): string {
  switch (n) {
    case 1:
      return 'бала' // child
    case 2:
      return 'небере' // grandchild
    case 3:
      return 'чөбөрө' // great-grandchild
    case 4:
      return 'чыбыра'
    case 5:
      return 'кыбыра'
    default:
      return `${n}-тукум`
  }
}

// Ancestor term, looking UP n generations (n>=1).
function ancestorTerm(n: number): string {
  switch (n) {
    case 1:
      return 'ата' // father
    case 2:
      return 'чоң ата' // grandfather
    case 3:
      return 'баба' // great-grandfather
    case 4:
      return 'буба'
    default:
      return `${n}-ата`
  }
}

// Sibling term, sex + relative age aware.
function siblingTerm(self: PersonNode, other: PersonNode): string {
  const older = (other.birthYear ?? 0) < (self.birthYear ?? 0)
  if (other.sex === 'm') return older ? 'ага' : 'ини'
  return older ? 'эже' : 'карындаш / сиңди'
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function relate(aId: string, bId: string): RelationResult {
  const A = NODES.get(aId)!
  const B = NODES.get(bId)!
  const base: RelationResult = {
    related: false,
    aUp: -1,
    bUp: -1,
    ataApart: -1,
    termForB: '',
    termForA: '',
    summary: '',
    pathA: [],
    pathB: [],
  }
  if (!A || !B) return base
  if (aId === bId) {
    return { ...base, related: true, summary: 'Бул бир эле адам.' }
  }

  const { ancestor, aUp, bUp } = lca(aId, bId)
  if (!ancestor) {
    return { ...base, summary: 'Бул экөө бир санжыра бутагында эмес — жалпы баба табылган жок.' }
  }

  const pathA = ancestorChain(aId).slice(0, aUp + 1)
  const pathB = ancestorChain(bId).slice(0, bUp + 1)
  const ataApart = Math.max(aUp, bUp)

  let termForB = ''
  let termForA = ''
  let summary = ''

  // --- Direct line: one is an ancestor of the other ---
  if (aUp === 0 || bUp === 0) {
    const diff = Math.abs(aUp - bUp)
    if (aUp === 0) {
      // A is the ancestor, B descends from A
      termForB = descendantTerm(diff) // B is A's …
      termForA = ancestorTerm(diff) // A is B's …
    } else {
      termForB = ancestorTerm(diff)
      termForA = descendantTerm(diff)
    }
    summary = `${B.name} — ${A.name}дын ${termForB}сы (түз ата-бала линиясы, ${diff} муун).`
    return { ...base, related: true, commonAncestor: ancestor, aUp, bUp, ataApart, termForB, termForA, summary, pathA, pathB }
  }

  // --- Siblings: share a father directly ---
  if (aUp === 1 && bUp === 1) {
    termForB = siblingTerm(A, B)
    termForA = siblingTerm(B, A)
    summary = `${A.name} менen ${B.name} — бир туугандар (${ancestor.name}дын балдары).`
    return { ...base, related: true, commonAncestor: ancestor, aUp, bUp, ataApart, termForB, termForA, summary, pathA, pathB }
  }

  // --- Uncle / nephew style: one side is exactly 1 up ---
  if (aUp === 1 || bUp === 1) {
    // The "1-up" person is a sibling of the other's ancestor.
    if (aUp === 1) {
      termForA = B.sex === 'm' ? 'аба (атасынын бир тууганы)' : 'аба'
      termForB = descendantTerm(bUp - 1) + ' (агасынын/ининин тукуму)'
    } else {
      termForB = 'аба (атасынын бир тууганы)'
      termForA = descendantTerm(aUp - 1) + ' (агасынын/ининин тукуму)'
    }
    summary = `${ancestor.name} аркылуу байланышкан — бир тууганынын тукуму (${ataApart}-ата бир).`
    return { ...base, related: true, commonAncestor: ancestor, aUp, bUp, ataApart, termForB, termForA, summary, pathA, pathB }
  }

  // --- Cousins of various degrees: both >= 2 up ---
  // "канча ата бир" = generations to the shared baba.
  const cousinKg =
    aUp === 2 && bUp === 2
      ? 'бөлө (эки ата бир)' // share a grandfather
      : `${ataApart}-ата бир тууган`
  termForB = cousinKg
  termForA = cousinKg
  summary = `${A.name} менen ${B.name} — ${ataApart}-ата бир (жалпы бабасы: ${ancestor.name}).`
  return { ...base, related: true, commonAncestor: ancestor, aUp, bUp, ataApart, termForB, termForA, summary, pathA, pathB }
}

// Within the жети-ата rule (forbidden marriage if shared baba within 7 gens)?
export function withinSevenAta(aId: string, bId: string): { flagged: boolean; ataApart: number } {
  const r = relate(aId, bId)
  if (!r.related || !r.commonAncestor) return { flagged: false, ataApart: -1 }
  return { flagged: r.ataApart <= 7, ataApart: r.ataApart }
}

export { cap }
