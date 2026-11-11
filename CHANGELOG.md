# Changelog

All notable changes to Sonance are recorded in this file. The format follows Keep a Changelog, and the project follows Semantic Versioning: the version in package.json is the single source of truth, every change that will ship is written into this file's Unreleased section in the same commit that makes it, a release renames that section to the new version with its date before publishing, and breaking changes to the public exports in src/index.js are called out in plain words (a major version bump once the package is past 1.0, and a minor bump with a clear breaking note while it is still 0.x). Nothing is published to npm except on the owner's explicit word in an interactive session.

## [Unreleased]

Nothing yet. New work that will ship goes here as it lands.

## [0.1.0] — not yet published (prepared 2026-11-11)

The first package-ready build, prepared for the owner's publish gate. It has not been published to npm; until the owner says the word, consumers use the GitHub repo or a local checkout, as the README describes.

### Added

- The standalone library extracted from codecube.net's Static-Site-Generator (roadmap E1 and E2): the engine, Sound, Soundtrack, Channel, and Instrument classes, the effects chain builder, the MIDI and variation helpers, the soundtrack loader, the scene manager with four built-in presets, and one demo soundtrack, packaged as @codecube/sonance under the MIT license.
- Sonance's own examples (roadmap X1): a standalone audio demo and synth designer under examples/, rebuilt from the host's parked modules so they import the library as an ES module and run with no site files present.
- Package readiness (roadmap P1): a finished exports map, hand-written type declarations in src/index.d.ts that match the real public surface in src/index.js and were compiled against a test consumer, a README quickstart verified from the packed tarball in a clean folder, and this changelog.

### Changed

- Decoupling (roadmap D1 and D2): modulation is no longer imported from the host site. The engine takes an optional modulation system through its options, and works fully for Sounds and Soundtracks with none injected.

### Removed

- Breaking, while still 0.x: the nine host-era Modulation re-exports and the Modulation namespace are gone from the public surface, and the library entry no longer sets a window.Sonance global. Consumers import the ES module instead.
