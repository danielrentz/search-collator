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
 * Position and content of a matching substring in an input text.
 */
export interface CollatorMatch {
  /** The content of the matching slice in the input text. */
  text: string
  /** Start index of the matching slice (code units index). */
  start: number
  /** End index of the matching slice (code units index). */
  end: number
}

/**
 * An iterator for `CollatorMatch` objects.
 */
export type CollatorMatchIterator = IteratorObject<CollatorMatch, undefined>

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
   *  The index in the input text to start searching at. Default is `0`.
   *
   * @returns
   *  An iterator yielding the content and positions of all occurrences of the
   *  query string in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  for (const match of collator.findMatches('c.b.á.b.c.b.À.b.c', 'AB')) {
   *    // match: { text: 'á.b', start: 4, end: 7 }
   *    // match: { text: 'À.b', start: 12, end: 15 }
   *  }
   */
  findMatches(input: string, query: string, start?: number): CollatorMatchIterator {
    return this.#findSlices(input, query, start)
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
   *  The index in the input text to start searching at. Default is `0`.
   *
   * @returns
   *  The content and position of the first occurrence of the query string in
   *  the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.findMatch('c.b.á.b.c', 'AB')     // { text: 'á.b', start: 4, end: 7 }
   *  collator.findMatch('c.b.á.b.c', 'AB', 6)  // undefined
   *  collator.findMatch('c.b.á.b.c', 'ac')     // undefined
   */
  findMatch(input: string, query: string, start?: number): CollatorMatch | undefined {
    return this.#findSlices(input, query, start).next().value
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
   *  The index in the input text to start searching at. Default is `0`.
   *
   * @returns
   *  The index of the first occurrence of the query string in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.indexOf('c.b.á.b.c', 'AB')     // 4 (match for 'á.b')
   *  collator.indexOf('c.b.á.b.c', 'AB', 6)  // -1
   *  collator.indexOf('c.b.á.b.c', 'ac')     // -1
   */
  indexOf(input: string, query: string, start?: number): number {
    return this.#findSlices(input, query, start).next().value?.start ?? -1
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
   *  The index in the input text to start searching at. Default is `0`.
   *
   * @returns
   *  Whether the query string is included in the input text.
   *
   * @example
   *  const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.includes('c.b.á.b.c', 'AB')      // true (match for 'á.b')
   *  collator.includes('c.b.á.b.c', 'AB', 6)   // false
   *  collator.includes('c.b.á.b.c', 'ac')      // false
   */
  includes(input: string, query: string, start?: number): boolean {
    return !this.#findSlices(input, query, start).next().done
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
   *  collator.startsWith('á.b.c', 'AB')  // true (match for 'á.b')
   *  collator.startsWith('á.b.c', 'bc')  // false
   */
  startsWith(input: string, query: string): boolean {
    return !this.#findSlices(input, query, 0, true).next().done
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
   *  collator.equals('á.b.c', 'ABC')   // true
   *  collator.equals('á.b.c', 'bc')    // false
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
   *  const filter = collator.filter('ABC')
   *  filter('abc')     // true
   *  filter('á.b.c')   // true
   *  filter('def')     // false
   *
   *  // filter array for equal strings
   *  const array = ['def', 'abc', '', 'á.b.c']
   *  array.filter(filter)      // ['abc', 'á.b.c']
   *  array.find(filter)        // 'abc'
   *  array.lastIndexOf(filter) // 3
   *
   *  // or inline
   *  array.filter(collator.filter('ABC'))
   */
  filter(input1: string): (input2: string) => boolean {
    return this.equals.bind(this, input1)
  }

  // private ------------------------------------------------------------------

  /**
   * Iterates through the grapheme clusters of a string. Skips punctuation if
   * configured in the collator.
   */
  *#visitSignificantGraphemes(text: string): Intl.SegmentIterator<Intl.SegmentData> {
    // resolved collator options
    const { locale, ignorePunctuation } = this.resolvedOptions()

    // create the iterator for the grapheme segments
    const segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' })
    const segments = segmenter.segment(text)

    // ignore punctuation grapheme clusters if configured
    if (ignorePunctuation) {
      for (const data of segments) {
        // yield grapheme clusters that differ from empty string (i.e. not punctuation)
        if (this.compare('', data.segment)) yield data
      }
    } else {
      yield* segments
    }
  }

  /**
   * Returns the number of grapheme clusters in a string. Skips punctuation if
   * configured in the collator.
   */
  #countSignificantGraphemes(text: string): number {
    let length = 0 // performance: plain for-loop without intermediate array
    for (const _ of this.#visitSignificantGraphemes(text)) length += 1
    return length
  }

  /**
   * Yields the number of grapheme clusters to match in a text according to the
   * number of grapheme clusters in a query text.
   */
  *#yieldMatchGraphemeCounts(query: number, remain: number): IteratorObject<number, undefined> {
    // shortcut if the remainder of the input string contains less grapheme clusters than the query
    const min = Math.max(1, query - this.#tolerance)
    if (remain < query) {
      for (let q = remain; q >= min; q -= 1) yield q
      return
    }

    // remainder of input is long enough: try to match the same amount of grapheme clusters
    yield query

    // try less grapheme clusters and more grapheme clusters, increase distance in both directions simultaneously
    const max = Math.min(remain, query + this.#tolerance)
    for (let q1 = query - 1, q2 = query + 1; (q1 >= min) || (q2 <= max); q1 -= 1, q2 += 1) {
      if (q1 >= min) yield q1
      if (q2 <= max) yield q2
    }
  }

  /**
   * Yields the positions of all matching substrings in an input text according
   * to the settings of the collator. Supports the option 'ignorePunctuation'.
   */
  *#findSlices(input: string, query: string, start = 0, single = false): CollatorMatchIterator {
    // split 'query' into grapheme clusters that will be used to find a match in 'input'
    const queryGraphemeCount = query ? this.#countSignificantGraphemes(query) : 0

    // start searching at specified index (no support for negative indices counting from end!)
    start = Math.min(input.length, Math.max(0, start))
    const search = start ? input.slice(start) : input

    // creates a `CollatorMatch` object
    const makeMatch = (index: number, end = index): CollatorMatch => {
      return { text: search.slice(index, end), start: start + index, end: start + end }
    }

    // quick escape hatch for empty query strings
    if (!queryGraphemeCount) {
      // first, yield a match at the beginning of 'input'
      const index = Math.min(start, input.length)
      yield { start: index, end: index, text: '' }
      // yield a match after every _significant_ grapheme cluster
      for (const grapheme of this.#visitSignificantGraphemes(search)) {
        yield makeMatch(grapheme.index + grapheme.segment.length)
      }
      return
    }

    // buffer for already known grapheme clusters extracted from search text
    const graphemePositions: [number, number][] = []
    // iterator for significant grapheme clusters in search text
    const graphemesIter = this.#visitSignificantGraphemes(search)
    // minimum and maximum number of graphemes to be fetched from input text
    const minGraphemeCount = Math.max(1, queryGraphemeCount - this.#tolerance)
    const maxGraphemeCount = queryGraphemeCount + this.#tolerance

    // tries to find a matching grapheme cluster sequence for a grapheme index
    const findMatch = (graphemeIdx: number): CollatorMatch | undefined => {
      // fetch grapheme clusters from input text until maximum possible match length is reached
      while (graphemePositions.length - graphemeIdx < maxGraphemeCount) {
        const { done, value } = graphemesIter.next()
        if (done) break
        graphemePositions.push([value.index, value.index + value.segment.length])
      }
      // try to match grapheme cluster sequences with different lengths in input text
      const remainingGraphemeCount = graphemePositions.length - graphemeIdx
      for (const matchGraphemeCount of this.#yieldMatchGraphemeCounts(queryGraphemeCount, remainingGraphemeCount)) {
        const lastGraphemeIdx = graphemeIdx + matchGraphemeCount - 1
        const match = makeMatch(graphemePositions[graphemeIdx]![0], graphemePositions[lastGraphemeIdx]![1])
        if (match && !this.compare(match.text, query)) return match
      }
      return
    }

    // try first index only for mode 'start' (implementation for 'startsWith')
    if (single) {
      const match = findMatch(0)
      if (match) yield match
      return
    }

    // try to find a matching grapheme cluster sequence somewhere in search text
    for (let graphemeIdx = 0; graphemeIdx <= graphemePositions.length; graphemeIdx += 1) {
      const match = findMatch(graphemeIdx)
      if (match) yield match
      // exit if remainder of input string is too short to find something in next iteration
      if (graphemePositions.length - graphemeIdx === minGraphemeCount) return
      // keep the 'graphemes' array short while searching in very long strings
      if (graphemeIdx === 100) graphemePositions.splice((graphemeIdx = 0), 100)
    }
  }
}
