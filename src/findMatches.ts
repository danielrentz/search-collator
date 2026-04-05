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

type GraphemePosition = readonly [start: number, end: number]
type GraphemePositionIterator = IteratorObject<GraphemePosition, undefined>

/**
 * Creates a `CollatorMatch` object.
 */
function makeMatch(input: string, start: number, end: number = start): CollatorMatch {
  return { text: input.slice(start, end), start, end }
}

/**
 * Iterates through the grapheme clusters of a string in the specified order.
 */
function* yieldGraphemes(options: Intl.ResolvedCollatorOptions, text: string, start: number, reverse?: boolean): Intl.SegmentIterator<Intl.SegmentData> {
  // create the native iterator for the grapheme segments
  const segmenter = new Intl.Segmenter(options.locale, { granularity: 'grapheme' })
  const segments = segmenter.segment(text)

  // visit the segments in correct order using `segments.containing` to be able
  // to start at an arbitrary position, ignore partially covered first segment
  if (reverse) {
    for (let index = start; index > 0; ) {
      const data = segments.containing(index - 1)!
      if (data.index + data.segment.length === index) yield data
      index = data.index
    }
  } else {
    for (let index = start; index < text.length; ) {
      const data = segments.containing(index)!
      if (data.index === index) yield data
      index = data.index + data.segment.length
    }
  }
}

/**
 * Iterates through the grapheme clusters of a string in the specified order.
 * Skips punctuation if configured in the collator.
 */
function* yieldSignificantGraphemePositions(collator: Intl.Collator, text: string, start: number, reverse?: boolean): GraphemePositionIterator {
  // resolved collator options
  const options = collator.resolvedOptions()

  // create a forward or backward iterator for the grapheme segments
  const iterator = yieldGraphemes(options, text, start, reverse)

  // ignore punctuation grapheme clusters if configured
  if (options.ignorePunctuation) {
    for (const data of iterator) {
      // yield grapheme clusters that differ from empty string (i.e. not punctuation)
      if (collator.compare('', data.segment)) yield [data.index, data.index + data.segment.length]
    }
  } else {
    for (const data of iterator) {
      yield [data.index, data.index + data.segment.length]
    }
  }
}

/**
 * Returns the number of grapheme clusters in a string. Skips punctuation if
 * configured in the collator.
 */
function countSignificantGraphemes(collator: Intl.Collator, text: string): number {
  let length = 0
  if (text) {
    // performance: plain for-loop without intermediate array
    for (const _ of yieldSignificantGraphemePositions(collator, text, 0)) length += 1
  }
  return length
}

/**
 * Yields the number of grapheme clusters to match in a text according to the
 * number of grapheme clusters in a query text and the configured tolerance.
 */
function* yieldMatchGraphemeCounts(query: number, remain: number, tolerance: number): IteratorObject<number, undefined> {
  // shortcut if the remainder of the input string contains less grapheme clusters than the query
  const min = Math.max(1, query - tolerance)
  if (remain < query) {
    for (let q = remain; q >= min; q -= 1) yield q
    return
  }

  // remainder of input is long enough: try to match the same amount of grapheme clusters
  yield query

  // try less grapheme clusters and more grapheme clusters, increase distance in both directions simultaneously
  const max = Math.min(remain, query + tolerance)
  for (let q1 = query - 1, q2 = query + 1; q1 >= min || q2 <= max; q1 -= 1, q2 += 1) {
    if (q1 >= min) yield q1
    if (q2 <= max) yield q2
  }
}

/**
 * Yields the positions of all matching substrings in an input text according
 * to the settings of the passed collator. Explicitly supports the collator
 * option 'ignorePunctuation'.
 */
export function* findMatches(collator: Intl.Collator, input: string, query: string, tolerance: number, start?: number, reverse?: boolean, boundary?: boolean): CollatorMatchIterator {
  // start searching at specified index (no support for negative indices counting from end!)
  start = Math.min(input.length, Math.max(0, start ?? (reverse ? input.length : 0)))
  // iterator for significant grapheme clusters in input text
  const graphemesIter = yieldSignificantGraphemePositions(collator, input, start, reverse)

  // split 'query' into grapheme clusters that will be used to find a match in 'input'
  const queryGraphemeCount = countSignificantGraphemes(collator, query)
  // quick escape hatch for empty query strings
  if (!queryGraphemeCount) {
    // yield a match before every _significant_ grapheme cluster (reverse mode: after each)
    const posIdx = reverse ? 1 : 0
    for (const position of graphemesIter) yield makeMatch(input, position[posIdx])
    // yield a match at the end of 'input' (reverse mode: at the beginning)
    yield makeMatch(input, reverse ? 0 : input.length)
    return
  }

  // buffer for already known grapheme clusters extracted from input text
  const graphemePositions: GraphemePosition[] = []
  // minimum and maximum number of graphemes to be fetched from input text
  const minGraphemeCount = Math.max(1, queryGraphemeCount - tolerance)
  const maxGraphemeCount = queryGraphemeCount + tolerance

  // tries to find a matching grapheme cluster sequence for a grapheme index
  const findMatch = (graphemeIdx: number): CollatorMatch | undefined => {
    // fetch grapheme clusters from input text until maximum possible match length is reached
    while (graphemePositions.length - graphemeIdx < maxGraphemeCount) {
      const { done, value } = graphemesIter.next()
      if (done) break
      graphemePositions.push(value)
    }
    // try to match grapheme cluster sequences with different lengths in input text
    const remainingGraphemeCount = graphemePositions.length - graphemeIdx
    for (const matchGraphemeCount of yieldMatchGraphemeCounts(queryGraphemeCount, remainingGraphemeCount, tolerance)) {
      const lastGraphemeIdx = graphemeIdx + matchGraphemeCount - 1
      const idx1 = reverse ? lastGraphemeIdx : graphemeIdx
      const idx2 = reverse ? graphemeIdx : lastGraphemeIdx
      const match = makeMatch(input, graphemePositions[idx1]![0], graphemePositions[idx2]![1])
      if (match && !collator.compare(match.text, query)) return match
    }
    return
  }

  // try first index only for boundary mode (implementation for 'startsWith' and 'endsWith')
  if (boundary) {
    const match = findMatch(0)
    if (match) yield match
    return
  }

  // try to find a matching grapheme cluster sequence somewhere in input text
  for (let graphemeIdx = 0; graphemeIdx <= graphemePositions.length; graphemeIdx += 1) {
    const match = findMatch(graphemeIdx)
    if (match) yield match
    // exit if remainder of input string is too short to find something in next iteration
    if (graphemePositions.length - graphemeIdx === minGraphemeCount) return
    // keep the 'graphemes' array short while searching in very long strings
    if (graphemeIdx === 100) graphemePositions.splice((graphemeIdx = 0), 100)
  }
}
