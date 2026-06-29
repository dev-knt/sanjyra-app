import type { PersonNode } from '../types'
import { branchHue } from '../lib/branches'

// Avatar colour = the person's ANCESTRAL BRANCH hue (a small curated palette),
// so colour carries meaning (lineage) and the UI isn't a random rainbow.
export function Avatar({ person, size = 44 }: { person: PersonNode; size?: number }) {
  const hue = branchHue(person.id)
  const initial = person.name.charAt(0)
  return (
    <div
      className="kg-name flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `hsl(${hue} 55% 88%)`,
        color: `hsl(${hue} 55% 30%)`,
      }}
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function lifespan(p: PersonNode): string {
  if (p.birthYear && p.deathYear) return `${p.birthYear} – ${p.deathYear}`
  if (p.birthYear) return `${p.birthYear}`
  return ''
}
