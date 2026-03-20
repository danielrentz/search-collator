# search-collator

This package provides the class `SearchCollator` that extends the class [`Intl.Collator`][1] with methods for searching substrings in a string with locale-aware fuzzy matching.

Internally, all string comparison operations will be delegated to [`Intl.Collator`'s][1] method `compare` to get the full power of native localized string comparison.
Class [`Intl.Segmenter`][2] will be used to split all strings into grapheme clusters to optimize searching for match candidates in the search string.

Expects globally available [`Intl.Collator`][1] and [`Intl.Segmenter`][2]. If missing, please provide appropriate polyfills.

Zero dependencies, ESM and CJS bundles available, TypeScript type definitions included.

## Installation

```sh
npm install search-collator
# or
pnpm add search-collator
# or
yarn add search-collator
```

## Usage

### Native Collator

Class `SearchCollator` is a subclass of [`Intl.Collator`][1]. The constructor passes all options to the native collator, and instances provide all methods. However, the default value of the collator option `usage` is "search" instead of "sort" due to the purpose of this class.

_Example:_

```js
import { SearchCollator } from 'search-collator'

const collator = new SearchCollator('de', { sensitivity: 'base', ignorePunctuation: true })

collator instanceof Intl.Collator // true

collator.resolvedOptions()
// returns { locales: 'de', usage: 'search', sensitivity: 'base', ... }

collator.compare('Größe', 'groesse') // returns 0
```

### Search for Substrings

The following methods for substring lookup are available:

| Method        | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `findMatches` | Creates a lazy iterator for all matches in the input string.                      |
| `findMatch`   | Returns the first match in the input string (start index, end index, text slice). |
| `indexOf`     | Returns the start index of the first match in the input string.                   |
| `includes`    | Returns whether the input string contains a match.                                |
| `startsWith`  | Returns whether the input string starts with a match.                             |

_Example:_

```js
import { SearchCollator } from 'search-collator'

const collator = new SearchCollator('de', { sensitivity: 'base', ignorePunctuation: true })

// it finds substrings
collator.indexOf('Größe', 'Ö') // 2
collator.indexOf('Größe', 'oe') // 2 (matches 'ö')
collator.indexOf('Größe', 'SS') // 3 (matches 'ß')
collator.indexOf('G r ö ß e', 'oess') // 4 (matches 'ö ß' ignoring spaces)
collator.findMatch('G r ö ß e', 'oess') // { text: 'ö ß', start: 4, end: 7 }
collator.includes('G r ö ß e', 'oess') // true
collator.startsWith('G r ö ß e', 'Groess') // true

// it iterates all substrings
for (const { text, start, end } of collator.findMatches(input, query)) {
  // ...
}
```

### Test for Equality

Additionally, the following methods for checking string equality are available:

| Method   | Description                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------- |
| `equals` | Checks for equality of two strings.                                                             |
| `filter` | Creates a unary predicate function bound to a test string. Can be passed to `Array.filter` etc. |

_Example:_

```js
import { SearchCollator } from 'search-collator'

const collator = new SearchCollator('de', { sensitivity: 'base', ignorePunctuation: true })

// test for equality
collator.equals('Größe', 'groesse') // true

// filter array for equal strings
const filter = collator.filter('Größe')
array.filter(filter)
array.find(filter)
array.findIndex(filter)

// or inline
array.filter(collator.filter('Größe'))
```

## Prior Art

Inspired by the package [locale-index-of][3].

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
[3]: https://www.npmjs.com/package/locale-index-of
