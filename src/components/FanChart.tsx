import { useMemo } from 'react'
import { ancestorChain } from '../lib/graph'

// Semicircular fan chart of the "жети ата" — best way to fit 7 ancestors on a
// phone screen. Center = the person; each ring outward = one older generation.
// Tap any wedge to recenter the tree on that ancestor.

interface Props {
  rootId: string
  onSelect: (id: string) => void
}

const TAU = Math.PI * 2

function polar(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

// Build an SVG arc-segment (a "wedge ring") path.
function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r1, a0)
  const [x1, y1] = polar(cx, cy, r1, a1)
  const [x2, y2] = polar(cx, cy, r0, a1)
  const [x3, y3] = polar(cx, cy, r0, a0)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`
}

export function FanChart({ rootId, onSelect }: Props) {
  // Full paternal line (self + all fathers). Fixed ring thickness so the chart
  // grows TALL with each generation — the parent wraps it in a scroll view.
  const chain = useMemo(() => ancestorChain(rootId), [rootId])
  const W = 300
  const ringW = 38
  const cx = W / 2
  const H = ringW * chain.length + 26
  const cy = H - 16

  // Fan spans from -180° to 0° (upper semicircle).
  const start = Math.PI
  const end = TAU // i.e. 2π == 0, sweeping the top half

  function hue(id: string) {
    let h = 0
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
    return h
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block select-none" role="img" aria-label="Жети ата">
      {chain.map((p, gen) => {
        const r0 = gen === 0 ? 0 : ringW * gen + 6
        const r1 = ringW * (gen + 1) + 6
        // Each generation up doubles the slots, but our chain is a single line,
        // so we render one centered wedge per ring whose width narrows with depth.
        const span = (end - start) / Math.pow(1.18, gen)
        const mid = (start + end) / 2
        const a0 = mid - span / 2
        const a1 = mid + span / 2
        const [lx, ly] = polar(cx, cy, (r0 + r1) / 2, mid)
        const h = hue(p.id)
        const isCenter = gen === 0

        return (
          <g key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)}>
            {isCenter ? (
              <circle cx={cx} cy={cy} r={ringW + 6} fill={`hsl(${h} 60% 92%)`} stroke={`hsl(${h} 55% 55%)`} strokeWidth={2} />
            ) : (
              <path
                d={wedge(cx, cy, r0, r1, a0, a1)}
                fill={`hsl(${h} 45% ${92 - gen * 3}%)`}
                stroke="rgb(var(--c-surface))"
                strokeWidth={2}
                className="transition-opacity hover:opacity-80"
              />
            )}
            <text
              x={isCenter ? cx : lx}
              y={isCenter ? cy + 1 : ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="kg-name pointer-events-none"
              style={{
                fontSize: isCenter ? 13 : Math.max(8.5, 12 - gen * 0.8),
                fill: `hsl(${h} 50% 25%)`,
                fontWeight: isCenter ? 700 : 600,
              }}
            >
              {p.name.length > 9 ? p.name.slice(0, 8) + '…' : p.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
