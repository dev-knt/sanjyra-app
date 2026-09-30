// Kyrgyz suffixes with vowel harmony and consonant assimilation, so generated
// sentences read correctly: "Айбектин уулу", "Камыттын небереси", "Сиздин атаңыз".

const VOWELS = 'аыоуэиеөүяюё'
const VOICELESS = 'кпстфхцчшщ'

// Suffix vowels follow the stem's last vowel. Narrow (high) suffixes: ы/и/у/ү.
// Wide (low) suffixes: а/е/о/ө — but a stem ending in у takes а, not о
// (уул → уулдар, суу → суудан), while ү takes ө (үй → үйдөн).
const NARROW: Record<string, string> = { а: 'ы', ы: 'ы', я: 'ы', э: 'и', и: 'и', е: 'и', о: 'у', ё: 'у', у: 'у', ю: 'у', ө: 'ү', ү: 'ү' }
const WIDE: Record<string, string> = { а: 'а', ы: 'а', я: 'а', э: 'е', и: 'е', е: 'е', о: 'о', ё: 'о', у: 'а', ю: 'а', ө: 'ө', ү: 'ө' }

function lastVowel(word: string): string {
  const w = word.toLowerCase()
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i])) return w[i]
  return 'а'
}

const lastLetter = (word: string) => {
  const w = word.toLowerCase().replace(/[^а-яөүңё]+$/u, '')
  return w[w.length - 1] ?? ''
}
const endsInVowel = (word: string) => VOWELS.includes(lastLetter(word))
const endsVoiceless = (word: string) => VOICELESS.includes(lastLetter(word))

// Before a vowel-initial suffix a final к/п voices: урпак → урпагы.
function soften(word: string): string {
  if (word.endsWith('к')) return word.slice(0, -1) + 'г'
  if (word.endsWith('п')) return word.slice(0, -1) + 'б'
  return word
}

/** Genitive "of X": Айбектин, Аттокурдун, Осмонаалынын, Бөкөлөйдүн. */
export function genitive(word: string): string {
  const c = endsInVowel(word) ? 'н' : endsVoiceless(word) ? 'т' : 'д'
  return `${word}${c}${NARROW[lastVowel(word)]}н`
}

/** Ablative "from X": Амирден, Айбектен, Бөкөлөйдөн. */
export function ablative(word: string): string {
  const c = endsVoiceless(word) ? 'т' : 'д'
  return `${word}${c}${WIDE[lastVowel(word)]}н`
}

/** Dative "to X": Багышка, Амирге, Бөкөлөйгө, Осмонаалыга. */
export function dative(word: string): string {
  const c = endsVoiceless(word) ? 'к' : 'г'
  return `${word}${c}${WIDE[lastVowel(word)]}`
}

// Possessive suffixes act on the last word of a phrase ("чоң ата" → "чоң атасы").
function onLastWord(phrase: string, fn: (w: string) => string): string {
  const i = phrase.lastIndexOf(' ')
  return i < 0 ? fn(phrase) : phrase.slice(0, i + 1) + fn(phrase.slice(i + 1))
}

/** 3rd-person possessive "his X": атасы, небереси, уулу, бир тууганы, урпагы. */
export function poss3(phrase: string): string {
  return onLastWord(phrase, (w) => {
    const v = NARROW[lastVowel(w)]
    return endsInVowel(w) ? `${w}с${v}` : `${soften(w)}${v}`
  })
}

/** Formal 2nd-person possessive "your X": атаңыз, небереңиз, уулуңуз, бир тууганыңыз. */
export function poss2(phrase: string): string {
  return onLastWord(phrase, (w) => {
    const v = NARROW[lastVowel(w)]
    return endsInVowel(w) ? `${w}ң${v}з` : `${soften(w)}${v}ң${v}з`
  })
}
