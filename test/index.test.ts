import { describe, expect, it } from 'vitest'
import { type CollatorMatch, type SearchCollatorOptions, SearchCollator } from '@/index'

function printValue(value: unknown): string {
  return typeof value === 'string' ? `'${value}'` : String(value)
}

function printSignature(args: unknown[], options: SearchCollatorOptions): string {
  const optstr = Object.entries(options)
    .map(([key, value]) => `${key}: ${printValue(value)}`)
    .join(', ')
  return `(${args.map(printValue).join(', ')}) with { ${optstr} }`
}

type Pos = readonly [number, number]
type PosSpec = Pos | number

function toPos(pos: PosSpec): Pos {
  return typeof pos === 'number' ? [pos, pos] : pos
}

function toMatch(input: string, pos: PosSpec): CollatorMatch {
  pos = toPos(pos)
  return { start: pos[0], end: pos[1], text: input.slice(...pos) }
}

// ----------------------------------------------------------------------------

it('should resolve default options', () => {
  const collator1 = new SearchCollator('de')
  expect(collator1.resolvedOptions()).toMatchObject({
    graphemeSequenceTolerance: 3,
    ignorePunctuation: false,
    locale: 'de',
    numeric: false,
    sensitivity: 'variant',
    usage: 'search',
  })
  const collator2 = new SearchCollator('de', { usage: 'sort', sensitivity: 'base', ignorePunctuation: true, graphemeSequenceTolerance: 0 })
  expect(collator2.resolvedOptions()).toMatchObject({
    graphemeSequenceTolerance: 0,
    ignorePunctuation: true,
    locale: 'de',
    numeric: false,
    sensitivity: 'base',
    usage: 'sort',
  })
})

// ----------------------------------------------------------------------------

type MatchTestSpec = [id: string, locales: Intl.LocalesArgument, options: SearchCollatorOptions, input: string, query: string, expected: PosSpec[], reverse?: PosSpec[]]

// oxfmt-ignore
const MATCH_TESTS: MatchTestSpec[] = [
  // sensitivity
  ['S1', 'de', { sensitivity: 'base' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'ROESSE', [[29, 33], [35, 39], [41, 47], [49, 55]]],
  ['S2', 'de', { sensitivity: 'base' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'FUESSE', []],
  ['S3', 'de', { sensitivity: 'case' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe Groesse GROESSE GRÖẞE', 'röße', [[29, 33], [35, 41]]],
  ['S4', 'de', { sensitivity: 'case' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe Groesse GROESSE GRÖẞE', 'füße', []],
  ['S5', 'de', { sensitivity: 'accent' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'ROESSE', [[41, 47], [49, 55]]],
  ['S6', 'de', { sensitivity: 'accent' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'FUESSE', []],
  ['S7', 'de', { sensitivity: 'variant' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'ROESSE', [[49, 55]]],
  ['S8', 'de', { sensitivity: 'variant' }, 'Große GROẞE G.r.ö.ß.e Grüße Größe GRÖẞE Groesse GROESSE', 'FUESSE', []],
  // ignore punctuation
  ['P1', 'de', { sensitivity: 'base', ignorePunctuation: true }, 'Große GROẞE Grüße Größe G R Ö ẞ E Groesse G R O E S S E', 'R_O_E_S_S_E', [[19, 23], [26, 33], [35, 41], [44, 55]]],
  ['P2', 'de', { sensitivity: 'base', ignorePunctuation: true }, 'Große GROẞE Grüße Größe G R Ö ẞ E Groesse G R O E S S E', 'F_U_E_S_S_E', []],
  // numeric
  ['N1', 'de', { sensitivity: 'base', numeric: true }, 'Größe1 GRÖẞE01 Groesse001 GROESSE0001 Größe2 Große1 GROẞE1 Grüße1', 'ROESSE01', [[1, 6], [8, 14], [16, 25], [27, 37]]],
  ['N2', 'de', { sensitivity: 'base', numeric: true }, 'Größe1 GRÖẞE01 Groesse001 GROESSE0001 Größe2 Große1 GROẞE1 Grüße1', 'FUESSE01', []],
  // empty search text
  ['E1', 'de', { sensitivity: 'base' }, '', 'abc', []],
  ['E2', 'de', { sensitivity: 'base', ignorePunctuation: true }, '.!.', 'a!b!c', []],
  // empty query string
  ['Q1', 'de', { sensitivity: 'base' }, 'a!b!c', '', [0, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 0]],
  ['Q2', 'de', { sensitivity: 'base', ignorePunctuation: true }, 'a!b!c', '!!', [0, 2, 4, 5], [5, 3, 1, 0]],
  ['Q3', 'de', { sensitivity: 'base', ignorePunctuation: true }, '!a!b!', '!!', [1, 3, 5], [4, 2, 0]],
  ['Q4', 'de', { sensitivity: 'base' }, '', '', [0], [0]],
  ['Q5', 'de', { sensitivity: 'base', ignorePunctuation: true }, '.!.', '!!', [3], [0]],
]

function expectAllMatchMethods(locales: Intl.LocalesArgument, options: SearchCollatorOptions, args: [string, string, number?], expected: PosSpec[]): void {
  const collator = new SearchCollator(locales, options)
  const matches = expected.map((pos) => toMatch(args[0], pos))
  const match0 = matches[0]
  const signature = printSignature(args, options)
  expect(Array.from(collator.findMatches(...args)), `collator.findMatches${signature}`).toStrictEqual(matches)
  expect(collator.findMatch(...args), `collator.findMatch${signature}`).toStrictEqual(match0)
  expect(collator.indexOf(...args), `collator.indexOf${signature}`).toBe(match0?.start ?? -1)
  expect(collator.includes(...args), `collator.includes${signature}`).toBe(matches.length > 0)
}

function expectAllMatchReverseMethods(locales: Intl.LocalesArgument, options: SearchCollatorOptions, args: [string, string, number?], expected: PosSpec[]): void {
  const collator = new SearchCollator(locales, options)
  const matches = expected.map((pos) => toMatch(args[0], pos))
  const match0 = matches[0]
  const signature = printSignature(args, options)
  expect(Array.from(collator.findMatchesReverse(...args)), `collator.findMatchesReverse${signature}`).toStrictEqual(matches)
  expect(collator.findLastMatch(...args), `collator.findLastMatch${signature}`).toStrictEqual(match0)
  expect(collator.lastIndexOf(...args), `collator.lastIndexOf${signature}`).toBe(match0?.start ?? -1)
}

describe('should search for matches', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected]) => {
    expectAllMatchMethods(locales, options, [input, query], expected)
    // negative start index will be ignored
    expectAllMatchMethods(locales, options, [input, query, -2], expected)
  })
})

describe('should search for matches in reversed direction', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected, reverse = expected.toReversed()]) => {
    expectAllMatchReverseMethods(locales, options, [input, query], reverse)
    // large start index will be ignored
    expectAllMatchReverseMethods(locales, options, [input, query, 1000], reverse)
  })
})

describe('should search for matches after start index', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected, reverse]) => {
    const [skipped = 0, ...rest] = expected
    const start = toPos(skipped)[0] + 1 // start one character after first match
    if (reverse && !rest.length) rest.push(Math.min(start, input.length))
    expectAllMatchMethods(locales, options, [input, query, start], rest)
  })
})

describe('should search for matches before start index', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected, reverse]) => {
    const [skipped = 0, ...rest] = reverse ?? expected.toReversed()
    const start = toPos(skipped)[1] - 1 // start before last match
    if (reverse && !rest.length) rest.push(0)
    expectAllMatchReverseMethods(locales, options, [input, query, start], rest)
  })
})

describe('should search for matches with large start index', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, , reverse]) => {
    const expected = reverse ? [input.length] : []
    expectAllMatchMethods(locales, options, [input, query, 1000], expected)
  })
})

describe('should search for matches with small start index', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, , reverse]) => {
    const expected = reverse ? [0] : []
    expectAllMatchReverseMethods(locales, options, [input, query, -2], expected)
  })
})

it('should take tolerance option into account', () => {
  const collator = new SearchCollator('de', { sensitivity: 'base', numeric: true, graphemeSequenceTolerance: 1 })
  // letters with sensitivity 'base'
  expect(collator.indexOf('Größe', 'oess')).toBe(-1) // difference too large ('öß' vs. 'oess')
  expect(collator.indexOf('Größe', 'öss')).toBe(2)
  expect(collator.indexOf('Größe', 'oeß')).toBe(2)
  expect(collator.indexOf('Größe', 'öß')).toBe(2)
  expect(collator.indexOf('Groeße', 'öß')).toBe(2)
  expect(collator.indexOf('Grösse', 'öß')).toBe(2)
  expect(collator.indexOf('Groesse', 'öß')).toBe(-1) // difference too large ('oess' vs. 'öß')
  // numbers
  expect(collator.indexOf('a001b', '1')).toBe(2) // matches '01' only
  expect(collator.indexOf('a001b', '01')).toBe(1)
  expect(collator.indexOf('a001b', '001')).toBe(1)
  expect(collator.indexOf('a001b', '0001')).toBe(1)
  expect(collator.indexOf('a001b', '00001')).toBe(-1) // query text too long
})

it('should work when shortening grapheme cluster cache', () => {
  const collator = new SearchCollator('de', { sensitivity: 'base' })
  const text = `ee${'a'.repeat(96)}eeee${'a'.repeat(96)}eeee`
  const result1 = Array.from(collator.findMatches(text, 'éé'))
  expect(result1).toStrictEqual([0, 98, 99, 100, 198, 199, 200].map((idx) => toMatch(text, [idx, idx + 2])))
  const result2 = Array.from(collator.findMatchesReverse(text, 'éé'))
  expect(result2).toStrictEqual([200, 199, 198, 100, 99, 98, 0].map((idx) => toMatch(text, [idx, idx + 2])))
})

// ----------------------------------------------------------------------------

describe('should find match at start of text', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected, reverse]) => {
    const collator = new SearchCollator(locales, options)
    for (const pos of expected) {
      const { text, start } = toMatch(input, pos)
      const expectResults = (slice: string, exp: number) => {
        const match = exp >= 0 ? { text, start: exp, end: exp + text.length } : undefined
        expect(collator.findStartMatch(slice, query), `collator.findStartMatch${printSignature([slice, query], options)}`).toStrictEqual(match)
        expect(collator.startsWith(slice, query), `collator.startsWith${printSignature([slice, query], options)}`).toBe(!!match)
      }
      const slice = input.slice(start)
      expectResults(slice, 0)
      expectResults(`xy${slice}`, reverse ? 0 : -1)
      expectResults(`!!${slice}`, options.ignorePunctuation ? 2 : reverse ? 0 : -1)
    }
  })
})

describe('should find match at end of text', () => {
  it.for(MATCH_TESTS)('case %s', ([, locales, options, input, query, expected, reverse]) => {
    const collator = new SearchCollator(locales, options)
    for (const pos of reverse ?? expected.toReversed()) {
      const { text, start, end } = toMatch(input, pos)
      const expectResults = (slice: string, exp: number) => {
        const match = exp >= 0 ? { text, start: exp, end: exp + text.length } : undefined
        expect(collator.findEndMatch(slice, query), `collator.findEndMatch${printSignature([slice, query], options)}`).toStrictEqual(match)
        expect(collator.endsWith(slice, query), `collator.endsWith${printSignature([slice, query], options)}`).toBe(!!match)
      }
      const slice = input.slice(0, end)
      expectResults(slice, start)
      expectResults(`${slice}xy`, reverse ? end + 2 : -1)
      expectResults(`${slice}!!`, options.ignorePunctuation ? start : reverse ? end + 2 : -1)
    }
  })
})

// ----------------------------------------------------------------------------

type EqualsTestSpec = [id: string, locales: Intl.LocalesArgument, options: SearchCollatorOptions, text1: string, texts2: string[], expected: boolean]

// oxfmt-ignore
const EQUAL_TESTS: EqualsTestSpec[] = [
  // sensitivity
  ['S1', 'de', { sensitivity: 'base' }, 'Größe', ['Größe', 'GRÖẞE', 'Groesse', 'GROESSE'], true],
  ['S2', 'de', { sensitivity: 'base' }, 'Größe', ['Grüße', 'G.r.ö.ß.e', 'Große', 'GROẞE'], false],
  ['S3', 'de', { sensitivity: 'case' }, 'Größe', ['Größe', 'Groesse'], true],
  ['S4', 'de', { sensitivity: 'case' }, 'Größe', ['Grüße', 'GRÖẞE', 'GROESSE', 'G.r.ö.ß.e', 'Große', 'GROẞE'], false],
  ['S5', 'de', { sensitivity: 'accent' }, 'Größe', ['Größe', 'GRÖẞE'], true],
  ['S6', 'de', { sensitivity: 'accent' }, 'Größe', ['Grüße', 'Groesse', 'GROESSE', 'G.r.ö.ß.e', 'Große', 'GROẞE'], false],
  ['S7', 'de', { sensitivity: 'variant' }, 'Größe', ['Größe'], true],
  ['S8', 'de', { sensitivity: 'variant' }, 'Größe', ['Grüße', 'GRÖẞE', 'Groesse', 'GROESSE', 'G.r.ö.ß.e', 'Große', 'GROẞE'], false],
  // usage sort
  ['U1', 'de', { sensitivity: 'base', usage: 'sort' }, 'Größe', ['Größe', 'GRÖẞE', 'Große', 'GROẞE'], true],
  ['U2', 'de', { sensitivity: 'base', usage: 'sort' }, 'Größe', ['Grüße', 'Groesse', 'GROESSE', 'G.r.ö.ß.e'], false],
  // ignore punctuation
  ['P1', 'de', { sensitivity: 'base', ignorePunctuation: true }, 'G.r.ö.ß.e', ['Größe', 'G R Ö ẞ E', 'Groesse', 'G R O E S S E'], true],
  ['P2', 'de', { sensitivity: 'base', ignorePunctuation: true }, 'G.r.ö.ß.e', ['Grüße', 'Große', 'GROẞE'], false],
  ['P3', 'de', { sensitivity: 'base', ignorePunctuation: true }, '.!.', ['', '!.!', ' ! '], true],
  ['P4', 'de', { sensitivity: 'base', ignorePunctuation: true }, '.!.', ['a', '.a.', ' a '], false],
  // numeric
  ['N1', 'de', { sensitivity: 'base', numeric: true }, 'Größe1', ['Größe1', 'GRÖẞE01', 'Groesse001', 'GROESSE0001'], true],
  ['N2', 'de', { sensitivity: 'base', numeric: true }, 'Größe1', ['Grüße1', 'Größe2', 'Große1', 'GROẞE1'], false],
]

describe('should test for equality', () => {
  it.for(EQUAL_TESTS)('case %s', ([, locales, options, text1, texts2, expected]) => {
    const collator = new SearchCollator(locales, options)
    const filter = collator.filter(text1)
    for (const text2 of texts2) {
      const signature = printSignature([text1, text2], options)
      expect(collator.equals(text1, text2), `collator.equals${signature}`).toBe(expected)
      expect(filter(text2), `collator.filter${signature}`).toBe(expected)
    }
  })
})
