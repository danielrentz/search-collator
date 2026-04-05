import { CollatorMatch, CollatorMatchIterator } from './findMatches.js'
import { findMatches } from './findMatches.js'

/**
 * Optional parameters for the constructor of class `SearchCollator`.
 */
export interface SearchCollatorOptions extends Intl.CollatorOptions {
  /**
   * The maximum length difference of grapheme cluster sequences to be
   * extracted from the input text and compared with the query text.
   *
   * When searching for a substring match, the search algorithm will extract
   * substring candidates with different grapheme cluster counts from the input
   * text and will compare them with the query string. This option specifies
   * the lower and upper limit for the lengths of these candidates relative to
   * the number of grapheme clusters in the query string.
   *
   * _Note:_ The higher this number, the slower the search algorithm will run.
   *
   * _Example:_ The query text contains 5 grapheme clusters. With this option
   * set to `2`, the search algorithm extracts substrings with 3, 4, 5, 6, and
   * 7 grapheme clusters for every grapheme cluster in the input text.
   *
   * _Example:_ Using the collator option `numeric: true`, this option set to
   * `2`, and the query text `'1'` (one grapheme cluster), the search algorithm
   * will find a match for `'1'`, `'01'`, and `'001'` in the input text (up to
   * three grapheme clusters), but not for `'0001'` (four grapheme clusters).
   *
   * _Example:_ With this option set to `1`, and using German locale, the
   * search algorithm will match `'ä'` with `'ae'` (one vs. two grapheme
   * clusters), but will not match `'ää'` with `'aeae'` (two vs. four grapheme
   * clusters). It will not match any of these when setting this option to `0`.
   * On the other hand, `'ä'` and `'a\u0308'` (lowercase letter A followed by
   * combining diaeresis mark) will _always_ match (both count as single
   * grapheme cluster).
   *
   * @default 3
   */
  graphemeSequenceTolerance?: number | undefined
}

/**
 * All resolved options of a `SearchCollator` instance.
 */
export interface ResolvedSearchCollatorOptions extends Intl.ResolvedCollatorOptions {
  graphemeSequenceTolerance: number
}

/**
 * Extends the class [`Intl.Collator`](https://devdocs.io/javascript/global_objects/intl/collator)
 * with methods for searching substrings in a string with locale-aware fuzzy
 * matching.
 */
export class SearchCollator extends Intl.Collator {
  readonly #tolerance: number

  /**
   * @param locales
   *  The locale to be used. Will be passed to the `Intl.Collator` constructor.
   *  Default is the runtime's default locale.
   *
   * @param options
   *  Optional parameters. Will be passed to the `Intl.Collator` constructor.
   *  Due to the purpose of class `SearchCollator`, the default value of the
   *  option `usage` is `'search'` in contrast to `Intl.Collator` that picks
   *  `'sort'` by default.
   */
  constructor(locales?: Intl.LocalesArgument, options?: SearchCollatorOptions) {
    super(locales, { usage: 'search', ...options })
    this.#tolerance = options?.graphemeSequenceTolerance ?? 3
  }

  /**
   * Returns the resolved options of this instance, including custom options
   * added by class `SearchCollator`.
   *
   * @returns
   *  The resolved options of this instance.
   */
  override resolvedOptions(): ResolvedSearchCollatorOptions {
    return Object.assign(super.resolvedOptions(), {
      graphemeSequenceTolerance: this.#tolerance,
    })
  }

  /**
   * Returns an iterator yielding the content and positions of all occurrences
   * of a substring in the input text according to the collator's locale and
   * options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at. Default is `0`.
   *
   * @returns
   *  An iterator yielding the content and positions of all occurrences of the
   *  query string in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  for (const match of collator.findMatches('.C.A.F.É.c.a.f.é.', 'fe')) {
   *    // 1st match: { text: 'F.É', start: 5, end: 8 }
   *    // 2nd match: { text: 'f.é', start: 13, end: 16 }
   *  }
   */
  findMatches(input: string, query: string, start?: number): CollatorMatchIterator {
    return findMatches(this, input, query, this.#tolerance, start)
  }

  /**
   * Returns an iterator yielding the content and positions of all occurrences
   * of a substring in the input text in reversed order according to the
   * collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at (matches will start before this position). Default is `input.length`.
   *
   * @returns
   *  An iterator yielding the content and positions of all occurrences of the
   *  query string in the input text in reversed order.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  for (const match of collator.findMatchesReverse('.c.a.f.é.C.A.F.É.', 'fe')) {
   *    // 1st match: { text: 'F.É', start: 13, end: 16 }
   *    // 2nd match: { text: 'f.é', start: 5, end: 8 }
   *  }
   */
  findMatchesReverse(input: string, query: string, start?: number): CollatorMatchIterator {
    return findMatches(this, input, query, this.#tolerance, start, true)
  }

  /**
   * Returns the content and position of the first occurrence of a substring in
   * the input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at. Default is `0`.
   *
   * @returns
   *  The content and position of the first occurrence of the query string in
   *  the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe')     // { text: 'F.É', start: 5, end: 8 }
   *  collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe', 6)  // { text: 'f.é', start: 13, end: 16 }
   *  collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe', 14) // undefined
   */
  findMatch(input: string, query: string, start?: number): CollatorMatch | undefined {
    return findMatches(this, input, query, this.#tolerance, start).next().value
  }

  /**
   * Returns the content and position of the last occurrence of a substring in
   * the input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at (matches will start before this position). Default is `input.length`.
   *
   * @returns
   *  The content and position of the last occurrence of the query string in
   *  the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe')     // { text: 'F.É', start: 13, end: 16 }
   *  collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe', 13) // { text: 'f.é', start: 5, end: 8 }
   *  collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe', 5)  // undefined
   */
  findLastMatch(input: string, query: string, start?: number): CollatorMatch | undefined {
    return findMatches(this, input, query, this.#tolerance, start, true).next().value
  }

  /**
   * Returns the character index of the first occurrence of a substring in the
   * input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at. Default is `0`.
   *
   * @returns
   *  The index of the first occurrence of the query string in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe')     // 5 (match for 'F.É')
   *  collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe', 6)  // 13 (match for 'f.é')
   *  collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe', 14) // -1
   */
  indexOf(input: string, query: string, start?: number): number {
    return findMatches(this, input, query, this.#tolerance, start).next().value?.start ?? -1
  }

  /**
   * Returns the character index of the last occurrence of a substring in the
   * input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at (matches will start before this position). Default is `input.length`.
   *
   * @returns
   *  The index of the last occurrence of the query string in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe')     // 13 (match for 'F.É')
   *  collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe', 13) // 5 (match for 'f.é')
   *  collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe', 5)  // -1
   */
  lastIndexOf(input: string, query: string, start?: number): number {
    return findMatches(this, input, query, this.#tolerance, start, true).next().value?.start ?? -1
  }

  /**
   * Returns whether a substring is included in the input text according to the
   * collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @param start
   *  The code unit index of the character in the input text to start searching
   *  at. Default is `0`.
   *
   * @returns
   *  Whether the query string is included in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.includes('.C.A.F.É.c.a.f.é.', 'fe') // true (match for 'F.É' at 5)
   *  collator.includes('.C.A.F.É.c.a.f.é.', 'fe', 6) // true (match for 'f.é' at 13)
   *  collator.includes('.C.A.F.É.c.a.f.é.', 'fe', 14) // false
   */
  includes(input: string, query: string, start?: number): boolean {
    return !findMatches(this, input, query, this.#tolerance, start).next().done
  }

  /**
   * Returns the content and position of a matching substring at the beginning
   * of the input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @returns
   *  The content and position of a matching substring at the beginning of the
   *  input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.findStartMatch('.C.A.F.É.c.a.f.é.', 'cafe') // { text: 'C.A.F.É', start: 1, end: 8 }
   *  collator.findStartMatch('.C.A.F.É.c.a.f.é.', 'fe')  // undefined
   */
  findStartMatch(input: string, query: string): CollatorMatch | undefined {
    return findMatches(this, input, query, this.#tolerance, undefined, false, true).next().value
  }

  /**
   * Returns the content and position of a matching substring at the end of the
   * input text according to the collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @returns
   *  The content and position of a matching substring at the end of the input
   *  text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.findEndMatch('.c.a.f.é.C.A.F.É.', 'cafe') // { text: 'C.A.F.É', start: 9, end: 16 }
   *  collator.findEndMatch('.c.a.f.é.C.A.F.É.', 'ca')  // undefined
   */
  findEndMatch(input: string, query: string): CollatorMatch | undefined {
    return findMatches(this, input, query, this.#tolerance, undefined, true, true).next().value
  }

  /**
   * Returns whether the input text starts with a substring according to the
   * collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @returns
   *  Whether the input text starts with the query string.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.startsWith('.C.A.F.É.c.a.f.é.', 'cafe') // true (match for 'C.A.F.É')
   *  collator.startsWith('.C.A.F.É.c.a.f.é.', 'fe') // false
   */
  startsWith(input: string, query: string): boolean {
    return !findMatches(this, input, query, this.#tolerance, undefined, false, true).next().done
  }

  /**
   * Returns whether the input text ends with a substring according to the
   * collator's locale and options.
   *
   * @param input
   *  The input text to search the substring in.
   *
   * @param query
   *  The substring to be searched in the input text.
   *
   * @returns
   *  Whether the input text ends with the query string.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.endsWith('.c.a.f.é.C.A.F.É.', 'cafe') // true (match for 'C.A.F.É')
   *  collator.endsWith('.c.a.f.é.C.A.F.É.', 'ca')  // false
   */
  endsWith(input: string, query: string): boolean {
    return !findMatches(this, input, query, this.#tolerance, undefined, true, true).next().done
  }

  /**
   * Returns whether two strings are equal according to the collator's locale
   * and options.
   *
   * @param input1
   *  The first string to be compared with the second string.
   *
   * @param input2
   *  The second string to be compared with the first string.
   *
   * @returns
   *  Whether the two strings are equal.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.equals('CAFÉ', 'cafe')     // true
   *  collator.equals('C.A.F.É', 'cafe')  // true
   *  collator.equals('K.A.F.É', 'cafe')  // false
   */
  equals(input1: string, input2: string): boolean {
    return !this.compare(input1, input2)
  }

  /**
   * Returns a unary predicate function bound to a fixed string that tests
   * whether another string is equal according to the collator's locale and
   * options.
   *
   * Useful to be passed into the array methods `filter()` and `find()`, as
   * well as similar functions processing string sequences.
   *
   * @param input1
   *  The fixed input string to be bound to the returned filter function.
   *
   * @returns
   *  A unary predicate function that tests whether the bound string is equal
   *  to the received string. Delegates to the method `equals()` when called.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  const filter = collator.filter('cafe')
   *  filter('CAFÉ')      // true
   *  filter('C.A.F.É')   // true
   *  filter('K.A.F.É')   // false
   *
   *  // filter array for equal strings
   *  const array = ['CAFÉ', 'C.A.F.É', 'K.A.F.É']
   *  array.filter(filter)      // ['CAFÉ', 'C.A.F.É']
   *  array.find(filter)        // 'CAFÉ'
   *  array.lastIndexOf(filter) // 1
   *
   *  // or inline
   *  array.filter(collator.filter('cafe'))
   */
  filter(input1: string): (input2: string) => boolean {
    return this.equals.bind(this, input1)
  }
}
