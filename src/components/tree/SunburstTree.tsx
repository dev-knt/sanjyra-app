import { useMemo, useRef, useState, useLayoutEffect, type PointerEvent, type WheelEvent } from 'react'
import { getNode, childrenNodes } from '../../lib/graph'
import { branchHue } from '../../lib/branches'
import { lifespan } from '../ui'

const RING = 104 // radial thickness of one generation

function arcPath(r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${(r * Math.sin(a)).toFixed(2)},${(-r * Math.cos(a)).toFixed(2)}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${p(r1, a0)} A${r1},${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 ${large} 0 ${p(r0, a0)} Z`
}

const leafCache = new Map<string, number>()
function leafCount(id: string): number {
  const c = leafCache.get(id)
  if (c != null) return c
  const kids = childrenNodes(id)
  const n = kids.length ? kids.reduce((s, k) => s + leafCount(k.id), 0) : 1
  leafCache.set(id, n)
  return n
}

interface Laid {
  id: string
  name: string
  a0: number
  a1: number
  depth: number
  bA0: number // angular range of this node's top-level branch (for the hue gradient)
  bA1: number
}

// Weighted full-circle layout: a lineage's wedge scales with its size, but every
// child keeps a visible minimum slice (so childless people still show + label).
function buildLayout(focalId: string) {
  const out: Laid[] = []
  let maxDepth = 0
  function rec(id: string, a0: number, a1: number, depth: number, bA0: number, bA1: number) {
    const p = getNode(id)
    if (!p) return
    // each son of the focal opens a new branch → its own angular range
    const b0 = depth === 1 ? a0 : bA0
    const b1 = depth === 1 ? a1 : bA1
    out.push({ id, name: p.name, a0, a1, depth, bA0: b0, bA1: b1 })
    maxDepth = Math.max(maxDepth, depth)
    const kids = childrenNodes(id)
    if (!kids.length) return
    const raw = kids.map((k) => leafCount(k.id))
    const sum = raw.reduce((a, b) => a + b, 0)
    const floor = sum * 0.08
    const w = raw.map((r) => Math.max(r, floor))
    const ws = w.reduce((a, b) => a + b, 0)
    let acc = a0
    kids.forEach((k, i) => {
      const span = ((a1 - a0) * w[i]) / ws
      rec(k.id, acc, acc + span, depth + 1, b0, b1)
      acc += span
    })
  }
  rec(focalId, 0, 2 * Math.PI, 0, 0, 2 * Math.PI)
  return { nodes: out, maxDepth }
}

type VB = { x: number; y: number; w: number; h: number }

export function SunburstTree({ focalId, onOpen }: { focalId: string; onOpen: (id: string) => void }) {
  const { nodes, maxDepth } = useMemo(() => buildLayout(focalId), [focalId])
  const pad = 40
  const R = RING * (maxDepth + 1)
  const SIZE = (R + pad) * 2 // content box, centred at SIZE/2

  const wrap = useRef<HTMLDivElement>(null)
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: SIZE, h: SIZE })
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const drag = useRef<{ x: number; y: number } | null>(null)
  const pinch = useRef<number | null>(null)
  const moved = useRef(false)

  // fit the content box into the (aspect-matched) viewBox so there's no letterbox
  const fit = () => {
    const el = wrap.current
    if (!el) return
    const cw = el.clientWidth || 1
    const ch = el.clientHeight || 1
    const w = Math.max(SIZE, SIZE * (cw / ch)) * 1.04
    const h = w * (ch / cw)
    setVb({ x: (SIZE - w) / 2, y: (SIZE - h) / 2, w, h })
  }
  useLayoutEffect(() => {
    fit()
    const on = () => fit()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scale = () => (wrap.current ? wrap.current.clientWidth / vb.w : 1)

  const zoomAt = (factor: number, px: number, py: number) => {
    setVb((v) => {
      const el = wrap.current
      if (!el) return v
      const s = el.clientWidth / v.w
      const ux = v.x + px / s
      const uy = v.y + py / s
      let w = v.w / factor
      const minW = SIZE / 14
      const maxW = SIZE * 3
      w = Math.min(maxW, Math.max(minW, w))
      const h = w * (v.h / v.w)
      const s2 = el.clientWidth / w
      return { x: ux - px / s2, y: uy - py / s2, w, h }
    })
  }

  const rel = (e: { clientX: number; clientY: number }) => {
    const r = wrap.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    moved.current = false
    if (pointers.current.size === 1) drag.current = { x: e.clientX, y: e.clientY }
    else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
      drag.current = null
    }
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 })
      zoomAt(dist / pinch.current, mid.x, mid.y)
      pinch.current = dist
      moved.current = true
      return
    }
    if (drag.current) {
      const dx = e.clientX - drag.current.x
      const dy = e.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true
      const s = scale()
      setVb((v) => ({ ...v, x: v.x - dx / s, y: v.y - dy / s }))
      drag.current = { x: e.clientX, y: e.clientY }
    }
  }
  const onPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) drag.current = null
  }
  const onWheel = (e: WheelEvent) => {
    const p = rel(e)
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, p.x, p.y)
  }

  const c = SIZE / 2

  return (
    <div ref={wrap} className="relative h-full w-full overflow-hidden touch-none cursor-grab active:cursor-grabbing">
      <svg
        width="100%"
        height="100%"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${c},${c})`}>
          {nodes.map((n) => {
            const isCenter = n.depth === 0
            const r0 = n.depth * RING
            const r1 = (n.depth + 1) * RING - 3
            const mid = (n.a0 + n.a1) / 2
            // base lineage colour + a slight hue gradient across the branch so
            // neighbouring sub-families read as distinct (ref-style), lighter inward.
            const span = n.bA1 - n.bA0
            const t = span > 0 ? (mid - n.bA0) / span : 0.5
            const hue = branchHue(n.id) + (t - 0.5) * 46
            const light = Math.max(48, 88 - n.depth * 5)
            const midR = (r0 + r1) / 2
            const arcLen = (n.a1 - n.a0) * midR
            const years = lifespan(getNode(n.id)!)
            let deg = (mid * 180) / Math.PI - 90
            if (deg > 90 || deg < -90) deg += 180
            const tx = midR * Math.sin(mid)
            const ty = -midR * Math.cos(mid)
            const tap = () => {
              if (!moved.current) onOpen(n.id)
            }
            return (
              <g key={n.id} className="cursor-pointer" onClick={tap}>
                {isCenter ? (
                  <circle r={RING - 4} fill={`hsl(${hue} 45% 55%)`} stroke="rgb(var(--c-surface))" strokeWidth={3} />
                ) : (
                  <path d={arcPath(r0, r1, n.a0, n.a1)} fill={`hsl(${hue} 52% ${light}%)`} stroke="rgb(var(--c-surface))" strokeWidth={1.5} />
                )}
                {isCenter ? (
                  <text textAnchor="middle" dominantBaseline="central" className="kg-name pointer-events-none" style={{ fontSize: 24, fontWeight: 700, fill: '#fff' }}>
                    {n.name}
                  </text>
                ) : (
                  arcLen > 24 && (
                    <text
                      transform={`translate(${tx},${ty}) rotate(${deg})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="kg-name pointer-events-none"
                      style={{ fontSize: Math.min(19, RING * 0.18), fontWeight: 600, fill: `hsl(${hue} 45% 24%)` }}
                    >
                      {years ? `${n.name} · ${years}` : n.name}
                    </text>
                  )
                )}
              </g>
            )
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        {[
          { l: '＋', f: () => wrap.current && zoomAt(1.4, wrap.current.clientWidth / 2, wrap.current.clientHeight / 2) },
          { l: '－', f: () => wrap.current && zoomAt(1 / 1.4, wrap.current.clientWidth / 2, wrap.current.clientHeight / 2) },
          { l: '⟳', f: fit },
        ].map((b) => (
          <button key={b.l} onClick={b.f} className="h-10 w-10 rounded-full bg-surface border border-line shadow-soft text-ink text-base font-semibold active:scale-95">
            {b.l}
          </button>
        ))}
      </div>
    </div>
  )
}
