import { NODES, ancestorChain, getNode } from './graph'
import { rootIds } from './layout'

// Colour-code people by ancestral BRANCH so colour carries meaning (lineage) and
// the UI isn't a random rainbow. The tree is a single spine (Багыш → … → Аттокур)
// that then fans out, so we group by the FAN-OUT node's children (Аттокур's sons),
// not the root's — otherwise everyone shares one colour.

// Tasteful, well-separated hues for the branches.
const BRANCH_HUES = [200, 28, 150, 268, 338, 48, 178, 96]
const SPINE_HUE = 178 // the founding line (root → fan-out) reads in the brand teal

// The first node (from the root) that truly fans out into 2+ substantial lines.
// Childless siblings along the spine (e.g. Аттокур's brothers) count as leaf tips,
// not branches — so colouring stays anchored at Аттокур's sons.
const FANOUT = (() => {
  let node = getNode(rootIds()[0] ?? '')
  while (node) {
    const branching = node.childrenIds.filter((id) => (NODES.get(id)?.childrenIds.length ?? 0) > 0)
    if (branching.length === 1) node = NODES.get(branching[0])
    else break
  }
  return node
})()

const cache = new Map<string, number>()

export function branchHue(id: string): number {
  const cached = cache.get(id)
  if (cached != null) return cached
  const node = getNode(id)
  let hue = SPINE_HUE
  if (node && FANOUT && node.generation > FANOUT.generation) {
    // the ancestor on this person's line that is a direct child of the fan-out node
    const branch = ancestorChain(id).find((n) => n.fatherId === FANOUT.id)
    const idx = branch ? Math.max(0, FANOUT.childrenIds.indexOf(branch.id)) : 0
    hue = BRANCH_HUES[idx % BRANCH_HUES.length]
  }
  cache.set(id, hue)
  return hue
}
