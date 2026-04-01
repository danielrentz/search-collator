# Changelog

## Unreleased

- Documentation: Extended `README.md`: TOC and initial example
- Chore: Bump dev dependencies

## `1.2.0` – 2026-Mar-25

- Added: Reverse methods `findMatchesReverse`, `findLastMatch`, `lastIndexOf`, `findEndMatch`, `endsWith`

## `1.1.0` – 2026-Mar-22

- Added: Method `findStartMatch`

## `1.0.1` – 2026-Mar-21

- Fixed: Improve performance (early exit near end of input string if remaining text is too short for successful comparisons)
- Fixed: Return type of `findMatches` is now an `IteratorObject<CollatorMatch>` to provide [iterator helper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#instance_methods) types
- Fixed: Type of constructor parameter `locales` is now marked optional as intended
- Fixed: Renamed type `SearchCollatorResolvedOptions` to `ResolvedSearchCollatorOptions` for consistency with `Intl.ResolvedCollatorOptions`
- Documentation: Extended `README.md` (especially for option `graphemeSequenceTolerance`) and source doc

## `1.0.0` – 2026-Mar-10

Initial release

- Added: Class `SearchCollator` with methods `findMatches`, `findMatch`, `indexOf`, `includes`, `startsWith`, `equals`, `filter`
