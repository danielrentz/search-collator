# search-collator

[![Publish Package](https://github.com/danielrentz/search-collator/actions/workflows/publish.yml/badge.svg)](https://github.com/danielrentz/search-collator/actions/workflows/publish.yml)
[![npm version](https://badge.fury.io/js/search-collator.svg?icon=si%3Anpm)](https://badge.fury.io/js/search-collator)

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [How It Works](#how-it-works)

## Overview

This package provides the class `SearchCollator` that extends the class [`Intl.Collator`][1] with methods for searching substrings in a string with locale-aware fuzzy matching.

_Example:_

```ts
import { SearchCollator } from 'search-collator'

const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.indexOf('.C.A.F.É.', 'fe') // 5 (match for 'F.É')
```

Internally, all string comparison operations will be delegated to [`Intl.Collator`][1]'s method `compare` to get the full power of native localized string comparison.
Class [`Intl.Segmenter`][2] will be used to split all strings into grapheme clusters to optimize searching for match candidates in the search string.

Zero dependencies, ESM only, TypeScript type definitions included.

## Installation

```sh
npm install search-collator
# or
pnpm add search-collator
# or
yarn add search-collator
```

Expects globally available [`Intl.Collator`][1] and [`Intl.Segmenter`][2]. If missing, please provide appropriate polyfills before importing this package.

## Usage

```ts
import { SearchCollator } from 'search-collator'
```

### Class `SearchCollator`

```ts
class SearchCollator extends Intl.Collator {}
```

Class `SearchCollator` is a subclass of [`Intl.Collator`][1]. Instances will provide all native collator methods.

#### Interface `SearchCollatorOptions`

Optional parameters for the constructor of class `SearchCollator`.

```ts
interface SearchCollatorOptions extends Intl.CollatorOptions {
  graphemeSequenceTolerance?: number | undefined
}
```

| Property                    | Type     | Default | Description                                                                                                              |
| --------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `graphemeSequenceTolerance` | `number` | `3`     | Length tolerance for matching substrings in the input text. See chapter [How It Works](#how-it-works) below for details. |

Due to the purpose of class `SearchCollator`, the default value of the option `usage` is `'search'` (in contrast to `Intl.Collator` that picks `'sort'` by default).

#### Constructor

The constructor forwards all options to the native collator base class.

```ts
constructor(locales?: Intl.LocalesArgument, options?: SearchCollatorOptions)
```

| Parameter | Type                    | Default                    | Description            |
| --------- | ----------------------- | -------------------------- | ---------------------- |
| `locales` | `Intl.LocalesArgument`  | _runtime's default locale_ | The locale to be used. |
| `options` | `SearchCollatorOptions` | `{}`                       | Optional parameters.   |

_Example:_

```ts
const collator = new SearchCollator('de', { sensitivity: 'base', ignorePunctuation: true })

collator instanceof Intl.Collator // evaluates to true
```

#### Interface `ResolvedSearchCollatorOptions`

All resolved options of a `SearchCollator` instance.

```ts
interface ResolvedSearchCollatorOptions extends Intl.ResolvedCollatorOptions {
  graphemeSequenceTolerance: number
}
```

#### Method `SearchCollator::resolvedOptions`

Returns the resolved options of this instance, including custom options added by class `SearchCollator`.

```ts
override resolvedOptions(): ResolvedSearchCollatorOptions
```

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.resolvedOptions()
// returns { locales: 'en', usage: 'search', sensitivity: 'base', graphemeSequenceTolerance: 3, ... }
```

### Search for Substrings

#### Interface `CollatorMatch`

The position and content of a matching substring in an input text.

```ts
interface CollatorMatch {
  text: string
  start: number
  end: number
}
```

| Property | Description                                           |
| -------- | ----------------------------------------------------- |
| `text`   | The content of the matching slice in the input text.  |
| `start`  | Start index of the matching slice (code units index). |
| `end`    | End index of the matching slice (code units index).   |

#### Type `CollatorMatchIterator`

An iterator for `CollatorMatch` objects.

```ts
type CollatorMatchIterator = IteratorObject<CollatorMatch, undefined>
```

#### Method `SearchCollator::findMatches`

Returns an iterator yielding the content and positions of all occurrences of a substring in the input text according to this collator's locale and options.

```ts
findMatches(input: string, query: string, start?: number): CollatorMatchIterator
```

| Parameter | Type     | Default    | Description                                                                   |
| --------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.                                    |
| `query`   | `string` | _required_ | The substring to be searched in the input text.                               |
| `start`   | `number` | `0`        | The code unit index of the character in the input text to start searching at. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

for (const match of collator.findMatches('.C.A.F.É.c.a.f.é.', 'fe')) {
  // 1st match: { text: 'F.É', start: 5, end: 8 }
  // 2nd match: { text: 'f.é', start: 13, end: 16 }
}
```

#### Method `SearchCollator::findMatchesReverse`

Returns an iterator yielding the content and positions of all occurrences of a substring in the input text in reversed order according to the collator's locale and options.

```ts
findMatchesReverse(input: string, query: string, start?: number): CollatorMatchIterator
```

| Parameter | Type     | Default        | Description                                                                                                             |
| --------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `input`   | `string` | _required_     | The input text to search the substring in.                                                                              |
| `query`   | `string` | _required_     | The substring to be searched in the input text.                                                                         |
| `start`   | `number` | `input.length` | The code unit index of the character in the input text to start searching at (matches will start before this position). |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

for (const match of collator.findMatchesReverse('.c.a.f.é.C.A.F.É.', 'fe')) {
  // 1st match: { text: 'F.É', start: 13, end: 16 }
  // 2nd match: { text: 'f.é', start: 5, end: 8 }
}
```

#### Method `SearchCollator::findMatch`

Returns the content and position of the first occurrence of a substring in the input text according to this collator's locale and options.

```ts
findMatch(input: string, query: string, start?: number): CollatorMatch | undefined
```

| Parameter | Type     | Default    | Description                                                                   |
| --------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.                                    |
| `query`   | `string` | _required_ | The substring to be searched in the input text.                               |
| `start`   | `number` | `0`        | The code unit index of the character in the input text to start searching at. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe') // { text: 'F.É', start: 5, end: 8 }
collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe', 6) // { text: 'f.é', start: 13, end: 16 }
collator.findMatch('.C.A.F.É.c.a.f.é.', 'fe', 14) // undefined
```

#### Method `SearchCollator::findLastMatch`

Returns the content and position of the last occurrence of a substring in the input text according to the collator's locale and options.

```ts
findLastMatch(input: string, query: string, start?: number): CollatorMatch | undefined
```

| Parameter | Type     | Default        | Description                                                                                                             |
| --------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `input`   | `string` | _required_     | The input text to search the substring in.                                                                              |
| `query`   | `string` | _required_     | The substring to be searched in the input text.                                                                         |
| `start`   | `number` | `input.length` | The code unit index of the character in the input text to start searching at (matches will start before this position). |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe') // { text: 'F.É', start: 13, end: 16 }
collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe', 13) // { text: 'f.é', start: 5, end: 8 }
collator.findLastMatch('.c.a.f.é.C.A.F.É.', 'fe', 5) // undefined
```

#### Method `SearchCollator::indexOf`

Returns the character index of the first occurrence of a substring in the input text according to this collator's locale and options.

```ts
indexOf(input: string, query: string, start?: number): number
```

| Parameter | Type     | Default    | Description                                                                   |
| --------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.                                    |
| `query`   | `string` | _required_ | The substring to be searched in the input text.                               |
| `start`   | `number` | `0`        | The code unit index of the character in the input text to start searching at. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe') // 5 (match for 'F.É')
collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe', 6) // 13 (match for 'f.é')
collator.indexOf('.C.A.F.É.c.a.f.é.', 'fe', 14) // -1
```

#### Method `SearchCollator::lastIndexOf`

Returns the character index of the last occurrence of a substring in the input text according to this collator's locale and options.

```ts
lastIndexOf(input: string, query: string, start?: number): number
```

| Parameter | Type     | Default        | Description                                                                                                             |
| --------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `input`   | `string` | _required_     | The input text to search the substring in.                                                                              |
| `query`   | `string` | _required_     | The substring to be searched in the input text.                                                                         |
| `start`   | `number` | `input.length` | The code unit index of the character in the input text to start searching at (matches will start before this position). |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe') // 13 (match for 'F.É')
collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe', 13) // 5 (match for 'f.é')
collator.lastIndexOf('.c.a.f.é.C.A.F.É.', 'fe', 5) // -1
```

#### Method `SearchCollator::includes`

Returns whether a substring is included in the input text according to this collator's locale and options.

```ts
includes(input: string, query: string, start?: number): boolean
```

| Parameter | Type     | Default    | Description                                                                   |
| --------- | -------- | ---------- | ----------------------------------------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.                                    |
| `query`   | `string` | _required_ | The substring to be searched in the input text.                               |
| `start`   | `number` | `0`        | The code unit index of the character in the input text to start searching at. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.includes('.C.A.F.É.c.a.f.é.', 'fe') // true (match for 'F.É' at 5)
collator.includes('.C.A.F.É.c.a.f.é.', 'fe', 6) // true (match for 'f.é' at 13)
collator.includes('.C.A.F.É.c.a.f.é.', 'fe', 14) // false
```

#### Method `SearchCollator::findStartMatch`

Returns the content and position of a matching substring at the beginning of the input text according to the collator's locale and options.

```ts
findStartMatch(input: string, query: string): CollatorMatch | undefined
```

| Parameter | Type     | Default    | Description                                     |
| --------- | -------- | ---------- | ----------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.      |
| `query`   | `string` | _required_ | The substring to be searched in the input text. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.findStartMatch('.C.A.F.É.c.a.f.é.', 'cafe') // { text: 'C.A.F.É', start: 1, end: 8 }
collator.findStartMatch('.C.A.F.É.c.a.f.é.', 'fe') // undefined
```

#### Method `SearchCollator::findEndMatch`

Returns the content and position of a matching substring at the end of the input text according to the collator's locale and options.

```ts
findEndMatch(input: string, query: string): CollatorMatch | undefined
```

| Parameter | Type     | Default    | Description                                     |
| --------- | -------- | ---------- | ----------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.      |
| `query`   | `string` | _required_ | The substring to be searched in the input text. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.findEndMatch('.c.a.f.é.C.A.F.É.', 'cafe') // { text: 'C.A.F.É', start: 9, end: 16 }
collator.findEndMatch('.c.a.f.é.C.A.F.É.', 'ca') // undefined
```

#### Method `SearchCollator::startsWith`

Returns whether the input text starts with a substring according to this collator's locale and options.

```ts
startsWith(input: string, query: string): boolean
```

| Parameter | Type     | Default    | Description                                     |
| --------- | -------- | ---------- | ----------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.      |
| `query`   | `string` | _required_ | The substring to be searched in the input text. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.startsWith('.C.A.F.É.c.a.f.é.', 'cafe') // true (match for 'C.A.F.É')
collator.startsWith('.C.A.F.É.c.a.f.é.', 'fe') // false
```

#### Method `SearchCollator::endsWith`

Returns whether the input text ends with a substring according to this collator's locale and options.

```ts
endsWith(input: string, query: string): boolean
```

| Parameter | Type     | Default    | Description                                     |
| --------- | -------- | ---------- | ----------------------------------------------- |
| `input`   | `string` | _required_ | The input text to search the substring in.      |
| `query`   | `string` | _required_ | The substring to be searched in the input text. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.endsWith('.c.a.f.é.C.A.F.É.', 'cafe') // true (match for 'C.A.F.É')
collator.endsWith('.c.a.f.é.C.A.F.É.', 'ca') // false
```

### Test for Equality

#### Method `SearchCollator::equals`

Returns whether two strings are equal according to this collator's locale and options.

```ts
equals(input1: string, input2: string): boolean
```

| Parameter | Type     | Default    | Description                                             |
| --------- | -------- | ---------- | ------------------------------------------------------- |
| `input1`  | `string` | _required_ | The first string to be compared with the second string. |
| `input2`  | `string` | _required_ | The second string to be compared with the first string. |

_Example:_

```ts
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

collator.equals('CAFÉ', 'cafe') // true
collator.equals('C.A.F.É', 'cafe') // true
collator.equals('C.A.F.É', 'kafe') // false
```

#### Method `SearchCollator::filter`

Returns a unary predicate function bound to a fixed string that tests whether another string is equal according to the collator's locale and options.

Useful to be passed into the array methods `filter()` and `find()`, as well as similar functions processing string sequences.

```ts
filter(input1: string): (input2: string) => boolean
```

| Parameter | Type     | Default    | Description                                                         |
| --------- | -------- | ---------- | ------------------------------------------------------------------- |
| `input1`  | `string` | _required_ | The fixed input string to be bound to the returned filter function. |

_Example:_

```js
const collator = new SearchCollator('en', { sensitivity: 'base', ignorePunctuation: true })

const filter = collator.filter('cafe')
filter('CAFÉ') // true
filter('C.A.F.É') // true
filter('K.A.F.É') // false

// filter array for equal strings
const array = ['CAFÉ', 'C.A.F.É', 'K.A.F.É']
array.filter(filter) // ['CAFÉ', 'C.A.F.É']
array.find(filter) // 'CAFÉ'
array.lastIndexOf(filter) // 1

// or inline
array.filter(collator.filter('cafe'))
```

## How It Works

Class [`Intl.Collator`][1] does not provide built-in ability to search for substrings in an input text. The search algorithm implemented by `SearchCollator` tries to find matches in an input text by extracting substring candidates with a specific length, and comparing them with the query text using the collator's `compare` method.

> _Example:_ To find a match for the query string `ej` in the input text `déjà-vu`, the search algorithm extracts the substrings `dé`, `éj`, `jà`, `à-`, `-v`, and `vu`, and compares them with the query string.
> If the collator is configured to ignore accents, it will find a match for `éj` at index 1 in the input string.

More precisely, the search algorithm splits the strings by [grapheme clusters][3] to be able to match sequences of characters extended with combining characters.

> _Example:_ The string `déjà-vu` (7 code units) can be rewritten as `de\u0301ja\u0300-vu` (9 code units) with the characters U+0301 COMBINING ACUTE ACCENT and U+0300 COMBINING GRAVE ACCENT.
> The character sequences `e\u0301` and `a\u0300` are considered single grapheme clusters representing the characters `é` and `à` respectively.
> Internally, the search algorithm uses an [`Intl.Segmenter`][2] to be able to extract the grapheme cluster sequences `de\u0301`, `e\u0301j`, `j\u0300`, and so on, and the collator will find a match for `ej` and `e\u0301j`.

### Grapheme Cluster Sequences (Option `graphemeSequenceTolerance`)

There are languages where a single character (grapheme cluster) will match a sequence of several characters (grapheme clusters).
For example, in German, the letter `ß` (_'Eszett'_, one grapheme cluster) will match `ss` (two grapheme clusters) if the collator ignores accents, or even `śś` using combining characters (four code units, but still two grapheme clusters).
Similarly, umlauts like `ä` (one grapheme cluster) will match `ae` (two grapheme clusters).
Or, if the collator is set to `numeric` mode, numbers like `1` will match longer sequences like `001`.

To be able to find these matches when searching in the input string, the search algorithm will extract substring candidates with different lengths.

- First, the number of grapheme clusters in the query string will be counted.
- Next, for every start position in the input text, these number of grapheme clusters will be extracted.
- If that substring does not match, the search algorithm will try sequences with one more grapheme cluster, and one less grapheme cluster.
- This will be repeated up to a maximum distance (by default, 3 more or less grapheme clusters).

The maximum distance can be customized with the constructor option `graphemeSequenceTolerance` of the `SearchCollator` class.
However, the higher this number, the slower the search algorithm will run.

> _Example:_ When searching the string `oess` (4 grapheme clusters) in the input string `Größe` (German for 'size'), the algorithm will extract and compare the following substrings:
>
> - Try to find matches at code unit index 0:
>   - `Größ` (4 grapheme clusters)
>   - `Grö` and `Größe` (one more and one less)
>   - `Gr` (two less - two more is not possible)
>   - `G` (three less)
> - Try to find matches at code unit index 1:
>   - `röße` (4 grapheme clusters)
>   - `röß` (one less - one more is not possible)
>   - `rö` (two less)
>   - `r` (three less)
> - Try to find matches at code unit index 2:
>   - remainder (`öße`) too short to extract 4 grapheme clusters
>   - `öße` (one less, 3 grapheme clusters)
>   - `öß` (two less) => match found

## References

Inspired by the package [locale-index-of][4].

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
[3]: https://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries
[4]: https://www.npmjs.com/package/locale-index-of
