import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy'
import type { PersonNode } from '../types'
import { NODES, getNode, childrenNodes } from './graph'

export type PointNode = HierarchyPointNode<PersonNode>

// All root ancestors (people with no father in the tree). Usually one (баба).
export function rootIds(): string[] {
  return [...NODES.values()].filter((n) => !n.fatherId).map((n) => n.id)
}

// A virtual super-root lets us lay out multiple founding ancestors as one tree.
const SUPER: PersonNode = {
  id: '__root__',
  name: 'Багыш',
  fatherId: null,
  sex: 'm',
  living: false,
  childrenIds: [],
  generation: 0,
}

function buildHierarchy(rootId: string | null, collapsed: Set<string>) {
  const accessor = (d: PersonNode): PersonNode[] => {
    if (collapsed.has(d.id)) return []
    if (d.id === '__root__') return rootIds().map((id) => getNode(id)!)
    return childrenNodes(d.id)
  }
  const root = rootId ? getNode(rootId)! : SUPER
  return hierarchy(root, accessor)
}

// Tidy vertical (top-down) tree. dx = sibling gap, dy = generation gap.
export function descendantTree(rootId: string | null, collapsed: Set<string>, dx = 92, dy = 110) {
  const h = buildHierarchy(rootId, collapsed)
  const layout = tree<PersonNode>().nodeSize([dx, dy])
  const root = layout(h)
  let minX = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  root.each((n) => {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    maxY = Math.max(maxY, n.y)
  })
  return { root, width: maxX - minX, height: maxY, minX, descendants: root.descendants(), links: root.links() }
}

// Radial tree: angle from x, radius from depth.
export function radialTree(rootId: string | null, collapsed: Set<string>, radiusStep = 92) {
  const h = buildHierarchy(rootId, collapsed)
  const count = h.descendants().length
  const layout = tree<PersonNode>()
    .size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / Math.max(a.depth, 1))
  const root = layout(h)
  const maxDepth = Math.max(...root.descendants().map((d) => d.depth), 1)
  const R = radiusStep * maxDepth
  // Attach cartesian coords for convenience.
  root.each((n) => {
    const angle = n.x - Math.PI / 2
    const radius = (n.depth / maxDepth) * R
    ;(n as any).cx = radius * Math.cos(angle)
    ;(n as any).cy = radius * Math.sin(angle)
    ;(n as any).angle = n.x
  })
  return { root, R, count, descendants: root.descendants(), links: root.links() }
}

// SVG path for a smooth vertical link (parent → child).
export function vLinkPath(s: PointNode, t: PointNode): string {
  const my = (s.y + t.y) / 2
  return `M${s.x},${s.y} C${s.x},${my} ${t.x},${my} ${t.x},${t.y}`
}

// SVG path for a radial link using the attached cx/cy.
export function radialLinkPath(s: any, t: any): string {
  return `M${s.cx},${s.cy} Q${(s.cx + t.cx) / 2},${(s.cy + t.cy) / 2} ${t.cx},${t.cy}`
}
