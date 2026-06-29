import type { PersonNode } from '../types'
import { allNodes, fatherOf } from './graph'

// Cyrillic-tolerant normalisation. Folds the Kyrgyz-specific letters onto their
// nearest Russian-keyboard equivalents so someone typing "оз" still finds "өз",
// and folds common spelling variants. Also maps a basic Latin layout so diaspora
// users typing "asan" can find "Асан".
const FOLD: Record<string, string> = {
  ө: 'о',
  ү: 'у',
  ң: 'н',
  ё: 'е',
  й: 'и',
}

const LAT2CYR: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', j: 'ж', z: 'з',
  i: 'и', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
  s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', c: 'ц', y: 'ы',
}

export function normalize(s: string): string {
  let out = s.toLowerCase().trim()
  // transliterate stray Latin letters
  out = out.replace(/[a-z]/g, (ch) => LAT2CYR[ch] ?? ch)
  out = out.replace(/[өүңёй]/g, (ch) => FOLD[ch] ?? ch)
  return out
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  const dp = Array.from({ length: m + 1 }, (_, i) => i)
  for (let j = 1; j <= n; j++) {
    let prev = dp[0]
    dp[0] = j
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i]
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[m]
}

export interface SearchHit {
  node: PersonNode
  score: number
  fatherName?: string
}

export function searchPeople(query: string, limit = 25): SearchHit[] {
  const q = normalize(query)
  if (!q) return []
  const hits: SearchHit[] = []
  for (const node of allNodes()) {
    const name = normalize(node.name)
    let score = 0
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80 - (name.length - q.length) * 0.5
    else if (name.includes(q)) score = 60
    else {
      const d = levenshtein(name, q)
      if (d <= Math.max(1, Math.floor(q.length / 3))) score = 45 - d * 5
    }
    if (score > 0) {
      hits.push({ node, score, fatherName: fatherOf(node.id)?.name })
    }
  }
  return hits.sort((a, b) => b.score - a.score || (b.node.birthYear ?? 0) - (a.node.birthYear ?? 0)).slice(0, limit)
}
