// ---- Core data model ----
// Patronymic-chain first: every person points at exactly one father (fatherId).
// Spouse/marriage is secondary metadata attached to a person.
// This shape maps 1:1 onto a future Postgres `people` table + `father_id` FK,
// so the JSON seed used by the prototype is not throwaway.

export type Sex = 'm' | 'f'

export interface Person {
  id: string
  name: string // Cyrillic given name, e.g. "Асан"
  fatherId: string | null // null = root ancestor (баба) of an imported branch
  sex: Sex
  birthYear?: number | null
  deathYear?: number | null
  living: boolean
  // Spouse(s): ids of people in the tree, or free-text names for those not in it.
  spouseIds?: string[]
  spouseNames?: string[]
  bio?: string // optional short story / эскерүү
  birthPlace?: string
}

// A person augmented with cheap derived fields (computed once at load).
export interface PersonNode extends Person {
  childrenIds: string[]
  generation: number // 0 = oldest known ancestor, increases downward
}

export type Theme = 'koldoo' | 'tenir' | 'kok'
export type Screen = 'search' | 'person' | 'relate' | 'tree' | 'persontree'
