/**
 * Optional parameters for the class `SearchCollator`.
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
export interface SearchCollatorResolvedOptions extends Intl.ResolvedCollatorOptions {
  graphemeSequenceTolerance: number
}

/**
 * Position and content of a matching substring in a text.
 */
export interface CollatorMatch {
  /** The content of the matching slice in the text. */
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
 * Extends the [`Intl.Collator`](https://devdocs.io/javascript/global_objects/intl/collator)
 * class with methods for searching substrings in a string with locale-aware
 * fuzzy matching.
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
   *  Default value of the option 'usage' is 'search' in contrast to the native
   *  `Intl.Collator` that uses 'sort' by default.
   */
  constructor(locales: Intl.LocalesArgument, options?: SearchCollatorOptions) {
    super(locales, { usage: 'search', ...options })
    this.#tolerance = options?.graphemeSequenceTolerance ?? 3
  }

  /**
   * Returns the resolved options of this instance, including custom options
   * added by this class.
   *
   * @returns
   *  The resolved options of this instance.
   */
  override resolvedOptions(): SearchCollatorResolvedOptions {
    return Object.assign(super.resolvedOptions(), {
      graphemeSequenceTolerance: this.#tolerance,
    })
  }

  /**
   * Returns an iterator yielding the content and positions of all occurrences
   * of a substring in the input text according to this collator's locale and
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  for (const { match, start, end } of collator.findMatches('c.b.á.b.c.b.À.b.c', 'AB')) {
   *    // { text: 'á.b', start: 4, end: 7 }
   *    // { text: 'À.b', start: 12, end: 15 }
   *  }
   */
  findMatches(input: string, query: string, start?: number): CollatorMatchIterator {
    return this.#findSlices(input, query, start)
  }

  /**
   * Returns the content and position of the first occurrence of a substring in
   * the input text according to this collator's locale and options.
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
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
   * input text according to this collator's locale and options.
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.indexOf('c.b.á.b.c', 'AB')     // 4 (match for 'á.b')
   *  collator.indexOf('c.b.á.b.c', 'AB', 6)  // -1
   *  collator.indexOf('c.b.á.b.c', 'ac')     // -1
   */
  indexOf(input: string, query: string, start?: number): number {
    return this.#findSlices(input, query, start).next().value?.start ?? -1
  }

  /**
   * Returns whether a substring is included in the input text according to
   * this collator's locale and options.
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.includes('c.b.á.b.c', 'AB')      // true (match for 'á.b')
   *  collator.includes('c.b.á.b.c', 'AB', 6)   // false
   *  collator.includes('c.b.á.b.c', 'ac')      // false
   */
  includes(input: string, query: string, start?: number): boolean {
    return !this.#findSlices(input, query, start).next().done
  }

  /**
   * Returns whether the input text starts with a substring according to this
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.startsWith('á.b.c', 'AB')  // true (match for 'á.b')
   *  collator.startsWith('á.b.c', 'bc')  // false
   */
  startsWith(input: string, query: string): boolean {
    return !this.#findSlices(input, query, 0, true).next().done
  }

  /**
   * Returns whether two strings are equal according to this collator's locale
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
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *
   *  collator.equals('á.b.c', 'ABC')   // true
   *  collator.equals('á.b.c', 'bc')    // false
   */
  equals(input1: string, input2: string): boolean {
    return !this.compare(input1, input2)
  }

  /**
   * Returns a unary predicate function bound to a fixed string that tests
   * whether another string is equal according to this collator's locale and
   * options.
   *
   * Useful to be passed into the array methods `filter()` and `find()`, as
   * well as similar functions processing string sequences.
   *
   * @param input1
   *  The fixed string to be bound to the returned filter function.
   *
   * @returns
   *  A unary predicate function that tests whether the bound string is equal
   *  to the received string. Delegates to the method `equals()` when called.
   *
   * @example
   *  const collator = new Collator('en', { sensitivity: 'base', ignorePunctuation: true })
   *  const filter = collator.filter('ABC')
   *
   *  filter('abc')     // true
   *  filter('á.b.c')   // true
   *  filter('def')     // false
   *
   *  ['def', 'abc', '', 'á.b.c'].filter(filter)        // ['abc', 'á.b.c']
   *  ['def', 'abc', '', 'á.b.c'].find(filter)          // 'abc'
   *  ['def', 'abc', '', 'á.b.c'].lastIndexOf(filter)   // 3
   */
  filter(input1: string): (input2: string) => boolean {
    return this.equals.bind(this, input1)
  }

  // private ------------------------------------------------------------------

  /**
   * Iterates through the grapheme clusters of a string. Skips punctuation if
   * configured in this collator.
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
   * configured in this collator.
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
  *#yieldMatchGraphemeCounts(query: number): IteratorObject<number, undefined> {
    // first try to match the same amount of grapheme clusters in the text
    yield query
    // try less grapheme clusters and more grapheme clusters, increase distance in both directions simultaneously
    for (let i = 1; i <= this.#tolerance; i += 1) {
      if (i < query) yield query - i
      yield query + i
    }
  }

  /**
   * Yields the positions of all matching substrings in an input text according
   * to the settings of this collator. Supports the option 'ignorePunctuation'.
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
    const positions: [number, number][] = []
    // iterator for significant grapheme clusters in search text
    const graphemes = this.#visitSignificantGraphemes(search)

    // returns a match from search text spanning the specified graphemes
    const getMatch = (graphemeIdx: number, graphemeCount: number): CollatorMatch | undefined => {
      // fetch missing grapheme clusters from the iterator
      const graphemeEnd = graphemeIdx + graphemeCount
      while (positions.length < graphemeEnd) {
        const { done, value } = graphemes.next()
        if (done) break
        positions.push([value.index, value.index + value.segment.length])
      }
      // do not extract match if search text does not contain enough grapheme clusters anymore
      if (positions.length < graphemeEnd) return
      // extract slice from original text
      return makeMatch(positions[graphemeIdx]![0], positions[graphemeEnd - 1]![1])
    }

    // tries to find a matching grapheme cluster sequence for a grapheme index
    const findMatch = (graphemeIdx: number): CollatorMatch | undefined => {
      // try sequences with different lengths inside 'input'
      for (const graphemeCount of this.#yieldMatchGraphemeCounts(queryGraphemeCount)) {
        const match = getMatch(graphemeIdx, graphemeCount)
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
    for (let graphemeIdx = 0; graphemeIdx <= positions.length; graphemeIdx += 1) {
      const match = findMatch(graphemeIdx)
      if (match) yield match
      // keep the 'graphemes' array short while searching in very long strings
      if (graphemeIdx === 100) positions.splice((graphemeIdx = 0), 100)
    }
  }
}
