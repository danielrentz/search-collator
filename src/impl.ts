
import type { CollatorMatch } from './index.js'

export type GraphemePosition = [start: number, end: number]

/**
 * Creates a `CollatorMatch` object.
 */
export function makeMatch(input: string, start: number, end: number = start): CollatorMatch {
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
export function *yieldSignificantGraphemePositions(collator: Intl.Collator, text: string, start: number, reverse?: boolean): IteratorObject<GraphemePosition, undefined> {

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
export function countSignificantGraphemes(collator: Intl.Collator, text: string): number {
  let length = 0
  // performance: plain for-loop without intermediate array
  if (text) {
    for (const _ of yieldSignificantGraphemePositions(collator, text, 0)) length += 1
  }
  return length
}

/**
 * Yields the number of grapheme clusters to match in a text according to the
 * number of grapheme clusters in a query text and the configured tolerance.
 */
export function* yieldMatchGraphemeCounts(query: number, remain: number, tolerance: number): IteratorObject<number, undefined> {

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
  for (let q1 = query - 1, q2 = query + 1; (q1 >= min) || (q2 <= max); q1 -= 1, q2 += 1) {
      if (q1 >= min) yield q1
      if (q2 <= max) yield q2
  }
}
