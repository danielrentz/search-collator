# search-collator

This package provides the class `SearchCollator` that extends the class [`Intl.Collator`][1] with methods for searching substrings in a string with locale-aware fuzzy matching.

Internally, all string comparison operations will be delegated to [`Intl.Collator`'s][1] method `compare` to get the full power of native localized string comparison.
Class [`Intl.Segmenter`][2] will be used to split all strings into grapheme clusters to optimize searching for match candidates in the search string.

Expects globally available [`Intl.Collator`][1] and [`Intl.Segmenter`][2]. If missing, please provide appropriate polyfills.

Zero dependencies, TypeScript type definitions included.

## Example

```js
import { SearchCollator } from 'search-collator'

const collator = new SearchCollator('de', { sensitivity: 'base', ignorePunctuation: true })

// it is a native Intl.Collator
collator.resolvedOptions()              // returns { locales: 'de', ... }
collator.compare('Größe', 'groesse')    // returns 0

// it finds substrings
collator.indexOf('Größe', 'Ö')          // returns 2
collator.indexOf('Größe', 'oe')         // returns 2 (matches 'ö')
collator.indexOf('Größe', 'SS')         // returns 3 (matches 'ß')
collator.indexOf('G r ö ß e', 'oess')   // returns 4 (matches 'ö ß' ignoring spaces)
collator.findMatch('G r ö ß e', 'oess') // returns { text: 'ö ß', start: 4, end: 7 }
collator.includes('G r ö ß e', 'oess')  // returns true

// it iterates all substrings
for (const { text, start, end } of collator.findMatches(text, query)) {
  // ...
}

// it tests strings for equality
collator.equals('Größe', 'groesse')     // returns true
array.filter(collator.filter('Größe'))  // filters array for equal strings
```

## Overview

### Search for Substrings

Class `SearchCollator` provides the following methods for substring lookup:

| Method | Description |
| - | - |
| `findMatches` | Creates an iterator for all matches in the search string. |
| `findMatch` | Returns the first match in the search string (start index, end index, text slice). |
| `indexOf` | Returns the start index of the first match in the search string. |
| `includes` | Returns whether the search string contains a match. |
| `startsWith` | Returns whether the search string starts with a match. |

### Test for Equality

Additionally, the following methods for checking string equality are provided:

| Method | Description |
| - | - |
| `equals` | Checks for equality of two strings. |
| `filter` | Creates a unary predicate function bound to a test string. Can be passed to `Array.filter` etc. |

[1]: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator>
[2]: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter>
