# Changelog

## [Unreleased]

## [1.3.0] - 2026-09-30

- Fixed: Parameter `start` of the reverse methods `findMatchesReverse`, `findLastMatch`, and `lastIndexOf` now behaves like in the native method `String::lastIndexOf` (matches may start at this position and end after it)
- Documentation: Function `findMatches` as public low-level API
- Documentation: Fixed examples and typos in `README.md`
- Documentation: Add diff links to `CHANGELOG.md`
- Chore: Use shared GitHub actions from `build-tools` for build and publish
- Chore: Bump `@daniel.rentz/build-tools` to 0.0.9, hoisting `oxlint-tsgolint` is not needed anymore

## [1.2.1] - 2026-04-01

- Documentation: Extended `README.md`: TOC and initial example
- Chore: Bump dev dependencies

## [1.2.0] - 2026-03-25

- Added: Reverse methods `findMatchesReverse`, `findLastMatch`, `lastIndexOf`, `findEndMatch`, `endsWith`

## [1.1.0] - 2026-03-22

- Added: Method `findStartMatch`

## [1.0.1] - 2026-03-21

- Fixed: Improve performance (early exit near end of input string if remaining text is too short for successful comparisons)
- Fixed: Return type of `findMatches` is now an `IteratorObject<CollatorMatch>` to provide [iterator helper](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator#instance_methods) types
- Fixed: Type of constructor parameter `locales` is now marked optional as intended
- Fixed: Renamed type `SearchCollatorResolvedOptions` to `ResolvedSearchCollatorOptions` for consistency with `Intl.ResolvedCollatorOptions`
- Documentation: Extended `README.md` (especially for option `graphemeSequenceTolerance`) and source doc

## [1.0.0] - 2026-03-10

Initial release

- Added: Class `SearchCollator` with methods `findMatches`, `findMatch`, `indexOf`, `includes`, `startsWith`, `equals`, `filter`

[Unreleased]: https://github.com/danielrentz/search-collator/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/danielrentz/search-collator/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/danielrentz/search-collator/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/danielrentz/search-collator/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/danielrentz/search-collator/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/danielrentz/search-collator/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/danielrentz/search-collator/releases/tag/v1.0.0
